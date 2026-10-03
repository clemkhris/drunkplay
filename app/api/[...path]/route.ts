import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { compare } from 'bcryptjs';
import { rpc } from '@/lib/cloudbase-server';
import type { AppUser } from '@/lib/supabaseClient';
export const runtime = 'nodejs';
const cookieName = '__Secure-drunkplay';
const hash = (s: string) => createHash('sha256').update(s).digest('hex');
const sessions = (r: NextRequest) => hash(r.cookies.get(cookieName)?.value ?? '');
function result(data: unknown = null, error: string | null = null, status = 200, count: number | null = null) {
 return NextResponse.json({ data, count, error: error ? { message: error } : null }, { status, headers: { 'Cache-Control': 'no-store' } });
}
function passwordHash(password: string) { const salt = randomBytes(16).toString('hex'); return `scrypt:${salt}:${scryptSync(password,salt,64).toString('hex')}`; }
async function validPassword(password: string, encoded: string) {
 if (/^\$2[aby]\$/.test(encoded)) return compare(password,encoded);
 const [kind,salt,digest] = encoded.split(':'); if(kind!=='scrypt' || !salt || !/^[a-f0-9]{128}$/.test(digest ?? '')) return false;
 return timingSafeEqual(scryptSync(password,salt,64),Buffer.from(digest,'hex'));
}
function validImage(data: Buffer, mime: string) {
 return (mime==='image/png' && data.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex'))) ||
 (mime==='image/jpeg' && data[0]===255 && data[1]===216 && data[2]===255) ||
 (mime==='image/gif' && /^GIF8[79]a$/.test(data.subarray(0,6).toString())) ||
 (mime==='image/webp' && data.subarray(0,4).toString()==='RIFF' && data.subarray(8,12).toString()==='WEBP');
}
const attempts = new Map<string,{ n: number; end: number }>();
function limited(key: string) {
 const now=Date.now(); for(const [k,v] of attempts) if(v.end<now) attempts.delete(k);
 const a=attempts.get(key)??{n:0,end:now+60000}; a.n++; attempts.set(key,a); return a.n>15;
}
export async function GET(request: NextRequest) {
 const parts=request.nextUrl.pathname.replace(/^\/(?:drunkplay\/)?api\//,'').split('/');
 try {
  if(parts[0]==='health') return NextResponse.json(await rpc('health'),{headers:{'Cache-Control':'no-store'}});
  if(parts[0]==='media' && /^[0-9a-f-]{36}$/.test(parts[1]??'')) {
   const m=await rpc<{mime:string;data:string}|null>('media',{id:parts[1]}); if(!m)return new Response(null,{status:404});
   return new Response(Buffer.from(m.data,'base64'),{headers:{'Content-Type':m.mime,'Cache-Control':'public, max-age=86400','X-Content-Type-Options':'nosniff'}});
  }
  return new Response(null,{status:404});
 } catch { return NextResponse.json({status:'unavailable'},{status:503}); }
}
export async function POST(request: NextRequest) {
 const operation=request.nextUrl.pathname.split('/').pop();
 const origin=process.env.APP_ORIGIN ?? 'https://kelve.cn';
 if(request.headers.get('origin')!==origin)return result(null,'请求来源不正确',403);
 const length=Number(request.headers.get('content-length')??0); if(length>2900000)return result(null,'请求过大',413);
 if(!request.headers.get('content-type')?.startsWith('application/json'))return result(null,'请求格式不正确',400);
 const text=await request.text(); if(Buffer.byteLength(text)>2900000)return result(null,'请求过大',413);
 let body: Record<string,unknown>; try {body=JSON.parse(text); if(!body || typeof body!=='object' || Array.isArray(body))throw Error();}catch{return result(null,'请求格式不正确',400);}
 const session_key=sessions(request);
 try {
  if(operation==='user')return result(await rpc('user',{session_key}));
  if(operation==='logout') { await rpc('logout',{session_key}); const r=result();r.cookies.set(cookieName,'',{httpOnly:true,secure:true,sameSite:'lax',path:'/drunkplay',maxAge:0});return r; }
  if(operation==='login' || operation==='signup') {
   const email=String(body.email??'').trim().toLowerCase(),password=String(body.password??'');
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||password.length<6||password.length>128)return result(null,'请填写有效邮箱及 6–128 位密码',400);
   if(limited(hash(email))||limited(hash(request.headers.get('x-forwarded-for')??'unknown')))return result(null,'尝试过于频繁，请稍后重试',429);
   let credentials=await rpc<{id:string;email:string;username:string;password_hash:string}|null>('credentials',{email});
   if(operation==='signup') {
    if(credentials)return result(null,'无法注册，请检查邮箱或尝试登录',409);
    const id=randomUUID(),username=String(body.username??'').trim().slice(0,48);if(!username)return result(null,'请填写昵称',400);
    await rpc('signup',{id,email,username,password_hash:passwordHash(password)});credentials={id,email,username,password_hash:''};
   } else if(!credentials || !await validPassword(password,credentials.password_hash))return result(null,'邮箱或密码不正确',401);
   if(!credentials)return result(null,'登录失败',401);
   const token=randomBytes(32).toString('hex');await rpc('session_create',{session_key:hash(token),user_id:credentials.id});
   const user:AppUser={id:credentials.id,email:credentials.email,user_metadata:{username:credentials.username}};
   const response=result(user);response.cookies.set(cookieName,token,{httpOnly:true,secure:true,sameSite:'lax',path:'/drunkplay',maxAge:604800});return response;
  }
  if(operation==='query') {
   const table=body.table,filters=(body.filters??{}) as Record<string,unknown>,insert=body.insert as Record<string,unknown>|undefined;
   if((table==='games'||table==='cocktails')&&!insert) {
    const c=await rpc<Record<string,unknown[]>>('content');const rows=c[String(table)];return result(rows,null,200,rows.length);
   }
   if(table==='game_ratings') {
    const game_id=Number(insert?.game_id??filters.game_id);if(!Number.isSafeInteger(game_id)||game_id<1)return result(null,'游戏编号不正确',400);
    if(insert) {const rating=Number(insert.rating);if(!Number.isInteger(rating)||rating<1||rating>5)return result(null,'评分须为 1–5 星',400);return result(await rpc('rate',{session_key,game_id,rating}));}
    return result(await rpc('rating_read',{session_key,game_id,own:!!filters.user_id}));
   }
   if(table==='games'&&insert) {
    const user=await rpc<AppUser|null>('user',{session_key});if(!user)return result(null,'请先登录',401);
    const title=String(insert.title??'').trim();if(!title||title.length>200)return result(null,'请填写 200 字以内的标题',400);
    const values:Record<string,unknown>={session_key,title};
    for(const k of ['description','scene','players','image','duration','tools','setup','winning_conditions'])values[k]=String(insert[k]??'').slice(0,10000);
    values.dimensions=Array.isArray(insert.dimensions)?insert.dimensions.filter(x=>typeof x==='string').slice(0,5):[];
    return result(await rpc('publish',values));
   }
  }
  if(operation==='upload') {
   const user=await rpc<AppUser|null>('user',{session_key});if(!user)return result(null,'请先登录',401);
   if(typeof body.data!=='string'||typeof body.mime!=='string'||!/^image\/(png|jpeg|webp|gif)$/.test(body.mime))return result(null,'仅支持 PNG、JPEG、WebP 和 GIF 图片',400);
   const data=Buffer.from(body.data,'base64');if(data.length>2097152||!validImage(data,body.mime))return result(null,'图片格式不正确或超过 2 MB',400);
   return result(await rpc('upload',{session_key,id:randomUUID(),mime:body.mime,data:data.toString('base64')}));
  }
  return result(null,'不支持的操作',400);
 } catch(e) {
  console.error('DRUNKPLAY_API_FAILED',e instanceof Error?e.message:'UNKNOWN');
  return result(null,e instanceof Error && e.message==='DUPLICATE'?'记录已存在，请勿重复操作':'操作失败，请稍后重试',503);
 }
}
