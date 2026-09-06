import type {RuleSet,Project,DocumentRecord,Section,Evidence,Finding} from '../shared/types.ts';
import {uid} from './db.ts';
export const evidence=(s:Section,quote=s.text.slice(0,200)):Evidence=>({documentId:s.documentId,sectionId:s.id,location:s.location,quote,version:s.version});
export function applicationSections(docs:DocumentRecord[],sections:Section[]){const ids=new Set(docs.filter(d=>d.role==='application'||(d.role==='annex'&&d.annexEligible)).map(d=>d.id));return sections.filter(s=>ids.has(s.documentId));}
export function deterministicFindings(rule:RuleSet,project:Project,docs:DocumentRecord[],sections:Section[]):Finding[]{
 const findings:Finding[]=[];const app=applicationSections(docs,sections);const sourceId=rule.sources[0].id;
 const add=(f:Partial<Finding>&Pick<Finding,'title'|'state'|'evidence'|'reason'>)=>findings.push({id:uid(),severity:'medium',criterionIds:[],sourceId,sourceSection:'Award criteria',scannedSections:app.map(s=>s.id),requestedInfo:'Kurumun doğrulayacağı bilgi ve dayanağını ekleyin.',correction:'İlgili başvuru bölümünü gözden geçirin.',draft:null,origin:'deterministic',status:'open',assignee:null,version:1,...f});
 for(const s of app.filter(s=>!s.readable))add({title:'İçerik okunamadı',state:'Okunamadı',severity:'critical',evidence:[evidence(s)],reason:'Bu bölüm okunamadığından eksiklik sonucu veya nihai toplam üretilemez.',correction:'OCR metnini kontrol edin veya okunabilir dosya yükleyin.'});
 const unconfirmed=docs.filter(d=>(d.role==='application'||d.annexEligible)&&!d.confirmed);for(const d of unconfirmed)add({title:'Çıkarılan metin kontrolü bekliyor',state:'Doğrulama bekliyor',severity:'high',evidence:[],reason:`${d.name}: çıkarım önizlemesini ve dosya rolünü doğrulayın.`});
 // Explicitly labelled counts only; proximity alone does not imply identical activity.
 const counts:{n:number;s:Section;key:string}[]=[];
 for(const s of sections.filter(s=>docs.some(d=>d.id===s.documentId&&!['official','institutional','past-review'].includes(d.role)))){
  for(const m of s.text.matchAll(/(?:(toplam|total)\s+)?(?:katılımcı(?:\s+sayısı)?|participants?)\s*[:=]\s*(\d+)|(\d+)\s+(?:kişi|participants?)(?!\w)/gi))counts.push({n:Number(m[2]||m[3]),s,key:'participants'});
  if(/katılımcı|participant/i.test(s.heading)&&/^\d+$/.test(s.text.trim()))counts.push({n:Number(s.text.trim()),s,key:'participants'});
 }
 const pairs=new Set<string>();for(const a of counts)for(const b of counts){if(a.s.documentId===b.s.documentId||a.n===b.n)continue;const key=[a.s.documentId,b.s.documentId].sort().join(':');if(pairs.has(key))continue;pairs.add(key);
  add({title:`Katılımcı sayısı farklı: ${a.n} / ${b.n}`,state:'Çelişkili',severity:'high',evidence:[evidence(a.s),evidence(b.s)],sourceSection:rule.criteria.find(c=>/tasarım/i.test(c.name))?.sourceSection||'Eligibility criteria',reason:'İki dosyada farklı katılımcı sayıları bulundu. Aynı faaliyet/toplamı ifade edip etmediğini doğrulayın.',requestedInfo:'Faaliyet kimliği, katılımcı kapsamı ve doğru toplam.',correction:'İlgili iki dosyada aynı kapsam için sayıları uzlaştırın.'});
 }
 const topics=[['İhtiyaç analizi',/ihtiyaç|needs? analys|survey|anket/i],['Hedef ve ölçüm',/hedef|objective|indicator|gösterge/i],['Risk ve güvenlik',/risk|safety|güvenlik|koruma/i],['Takip ve yaygınlaştırma',/yaygınlaştır|disseminat|follow.up|takip/i]] as const;
 for(const [title,regex] of topics){if(app.some(s=>regex.test(s.text)))continue;
  const working=sections.filter(s=>docs.some(d=>d.id===s.documentId&&['working','institutional'].includes(d.role))&&regex.test(s.text));
  if(working.length)add({title:`${title}: çalışma kanıtını başvuruya aktarın`,state:'Doğrulama bekliyor',evidence:working.map(s=>evidence(s)),reason:'Bu bilgi yalnızca çalışma havuzunda bulundu. Başvuruda yazılmış kabul edilmez.',correction:'Uygun bilgiyi başvuru metnine aktarın ve kaynağını belirtin.'});
  else if(app.length&&app.every(s=>s.readable))add({title:`${title} bölümünü doğrulayın`,state:'Doğrulama bekliyor',evidence:[],reason:'Tüm okunabilir başvuru tarandı; başlık/terim eşleşmesi bulunamadı. Bu yerel tarama anlamsal eksiklik kararı vermez.',correction:'Bilginin geçtiği farklı başlığı işaretleyin veya gerçek AI değerlendirmesi başlatın.'});
 }
 const injection=app.filter(s=>/100\s*puan\s*ver|ignore (all |previous )?instructions|önceki talimatları yok say/i.test(s.text));
 for(const s of injection)add({title:'Belge içinde değerlendirmeye yönelik talimat',state:'Doğrulama bekliyor',severity:'high',evidence:[evidence(s)],reason:'Belge metni komut olarak çalıştırılmaz ve puanı belirlemez.',correction:'Başvuru içeriğine ait olmayan talimatı gözden geçirin.'});
 return findings;
}
export function maskText(text:string,custom:string[]=[]){let out=text.replace(/\b\d{11}\b/g,'[KİMLİK MASKELENDİ]').replace(/(?:\+90|0)?\s*5\d{2}[\s()-]*\d{3}[\s-]*\d{2}[\s-]*\d{2}\b/g,'[TELEFON MASKELENDİ]').replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'[E-POSTA MASKELENDİ]');for(const term of custom.filter(x=>x.trim().length>1))out=out.split(term).join('[KİŞİ MASKELENDİ]');return out;}
