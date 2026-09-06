import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import type {RuleSet,Sector,Source,Criterion,FormField,Extraction} from '../shared/types.ts';
import {validateRuleSet} from '../shared/rules.ts';
import {extractFile} from '../server/extract.ts';
const m=JSON.parse(await readFile('sources/manifest.json','utf8'));
const hash=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const definitions:[string,Sector[],string,number[]|null,number|null,string[]][]=[
 ['KA120',['SCH','VET','ADU'],'accreditation',[10,40,20,30],70,['İlgililik','Erasmus Planı: hedefler','Erasmus Planı: faaliyetler','Erasmus Planı: yönetim']],
 ['KA121',['SCH','VET','ADU'],'sector',null,null,[]],
 ['KA122',['SCH','VET','ADU'],'sector',[20,50,30],60,['İlgililik','Proje tasarımının kalitesi','Takip faaliyetlerinin kalitesi']],
 ['KA150',['YOU'],'KA150',[20,40,40],70,['İlgililik','Stratejik gelişim','Yönetim ve koordinasyonun kalitesi']],
 ['KA151',['YOU'],'KA151',null,null,[]],
 ['KA152',['YOU'],'KA152',[30,40,30],60,['İlgililik, gerekçe ve etki','Proje tasarımının kalitesi','Proje yönetiminin kalitesi']],
 ['KA153',['YOU'],'KA153',[30,40,30],60,['İlgililik, gerekçe ve etki','Proje tasarımı ve uygulamanın kalitesi','Proje yönetiminin kalitesi']],
 ['KA154',['YOU'],'KA154',[30,40,30],60,['İlgililik, gerekçe ve etki','Proje tasarımının kalitesi','Proje yönetiminin kalitesi']],
 ['KA210',['SCH','VET','ADU','YOU'],'KA210',[30,30,20,20],60,['İlgililik','Proje tasarımı ve uygulama','Ortaklık ve iş birliği','Etki']],
 ['KA220',['SCH','VET','ADU','YOU','HED'],'KA220',[25,30,20,25],70,['Projenin ilgililiği','Proje tasarımı ve uygulama','Ortaklık ve iş birliği','Etki']],
 ['KA240',['SCH'],'KA240',[15,30,20,35],70,['İlgililik','Proje tasarımının kalitesi','Ortaklık ve iş birliği','Etki']],
];
const source=async(id:string,section:string):Promise<Source>=>{const s=m[id];return {...s,title:id,section,page:null,version:'2026 V1 / 12.11.2025',text:s?.localPath.endsWith('.html')?await readFile(`sources/text/${id}.txt`,'utf8').catch(()=> ''):undefined};};
const packs:RuleSet[]=[];
for(const [action,sectors,sourceKey,maxes,total,names] of definitions)for(const sector of sectors){
 const id=`2026-${action}-${sector}-TR-R1-v1`,key=sourceKey==='sector'?sector:sourceKey;const src=await source(key,maxes?'Award criteria':'Budget allocation');
 const text=src.text||'';const re=/^([^\n]+?\(?[Mm]aximum(?: score)?\s*:?\s*(\d+)\s*points\)?)[ \t]*$/gm;const matches=[...text.matchAll(re)].filter(x=>Number(x[2])<=50);
 const criteria:Criterion[]=(maxes||[]).map((max,i)=>{const match=matches[i];if(!match||Number(match[2])!==max)throw new Error(`${id} rubric source mismatch ${i}`);
  const end=matches[i+1]?.index??text.indexOf('\nFunding rules',match.index!+match[0].length);let desc=text.slice(match.index!+match[0].length,end>match.index!?end:match.index!+5000).trim();
  // Stop at next major section so budget/eligibility cannot masquerade as rubric elements.
  for(const marker of ['\nAccredited projects','\nWhat are the funding rules','\nTo be considered for funding','\nWhat are the rules','\nSelection criteria']){const cut=desc.indexOf(marker);if(cut>=0)desc=desc.slice(0,cut);}
  return {id:`c${i+1}`,name:names[i],max,threshold:Math.ceil(max/2),description:desc,sourceId:src.id,sourceSection:match[1],elements:desc.split('\n').filter(x=>x.length>25)};
 });
 const formId=`form-${action}-${sector}-pdf`;let formFields:FormField[]=[];let form:Source|undefined;
 if(m[formId]){form=await source(formId,'Application questions');let ex:Extraction;try{ex=JSON.parse(await readFile(`sources/text/${formId}.json`,'utf8'));}catch{ex=await extractFile(m[formId].localPath,formId+'.pdf',formId,false);await writeFile(`sources/text/${formId}.json`,JSON.stringify(ex,null,2));}
  // All template pages remain available; question mapping points at the real source page.
  formFields=ex.sections.filter(s=>s.page!>2&&s.text.length>50).map(s=>({id:`p${s.page}`,title:s.text.split('\n')[0].trim(),question:s.text.replace(/\n\d+ \/ \d+[\s\S]*$/,'').trim(),page:s.page!,characterLimit:null,criterionIds:criteria.map(c=>c.id)}));
 }
 const sources=[src,await source('experts','3.3 Award criteria and scoring'),...(form?[form]:[])];
 const p:RuleSet={id,callYear:2026,actionCode:action,sector,jurisdiction:'TR',agency:'TR01',round:'R1',applicantRole:'applicant',guideVersion:'2026 V1 / 12.11.2025',formVersion:form?`${formId} / ${form.hash.slice(0,12)}`:'Doğrulanamadı',effectiveDate:'2025-11-12',checkedAt:src.checkedAt,sourceUrl:src.url,sourceSection:src.section,sourcePage:null,contentHash:'pending',status:form?'verified':'draft',supersedes:null,mode:['KA121','KA151'].includes(action)?'allocation':['KA120','KA150'].includes(action)?'accreditation':'quality',criteria,totalThreshold:total,sources,formFields,formVerified:!!form,limitations:['Resmî form PDF şablonudur; dinamik soru ve karakter sınırları başvuru platformunda ayrıca doğrulanmalıdır.','Türkiye ulusal öncelikleri, kurum tanımı ve dönem açıklıkları ayrıca kontrol edilmelidir.'],eligibility:[],budget:{model:['KA120','KA150'].includes(action)?'none':action.startsWith('KA2')?'lump':'unit',lumpSums:[],individualRate:null,allocationVerified:false}};
 const add=(field:string,label:string,op:any,value:any,section='Eligibility criteria')=>p.eligibility.push({id:field+'-'+op,field,label,op,value,sourceId:src.id,sourceSection:section});
 if(action==='KA122'){add('accredited','Bu alanda akreditasyonu bulunmamalı','eq',false);add('durationMonths','Proje en az 6 ay','min',6);add('durationMonths','Proje en fazla 18 ay','max',18);add('participants','Hazırlık ziyareti ve refakatçiler hariç en fazla 30 katılımcı','max',30);add('mobilityCount','En az bir personel veya öğrenici hareketliliği','min',1);add('grantsFiveYears','Son beş çağrı yılında en fazla üç kısa dönem hibe','max',3);}
 if(['KA121','KA151'].includes(action))add('accredited','Geçerli alan akreditasyonu gerekli','eq',true);
 if(action==='KA210'){add('partnerCountries','En az iki farklı program ülkesinden ortak','min',2);add('partnerCount','En az iki kuruluş','min',2);add('durationMonths','Proje en az 6 ay','min',6);add('durationMonths','Proje en fazla 24 ay','max',24);if(/30.?000/.test(text)&&/60.?000/.test(text))p.budget.lumpSums=[30000,60000];}
 if(action==='KA220'){add('partnerCountries','En az üç farklı program ülkesinden ortak','min',3);add('partnerCount','En az üç kuruluş','min',3);add('durationMonths','Proje en az 12 ay','min',12);add('durationMonths','Proje en fazla 36 ay','max',36);if(/120.?000/.test(text)&&/250.?000/.test(text)&&/400.?000/.test(text))p.budget.lumpSums=[120000,250000,400000];}
 if(action==='KA122'&&sector==='SCH')p.budget.travel=[{min:10,max:99,green:56,standard:28},{min:100,max:499,green:285,standard:211},{min:500,max:1999,green:417,standard:309},{min:2000,max:2999,green:535,standard:395},{min:3000,max:3999,green:785,standard:580},{min:4000,max:7999,green:1180,standard:1180},{min:8000,max:null,green:1735,standard:1735}];
 if(!form)p.limitations.unshift('Bilgilendirme mevcut; değerlendirme henüz doğrulanmadı. 2026 form kaynağı bulunamadı.');
 p.contentHash=hash({...p,contentHash:undefined});const errors=validateRuleSet(p,!!form);if(errors.length)throw new Error(`${id}: ${errors.join(';')}`);packs.push(p);console.log(id,p.status,formFields.length);
}
await mkdir('rules',{recursive:true});await writeFile('rules/2026.json',JSON.stringify(packs,null,2));
