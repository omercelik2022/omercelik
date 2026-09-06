import type {Store} from './db.ts';
import {uid,now} from './db.ts';
import type {Project,DocumentRecord,Section,RuleSet,Assessment} from '../shared/types.ts';
import {evaluateThreshold,evaluateEligibility} from '../shared/rules.ts';
import {deterministicFindings,applicationSections} from './analysis.ts';
import {defaultAI,prepareAI,runAI,PROMPT_VERSION,type AISettings} from './ai.ts';
import {sha} from './auth.ts';
export const noThreshold={status:'unavailable' as const,total:null,totalPassed:null,criteria:[],reason:'Gerçek AI kalite değerlendirmesi yapılmadı; puan uydurulmaz.'};
export class AssessmentService {
 running=new Map<string,AbortController>();
 constructor(public store:Store){}
 getRule(p:Project,ruleId?:string){const rules=this.store.list<RuleSet>('CallRuleSet');const rule=ruleId?rules.find(r=>r.id===ruleId):rules.filter(r=>r.callYear===p.callYear&&r.actionCode===p.actionCode&&r.sector===p.sector&&r.round===p.round&&r.jurisdiction===p.country).at(-1);if(!rule)throw new Error('Bu çağrı yılı/ülke/dönem için kural paketi yok; başka yılın kuralı uygulanmadı.');if(rule.actionCode!==p.actionCode||rule.sector!==p.sector||rule.jurisdiction!==p.country)throw new Error('Kural paketi proje eylemi/alanı/ülkesiyle uyuşmuyor.');return rule;}
 preview(p:Project,ruleId?:string,custom:string[]=[]){const docs=this.store.list<DocumentRecord>('Document',p.id),sections=this.store.list<Section>('ExtractedSection',p.id),rule=this.getRule(p,ruleId),settings=this.store.setting('ai',defaultAI);return {...prepareAI(rule,docs,sections,settings,custom),provider:settings.provider,model:settings.model,ruleId:rule.id};}
 start(p:Project,userId:string,options:{ai:boolean;ruleId?:string;mode:'original'|'adaptation';customMask:string[];previewHash?:string}){
  const rule=this.getRule(p,options.ruleId);if(rule.callYear!==p.callYear&&options.mode!=='adaptation')throw new Error('Farklı yıl için açık çağrı uyarlaması seçilmeli.');
  const docs=this.store.list<DocumentRecord>('Document',p.id),sections=this.store.list<Section>('ExtractedSection',p.id),app=applicationSections(docs,sections);if(!docs.some(d=>d.role==='application'))throw new Error('Değerlendirmeye esas başvuru dosyası gerekli.');
  if(docs.some(d=>['extracting','queued'].includes(d.status)))throw new Error('Dosya çıkarımı sürüyor.');
  const relevant=docs.filter(d=>d.role==='application'||d.annexEligible);const complete=!!app.length&&app.every(s=>s.readable)&&relevant.every(d=>d.confirmed&&d.status==='ready'&&d.extraction?.complete);
  const settings=this.store.setting<AISettings>('ai',defaultAI);const preview=prepareAI(rule,docs,sections,settings,options.customMask);
  if(options.ai){if(!complete)throw new Error('AI öncesi tüm esas belgelerin okunabilirliği ve metin kontrolü tamamlanmalı.');if(options.previewHash!==sha(JSON.stringify(preview.payload)))throw new Error('Gönderilecek içerik değişti; maskeleme önizlemesini yeniden onaylayın.');if(preview.blocked)throw new Error(preview.blocked);}
  const cacheKey=sha(JSON.stringify({project:p.id,revision:p.revision,rule:rule.contentHash,docs:docs.map(d=>[d.id,d.hash,d.version,d.role,d.confirmed,d.annexEligible]),sections:sections.map(s=>[s.id,s.version]),facts:p.facts,model:options.ai?settings.model:'local',provider:options.ai?settings.provider:'local',mask:options.customMask,prompt:PROMPT_VERSION,mode:options.mode}));
  const existing=this.store.list<Assessment>('AssessmentRun',p.id).find(a=>a.cacheKey===cacheKey&&!['failed','cancelled'].includes(a.status));if(existing)return existing;
  const run:Assessment={id:uid(),projectId:p.id,createdBy:userId,createdAt:now(),status:'analyzing',revision:p.revision,ruleSet:structuredClone(rule),documents:structuredClone(docs),sections:structuredClone(sections),findings:deterministicFindings(rule,p,docs,sections),eligibility:evaluateEligibility(rule,p),criteria:[],threshold:rule.mode==='allocation'?evaluateThreshold(rule,[]):{...noThreshold},coverage:{total:app.length,readable:app.filter(s=>s.readable).length,complete},aiStatus:options.ai?'running':'disabled',model:options.ai?settings.model:'Yerel deterministik kontroller',promptVersion:PROMPT_VERSION,cacheKey,mode:options.mode,error:null};
  this.store.put('AssessmentRun',run,p.id);this.store.audit(userId,'Analiz başlatıldı',run.id,p.id);
  if(!options.ai){run.status='partial';run.aiStatus='not-requested';this.store.put('AssessmentRun',run,p.id);return run;}
  const today=now().slice(0,10);const spent=this.store.setting(`cost:${today}`,0);if(spent+preview.estimatedMaxCost>settings.dailyLimit){run.status='failed';run.error='Günlük maliyet sınırı aşıldı.';this.store.put('AssessmentRun',run,p.id);return run;}
  this.store.setSetting(`cost:${today}`,spent+preview.estimatedMaxCost);
  const controller=new AbortController();this.running.set(run.id,controller);
  void runAI(rule,docs,sections,settings,options.customMask,controller.signal).then(result=>{
   if(controller.signal.aborted)return;const active=this.store.db.prepare('SELECT active FROM users WHERE id=?').get(userId);if(!active?.active)throw new Error('Analizi başlatan hesabın erişimi kaldırılmış.');
   run.criteria=result.criteria;run.findings.push(...result.findings);run.threshold=evaluateThreshold(rule,result.criteria.map(c=>c.score),complete);run.status='completed';run.aiStatus='completed';
  }).catch(e=>{if(run.status==='cancelled')return;run.status='partial';run.aiStatus='failed';run.error=e instanceof Error?e.message:'AI değerlendirmesi tamamlanamadı.';run.threshold=rule.mode==='allocation'?evaluateThreshold(rule,[]):{...noThreshold};}).finally(()=>{this.running.delete(run.id);this.store.put('AssessmentRun',run,p.id);this.store.audit(userId,'Analiz durumu: '+run.status,run.id,p.id);});
  return run;
 }
 cancel(id:string,user:string){const run=this.store.get<Assessment>('AssessmentRun',id);if(!run)throw new Error('Analiz bulunamadı.');this.running.get(id)?.abort();run.status='cancelled';run.aiStatus='cancelled';this.store.put('AssessmentRun',run,run.projectId);this.store.audit(user,'Analiz iptal edildi',id,run.projectId);return run;}
}
