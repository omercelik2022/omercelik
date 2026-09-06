import {readFile,writeFile} from 'node:fs/promises';
import {extractFile} from '../server/extract.ts';
const m=JSON.parse(await readFile('sources/manifest.json','utf8'));
for(const id of process.argv.slice(2)){const s=m[id];const e=await extractFile(s.localPath,id+'.pdf',id,false);await writeFile(`sources/text/${id}.json`,JSON.stringify(e,null,2));await writeFile(`sources/text/${id}.txt`,e.sections.map(x=>`\n--- ${x.location} ---\n${x.text}`).join('\n'));console.log(id,e.pages,e.sections.length);}
