import {readFileSync,writeFileSync} from 'node:fs';
const p='server/app.ts';let text=readFileSync(p,'utf8');text=text.replaceAll('req.params.id','String(req.params.id)').replace('req.params.ruleId','String(req.params.ruleId)').replace('String(req.params.id)=p.sectionId','req.params.id=p.sectionId');writeFileSync(p,text);
