import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
export const officialHosts = ['erasmus-plus.ec.europa.eu','www.ua.gov.tr','ua.gov.tr','www.leargas.ie','webgate.ec.europa.eu'];
export async function safeFetch(url:string, allowedHosts=officialHosts, maxBytes=40_000_000):Promise<{buffer:Buffer;url:string;type:string}> {
  let next=url;
  for(let i=0;i<4;i++) {
    const u=new URL(next);
    if(u.protocol!=='https:'||u.username||u.password||(u.port&&u.port!=='443')||!allowedHosts.includes(u.hostname)||isIP(u.hostname)) throw new Error('Kaynak adresi izin verilen HTTPS havuzunda değil.');
    const addresses=await lookup(u.hostname,{all:true});
    if(addresses.some(a=>/^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.|::1$|f[cd]|fe80|::ffff:)/i.test(a.address))) throw new Error('Özel ağ kaynağına erişilemez.');
    const response=await fetch(u,{redirect:'manual',signal:AbortSignal.timeout(45000)});
    if([301,302,303,307,308].includes(response.status)){next=new URL(response.headers.get('location')||'',u).href;continue;}
    if(!response.ok||!response.body)throw new Error(`Kaynak indirilemedi: HTTP ${response.status}`);
    if(Number(response.headers.get('content-length'))>maxBytes)throw new Error('Kaynak boyut sınırını aşıyor.');
    const chunks:Uint8Array[]=[];let size=0;
    for await(const part of response.body){size+=part.length;if(size>maxBytes){throw new Error('Kaynak boyut sınırını aşıyor.');}chunks.push(part);}
    return {buffer:Buffer.concat(chunks),url:u.href,type:response.headers.get('content-type')||''};
  }
  throw new Error('Kaynak yönlendirme sınırı aşıldı.');
}
