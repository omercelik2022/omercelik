import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,readFileSync} from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
export const uid=()=>randomUUID();export const now=()=>new Date().toISOString();
export class Store {
 db:DatabaseSync;dir:string;
 constructor(dir=process.env.DATA_DIR||'data'){
  this.dir=path.resolve(dir);mkdirSync(this.dir,{recursive:true});mkdirSync(path.join(this.dir,'files'),{recursive:true});mkdirSync(path.join(this.dir,'ocr'),{recursive:true});
  this.db=new DatabaseSync(path.join(this.dir,'workshop.sqlite'));this.db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
  this.db.exec(readFileSync(new URL('./migrations/001.sql',import.meta.url),'utf8'));
 }
 get<T>(kind:string,id:string):T|undefined{const r=this.db.prepare('SELECT json FROM records WHERE kind=? AND id=?').get(kind,id);return r?JSON.parse(r.json as string):undefined;}
 list<T>(kind:string,projectId?:string):T[]{const rows=projectId===undefined?this.db.prepare('SELECT json FROM records WHERE kind=? ORDER BY rowid').all(kind):this.db.prepare('SELECT json FROM records WHERE kind=? AND project_id=? ORDER BY rowid').all(kind,projectId);return rows.map(r=>JSON.parse(r.json as string));}
 put<T extends {id:string}>(kind:string,value:T,projectId?:string){this.db.prepare('INSERT INTO records(kind,id,project_id,json) VALUES(?,?,?,?) ON CONFLICT(kind,id) DO UPDATE SET json=excluded.json,project_id=excluded.project_id').run(kind,value.id,projectId??null,JSON.stringify(value));return value;}
 remove(kind:string,id:string){this.db.prepare('DELETE FROM records WHERE kind=? AND id=?').run(kind,id);}
 setting<T>(key:string,fallback:T):T{const row=this.db.prepare('SELECT value FROM settings WHERE key=?').get(key);return row?JSON.parse(row.value as string):fallback;}
 setSetting(key:string,value:unknown){this.db.prepare('INSERT INTO settings VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(key,JSON.stringify(value));}
 audit(actor:string,action:string,target:string,project?:string){this.db.prepare('INSERT INTO audit_events VALUES(?,?,?,?,?,?)').run(uid(),actor,project??null,action,target,now());}
 transaction<T>(fn:()=>T):T{this.db.exec('BEGIN IMMEDIATE');try{const result=fn();this.db.exec('COMMIT');return result;}catch(e){this.db.exec('ROLLBACK');throw e;}}
 close(){this.db.close();}
}
