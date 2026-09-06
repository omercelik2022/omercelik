import {randomBytes,createHash,scrypt as scryptCallback,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
import type {Request,Response,NextFunction} from 'express';
import type {User} from '../shared/types.ts';
import {Store,uid,now} from './db.ts';
const scrypt=promisify(scryptCallback);
export const sha=(s:string|Buffer)=>createHash('sha256').update(s).digest('hex');
export async function hashPassword(password:string){if(password.length<12||password.length>200)throw new Error('Parola 12–200 karakter olmalı.');const salt=randomBytes(16).toString('hex');const key=await scrypt(password,salt,64) as Buffer;return `${salt}:${key.toString('hex')}`;}
export async function verifyPassword(password:string,stored:string){const [salt,key]=stored.split(':');const derived=await scrypt(password.slice(0,200),salt,64) as Buffer;return timingSafeEqual(derived,Buffer.from(key,'hex'));}
export function safeUser(r:any):User{return {id:r.id,name:r.name,email:r.email,role:r.role,active:!!r.active};}
export interface AuthedRequest extends Request {user:User;csrf:string;sessionHash:string}
export function authMiddleware(store:Store){return (req:Request,res:Response,next:NextFunction)=>{
 const token=req.cookies?.workshop;const row=token&&store.db.prepare('SELECT u.*,s.csrf,s.token_hash FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>? AND u.active=1').get(sha(token),Date.now());
 if(!row)return res.status(401).json({error:'Oturum açmanız gerekiyor.'});
 const a=req as AuthedRequest;a.user=safeUser(row);a.csrf=row.csrf as string;a.sessionHash=row.token_hash as string;
 if(!['GET','HEAD','OPTIONS'].includes(req.method)&&req.headers['x-csrf-token']!==a.csrf)return res.status(403).json({error:'Güvenlik doğrulaması başarısız; sayfayı yenileyin.'});
 next();
};}
export function ownerOnly(req:Request,res:Response,next:NextFunction){if((req as AuthedRequest).user.role!=='owner')return res.status(403).json({error:'Bu işlem yalnızca çalışma alanı sahibine açık.'});next();}
export function createSession(store:Store,userId:string,res:Response){const token=randomBytes(32).toString('base64url'),csrf=randomBytes(24).toString('base64url');store.db.prepare('INSERT INTO sessions VALUES(?,?,?,?)').run(sha(token),userId,csrf,Date.now()+12*60*60*1000);res.cookie('workshop',token,{httpOnly:true,sameSite:'strict',secure:process.env.COOKIE_SECURE==='true',maxAge:12*60*60*1000,path:'/'});return csrf;}
export function insertUser(store:Store,data:{name:string;email:string;passwordHash:string},role:'owner'|'member'){const user={id:uid(),name:data.name,email:data.email.toLowerCase(),role,active:true};store.db.prepare('INSERT INTO users VALUES(?,?,?,?,?,?,?)').run(user.id,user.name,user.email,data.passwordHash,role,1,now());return user;}
