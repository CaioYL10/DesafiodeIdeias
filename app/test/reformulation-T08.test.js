const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { openDatabase } = require('../src/db/database');
const { createRetentionService } = require('../src/services/retention');
const { createSession } = require('../src/security/sessions');
const { createApp } = require('../src/app');

function setup(db, clock) {
  db.exec("INSERT INTO managers VALUES (1,'gestor@example.test','s','h','2026'); INSERT INTO clients(id,name,created_at) VALUES (1,'Empresa fictícia','2026'),(2,'Outra','2026'); INSERT INTO products(id,name,type,created_at) VALUES (1,'Internet','service','2026'); INSERT INTO service_instances(id,client_id,product_id,name,created_at,updated_at) VALUES (1,1,1,'Serviço','2026','2026');");
  const s=createRetentionService(db,{clock});
  const pref={purpose:'Acompanhamento',consent:true,recipient:'pessoa@example.test',frequencyDays:30,active:true};
  const template=s.saveTemplate(null,{name:'Contato',subject:'Acompanhamento',body:'Mensagem fictícia.'},1);
  const event=s.createEvent({clientId:1,serviceInstanceId:1,kind:'maintenance',title:'Lembrete de manutenção',dueAt:'2026-11-06T02:00:00Z'},1);
  return {s,pref,template,event};
}
test('relógio UTC, fuso, duplicidade, consentimento, frequência e histórico', () => {
  const db=openDatabase(':memory:'); let time='2026-11-06T01:59:59Z';
  try {
    const {s,pref,template,event}=setup(db,()=>new Date(time));
    assert.equal(s.events(1)[0].due.local,'2026-11-05 23:00:00');
    assert.equal(s.events(1)[0].due.timeZone,'America/Sao_Paulo');
    assert.equal(s.plan({eventId:event.id,templateId:template.id,rule:'maintenance'},1).code,409);
    assert.equal(s.preference(1,{...pref,recipient:'inválido'},1).code,400);
    assert.equal(s.preference(1,pref,999).code,403);
    assert.equal(s.createEvent({clientId:2,serviceInstanceId:1,kind:'maintenance',title:'Teste',dueAt:'2026-11-06T02:00:00Z'},1).code,400);
    assert.equal(s.createEvent({clientId:1,kind:'follow_up',title:'Teste',dueAt:'2026-02-30T02:00:00Z'},1).code,400);
    s.preference(1,pref,1);
    const input={eventId:event.id,templateId:template.id,rule:'maintenance'};
    const job=s.plan(input,1); assert.equal(job.status,'planned'); assert.equal(job.simulated,true);
    assert.equal(s.plan(input,1).id,job.id); assert.equal(s.plan(input,1).duplicate,true);
    s.preference(1,{...pref,frequencyDays:7},1);
    assert.equal(s.plan(input,1).id,job.id);
    s.preference(1,pref,1);
    assert.equal(s.transition(job.id,'execute',{},1).code,409);
    time='2026-11-06T02:00:00Z';
    s.preference(1,{...pref,consent:false},1);
    assert.equal(s.transition(job.id,'execute',{},1).code,409);
    s.preference(1,pref,1);
    assert.equal(s.transition(job.id,'execute',{simulateFailure:true},1).status,'simulated_failure');
    const done=s.transition(job.id,'retry',{},1); assert.equal(done.status,'simulated_success');
    assert.deepEqual(done.history.map(h=>h.event_type),['planned','simulated_failure','retry_simulated_success']);
    assert.equal(done.history[2].actor,'gestor@example.test');
    assert.equal(s.transition(job.id,'retry',{},1).code,409);
    const second=s.plan({...input,rule:'other'},1);
    assert.equal(s.transition(second.id,'execute',{},1).code,409);
    time='2026-12-06T02:00:00Z';
    assert.equal(s.transition(second.id,'execute',{},1).status,'simulated_success');
    const third=s.plan({...input,rule:'cancel'},1);
    assert.equal(s.transition(third.id,'cancel',{},1).status,'cancelled');
    assert.equal(s.transition(third.id,'execute',{},1).code,409);
    assert.equal(s.plan({...input,rule:'cancel'},1).status,'cancelled');
    assert.throws(()=>db.exec('DELETE FROM retention_history'));
  } finally { db.close(); }
});
test('rotas exigem gestor e preservam prévia e idempotência após reinício', async t => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cti-t08-')); t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  const file=path.join(dir,'db.sqlite'); let db=openDatabase(file); const clock=()=>new Date('2026-11-06T03:00:00Z');
  const {s,pref,template,event}=setup(db,clock); s.preference(1,pref,1);
  let server=createApp({database:db,clock}).listen(0,'127.0.0.1'); await new Promise(r=>server.once('listening',r));
  let url='http://127.0.0.1:'+server.address().port; const cookie='cti_manager_session='+createSession(db,1).token;
  const call=(p,method='GET',body,auth=true)=>fetch(url+p,{method,headers:{...(auth?{cookie}:{}),'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
  try {
    assert.equal((await call('/api/manager/retention/clients/1','GET',null,false)).status,401);
    assert.equal((await call('/api/manager/retention/jobs','POST',{eventId:event.id,templateId:template.id,rule:'a'},false)).status,401);
    assert.equal((await call('/api/manager/retention/events','POST',{clientId:1,kind:'follow_up',title:'x',dueAt:'ontem'})).status,400);
    const input={eventId:event.id,templateId:template.id,rule:'maintenance'};
    const response=await call('/api/manager/retention/jobs','POST',input); assert.equal(response.status,201);
    const job=await response.json(); assert.equal(job.body,'Mensagem fictícia.'); assert.equal(job.simulated,true);
    assert.equal((await call('/api/manager/retention/jobs/'+job.id+'/execute','POST',{simulateFailure:true})).status,200);
    await new Promise(r=>server.close(r)); db.close(); db=openDatabase(file);
    server=createApp({database:db,clock}).listen(0,'127.0.0.1'); await new Promise(r=>server.once('listening',r)); url='http://127.0.0.1:'+server.address().port;
    const duplicate=await call('/api/manager/retention/jobs','POST',input); assert.equal(duplicate.status,200); assert.equal((await duplicate.json()).id,job.id);
    const retry=await call('/api/manager/retention/jobs/'+job.id+'/retry','POST',{}); assert.equal((await retry.json()).status,'simulated_success');
    const page=await call('/api/manager/retention/clients/1'); assert.equal(page.headers.get('cache-control'),'no-store'); assert.equal((await page.json()).jobs.length,1);
    const source=fs.readFileSync(path.join(__dirname,'../src/services/simulated-mail.js'),'utf8');
    assert.doesNotMatch(source, /require\s*\(|fetch\s*\(|https?:|smtp|net\.|child_process/i);
  } finally { if(server.listening) await new Promise(r=>server.close(r)); db.close(); }
});
test('simulador não tenta abrir conexão nem usar fetch', () => {
  const net = require('node:net'); const tls = require('node:tls');
  const originalConnect = net.Socket.prototype.connect; const originalTls = tls.connect; const originalFetch = global.fetch;
  const forbidden = () => { throw new Error('Conexão proibida na simulação'); };
  const db = openDatabase(':memory:');
  try {
    const {s,pref,template,event} = setup(db, () => new Date('2026-11-06T03:00:00Z'));
    s.preference(1,pref,1);
    const job = s.plan({eventId:event.id,templateId:template.id,rule:'local'},1);
    net.Socket.prototype.connect = forbidden; tls.connect = forbidden; global.fetch = forbidden;
    assert.equal(s.transition(job.id,'execute',{simulateFailure:true},1).status,'simulated_failure');
    assert.equal(s.transition(job.id,'retry',{},1).status,'simulated_success');
  } finally {
    net.Socket.prototype.connect = originalConnect; tls.connect = originalTls; global.fetch = originalFetch; db.close();
  }
});
