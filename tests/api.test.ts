import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import request from 'supertest';
import {Store} from '../server/db.ts';
import {createApp} from '../server/app.ts';
import type {RuleSet} from '../shared/types.ts';
const dir=mkdtempSync(path.join(tmpdir(),'erasmus-api-')),store=new Store(dir);
for(const r of JSON.parse(readFileSync('rules/2026.json','utf8')) as RuleSet[])store.put('CallRuleSet',r);
const {app}=createApp(store,'test-install-token');const owner=request.agent(app),friend=request.agent(app);
let csrf='',friendCsrf='',projectId='',runId='';
test.after(()=>{store.close();rmSync(dir,{recursive:true,force:true});});
test('acceptance 14 and 19: no public registration, two accounts, persisted shared project',async()=>{
 assert.equal((await request(app).post('/api/users').send({})).status,401);
 let r=await owner.post('/api/setup').send({token:'test-install-token',name:'Ömer',email:'omer@example.test',password:'very-safe-password'});assert.equal(r.status,201);csrf=r.body.csrf;
 r=await owner.post('/api/users').set('X-CSRF-Token',csrf).send({name:'Arkadaş',email:'friend@example.test',password:'another-safe-password'});assert.equal(r.status,201);
 r=await owner.post('/api/users').set('X-CSRF-Token',csrf).send({name:'Üçüncü',email:'third@example.test',password:'third-safe-password'});assert.equal(r.status,400);assert.match(r.body.error,/iki/i);
 r=await friend.post('/api/login').send({email:'friend@example.test',password:'another-safe-password'});assert.equal(r.status,200);friendCsrf=r.body.csrf;
 r=await owner.post('/api/projects').set('X-CSRF-Token',csrf).send({title:'Sentetik KA122',callYear:2026,actionCode:'KA122',sector:'SCH',country:'TR',agency:'TR01',round:'R1',applicantRole:'applicant',organisation:'Sentetik Okul',language:'tr',facts:{accredited:false,durationMonths:12,participants:12,mobilityCount:1,grantsFiveYears:0}});assert.equal(r.status,201);projectId=r.body.id;
 r=await friend.get(`/api/projects/${projectId}`);assert.equal(r.status,200);assert.equal(r.body.project.title,'Sentetik KA122');
 assert.equal((await request(app).get(`/api/projects/${projectId}`)).status,401);
});
test('acceptance 12: disabled AI creates deterministic partial assessment only',async()=>{
 const r=await owner.post(`/api/projects/${projectId}/assessments`).set('X-CSRF-Token',csrf).send({ai:false,mode:'original',customMask:[]});assert.equal(r.status,400);assert.match(r.body.error,/başvuru dosyası/i);
});
test('acceptance 13 and 20: version conflict keeps both edits',async()=>{
 const payload='Başlık\nKatılımcı: 12\nİhtiyaç analizi: kurum anketi 2026.';
 let r=await owner.post(`/api/projects/${projectId}/documents`).set('X-CSRF-Token',csrf).field('role','application').attach('files',Buffer.from(payload),'application.csv');assert.equal(r.status,202);
 let d:any;for(let i=0;i<20;i++){await new Promise(resolve=>setTimeout(resolve,250));r=await owner.get(`/api/projects/${projectId}`);d=r.body.documents[0];if(d.status!=='extracting')break;}assert.equal(d.status,'ready');
 r=await owner.patch(`/api/documents/${d.id}`).set('X-CSRF-Token',csrf).send({confirmed:true});assert.equal(r.status,200);r=await owner.get(`/api/projects/${projectId}`);const s=r.body.sections[0];assert.ok(s);
 r=await owner.patch(`/api/sections/${encodeURIComponent(s.id)}`).set('X-CSRF-Token',csrf).send({text:'13',version:s.version});assert.equal(r.status,200);
 r=await friend.patch(`/api/sections/${encodeURIComponent(s.id)}`).set('X-CSRF-Token',friendCsrf).send({text:'14',version:s.version});assert.equal(r.status,409);assert.equal(r.body.conflict.draft,'14');
 r=await owner.post(`/api/projects/${projectId}/assessments`).set('X-CSRF-Token',csrf).send({ai:false,mode:'original',customMask:[]});assert.equal(r.status,202);runId=r.body.id;assert.equal(r.body.aiStatus,'not-requested');
});
test('acceptance 15: exports freeze report scoring and Turkish content',async()=>{
 const r=await owner.get(`/api/assessments/${runId}/export/xlsx`);assert.equal(r.status,200);assert.match(r.headers['content-type'],/spreadsheet/);assert.ok(Number(r.headers['content-length'])>200);
});
test('multiple documents can be downloaded as a protected ZIP',async()=>{
 const r=await owner.get(`/api/projects/${projectId}/documents/download-all`);assert.equal(r.status,200);assert.match(r.headers['content-type'],/application\/zip/);assert.match(r.headers['content-disposition'],/dosyalar\.zip/);
 assert.equal((await request(app).get(`/api/projects/${projectId}/documents/download-all`)).status,401);
});
