import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {load} from 'cheerio';
const m=JSON.parse(await readFile('sources/manifest.json','utf8'));
await mkdir('sources/text',{recursive:true});
for(const [id,s] of Object.entries(m) as [string,any][]){
 if(!s.localPath?.endsWith('.html'))continue;
 const $=load(await readFile(s.localPath,'utf8'));$('script,style,nav,footer,header').remove();
 const root=$('main').length?$('main'):$('body');
 root.find('h1,h2,h3,h4,h5,p,li,tr').each((_,e)=>{$(e).prepend('\n').append('\n');});
 const text=root.text().replace(/[ \t]+/g,' ').replace(/\n\s*\n/g,'\n').trim();
 await writeFile(`sources/text/${id}.txt`,text);
 const links=$('a[href]').map((_,e)=>({text:$(e).text().trim(),url:new URL($(e).attr('href')!,s.url).href})).get().filter(x=>/\.pdf|template|2026|standard/i.test(x.url));
 await writeFile(`sources/text/${id}-links.json`,JSON.stringify(links,null,2));
 console.log(id, text.match(/.{0,60}(?:maximum score|Maximum score|maximum [0-9]+ points|at least [0-9]+ points|at least [0-9]+ out).{0,80}/g)?.join('\n')||'',id.startsWith('form')?JSON.stringify(links):'');
}
