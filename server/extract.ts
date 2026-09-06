import {readFile} from 'node:fs/promises';
import path from 'node:path';
import yauzl from 'yauzl';
import {XMLParser} from 'fast-xml-parser';
import ExcelJS from 'exceljs';
import {parse} from 'csv-parse/sync';
import type {Extraction,Section} from '../shared/types.ts';
export const MAX_FILE=20_000_000, MAX_PAGES=300, MAX_SECTIONS=30000, MAX_TEXT=2_000_000;

export async function readZip(buffer:Buffer):Promise<Map<string,Buffer>> {
 return new Promise((resolve,reject)=>{yauzl.fromBuffer(buffer,{lazyEntries:true,validateEntrySizes:true},(err,zip)=>{
  if(err||!zip)return reject(new Error('Geçersiz Office ZIP dosyası.'));
  const out=new Map<string,Buffer>();let bytes=0,count=0;let failed=false;
  const fail=(e:Error)=>{if(failed)return;failed=true;zip.close();reject(e);};
  zip.on('error',fail);zip.on('end',()=>resolve(out));
  zip.on('entry',entry=>{
   if(++count>5000||(bytes+=entry.uncompressedSize)>80_000_000||entry.uncompressedSize>20_000_000||entry.fileName.includes('..')||entry.fileName.startsWith('/')||entry.generalPurposeBitFlag&1)return fail(new Error('Arşiv güvenlik/boyut sınırı aşıldı.'));
   if(/vbaProject|embeddings\//i.test(entry.fileName))return fail(new Error('Makro veya gömülü çalıştırılabilir içerik kabul edilmez. Makrosuz DOCX/XLSX kaydedin.'));
   if(/\/$/.test(entry.fileName))return zip.readEntry();
   zip.openReadStream(entry,(err,stream)=>{if(err||!stream)return fail(err||new Error('Arşiv okunamadı.'));const chunks:Buffer[]=[];let actual=0;
    stream.on('data',chunk=>{actual+=chunk.length;if(actual>20_000_000){stream.destroy();fail(new Error('Açılım boyutu sınırı.'));}else chunks.push(chunk);});stream.on('error',fail);stream.on('end',()=>{out.set(entry.fileName,Buffer.concat(chunks));if(!failed)zip.readEntry();});
   });
  });zip.readEntry();
 });});
}

export async function extractFile(filePath:string,name:string,documentId:string,ocr=true):Promise<Extraction>{
 const buffer=await readFile(filePath);if(buffer.length>MAX_FILE)throw new Error('Dosya en fazla 20 MB olabilir.');
 const ext=path.extname(name).toLowerCase();const sections:Section[]=[];const warnings:string[]=[];let pages=0;
 const add=(s:Partial<Section>&{text:string;location:string})=>{if(sections.length>=MAX_SECTIONS)throw new Error('Bölüm sınırı aşıldı; dosyayı bölün.');sections.push({id:`${documentId}:${sections.length+1}`,documentId,heading:'',kind:'paragraph',readable:true,version:1,...s});};
 if(['.doc','.xls'].includes(ext))throw new Error('Eski DOC/XLS biçimi desteklenmiyor. Office veya LibreOffice ile DOCX/XLSX biçimine dönüştürün.');
 if(ext==='.pdf'){
  if(!buffer.subarray(0,5).equals(Buffer.from('%PDF-')))throw new Error('Dosya içeriği PDF değil.');
  const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs');
  const loading=pdfjs.getDocument({data:new Uint8Array(buffer),useSystemFonts:true,disableFontFace:true});
  const pdf=await loading.promise;
  pages=pdf.numPages;if(pages>MAX_PAGES){await loading.destroy();throw new Error('PDF en fazla 300 sayfa olabilir.');}
  let ocrWorker:Awaited<ReturnType<typeof import('tesseract.js').createWorker>>|undefined;
  try{for(let p=1;p<=pages;p++){
   const page=await pdf.getPage(p);const content=await page.getTextContent();
   let text=content.items.map(item=>'str' in item?item.str+('hasEOL' in item&&item.hasEOL?'\n':' '):'').join('').trim();
   let readable=!!text;
   if(!readable&&ocr){try{
    const {createCanvas}=await import('@napi-rs/canvas');const viewport=page.getViewport({scale:1.8});
    if(viewport.width*viewport.height>18_000_000)throw new Error('OCR sayfa çözünürlüğü sınırı.');
    const canvas=createCanvas(Math.ceil(viewport.width),Math.ceil(viewport.height));
    await page.render({canvasContext:canvas.getContext('2d') as any,viewport,canvas:canvas as any}).promise;
    if(!ocrWorker){const {createWorker}=await import('tesseract.js');ocrWorker=await createWorker(['tur','eng'],1,{cachePath:process.env.OCR_CACHE||'data/ocr',logger:()=>{}});}
    const result=await ocrWorker.recognize(canvas.toBuffer('image/png'));text=result.data.text.trim();readable=text.length>0&&result.data.confidence>=35;
    warnings.push(`Sayfa ${p}: OCR ${readable?'çıkarıldı, metni doğrulayın':'yetersiz güven; okunamadı'}.`);
   }catch{warnings.push(`Sayfa ${p}: Türkçe/İngilizce OCR çalışmadı. Bağımlılık veya dil dosyası bağlantısını kontrol edin.`);}}
   if(!readable)warnings.push(`Sayfa ${p} okunamadı; içerik eksikliği olarak değerlendirilmez.`);
   add({text,location:`Sayfa ${p}`,page:p,kind:'page',readable});
   const annotations=await page.getAnnotations();for(const a of annotations){if(a.subtype==='Widget'&&a.fieldValue){add({text:String(a.fieldValue),heading:String(a.fieldName||''),location:`Sayfa ${p} / form alanı ${a.fieldName||''}`,page:p,kind:'form'});}}
   page.cleanup();
  }}finally{if(ocrWorker)await ocrWorker.terminate();await loading.destroy();}
 }else if(ext==='.docx'||ext==='.xlsx'){
  if(buffer[0]!==0x50||buffer[1]!==0x4b)throw new Error('Dosyanın gerçek içeriği Office ZIP biçimi değil.');
  const entries=await readZip(buffer);
  if(!entries.has('[Content_Types].xml'))throw new Error('Office içerik tanımı bulunamadı.');
  if(ext==='.docx'){
   const xml=entries.get('word/document.xml');if(!xml)throw new Error('DOCX belgesi bulunamadı.');
   const parser=new XMLParser({preserveOrder:true,ignoreAttributes:false,processEntities:false});
   const tree=parser.parse(xml.toString('utf8'));let para=0,table=0,heading='';
   const textOf=(nodes:any[]):string=>nodes.map(n=>n['w:t']?.map((v:any)=>v['#text']??'').join('')??(n['w:tab']?'\t':n['w:br']?'\n':Object.entries(n).filter(([k,v])=>k!==':@'&&Array.isArray(v)).map(([,v])=>textOf(v as any[])).join(''))).join('');
   const visit=(nodes:any[])=>{for(const n of nodes){if(n['w:p']){para++;const t=textOf(n['w:p']);if(/Heading|Title|Başlık/i.test(JSON.stringify(n['w:p'].find((x:any)=>x['w:pPr']))||''))heading=t;
     if(t.trim())add({text:t,heading,location:`${heading?heading+' / ':''}Paragraf ${para}`});
    }else if(n['w:tbl']){table++;let row=0;for(const r of n['w:tbl'].filter((x:any)=>x['w:tr'])){row++;let cell=0;for(const c of r['w:tr'].filter((x:any)=>x['w:tc'])){cell++;add({text:textOf(c['w:tc']),heading,location:`Tablo ${table} / satır ${row} / hücre ${cell}`,kind:'cell'});}}}
    else for(const [k,v] of Object.entries(n))if(k!==':@'&&Array.isArray(v))visit(v);
   }};visit(tree);
  }else{
   if(!entries.has('xl/workbook.xml'))throw new Error('XLSX çalışma kitabı bulunamadı.');
   const wb=new ExcelJS.Workbook();await wb.xlsx.load(buffer as any);
   wb.eachSheet(sheet=>{sheet.eachRow({includeEmpty:false},row=>row.eachCell({includeEmpty:false},cell=>{
    const v=cell.value;const formula=typeof v==='object'&&v&&'formula' in v?String(v.formula):undefined;
    const cached=formula&&v&&typeof v==='object'&&'result' in v?(v.result as string|number|null):undefined;
    if(formula&&cached==null)warnings.push(`${sheet.name}!${cell.address}: formülün hesaplanmış değeri yok.`);
    const text=formula?(cached==null?'[Hesaplanmamış formül]':String(cached)):cell.text;
    add({text,location:`${sheet.name}!${cell.address}`,heading:sheet.name,kind:'cell',sheet:sheet.name,cell:cell.address,formula,cachedValue:cached,readable:!formula||cached!=null});
   }));});
  }
 }else if(ext==='.csv'){
  if(buffer.includes(0))throw new Error('CSV metin dosyası değil (NUL baytı). UTF-8 CSV kaydedin.');
  let text:string;try{text=new TextDecoder('utf-8',{fatal:true}).decode(buffer);}catch{throw new Error('CSV UTF-8 olarak kaydedilmeli.');}
  const first=text.split(/\r?\n/)[0];const delimiter=first.includes(';')?';':first.includes('\t')?'\t':',';
  const rows=parse(text,{bom:true,delimiter,relax_column_count:true,skip_empty_lines:true,max_record_size:200000}) as string[][];
  rows.forEach((row,r)=>row.forEach((value,c)=>add({text:value,location:`Satır ${r+1} / sütun ${c+1}`,heading:rows[0]?.[c]||'',kind:'cell',sheet:'CSV',cell:`${c+1}:${r+1}`,formula:/^[=+@]/.test(value)?value:undefined})));
 }else throw new Error('Yalnızca PDF, DOCX, XLSX ve CSV desteklenir.');
 const text=sections.map(s=>s.text).join('\n');if(text.length>MAX_TEXT)throw new Error('Metin boyutu sınırı aşıldı; dosyayı bölün.');
 if(!sections.length){warnings.push('Okunabilir içerik bulunamadı.');add({text:'',location:'Belge',readable:false});}
 return {sections,warnings,complete:sections.every(s=>s.readable),pages,suggestedCodes:[...new Set(text.match(/KA(?:120|121|122|150|151|152|153|154|155|182|210|220|240|130|131|171)[-\s]?(?:SCH|VET|ADU|YOU|HED|SPO)?/gi)||[])],suggestedYears:[...new Set([...text.matchAll(/(?:Call|Çağrı|Cagri|Year|Yıl)\s*[:\-]?\s*(20\d{2})/gi)].map(x=>Number(x[1])))]};
}
