import type {RuleSet,ThresholdResult,EligibilityResult,Project} from './types.ts';
export const sectorNames={SCH:'Okul eğitimi',VET:'Mesleki eğitim',ADU:'Yetişkin eğitimi',YOU:'Gençlik',HED:'Yükseköğretim',SPO:'Spor'};
export const actionNames:Record<string,string>={KA120:'Erasmus akreditasyonu',KA121:'Akredite hareketlilik talebi',KA122:'Kısa dönem hareketlilik',KA150:'Gençlik akreditasyonu',KA151:'Akredite gençlik hareketliliği',KA152:'Gençlik değişimleri',KA153:'Gençlik çalışanlarının hareketliliği',KA154:'Gençlik katılımı',KA210:'Küçük ölçekli ortaklıklar',KA220:'İş birliği ortaklıkları',KA240:'Okul gelişimi için Avrupa ortaklıkları',KA155:'DiscoverEU dahil etme',KA182:'Spor personeli hareketliliği',KA130:'Yükseköğretim konsorsiyum akreditasyonu',KA131:'Yükseköğretim hareketliliği — iç fonlar',KA171:'Yükseköğretim hareketliliği — dış fonlar'};
export function validateRuleSet(r:RuleSet,activation=false):string[]{
 const errors:string[]=[];const refs=new Set(r.sources.filter(s=>s.status==='verified'&&/^[a-f0-9]{64}$/.test(s.hash)&&s.section&&/^https:\/\//.test(s.url)).map(s=>s.id));
 if(!Number.isInteger(r.callYear)||!r.guideVersion||!r.contentHash||!r.sourceSection||!r.checkedAt)errors.push('Kural sürümü/kaynak bilgisi eksik.');
 if(!r.sources.length||r.sources.some(s=>!refs.has(s.id)))errors.push('Doğrulanmış kaynak referansı gerekli.');
 if(r.mode==='allocation'){if(r.criteria.length||r.totalThreshold!==null)errors.push('Tahsis talebine standart kalite puanı uygulanamaz.');}
 else {
  if(r.criteria.reduce((n,c)=>n+c.max,0)!==100)errors.push('Ölçüt tavanlarının toplamı 100 olmalı.');
  if(!Number.isInteger(r.totalThreshold)||r.totalThreshold!<1||r.totalThreshold!>100)errors.push('Toplam eşik geçersiz.');
  if(new Set(r.criteria.map(c=>c.id)).size!==r.criteria.length)errors.push('Tekrarlanan ölçüt kimliği.');
  for(const c of r.criteria)if(!Number.isInteger(c.max)||c.max<=0||!Number.isInteger(c.threshold)||c.threshold<Math.ceil(c.max/2)||c.threshold>c.max||!refs.has(c.sourceId)||!c.sourceSection||!c.description)errors.push(`Geçersiz ölçüt: ${c.id}`);
 }
 for(const e of r.eligibility)if(!refs.has(e.sourceId)||!e.sourceSection)errors.push(`Uygunluk kaynağı eksik: ${e.id}`);
 if(activation&&(!r.formVerified||!r.formFields.length))errors.push('Form eşlemesi doğrulanmadı.');
 if(activation&&r.status==='conflict')errors.push('Çözümlenmemiş kaynak çelişkisi.');
 return errors;
}
export function evaluateThreshold(r:RuleSet,scores:unknown,complete=true):ThresholdResult{
 const unavailable=(reason:string):ThresholdResult=>({status:'unavailable',total:null,totalPassed:null,criteria:[],reason});
 if(r.mode==='allocation')return {status:'not-applicable',total:null,totalPassed:null,criteria:[],reason:'Akreditasyona bağlı talep; standart kalite eşiği uygulanmaz.'};
 const errors=validateRuleSet(r);if(errors.length)return unavailable(errors.join(' '));
 if(!complete)return unavailable('Okunamayan veya doğrulama bekleyen içerik nedeniyle nihai toplam üretilmedi.');
 if(!Array.isArray(scores)||scores.length!==r.criteria.length)throw new Error('Tüm ana ölçütlerin puanları gerekli.');
 const criteria=r.criteria.map((c,i)=>{const score=scores[i];if(!Number.isInteger(score)||score<0||score>c.max)throw new Error(`${c.name}: puan 0–${c.max} aralığında tam sayı olmalı.`);return {id:c.id,score,threshold:c.threshold,passed:score>=c.threshold};});
 const total=criteria.reduce((n,c)=>n+c.score,0),totalPassed=total>=r.totalThreshold!;
 return {status:totalPassed&&criteria.every(c=>c.passed)?'passed':'failed',total,totalPassed,criteria,reason:'Eşik sonucu matematiksel öz değerlendirmedir; fonlama veya hibe garantisi değildir.'};
}
export function evaluateEligibility(r:RuleSet,project:Project):EligibilityResult[]{
 return r.eligibility.map(rule=>{const actual=project.facts[rule.field];let status:EligibilityResult['status']='insufficient';if(actual!==undefined&&actual!==null&&actual!=='unknown'&&actual!==''){
  const ok=rule.op==='eq'?actual===rule.value:rule.op==='oneOf'?(rule.value as string[]).includes(String(actual)):typeof actual==='number'&&Number.isFinite(actual)&&(rule.op==='min'?actual>=Number(rule.value):actual<=Number(rule.value));status=ok?'eligible':'ineligible';}
  return {ruleId:rule.id,label:rule.label,status,actual:actual??null,sourceId:rule.sourceId,sourceSection:rule.sourceSection};
 });
}
