import {extractFile} from './extract.ts';
process.on('message',async(message:{path:string;name:string;id:string;ocr:boolean})=>{
 try{const result=await extractFile(message.path,message.name,message.id,message.ocr);process.send?.({ok:true,result});}
 catch(e){process.send?.({ok:false,error:(e as Error).message});}
 finally{process.disconnect?.();}
});
