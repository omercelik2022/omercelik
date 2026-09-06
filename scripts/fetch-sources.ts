import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {safeFetch} from '../server/safe-fetch.ts';
const base='https://erasmus-plus.ec.europa.eu/';
const paths:Record<string,string>={
  guide:'erasmus-programme-guide',
  'guide-pdf':'sites/default/files/2025-11/programme-guide-2026_en.pdf',
  accreditation:'programme-guide/part-b/key-action-1/erasmus-accreditation-vet-school-adult',
  SCH:'programme-guide/part-b/key-action-1/school-pupils-and-staff',
  VET:'programme-guide/part-b/key-action-1/mobility-vet',
  ADU:'programme-guide/part-b/key-action-1/mobility-adult',
  KA150:'programme-guide/part-b/key-action-1/accreditation-youth',
  KA151:'programme-guide/part-b/key-action-1/mobility-accredited-youth',
  KA152:'programme-guide/part-b/key-action-1/youth-exchanges',
  KA153:'programme-guide/part-b/key-action-1/mobility-youth-workers',
  KA154:'programme-guide/part-b/key-action-1/youth-participation',
  KA210:'programme-guide/part-b/key-action-2/small-scale-partnerships',
  KA220:'programme-guide/part-b/key-action-2/cooperation-partnerships',
  KA240:'programme-guide/part-b/key-action-2/school-development-partnerships',
  experts:'https://www.leargas.ie/wp-content/uploads/2026/02/IV.1a-E-Guide-for-experts-on-quality-assessment-2026_v1.pdf',
  'ua-catalog':'https://www.ua.gov.tr/anasayfa/icerikler/teklif-cagrilari-ve-rehberler/',
  'ua-sch':'https://www.ua.gov.tr/programlar/firsatlar/ka122-sch-kisa-donem-ogrenciler/',
  'ua-allocation-sch':'https://ua.gov.tr/haber/2026-yili-okul-egitimi-alaninda-erasmus-akreditasyonuna-sahip-kuruluslara-hibe-tahsis-edilmesine-iliskin-kurallar-1/',
  'form-KA122-SCH':'document/2026-template-application-form-short-term-projects-for-mobility-of-learners-and-staff-in-school-education-ka122-sch',
};
await mkdir('sources/raw',{recursive:true});
let manifest:Record<string,unknown>={};try{manifest=JSON.parse(await readFile('sources/manifest.json','utf8'));}catch{}
const entries=Object.entries(paths);
for(let offset=0;offset<entries.length;offset+=4){
 await Promise.all(entries.slice(offset,offset+4).map(async([id,path])=>{
  const url=path.startsWith('https:')?path:base+path;
  try{
   const result=await safeFetch(url);const hash=createHash('sha256').update(result.buffer).digest('hex');
   const ext=result.type.includes('pdf')?'pdf':'html';const localPath=`sources/raw/${id}-${hash.slice(0,12)}.${ext}`;
   await writeFile(localPath,result.buffer);
   manifest[id]={id,url:result.url,hash,checkedAt:new Date().toISOString(),localPath,type:result.type,status:'verified'};
   console.log(`${id}: ${result.buffer.length} bytes ${hash.slice(0,12)}`);
  }catch(e){manifest[id]={...((manifest[id]||{}) as object),id,url,lastAttempt:new Date().toISOString(),error:(e as Error).message};console.log(`${id}: ${(e as Error).message}`);}
 }));
 await writeFile('sources/manifest.json',JSON.stringify(manifest,null,2));
}
