import {readFileSync,writeFileSync} from 'node:fs';

const appPath='src/App.tsx';
let app=readFileSync(appPath,'utf8');
app=app.replace('<Button onClick={()=>setNewProject(true)}><Plus size={18}/>Yeni Proje</Button></div>\n {page===\'dashboard\'', '<div className="inline-controls"><Button variant="outline" onClick={()=>{window.location.hash=\'files\';setNewProject(true)}}><Upload size={17}/>Mevcut başvuruyu yükle</Button><Button onClick={()=>setNewProject(true)}><Plus size={18}/>Yeni Proje</Button></div></div>\n {page===\'dashboard\'');
app=app.replace('onClick={()=>setNewProject(true)}>Projenizi atölyeye taşıyın<ArrowRight', 'onClick={()=>{window.location.hash=\'files\';setNewProject(true)}}><Upload size={17}/>Mevcut başvuruyu yükle<ArrowRight');
app=app.replace("function NewProject({rules,onClose,onCreate}:{rules:RuleSet[];onClose:()=>void;onCreate:(p:Project)=>void}){const [sector", "function NewProject({rules,onClose,onCreate}:{rules:RuleSet[];onClose:()=>void;onCreate:(p:Project)=>void}){const importing=window.location.hash==='#files';const [sector");
app=app.replace('YENİ BİR BAŞLANGIÇ</div><h2 id="new-project-title">Projenizi tanıyalım', "{importing?'MEVCUT BAŞVURU YÜKLEME':'YENİ BİR BAŞLANGIÇ'}</div><h2 id=\"new-project-title\">{importing?'Dosyanız için çağrıyı seçin':'Projenizi tanıyalım'}");
app=app.replace('<div className="steps"><button className={step===1?', '<>{importing&&<div className="alert"><Upload size={16}/>Kaydı tamamladığınızda dosya yükleme alanı doğrudan açılır.</div>}<div className="steps"><button className={step===1?');
app=app.replace('<Field label="Proje adı"><input name="title" required minLength={3}/>', '<Field label="Proje adı"><input name="title" required minLength={3} defaultValue={importing?\'Yüklenen Erasmus+ başvurusu\':\'\'}/>');
app=app.replace("{busy?'Oluşturuluyor…':'Proje oluştur'}", "{busy?'Hazırlanıyor…':importing?'Dosya yükleme alanını aç':'Proje oluştur'}");
app=app.replace('</form></section></div>;\n}', '</form></section></div></>;\n}');
app=app.replace('</form></section></div></>;', '</form></></section></div>;');
app=app.replace('<>{importing&&<div className="alert">', '{importing&&<div className="alert">');
app=app.replace('</form></></section></div>;', '</form></section></div>;');
writeFileSync(appPath,app);

const projectPath='src/ProjectView.tsx';
let project=readFileSync(projectPath,'utf8');
project=project.replace("[tab,setTab]=useState('overview')", "[tab,setTab]=useState(()=>window.location.hash==='#files'?'files':'overview')");
writeFileSync(projectPath,project);

const stylePath='src/style.css';
let style=readFileSync(stylePath,'utf8');
style=style.replace('.welcome-banner .button-outline{background:#fff;color:#123f50;border:0}', '.welcome-banner .button-outline{background:#fff;color:#123f50;border:0}.welcome-banner .inline-controls{margin-top:20px}');
writeFileSync(stylePath,style);
