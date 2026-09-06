import {readFileSync,writeFileSync} from 'node:fs';

const file='src/App.tsx';
let text=readFileSync(file,'utf8');
const notice=`{importing&&<div className="alert"><Upload size={16}/>Kaydı tamamladığınızda dosya yükleme alanı doğrudan açılır.</div>}`;
const sequence=/<>{importing&&<div className="alert"><Upload size=\{16\}\/>Kaydı tamamladığınızda dosya yükleme alanı doğrudan açılır.<\/div>}|{importing&&<div className="alert"><Upload size=\{16\}\/>Kaydı tamamladığınızda dosya yükleme alanı doğrudan açılır.<\/div>}/g;
let count=0;
text=text.replace(sequence,()=>{count++;return count===1?notice:'';});
writeFileSync(file,text);
