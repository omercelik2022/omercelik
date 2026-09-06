import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {load} from 'cheerio';
import {safeFetch} from '../server/safe-fetch.ts';
const manifest=JSON.parse(await readFile('sources/manifest.json','utf8'));
async function save(id:string,url:string){
 try{const r=await safeFetch(url);const hash=createHash('sha256').update(r.buffer).digest('hex');const localPath=`sources/raw/${id}-${hash.slice(0,12)}.${r.type.includes('pdf')?'pdf':'html'}`;await writeFile(localPath,r.buffer);manifest[id]={id,url:r.url,hash,localPath,checkedAt:new Date().toISOString(),status:'verified',type:r.type};console.log(id,r.buffer.length);return r;}catch(e){console.log(id,(e as Error).message);return null;}
}
// Discover the PDF URL exposed by the official page's download component.
for(const [id,s] of Object.entries(manifest) as [string,any][]){if(!id.startsWith('form-')||!s.localPath.endsWith('.html'))continue;const $=load(await readFile(s.localPath,'utf8'));for(const e of $('eac-download').toArray()){const url=$(e).attr('url');if(url)await save(id+'-pdf',new URL(url,s.url).href);}}
const allocation=JSON.parse(await readFile('sources/text/ua-allocation-sch-links.json','utf8')).find((x:any)=>x.url.endsWith('.pdf'));if(allocation)await save('allocation-SCH-pdf',allocation.url);
// Catalogue contains official template links for the remaining calls.
const listing=await save('form-catalog','https://erasmus-plus.ec.europa.eu/sitemap');
if(listing){const $=load(listing.buffer.toString());const links=$('a[href]').map((_,e)=>({title:$(e).text(),url:new URL($(e).attr('href')!,'https://erasmus-plus.ec.europa.eu').href})).get().filter(x=>/2026-template-application-form/i.test(x.url));await mkdir('sources/text',{recursive:true});await writeFile('sources/text/form-catalog-links.json',JSON.stringify(links,null,2));console.log('template links',links.length);
 for(let i=0;i<links.length;i+=3)await Promise.all(links.slice(i,i+3).map(async link=>{const code=link.url.match(/ka\d{3}-[a-z]{3}/i)?.[0].toUpperCase();if(!code)return;const id='form-'+code;const page=await save(id,link.url);if(!page)return;const $=load(page.buffer.toString());const url=$('eac-download').first().attr('url');if(url)await save(id+'-pdf',new URL(url,link.url).href);}));
}
await writeFile('sources/manifest.json',JSON.stringify(manifest,null,2));
