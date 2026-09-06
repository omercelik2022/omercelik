import PDFDocument from 'pdfkit';
import {Document,Paragraph,TextRun,Packer,HeadingLevel} from 'docx';
import ExcelJS from 'exceljs';
import {existsSync} from 'node:fs';
import type {Assessment,Project,Task,BudgetLine} from '../shared/types.ts';
export function exportLines(a:Assessment,p:Project){
 return ['Erasmus+ Proje Atölyesi — Öz değerlendirme raporu',p.title,`Proje: ${p.id}`,`Koşu: ${a.id} | ${a.createdAt}`,`Çağrı: ${a.ruleSet.callYear} ${a.ruleSet.actionCode}-${a.ruleSet.sector}`,`Kural: ${a.ruleSet.id} | ${a.ruleSet.contentHash}`,`Rehber: ${a.ruleSet.guideVersion} | Form: ${a.ruleSet.formVersion}`,`Başvuru sürümü: ${a.revision} | Mod: ${a.mode}`,`Kapsam: ${a.coverage.readable}/${a.coverage.total} | ${a.status}`,`AI: ${a.aiStatus} | Model: ${a.model}`,`Tahmini toplam: ${a.threshold.total??'Değerlendirilemedi'}`,`Eşik sonucu: ${a.threshold.status} — ${a.threshold.reason}`,
  ...a.criteria.map(c=>{const r=a.ruleSet.criteria.find(x=>x.id===c.criterionId)!;return `${r.name}: ${c.score}/${r.max}, alt eşik ${r.threshold}. ${c.rationale}`;}),
  'İdari/teknik uygunluk',...a.eligibility.map(e=>`${e.label}: ${e.status} (${String(e.actual??'Bilgi yok')}) | ${e.sourceId} / ${e.sourceSection}`),
  'Bulgular ve kanıtlar',...a.findings.flatMap(f=>[`${f.title} — ${f.state} / ${f.severity}`,f.reason,f.correction,`Kural: ${f.sourceId} / ${f.sourceSection}`,...f.evidence.map(e=>`${e.documentId} / ${e.location} / v${e.version}: “${e.quote}”`),...(f.evidence.length?[]:[`Taranan bölümler: ${f.scannedSections.join(', ')}`])]),
  'Belge sürümleri',...a.documents.map(d=>`${d.name} / ${d.role} / v${d.version} / SHA256 ${d.hash}`),
  'Kaynaklar',...a.ruleSet.sources.map(s=>`${s.id} | ${s.url} | ${s.section} | ${s.version} | ${s.hash} | kontrol ${s.checkedAt}`),
  'Sınırlar',...a.ruleSet.limitations,'Bu rapor resmî uzman değerlendirmesi değildir. Eşikleri geçmek fonlama garantisi değildir.'];
}
export async function makeExport(format:string,a:Assessment,p:Project,tasks:Task[]=[],budget:BudgetLine[]=[]):Promise<{buffer:Buffer;type:string}>{
 const lines=exportLines(a,p);
 if(format==='pdf'){
  const font=process.env.PDF_FONT||['C:/Windows/Fonts/arial.ttf','/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'].find(existsSync);if(!font)throw new Error('Türkçe PDF için PDF_FONT ile Unicode font yolu tanımlayın.');
  const doc=new PDFDocument({size:'A4',margin:45,info:{Title:p.title,Author:'Erasmus+ Proje Atölyesi'}});const chunks:Buffer[]=[];const buffer=new Promise<Buffer>((resolve,reject)=>{doc.on('data',c=>chunks.push(c));doc.on('end',()=>resolve(Buffer.concat(chunks)));doc.on('error',reject);});
  doc.font(font);lines.forEach((line,i)=>doc.fontSize(i===0?18:9).fillColor(i===0?'#102d40':'#253c48').text(line,{paragraphGap:6}));doc.end();return {buffer:await buffer,type:'application/pdf'};
 }
 if(format==='docx'){
  const children=[new Paragraph({text:'Çalışma kopyası — özgün dosya değiştirilmedi',heading:HeadingLevel.HEADING_1}),...lines.map(t=>new Paragraph({children:[new TextRun(t)]})),new Paragraph({text:'Yeni metin taslağı',heading:HeadingLevel.HEADING_1}),...a.sections.filter(s=>a.documents.some(d=>d.id===s.documentId&&d.role==='application')).flatMap(s=>[new Paragraph({text:s.location,heading:HeadingLevel.HEADING_2}),new Paragraph(s.text)])];
  return {buffer:await Packer.toBuffer(new Document({sections:[{children}]})),type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'};
 }
 if(format==='xlsx'){
  const wb=new ExcelJS.Workbook();const safe=(value:unknown)=>typeof value==='string'&&/^[=+\-@\t\r]/.test(value)?"'"+value:value;
  const sheet=(name:string,rows:unknown[][])=>{const s=wb.addWorksheet(name);rows.forEach(r=>s.addRow(r.map(safe)));s.columns.forEach(c=>c.width=35);s.getRow(1).font={bold:true};};
  sheet('Rapor',lines.map((line,i)=>[i+1,line]));sheet('Puanlar',[['Ölçüt','Tahmini puan','Tavan','Alt eşik','Gerekçe'],...a.criteria.map(c=>{const r=a.ruleSet.criteria.find(x=>x.id===c.criterionId)!;return [r.name,c.score,r.max,r.threshold,c.rationale];})]);
  sheet('Görevler',[['Görev','Sorumlu','Durum','Tamamlanma kanıtı'],...tasks.map(t=>[t.title,t.assignee,t.status,t.completionEvidence])]);
  sheet('Bütçe',[['Kalem','Katılımcı','Gün','Birim maliyet','Planlanan','Talep','Tahsis','Kaynak'],...budget.map(b=>[b.label,b.participants,b.days,b.unitCost,b.planned,b.requested,b.awarded,b.sourceId])]);
  return {buffer:Buffer.from(await wb.xlsx.writeBuffer()),type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'};
 }throw new Error('Rapor biçimi PDF, DOCX veya XLSX olmalı.');
}
