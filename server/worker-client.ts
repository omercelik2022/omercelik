import {fork} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import type {Extraction} from '../shared/types.ts';
export function extractIsolated(path:string,name:string,id:string,ocr=true):{promise:Promise<Extraction>;cancel:()=>void}{
 const child=fork(fileURLToPath(new URL('./extract-worker.ts',import.meta.url)),[],{execArgv:['--import','tsx','--max-old-space-size=512'],stdio:['ignore','ignore','ignore','ipc'],env:{PATH:process.env.PATH,SystemRoot:process.env.SystemRoot,TEMP:process.env.TEMP,OCR_CACHE:process.env.OCR_CACHE}});
 let settled=false;
 const promise=new Promise<Extraction>((resolve,reject)=>{const timer=setTimeout(()=>{child.kill();reject(new Error('Dosya çıkarımında 180 saniye sınırı aşıldı.'));},180000);
  child.on('message',(msg:any)=>{settled=true;clearTimeout(timer);msg.ok?resolve(msg.result):reject(new Error(msg.error));});
  child.on('error',()=>{clearTimeout(timer);reject(new Error('İzole dosya işçisi başlatılamadı.'));});
  child.on('exit',()=>{clearTimeout(timer);if(!settled)reject(new Error('Dosya çıkarımı durduruldu.'));});
  child.send({path,name,id,ocr});
 });return {promise,cancel:()=>child.kill()};
}
