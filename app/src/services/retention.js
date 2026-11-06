const { simulateMail } = require('./simulated-mail');

const zone = 'America/Sao_Paulo';
const formatter = new Intl.DateTimeFormat('sv-SE', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
const text = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max;
const id = value => Number.isSafeInteger(value) && value > 0;
const email = value => text(value, 254) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const date = value => typeof value === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 19) === value.slice(0, 19);
const error = (code, message) => ({ error: message, code });
function createRetentionService(db, { clock = () => new Date() } = {}) {
  const now = () => new Date(clock()).toISOString();
  const local = value => ({ utc: value, local: formatter.format(new Date(value)), timeZone: zone });
  const actorExists = actor => id(actor) && !!db.prepare('SELECT id FROM managers WHERE id = ?').get(actor);
  const clientExists = client => id(client) && !!db.prepare('SELECT id FROM clients WHERE id = ?').get(client);
  const history = (client, job, type, actor, at) => db.prepare('INSERT INTO retention_history(client_id,job_id,event_type,manager_id,created_at) VALUES (?,?,?,?,?)').run(client, job, type, actor, at);
  const transaction = fn => { db.exec('BEGIN IMMEDIATE'); try { const result = fn(); db.exec('COMMIT'); return result; } catch (e) { db.exec('ROLLBACK'); throw e; } };
  const getJob = jobId => {
    const job = db.prepare('SELECT * FROM retention_jobs WHERE id = ?').get(jobId);
    if (!job) return null;
    const event = db.prepare('SELECT * FROM retention_events WHERE id = ?').get(job.event_id);
    return { ...job, simulated: true, due: local(event.due_at), event,
      history: db.prepare('SELECT h.id,h.event_type,h.manager_id,m.email AS actor,h.created_at FROM retention_history h JOIN managers m ON m.id=h.manager_id WHERE h.job_id=? ORDER BY h.id').all(jobId) };
  };
  function preference(client, input, actor) {
    if (!actorExists(actor)) return error(403, 'Gestor inválido.');
    if (!clientExists(client)) return error(404, 'Cliente não encontrado.');
    if (!input || Object.keys(input).some(k => !['purpose','consent','recipient','frequencyDays','active'].includes(k)) || !text(input.purpose, 120) || typeof input.consent !== 'boolean' || typeof input.active !== 'boolean' || typeof input.recipient !== 'string' || (input.recipient !== '' && !email(input.recipient)) || !Number.isInteger(input.frequencyDays) || input.frequencyDays < 1 || input.frequencyDays > 365 || (input.active && input.consent && !email(input.recipient))) return error(400, 'Preferência inválida.');
    return transaction(() => { const at = now(); db.prepare('INSERT INTO retention_preferences VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(client_id) DO UPDATE SET purpose=excluded.purpose, consent=excluded.consent, recipient=excluded.recipient, frequency_days=excluded.frequency_days, active=excluded.active, updated_by=excluded.updated_by, updated_at=excluded.updated_at').run(client,input.purpose.trim(),+input.consent,input.recipient.trim(),input.frequencyDays,+input.active,actor,at); history(client,null,'preference_updated',actor,at); return getPreference(client); });
  }
  function getPreference(client) { return db.prepare('SELECT * FROM retention_preferences WHERE client_id=?').get(client) || null; }
  function saveTemplate(templateId, input, actor) {
    if (!actorExists(actor)) return error(403,'Gestor inválido.');
    if (!input || Object.keys(input).some(k => !['name','subject','body'].includes(k)) || !text(input.name,100) || !text(input.subject,200) || !text(input.body,2000)) return error(400,'Template inválido.');
    if (templateId && !db.prepare('SELECT id FROM retention_templates WHERE id=?').get(templateId)) return error(404,'Template não encontrado.');
    const at=now(); let result;
    if (templateId) { db.prepare('UPDATE retention_templates SET name=?,subject=?,body=?,updated_by=?,updated_at=? WHERE id=?').run(input.name.trim(),input.subject.trim(),input.body.trim(),actor,at,templateId); result=templateId; }
    else result=Number(db.prepare('INSERT INTO retention_templates(name,subject,body,updated_by,updated_at) VALUES (?,?,?,?,?)').run(input.name.trim(),input.subject.trim(),input.body.trim(),actor,at).lastInsertRowid);
    return db.prepare('SELECT * FROM retention_templates WHERE id=?').get(result);
  }
  function createEvent(input, actor) {
    if (!actorExists(actor)) return error(403,'Gestor inválido.');
    if (!input || Object.keys(input).some(k => !['clientId','serviceInstanceId','kind','title','dueAt'].includes(k)) || !id(input.clientId) || !['follow_up','maintenance'].includes(input.kind) || !text(input.title,200) || !date(input.dueAt) || (input.serviceInstanceId != null && !id(input.serviceInstanceId))) return error(400,'Acompanhamento inválido.');
    if (!clientExists(input.clientId)) return error(404,'Cliente não encontrado.');
    if (input.serviceInstanceId != null && !db.prepare('SELECT id FROM service_instances WHERE id=? AND client_id=? AND active=1').get(input.serviceInstanceId,input.clientId)) return error(400,'Serviço incompatível com cliente.');
    if (input.kind === 'maintenance' && input.serviceInstanceId == null) return error(400,'Manutenção exige serviço.');
    return transaction(() => { const at=now(); const eventId=Number(db.prepare('INSERT INTO retention_events(client_id,service_instance_id,kind,title,due_at,created_by,created_at) VALUES (?,?,?,?,?,?,?)').run(input.clientId,input.serviceInstanceId ?? null,input.kind,input.title.trim(),new Date(input.dueAt).toISOString(),actor,at).lastInsertRowid); history(input.clientId,null,'event_created',actor,at); return db.prepare('SELECT * FROM retention_events WHERE id=?').get(eventId); });
  }
  function plan(input, actor) {
    if (!actorExists(actor)) return error(403,'Gestor inválido.');
    if (!input || Object.keys(input).some(k => !['eventId','templateId','rule'].includes(k)) || !id(input.eventId) || !id(input.templateId) || !text(input.rule,80) || !/^[a-z0-9_-]+$/.test(input.rule)) return error(400,'Planejamento inválido.');
    return transaction(() => {
      const event=db.prepare('SELECT * FROM retention_events WHERE id=?').get(input.eventId); const template=db.prepare('SELECT * FROM retention_templates WHERE id=?').get(input.templateId);
      if (!event || !template) return error(404,'Acompanhamento ou template não encontrado.');
      const pref=getPreference(event.client_id); if (!pref || !pref.active || !pref.consent || !email(pref.recipient)) return error(409,'Preferência, consentimento ou destinatário não permite simulação.');
      const day=formatter.format(new Date(event.due_at)).slice(0,10); const dayNumber=Math.floor(Date.parse(day+'T00:00:00Z')/86400000); const window=String(Math.floor(dayNumber/pref.frequency_days));
      // A alteração da frequência não recria uma comunicação para o mesmo evento.
      const existing=db.prepare('SELECT id FROM retention_jobs WHERE client_id=? AND rule=? AND event_id=?').get(event.client_id,input.rule,event.id);
      if (existing) return { ...getJob(existing.id), duplicate:true };
      const at=now(); const jobId=Number(db.prepare("INSERT INTO retention_jobs(client_id,event_id,template_id,rule,window,purpose,recipient,subject,body,status,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,'planned',?,?,?)").run(event.client_id,event.id,template.id,input.rule,window,pref.purpose,pref.recipient,template.subject,template.body,actor,at,at).lastInsertRowid);
      history(event.client_id,jobId,'planned',actor,at); return { ...getJob(jobId), duplicate:false };
    });
  }
  function transition(jobId, action, input, actor) {
    if (!actorExists(actor)) return error(403,'Gestor inválido.');
    if (!id(jobId) || !['execute','retry','cancel'].includes(action) || !input || Object.keys(input).some(k => k !== 'simulateFailure') || (input.simulateFailure !== undefined && typeof input.simulateFailure !== 'boolean') || (action === 'cancel' && input.simulateFailure !== undefined)) return error(400,'Operação inválida.');
    return transaction(() => {
      const job=getJob(jobId); if (!job) return error(404,'Simulação não encontrada.');
      if ((action === 'execute' && job.status !== 'planned') || (action === 'retry' && job.status !== 'simulated_failure') || (action === 'cancel' && !['planned','simulated_failure'].includes(job.status))) return error(409,'Transição inválida.');
      const at=now(); let status='cancelled';
      if (action !== 'cancel') {
        const pref=getPreference(job.client_id);
        if (!pref || !pref.active || !pref.consent || !email(pref.recipient) || pref.recipient !== job.recipient || pref.purpose !== job.purpose) return error(409,'Preferência, consentimento ou destinatário não permite simulação.');
        if (at < job.event.due_at) return error(409,'Acompanhamento ainda não venceu.');
        const previous=db.prepare("SELECT updated_at FROM retention_jobs WHERE client_id=? AND purpose=? AND status='simulated_success' AND id<>? ORDER BY updated_at DESC LIMIT 1").get(job.client_id,job.purpose,jobId);
        if (previous && Date.parse(at)-Date.parse(previous.updated_at) < pref.frequency_days*86400000) return error(409,'Frequência mínima ainda não foi respeitada.');
        status=simulateMail({fail:input.simulateFailure === true});
      }
      db.prepare('UPDATE retention_jobs SET status=?,updated_at=? WHERE id=?').run(status,at,jobId); history(job.client_id,jobId,action === 'retry' ? 'retry_'+status : status,actor,at); return getJob(jobId);
    });
  }
  return { preference,getPreference,saveTemplate,createEvent,plan,transition,getJob, local,
    templates: () => db.prepare('SELECT * FROM retention_templates ORDER BY id').all(),
    events: client => db.prepare('SELECT * FROM retention_events WHERE client_id=? ORDER BY due_at,id').all(client).map(e => ({...e,due:local(e.due_at)})),
    jobs: client => db.prepare('SELECT id FROM retention_jobs WHERE client_id=? ORDER BY id DESC').all(client).map(row => getJob(row.id)),
    history: client => db.prepare('SELECT h.id,h.job_id,h.event_type,h.manager_id,m.email AS actor,h.created_at FROM retention_history h JOIN managers m ON m.id=h.manager_id WHERE h.client_id=? ORDER BY h.id').all(client) };
}
module.exports = { createRetentionService };
