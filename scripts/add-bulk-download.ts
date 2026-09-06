import {readFileSync,writeFileSync} from 'node:fs';

const server='server/app.ts';
let code=readFileSync(server,'utf8');
code=code.replace(/import (?:\* as )?archiver from 'archiver';\r?\n/g, '');
code=code.replace("import multer from 'multer';", "import multer from 'multer';\nimport * as archiver from 'archiver';");
const needle=" app.get('/api/documents/:id/download',(req,res)=>{const d=doc(String(req.params.id));res.download(path.join(store.dir,'files',d.id),d.name);});";
const endpoint=" app.get('/api/projects/:id/documents/download-all',(req,res)=>{const p=project(String(req.params.id));const documents=store.list<DocumentRecord>('Document',p.id);if(!documents.length)throw new Error('İndirilecek proje dosyası yok.');res.status(200).set({'Content-Type':'application/zip','Content-Disposition':`attachment; filename=\\\"${p.title.replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,80)||'erasmus-proje'}-dosyalar.zip\\\"`});const zip=new archiver.ZipArchive({zlib:{level:9}});zip.on('error',(error:Error)=>res.destroy(error));zip.pipe(res);for(const d of documents){const source=path.join(store.dir,'files',d.id);if(existsSync(source))zip.file(source,{name:`${d.role}/${d.name.replace(/[\\\\/:*?\\\"<>|]/g,'_')}`});}void zip.finalize();store.audit(actor(req).id,'Proje dosyaları ZIP indirildi',p.id,p.id);});";
code=code.replace("const zip=archiver('zip',{zlib:{level:9}});zip.on('error',next=>res.destroy(next));", "const zip=new archiver.ZipArchive({zlib:{level:9}});zip.on('error',(error:Error)=>res.destroy(error));");
if(!code.includes("documents/download-all"))code=code.replace(/( app\.get\('\/api\/documents\/:id\/download',[\s\S]*?\n)/,`$1${endpoint}\n`);
writeFileSync(server,code);

const client='src/ProjectView.tsx';
let view=readFileSync(client,'utf8');
const before='<section className="panel"><div className="section-heading"><h2>Proje dosyaları</h2><Badge>{docs.length} dosya</Badge></div>';
const after='<section className="panel"><div className="section-heading"><h2>Proje dosyaları</h2><div className="inline-controls"><Badge>{docs.length} dosya</Badge>{docs.length>0&&<Button asChild variant="outline" size="sm"><a href={`/api/projects/${id}/documents/download-all`}><Archive size={15}/>Tümünü ZIP indir</a></Button>}</div></div>';
if(!view.includes('Tümünü ZIP indir'))view=view.replace(before,after);
const uploadHelp='<div className="file-type-guide"><strong>Birden fazla dosyayı aynı anda seçebilirsiniz.</strong><span><b>PDF</b> Başvuru ve ekler</span><span><b>DOCX</b> Metin ve çalışma taslağı</span><span><b>XLSX / CSV</b> Bütçe, faaliyet ve gösterge tabloları</span></div>';
if(!view.includes('file-type-guide'))view=view.replace('{progress!==null&&<div role="status">',`${uploadHelp}{progress!==null&&<div role="status">`);
writeFileSync(client,view);

const css='src/style.css';
let style=readFileSync(css,'utf8');
if(!style.includes('.file-type-guide{'))style += '.file-type-guide{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0;padding:11px;background:#f1f8f7;border-radius:8px;color:#46696d;font-size:11px}.file-type-guide strong{width:100%;color:#214a50}.file-type-guide span{background:#fff;border:1px solid #d7e7e5;border-radius:5px;padding:4px 6px}.file-type-guide b{color:#087f83}\n';
writeFileSync(css,style);
