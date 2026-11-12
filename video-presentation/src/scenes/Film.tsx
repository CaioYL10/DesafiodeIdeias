import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';

const c = {navy: '#07142b', blue: '#00499c', cyan: '#55c2ff', white: '#f7faff', pale: '#b2c8ea'};
const smooth = (v: number) => v * v * (3 - 2 * v);
const fade = (frame: number, duration: number) => Math.min(1, frame / 18, (duration - frame) / 18);

const Backdrop: React.FC = () => <AbsoluteFill style={{background: `radial-gradient(circle at 75% 12%, #173969 0, transparent 38%), ${c.navy}`}} />;

const Brand: React.FC<{small?: boolean}> = ({small}) => <div style={{display:'flex', alignItems:'center', gap:small ? 14 : 28}}>
  <Img src={staticFile('assets/favicon-cti.png')} style={{width:small ? 48 : 92,height:small ? 48 : 92,objectFit:'contain',filter:'brightness(0) invert(1)'}} />
  <div style={{width:2,height:small ? 32 : 58,background:c.cyan,opacity:.8}} />
  <span style={{fontSize:small ? 28 : 70,fontWeight:700,letterSpacing:-2,color:c.white}}>CRM <span style={{color:c.cyan}}>CTI</span></span>
</div>;

const Intro: React.FC = () => {
  const f = useCurrentFrame();
  const rise = interpolate(f,[0,25],[72,0],{extrapolateRight:'clamp'});
  return <AbsoluteFill style={{opacity:fade(f,180),overflow:'hidden'}}>
    <Backdrop />
    <div style={{position:'absolute',left:130,top:320,transform:`translateY(${rise}px)`,opacity:Math.min(1,f/24)}}><Brand />
      <div style={{fontSize:44,color:c.pale,marginTop:28,maxWidth:1000,lineHeight:1.25}}>Relacionamento com contexto.<br/>Qualidade com direção.</div>
    </div>
    <div style={{position:'absolute',right:-180,top:80,width:1000,height:1000,border:'1px solid #55c2ff44',borderRadius:'50%',transform:`scale(${.8 + f/900})`}} />
    <div style={{position:'absolute',right:80,top:250,width:630,height:630,border:'1px solid #55c2ff30',borderRadius:'50%',transform:`scale(${.8 + f/900})`}} />
    <div style={{position:'absolute',left:130,bottom:75,fontSize:20,letterSpacing:5,color:c.cyan}}>PROTÓTIPO DEMONSTRATIVO</div>
  </AbsoluteFill>;
};

type Shot = {file:string; at:number; label:string; zoom?:number; x?:number; y?:number};
const Demo: React.FC<{duration:number; section:string; title:string; subtitle:string; shots:Shot[]}> = ({duration,section,title,subtitle,shots}) => {
  const f = useCurrentFrame();
  let current=shots[0];
  for(const shot of shots) if(f>=shot.at) current=shot;
  const local=f-current.at;
  const opacity=fade(f,duration);
  const zoom=(current.zoom || 1.04) + Math.min(local/800, .035);
  const scale=smooth(Math.min(1,local/45));
  return <AbsoluteFill style={{opacity,overflow:'hidden',background:c.navy}}>
    <Img src={staticFile(`captures/${current.file}.png`)} style={{position:'absolute',width:1920,height:1080,objectFit:'cover',transform:`translate(${current.x||0}px, ${current.y||0}px) scale(${zoom + .025*scale})`,transformOrigin:'50% 38%',filter:'brightness(1.08)'}} />
    <div style={{position:'absolute',inset:0,background:'linear-gradient(90deg,#07142be0 0%,#07142b70 25%,transparent 55%), linear-gradient(0deg,#07142b91 0%,transparent 29%)'}} />
    <div style={{position:'absolute',left:96,top:74}}><Brand small /></div>
    <div style={{position:'absolute',left:100,bottom:100,width:950,transform:`translateY(${interpolate(f,[0,22],[45,0],{extrapolateRight:'clamp'})}px)`}}>
      <div style={{fontSize:20,letterSpacing:5,color:c.cyan,fontWeight:700,marginBottom:20}}>{section}</div>
      <div style={{fontSize:70,lineHeight:1.05,letterSpacing:-2.8,fontWeight:700,color:c.white,textShadow:'0 3px 20px #061226aa'}}>{title}</div>
      <div style={{fontSize:29,lineHeight:1.3,color:c.pale,marginTop:24,maxWidth:830}}>{subtitle}</div>
    </div>
    <div style={{position:'absolute',right:64,bottom:70,fontSize:18,color:c.white,background:'#00499ccc',border:'1px solid #55c2ff66',padding:'14px 20px',borderRadius:10}}>{current.label}</div>
    <div style={{position:'absolute',left:0,top:0,height:5,width:`${f/duration*100}%`,background:c.cyan}} />
  </AbsoluteFill>;
};

const Value: React.FC = () => <Demo duration={270} section="01 / VISÃO GERAL" title="Tudo em um só lugar." subtitle="Clientes, relatos e ações de melhoria conectados em um espaço de trabalho." shots={[
  {file:'01-public',at:0,label:'Apresentação pública'},
  {file:'02-overview',at:115,label:'Visão geral do CRM'},
]} />;
const Clients: React.FC = () => <Demo duration={300} section="02 / RELACIONAMENTO" title="Cada cliente tem contexto." subtitle="Carteira, perfil, serviços, histórico e próximos passos para a equipe." shots={[
  {file:'03-clients',at:0,label:'Carteira de clientes'},
  {file:'04-profile',at:150,label:'Perfil da empresa',zoom:1.09},
]} />;
const Feedbacks: React.FC = () => <Demo duration={300} section="03 / FEEDBACKS" title="Da manifestação à leitura." subtitle="Relatos vinculados a empresa e serviço, com busca e filtro por sentimento." shots={[
  {file:'05-feedbacks',at:0,label:'Relatos de demonstração'},
  {file:'06-feedbacks-filtered',at:160,label:'Filtro aplicado: negativo',zoom:1.1},
]} />;
const Triage: React.FC = () => <Demo duration={390} section="04 / TRIAGEM HUMANA" title="Padrões merecem atenção." subtitle="Regras locais identificam recorrências. A equipe confere os relatos e decide o encaminhamento." shots={[
  {file:'07-triage',at:0,label:'Reincidência detectada'},
  {file:'08-triage-review',at:125,label:'Relatos em revisão',zoom:1.1},
  {file:'09-human-decision',at:270,label:'Proposta e justificativa da equipe',zoom:1.1},
]} />;
const Actions: React.FC = () => <Demo duration={390} section="05 / ACOMPANHAMENTO" title="Decisão vira ação." subtitle="Uma proposta aceita ganha estado e histórico para acompanhar a melhoria." shots={[
  {file:'10-actions',at:0,label:'Ação criada na triagem'},
  {file:'11-action-followup',at:155,label:'Atualização de status',zoom:1.08},
  {file:'12-action-updated',at:305,label:'Acompanhamento registrado'},
]} />;
const Dashboards: React.FC = () => <Demo duration={420} section="06 / INDICADORES" title="Visão para decidir." subtitle="Feedbacks, relações e informações financeiras em painéis separados." shots={[
  {file:'13-dashboard-feedbacks',at:0,label:'Análise dos feedbacks'},
  {file:'14-dashboard-relations',at:150,label:'Análise das relações'},
  {file:'15-dashboard-financial',at:300,label:'Receita de demonstração'},
]} />;
const Outro: React.FC = () => {
  const f=useCurrentFrame();
  return <AbsoluteFill style={{opacity:fade(f,210),display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column'}}><Backdrop />
    <div style={{zIndex:1,transform:`translateY(${interpolate(f,[0,30],[35,0],{extrapolateRight:'clamp'})}px)`}}><Brand /></div>
    <div style={{zIndex:1,color:c.pale,fontSize:38,marginTop:34}}>Conheça. Escute. Acompanhe. Melhore.</div>
    <div style={{zIndex:1,color:c.cyan,fontSize:18,letterSpacing:4,marginTop:80}}>PROTÓTIPO LOCAL · DADOS DE DEMONSTRAÇÃO</div>
  </AbsoluteFill>;
};

export const Film: React.FC = () => <AbsoluteFill style={{fontFamily:'Inter, Segoe UI, Arial, sans-serif',background:c.navy}}>
  <Audio src={staticFile('audio/trilha-original.wav')} volume={0.5} />
  <Sequence from={0} durationInFrames={180}><Intro /></Sequence>
  <Sequence from={180} durationInFrames={270}><Value /></Sequence>
  <Sequence from={450} durationInFrames={300}><Clients /></Sequence>
  <Sequence from={750} durationInFrames={300}><Feedbacks /></Sequence>
  <Sequence from={1050} durationInFrames={390}><Triage /></Sequence>
  <Sequence from={1440} durationInFrames={390}><Actions /></Sequence>
  <Sequence from={1830} durationInFrames={420}><Dashboards /></Sequence>
  <Sequence from={2250} durationInFrames={210}><Outro /></Sequence>
</AbsoluteFill>;
