import {randomBytes} from 'node:crypto';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import path from 'node:path';
import {Store} from './db.ts';
import {createApp} from './app.ts';
import type {RuleSet} from '../shared/types.ts';
const store=new Store();
for(const r of JSON.parse(readFileSync('rules/2026.json','utf8')) as RuleSet[])if(!store.get('CallRuleSet',r.id))store.put('CallRuleSet',r);
let setupToken=process.env.SETUP_TOKEN;const tokenPath=path.join(store.dir,'setup-token.txt');
if(!store.db.prepare('SELECT id FROM users LIMIT 1').get()&&!setupToken){setupToken=existsSync(tokenPath)?readFileSync(tokenPath,'utf8').trim():randomBytes(24).toString('base64url');writeFileSync(tokenPath,setupToken,{mode:0o600});console.log(`İlk kurulum kodu özel dosyada: ${tokenPath}`);}
const {app}=createApp(store,setupToken);const port=Number(process.env.PORT||4310);const host=process.env.HOST||(process.env.NODE_ENV==='production'?'0.0.0.0':'127.0.0.1');app.listen(port,host,()=>console.log(`Erasmus+ Proje Atölyesi http://${host}:${port}`));
