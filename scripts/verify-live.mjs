import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';
const origin=process.env.VERIFY_ORIGIN || 'https://kelve.cn';
const base=origin+'/drunkplay';
let cookie='';
async function api(operation,body={},authenticated=true,source=origin) {
 const response=await fetch(base+'/api/'+operation,{method:'POST',headers:{'Content-Type':'application/json',Origin:source,...(authenticated && cookie?{Cookie:cookie}:{})},body:JSON.stringify(body)});
 const set=response.headers.get('set-cookie');if(set && authenticated)cookie=set.split(';')[0];
 return {status:response.status,...await response.json()};
}
for(const path of ['','/healthz','/api/health','/login','/publish']) {
 const r=await fetch(base+path);assert.equal(r.status,200,path);console.log('HTTP 200',path||'/');
}
const content=await api('query',{table:'games'});assert.equal(content.error,null);assert.equal(content.data.length,11);
const cocktails=await api('query',{table:'cocktails'});assert.equal(cocktails.error,null);assert.equal(cocktails.data.length,13);
assert.equal((await api('query',{table:'games'},true,'https://untrusted.example')).status,403);
assert.equal((await api('upload',{mime:'image/png',data:'AAAA'},false)).status,401);
const testId=randomBytes(8).toString('hex');
const email=`drunkplay-test-${testId}@example.invalid`,password=randomBytes(18).toString('hex');
const signup=await api('signup',{email,password,username:'deployment verification'});assert.equal(signup.error,null);const userId=signup.data.id;
const cleanup={userId,gameId:null,mediaId:null};
const cleanupFile=process.env.VERIFY_CLEANUP_FILE || '/private/tmp/drunkplay-test-cleanup.json';
const save=()=>writeFileSync(cleanupFile,JSON.stringify(cleanup),{mode:0o600});save();
assert.equal((await api('user')).data.id,userId);
assert.equal((await api('user',{},false)).data,null);
const game_id=content.data[0].id;
assert.equal((await api('query',{table:'game_ratings',insert:{game_id,rating:4}})).error,null);
assert.ok((await api('query',{table:'game_ratings',insert:{game_id,rating:5}})).error);
assert.equal((await api('upload',{mime:'image/png',data:'AAAA'})).status,400);
const pixel='R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const upload=await api('upload',{mime:'image/gif',data:pixel});assert.equal(upload.error,null);
cleanup.mediaId=upload.data.path.split('/').pop();save();
assert.equal((await fetch(origin+upload.data.path)).status,200);
const submission=await api('query',{table:'games',insert:{title:'Deployment verification '+testId,setup:'test',description:'synthetic deployment verification',dimensions:['运气'],players:'2',image:upload.data.path}});
assert.equal(submission.error,null);cleanup.gameId=submission.data[0].id;save();
assert.equal((await api('query',{table:'games'})).data.length,11);
assert.equal((await api('logout')).error,null);assert.equal((await api('user')).data,null);
assert.ok((await api('login',{email,password:'incorrect-password'})).error);
assert.equal((await api('login',{email,password})).error,null);
assert.equal((await api('logout')).error,null);
console.log('Verified: content counts, CSRF, anonymous restrictions, account/session, login/logout, rating deduplication, image validation/upload, pending publication.');
console.log('Remove only synthetic verification records listed in the private cleanup file.');
