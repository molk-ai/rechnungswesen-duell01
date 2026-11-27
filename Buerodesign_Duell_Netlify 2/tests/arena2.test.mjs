import test from 'node:test';
import assert from 'node:assert/strict';
import { ARENA2_BANK } from '../shared/arena2-questions.mjs';
import { createGameHandler, makeQuestionOrder } from '../netlify/functions/game-core.mjs';

class Store{
 constructor(){this.data=new Map();this.k=0;}
 async get(key){return this.data.get(key)?.value??null;}
 async getWithMetadata(key){const x=this.data.get(key);return x?{data:structuredClone(x.value),etag:x.etag}:null;}
 async setJSON(key,value,opts={}){const old=this.data.get(key);if(opts.onlyIfNew&&old)return {modified:false};if(opts.onlyIfMatch&&old?.etag!==opts.onlyIfMatch)return {modified:false};const etag=`v${++this.k}`;this.data.set(key,{value:structuredClone(value),etag});return {modified:true,etag};}
 async list({prefix}){return {blobs:[...this.data.keys()].filter(key=>key.startsWith(prefix)).map(key=>({key}))};}
 async delete(key){this.data.delete(key);}
}
const call=async(h,action,other={})=>{const r=await h(new Request('https://localhost/api/game',{method:'POST',body:JSON.stringify({action,...other})}));return {status:r.status,body:await r.json()};};
test('Lernarena 2 has independently keyed, grounded multi-mode tasks',()=>{
 assert.equal(Object.keys(ARENA2_BANK.topics).length,4);
 assert(ARENA2_BANK.questions.length>=250);
 const ids=new Set();
 for(const q of ARENA2_BANK.questions){
  assert(!ids.has(q.id),q.id);ids.add(q.id);
  assert.equal(q.arena,'2');assert(ARENA2_BANK.topics[q.topic]);
  assert(q.question.length>20&&q.explanation.length>15,q.id);
  if(q.kind==='choice'){assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);assert.equal(q.options.filter(x=>x===q.answer).length,1);}
  else if(q.kind==='number'){assert.equal(typeof q.answer,'number');assert(q.answer>=0);}
  else if(q.kind==='case'){assert.equal(q.answer.length,2);assert(['Nur Aktiva','Nur Passiva','Aktiva und Passiva'].includes(q.answer[0]));assert(['steigt','sinkt','unverändert'].includes(q.answer[1]));}
  else if(q.kind==='sort'||q.kind==='board'){assert.equal(q.items.length,q.kind==='board'?8:4);assert(q.answer.every(x=>q.bins.includes(x)));}
  else if(q.kind==='pair'){assert.deepEqual([...q.answer].sort(),[0,1,2]);}
  else if(q.kind==='memory'){assert.equal(q.cards.length,12);assert.equal(new Set(q.cards).size,12);const n=new Map();q.answer.forEach(i=>n.set(i,(n.get(i)||0)+1));assert.equal(n.size,6);assert([...n.values()].every(x=>x===2));}
  else assert.fail(q.kind);
 }
 for(const mode of ['mix','quiz','sort','board','pair','number','case','memory']){
  const order=makeQuestionOrder(12425,mode,'2');assert(order.length>0,mode);assert(order.every(x=>ids.has(x)),mode);
 }
});

test('Arena 2 class duel remains locked until teacher releases it; questions never mix arenas',async()=>{
 let now=987650;const store=new Store(),h=createGameHandler(()=>store,()=>now);
 const denied=await call(h,'create',{name:'Lehrkraft',arena:'2',gameMode:'quiz'});
 assert.equal(denied.status,403);
 await store.setJSON('v1/config/arena2',{enabled:true});
 const host=await call(h,'create',{name:'Lehrkraft',arena:'2',gameMode:'quiz'});
 assert.equal(host.status,200);assert.equal(host.body.room.arena,'2');
 const code=host.body.room.code;
 const peer=await call(h,'join',{code,name:'Lernpanda',avatar:'🐼'});
 assert.equal(peer.status,200);assert.equal(peer.body.room.arena,'2');
 await call(h,'start',{code,playerId:host.body.playerId,token:host.body.token});now+=3002;
 const state=await call(h,'state',{code,playerId:peer.body.playerId,token:peer.body.token});
 assert.equal(state.body.room.phase,'playing');
 const q=ARENA2_BANK.questions.find(x=>x.id===state.body.question.id);assert(q);assert.equal(q.kind,'choice');
 const answer=await call(h,'answer',{code,playerId:peer.body.playerId,token:peer.body.token,questionId:q.id,answer:q.answer});
 assert.equal(answer.status,200);assert.equal(answer.body.correct,true);
 const arena1=await call(h,'create',{name:'Lehrkraft',arena:'1',gameMode:'quiz'});
 assert.equal(arena1.status,200);assert.equal(arena1.body.room.arena,'1');
 assert(!arena1.body.room.code.includes(' '));
});

test('Raumleitung wählt Lernarena 1 oder 2, Spielart und 5/10/15 Minuten zentral',async()=>{
 let now=100000;const store=new Store();await store.setJSON('v1/config/arena2',{enabled:true});
 const h=createGameHandler(()=>store,()=>now);
 for(const arena of ['1','2'])for(const durationMinutes of [5,10,15]){
  const host=await call(h,'create',{name:'Spielleitung',arena,gameMode:'quiz',durationMinutes,hostSpectator:true});
  assert.equal(host.status,200,`${arena}/${durationMinutes}`);
  assert.equal(host.body.room.arena,arena);
  assert.equal(host.body.room.durationMs,durationMinutes*60000);
  assert.equal(host.body.room.mode,'quiz');
  const code=host.body.room.code;
  const learner=await call(h,'join',{code,name:'Schülerpanda'});
  assert.equal(learner.body.room.arena,arena);
  assert.equal(learner.body.room.durationMs,durationMinutes*60000);
  await call(h,'start',{code,playerId:host.body.playerId,token:host.body.token});
  now+=3001;
  const session={code,playerId:learner.body.playerId,token:learner.body.token};
  const playing=await call(h,'state',session);
  assert.equal(playing.body.room.phase,'playing');
  assert.equal(playing.body.question.kind,'choice');
  assert.equal(String(playing.body.question.id).startsWith('L2Q'),arena==='2');
  now+=durationMinutes*60000;
  const finished=await call(h,'state',session);
  assert.equal(finished.body.room.phase,'finished');
  now+=10000;
 }
 const bad=await call(h,'create',{name:'Spielleitung',durationMinutes:7});
 assert.equal(bad.status,400);
 const memory=await call(h,'create',{name:'Spielleitung',arena:'2',gameMode:'memory',durationMinutes:15});
 assert.equal(memory.status,200);
 assert.equal(memory.body.room.durationMs,150000);
});
