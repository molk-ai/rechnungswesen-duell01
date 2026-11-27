import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameHandler, makeQuestionOrder, GAME_MODES } from '../netlify/functions/game-core.mjs';
import { BANK } from '../shared/questions.mjs';

class FakeStore{
 constructor(){this.values=new Map();this.version=0;}
 async get(key){const item=this.values.get(key);return item?structuredClone(item.value):null;}
 async getWithMetadata(key){const item=this.values.get(key);return item?{data:structuredClone(item.value),etag:item.etag,metadata:{}}:null;}
 async setJSON(key,value,options={}){
  const existing=this.values.get(key);
  if(options.onlyIfNew&&existing)return {modified:false};
  if(options.onlyIfMatch&&existing?.etag!==options.onlyIfMatch)return {modified:false};
  const etag=`"${++this.version}"`;this.values.set(key,{value:structuredClone(value),etag});return {modified:true,etag};
 }
 async delete(key){this.values.delete(key);}
 async list({prefix='' }={}){return {blobs:[...this.values.keys()].filter(k=>k.startsWith(prefix)).map(key=>({key,etag:this.values.get(key).etag})),directories:[]};}
}
const bankQuestions=new Map(BANK.questions.map(q=>[q.id,q]));
const form=(action,more)=>new Request('https://localhost/api/game',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action,...more})});
async function api(handler,action,payload){const resp=await handler(form(action,payload));return {status:resp.status,data:await resp.json()};}

test('Question collection has consistent, non-ambiguous answers and all curriculum topics',()=>{
 assert(BANK.questions.length>800);
 for(const q of BANK.questions){
  assert(q.question.length>15 && q.explanation.length>15, q.id);
  if(q.kind==='choice'){
   assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);
   assert.equal(q.options.filter(x=>x===q.answer).length,1,q.id);
  }else if(q.kind==='number'){assert.equal(typeof q.answer,'number');assert(q.answer>=0);}
  else if(q.kind==='sort'||q.kind==='board'){assert.equal(q.items.length,q.kind==='board'?8:4);assert.equal(q.answer.length,q.items.length);assert(q.answer.every(v=>q.bins.includes(v)),q.id);}
  else if(q.kind==='pair'){assert.equal(q.left.length,3);assert.equal(q.right.length,3);assert.deepEqual([...q.answer].sort(),[0,1,2],q.id);}
  else if(q.kind==='case'){assert.equal(q.answer.length,2);assert(['Nur Aktiva','Nur Passiva','Aktiva und Passiva'].includes(q.answer[0]));assert(['steigt','sinkt','unverändert'].includes(q.answer[1]));}
  else if(q.kind==='memory'){assert.equal(q.cards.length,12);assert.equal(q.answer.length,12);assert.equal(new Set(q.cards).size,12);const bins=new Map();q.answer.forEach(x=>bins.set(x,(bins.get(x)||0)+1));assert.equal(bins.size,6);assert([...bins.values()].every(x=>x===2));}
  else assert.fail(`Unknown type: ${q.kind}`);
 }
 const counts=Object.fromEntries(Object.keys(BANK.topics).map(t=>[t,BANK.questions.filter(q=>q.topic===t).length]));
 assert(Object.values(counts).every(n=>n>=10));
 const first=makeQuestionOrder(7123).slice(0,60);
 for(const t of Object.keys(BANK.topics))assert(first.some(id=>bankQuestions.get(id).topic===t));
});

test('More/less cases have the right sign on both balance sides',()=>{
 const examples=BANK.questions.filter(q=>q.question.includes('Die Bürodesign GmbH kauft neue Büroausstattung für 800 € auf Rechnung.'));
 assert(examples.length>=6);
 assert(examples.some(q=>q.question.includes('Bilanzposten „Verbindlichkeiten')&&q.answer==='Der Posten steigt um 800 €'));
 const shrinking=BANK.questions.filter(q=>q.question.includes('Die Bürodesign GmbH tilgt 800 € eines langfristigen Darlehens'));
 assert(shrinking.some(q=>q.question.includes('„Bankguthaben“')&&q.answer==='Der Posten sinkt um 800 €'));
 assert(shrinking.some(q=>q.question.includes('„Langfristige Darlehen“')&&q.answer==='Der Posten sinkt um 800 €'));
});

test('Multi-person classroom, host-only start, same questions, score verified and timer ends',async()=>{
 let now=1000000;
 const store=new FakeStore();const handler=createGameHandler(()=>store,()=>now);
 const r1=await api(handler,'create',{name:'Bilanzpanda',avatar:'🐼'});
 assert.equal(r1.status,200);const {code}=r1.data.room;const one={code,playerId:r1.data.playerId,token:r1.data.token};
 const r2=await api(handler,'join',{code,name:'Fuchs',avatar:'🦊'});
 assert.equal(r2.status,200);const two={code,playerId:r2.data.playerId,token:r2.data.token};
 const r3=await api(handler,'join',{code,name:'Oli',avatar:'🐯'});
 assert.equal(r3.status,200);
 assert.equal((await api(handler,'start',two)).status,403);
 const started=await api(handler,'start',one);
 assert.equal(started.status,200);assert.equal(started.data.room.phase,'countdown');
 now+=3001;
 const s1=await api(handler,'state',one),s2=await api(handler,'state',two);
 assert.equal(s1.data.room.phase,'playing');assert.equal(s1.data.question.id,s2.data.question.id);
 assert.equal(s2.data.ranking.length,3);
 const q=bankQuestions.get(s1.data.question.id);
 const good=await api(handler,'answer',{...one,questionId:q.id,answer:q.answer});
 assert.equal(good.status,200);assert.equal(good.data.correct,true);assert(good.data.points>=100);
 const duplicate=await api(handler,'answer',{...one,questionId:q.id,answer:q.answer});
 assert.equal(duplicate.status,409);
 const fresh=await api(handler,'state',one);
 assert.equal(fresh.data.me.correct,1);assert.equal(fresh.data.index,1);
 now+=1000;
 const wrong=await api(handler,'answer',{...two,questionId:q.id,answer:q.kind==='choice'?q.options.find(v=>v!==q.answer):q.answer+1});
 assert.equal(wrong.status,200);assert.equal(wrong.data.points,0);
 const rank=await api(handler,'state',two);
 assert.equal(rank.data.ranking[0].name,'Bilanzpanda');
 assert.equal(rank.data.ranking[1].score,0);
 now+=600001;
 const over=await api(handler,'state',one);
 assert.equal(over.data.room.phase,'finished');
 const late=await api(handler,'answer',{...one,questionId:over.data.question?.id,answer:10});
 assert.equal(late.status,409);
});

test('Session secrets cannot be used to impersonate another player',async()=>{
 const store=new FakeStore();const handler=createGameHandler(()=>store,()=>30000);
 const result=await api(handler,'create',{name:'Testspieler'});const {code}=result.data.room;
 const bad=await api(handler,'state',{code,playerId:result.data.playerId,token:'X'.repeat(result.data.token.length)});
 assert.equal(bad.status,403);
 assert.equal((await api(handler,'state',{code,playerId:'../..',token:result.data.token})).status,403);
});


test('Only host can delete classroom data and all associated player scores',async()=>{
 const store=new FakeStore();const handler=createGameHandler(()=>store,()=>900000);
 const host=(await api(handler,'create',{name:'Spielleitung',hostSpectator:true})).data;
 const code=host.room.code;
 assert.equal(host.me.spectator,true);assert.equal(host.room.playerCount,0);
 const other=(await api(handler,'join',{code,name:'Lernfuchs',avatar:'🦊'})).data;
 assert.equal((await api(handler,'delete',{code,playerId:other.playerId,token:other.token})).status,403);
 assert.equal((await api(handler,'delete',{code,playerId:host.playerId,token:host.token})).status,200);
 assert.equal((await api(handler,'state',{code,playerId:other.playerId,token:other.token})).status,404);
 assert.equal(store.values.size,0);
});


test('Eight selectable games have their own validated question sequence',()=>{
 const expectedKinds={quiz:'choice',sort:'sort',board:'board',pair:'pair',number:'number',case:'case'};
 for(const [mode,kind] of Object.entries(expectedKinds)){
  const ids=makeQuestionOrder(4321,mode);
  assert(ids.length>=45,`${mode}: sufficient pool`);
  assert(ids.slice(0,25).every(id=>bankQuestions.get(id).kind===kind),mode);
 }
 assert.deepEqual(makeQuestionOrder(8456,'mix'),makeQuestionOrder(8456,'mix'));
 assert.deepEqual(makeQuestionOrder(8456,'mix').slice(0,6).map(id=>bankQuestions.get(id).kind),['choice','sort','board','pair','number','case']);
 assert.equal(Object.keys(GAME_MODES).length,8);
 assert(makeQuestionOrder(2345,'memory').every(id=>bankQuestions.get(id).kind==='memory'));
});

test('Each mode works in a ten-minute room: server validates multi-part responses and awards points',async()=>{
 let now=1300000;
 const store=new FakeStore();const handler=createGameHandler(()=>store,()=>now);
 const types={quiz:'choice',sort:'sort',board:'board',pair:'pair',number:'number',case:'case',mix:'choice'};
 for(const [gameMode,kind] of Object.entries(types)){
  const host=(await api(handler,'create',{name:'Lehrkraft',hostSpectator:true,gameMode})).data;
  const code=host.room.code;
  assert.equal(host.room.mode,gameMode);
  const player=(await api(handler,'join',{code,name:'Lernfuchs',avatar:'🦊'})).data;
  const auth={code,playerId:player.playerId,token:player.token};
  await api(handler,'start',{code,playerId:host.playerId,token:host.token});now+=3001;
  const qres=(await api(handler,'state',auth)).data;
  const q=bankQuestions.get(qres.question.id);
  assert.equal(q.kind,kind);
  assert(!Object.hasOwn(qres.question,'answer'),'no answer in exposed question');
  if(['sort','board','pair','case'].includes(kind)){
   assert.equal(qres.question.items?.length||qres.question.left?.length||2,kind==='sort'?4:kind==='board'?8:kind==='pair'?3:2);
   const bad=await api(handler,'answer',{...auth,questionId:q.id,answer:['wrong']});
   assert.equal(bad.status,200);assert.equal(bad.data.correct,false);assert.equal(bad.data.points,0);
   now+=500;
   const nextq=bankQuestions.get(bad.data.question.id);
   const correct=await api(handler,'answer',{...auth,questionId:nextq.id,answer:nextq.answer});
   assert.equal(correct.status,200);assert.equal(correct.data.correct,true);assert(correct.data.points>=150);
  }else{
   const correct=await api(handler,'answer',{...auth,questionId:q.id,answer:q.answer});
   assert.equal(correct.status,200);assert.equal(correct.data.correct,true);
  }
  now+=1000;
  const state=(await api(handler,'state',auth)).data;
  assert(state.me.score>0,`${gameMode} score`);
  assert.equal(state.room.phase,'playing');
 }
});


test('Memory is a 2:30-minute classroom duel: correct pairs scored, wrong pairs rejected and matches cannot be replayed',async()=>{
 let now=100000;const store=new FakeStore();const handler=createGameHandler(()=>store,()=>now);
 const host=(await api(handler,'create',{name:'Lehrkraft',hostSpectator:true,gameMode:'memory'})).data;
 assert.equal(host.room.mode,'memory');assert.equal(host.room.durationMs,150000);
 const user=(await api(handler,'join',{code:host.room.code,name:'Memoryfuchs',avatar:'🦊'})).data;
 const auth={code:host.room.code,playerId:user.playerId,token:user.token};
 await api(handler,'start',{code:host.room.code,playerId:host.playerId,token:host.token});now+=3001;
 let first=(await api(handler,'state',auth)).data;
 assert.equal(first.room.phase,'playing');assert.equal(first.room.endsAt-first.room.startedAt,150000);
 assert.equal(first.question.cards.length,12);assert(!Object.hasOwn(first.question,'answer'));
 const q=bankQuestions.get(first.question.id);
 const idx=Array.from({length:12},(_,i)=>i);
 const good=idx.flatMap(i=>idx.filter(j=>j>i&&q.answer[i]===q.answer[j]).map(j=>[i,j]));
 const wrong=[good[0][0],idx.find(i=>q.answer[i]!==q.answer[good[0][0]])];
 const bad=await api(handler,'answer',{...auth,questionId:q.id,answer:wrong});
 assert.equal(bad.status,200);assert.equal(bad.data.correct,false);assert.equal(bad.data.points,0);
 assert.equal(bad.data.matched.length,0);
 now+=400;
 const ok=await api(handler,'answer',{...auth,questionId:q.id,answer:good[0]});
 assert.equal(ok.status,200);assert.equal(ok.data.correct,true);assert.equal(ok.data.points,70);
 assert.equal(ok.data.matched.length,2);
 now+=400;
 const replay=await api(handler,'answer',{...auth,questionId:q.id,answer:good[0]});
 assert.equal(replay.status,409);
 for(const pair of good.slice(1)){
  now+=400;
  const hit=await api(handler,'answer',{...auth,questionId:q.id,answer:pair});
  assert.equal(hit.status,200);assert.equal(hit.data.correct,true);
  assert(hit.data.me.score>=70);
 }
 const result=(await api(handler,'state',auth)).data;
 assert.equal(result.index,1);
 assert.equal(result.matched.length,0);
 assert.equal(result.me.correct,6);
 assert.equal(result.me.score,6*70+2*30);
 now=first.room.endsAt;
 assert.equal((await api(handler,'state',auth)).data.room.phase,'finished');
 assert.equal((await api(handler,'answer',{...auth,questionId:result.question?.id,answer:good[0]})).status,409);
});
