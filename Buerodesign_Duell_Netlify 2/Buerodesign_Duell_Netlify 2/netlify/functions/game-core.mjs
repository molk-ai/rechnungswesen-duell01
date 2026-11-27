import { randomBytes, timingSafeEqual } from 'node:crypto';
import { BANK } from '../../shared/questions.mjs';
import { ARENA2_BANK } from '../../shared/arena2-questions.mjs';

const QUESTION_BY_ID = new Map([...BANK.questions,...ARENA2_BANK.questions].map(q => [q.id, q]));
const AVATARS = new Set(['🐼','🦊','🐯','🦉','🐧','🐨','🦁','🐙','🐸','🦄','🐺','🐻']);
const TOPIC_IDS = Object.keys(BANK.topics);
export const GAME_MODES = Object.freeze({mix:'Spiele-Mix',quiz:'Quiz-Arena',sort:'Sortier-Werkstatt',board:'Zuordnungsfeld',pair:'Paar-Finder',number:'Rechen-Rennen',case:'Bilanz-Kompass',memory:'Memory · 2:30'});
const KINDS = ['choice','sort','board','pair','number','case'];
const MODE_KINDS = {mix:KINDS,quiz:['choice'],sort:['sort'],board:['board'],pair:['pair'],number:['number'],case:['case'],memory:['memory']};
const POINTS = {choice:100,number:120,case:150,sort:180,board:220,pair:180};
const ROOM_LENGTH_MS = 600_000;
const ALLOWED_DUEL_MINUTES = [5,10,15];
const MEMORY_LENGTH_MS = 150_000;
const ROOM_VALID_MS = 2 * 60 * 60 * 1000;
const PLAYER_LIMIT = 45;
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const response = (obj, status=200) => new Response(JSON.stringify(obj), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control':'no-store', 'x-content-type-options':'nosniff' }
});
const failure = (message, status=400) => response({ error: message }, status);
const roomKey = code => `v1/rooms/${code}/meta`;
const playerPrefix = code => `v1/rooms/${code}/players/`;
const playerKey = (code,id) => playerPrefix(code)+id;
const secret = () => randomBytes(24).toString('hex');
const id = () => randomBytes(12).toString('hex');
const chooseCode = () => [...randomBytes(6)].map(b=>CHARSET[b%CHARSET.length]).join('');
const validCode = code => typeof code==='string' && /^[A-HJ-NP-Z2-9]{6}$/.test(code);
const normName = x => String(x??'').replace(/[<>\u0000-\u001f]/g,'').trim().slice(0,22);
const normAvatar = x => AVATARS.has(x)?x:'🐼';
const validSecret = (a,b) => {
  if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;
  return timingSafeEqual(Buffer.from(a),Buffer.from(b));
};
function shuffle(arr,seed){
  arr=[...arr];let s=seed>>>0;
  for(let i=arr.length-1;i>0;i--){s=(Math.imul(s,1664525)+1013904223)>>>0;const j=s%(i+1);[arr[i],arr[j]]=[arr[j],arr[i]];}
  return arr;
}
export function makeQuestionOrder(seed,mode='mix',arena='1'){
  const bank=arena==='2'?ARENA2_BANK:BANK;
  const kinds=MODE_KINDS[mode]||MODE_KINDS.mix;
  if(mode==='mix'){
    // Alle fünf Aufgabenmechaniken wechseln sich ab; derselbe Seed erzeugt dieselbe Reihenfolge.
    const buckets=kinds.map((kind,i)=>shuffle(bank.questions.filter(q=>q.kind===kind).map(q=>q.id),(seed+i*1667)>>>0));
    const out=[];
    for(let i=0;i<Math.max(...buckets.map(b=>b.length));i++)for(const bucket of buckets)if(bucket[i])out.push(bucket[i]);
    return out;
  }
  const pool=bank.questions.filter(q=>kinds.includes(q.kind));
  return shuffle(pool.map(q=>q.id),seed);
}
function exposedQuestion(q){if(!q)return null;return {id:q.id,topic:q.topic,level:q.level,kind:q.kind,
  question:q.question,options:q.options||null,unit:q.unit||null,items:q.items||null,bins:q.bins||null,
  left:q.left||null,right:q.right||null,cards:q.cards||null};}
function publicPlayer(p){return {id:p.id,name:p.name,avatar:p.avatar,score:p.score,correct:p.correct,attempts:p.attempts,streak:p.streak,spectator:!!p.spectator};}
async function listPlayers(store,code){
  const {blobs}=await store.list({prefix:playerPrefix(code)});
  const subset=blobs.slice(0,PLAYER_LIMIT+3);
  const people=(await Promise.all(subset.map(b=>store.get(b.key,{type:'json',consistency:'strong'})))).filter(Boolean);
  people.sort((a,b)=>b.score-a.score||b.correct-a.correct||a.attempts-b.attempts||a.joinedAt-b.joinedAt);
  return people;
}
async function roomState(store,meta,me,now,includePlayers=true){
  const phase=!meta.startedAt?'lobby':now<meta.startedAt?'countdown':now<meta.endsAt?'playing':'finished';
  const current=me&&!me.spectator&&phase==='playing'?QUESTION_BY_ID.get(meta.order[me.index]):null;
  const players=includePlayers?(await listPlayers(store,meta.code)).filter(p=>!p.spectator).map(publicPlayer):[];
  return {room:{code:meta.code,createdAt:meta.createdAt,startedAt:meta.startedAt,endsAt:meta.endsAt,phase,playerCount:players.length,mode:meta.mode||'mix',modeName:GAME_MODES[meta.mode||'mix'],durationMs:meta.durationMs||ROOM_LENGTH_MS,arena:meta.arena||'1'},
    now, me:me?publicPlayer(me):null, isHost:!!(me&&me.id===meta.hostId),index:me?.index||0,
    question:exposedQuestion(current),matched:current?.kind==='memory'?(me.memoryMatches||[]):[],ranking:players};
}
function correctAnswer(q,value){
 if(q.kind==='choice')return typeof value==='string' && q.options.includes(value) && value===q.answer;
 if(q.kind==='number')return typeof value==='number' && Number.isSafeInteger(value) && value===q.answer;
 if(!Array.isArray(value)||!Array.isArray(q.answer)||value.length!==q.answer.length)return false;
 return q.answer.every((v,i)=>value[i]===v);
}

/** Inject store and clock for repeatable tests; production Netlify wraps this handler. */
export function createGameHandler(getStore,clock=()=>Date.now()){
 return async function handle(req){
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:{allow:'GET, POST, OPTIONS'}});
  const action=req.method==='GET'?'health':req.method==='POST'?null:'method';
  if(action==='health')return response({ok:true,version:BANK.version,questions:BANK.questions.length,arena2Questions:ARENA2_BANK.questions.length});
  if(action==='method')return failure('Nur GET und POST sind erlaubt.',405);
  const body=await req.text();if(body.length>4000)return failure('Anfrage zu groß.',413);
  let input;try{input=JSON.parse(body);}catch{return failure('Ungültige Anfrage.');}
  const mode=input?.action;
  if(!['create','join','start','state','answer','delete'].includes(mode))return failure('Unbekannte Aktion.');
  const store=getStore();const now=clock();
  if(mode==='create'){
   const name=normName(input.name);if(name.length<2)return failure('Bitte gib einen Spielernamen mit mindestens 2 Zeichen an.');
   const gameMode=Object.hasOwn(GAME_MODES,input.gameMode)?input.gameMode:'mix';
   const arena=input.arena==='2'?'2':'1';
   const requestedMinutes=Number(input.durationMinutes??10);
   const durationMs=gameMode==='memory'?MEMORY_LENGTH_MS:(ALLOWED_DUEL_MINUTES.includes(requestedMinutes)?requestedMinutes*60_000:null);
   if(durationMs===null)return failure('Wähle 5, 10 oder 15 Minuten Spieldauer.');
   if(arena==='2'){const release=await store.get('v1/config/arena2',{type:'json',consistency:'strong'});if(!release?.enabled)return failure('Lernarena 2 ist noch durch die Lehrkraft gesperrt.',403);}
   let meta=null;
   for(let i=0;i<12;i++){
    const code=chooseCode(), seed=randomBytes(4).readUInt32BE(0),hostId=id();
    const candidate={code,hostId,seed,mode:gameMode,arena,durationMs,createdAt:now,startedAt:null,endsAt:null,order:makeQuestionOrder(seed,gameMode,arena)};
    const result=await store.setJSON(roomKey(code),candidate,{onlyIfNew:true});
    if(result.modified){meta=candidate;break;}
   }
   if(!meta)return failure('Raum konnte nicht angelegt werden. Bitte erneut versuchen.',503);
   const player={id:meta.hostId,token:secret(),name,avatar:normAvatar(input.avatar),joinedAt:now,index:0,
    score:0,correct:0,attempts:0,streak:0,lastAnswerAt:0,memoryMatches:[],spectator:input.hostSpectator===true};
   await store.setJSON(playerKey(meta.code,player.id),player,{onlyIfNew:true});
   return response({token:player.token,playerId:player.id,...await roomState(store,meta,player,now)});
  }
  const code=String(input.code||'').trim().toUpperCase();
  if(!validCode(code))return failure('Der Raumcode besteht aus 6 Zeichen.');
  const metaEntry=await store.getWithMetadata(roomKey(code),{type:'json',consistency:'strong'});
  if(!metaEntry)return failure('Raum nicht gefunden. Prüfe den Code.',404);
  const meta=metaEntry.data;
  if(now-meta.createdAt>ROOM_VALID_MS)return failure('Dieser Raum ist abgelaufen. Lege einen neuen Raum an.',410);
  if(mode==='join'){
   if(meta.arena==='2'){const release=await store.get('v1/config/arena2',{type:'json',consistency:'strong'});if(!release?.enabled)return failure('Lernarena 2 ist noch durch die Lehrkraft gesperrt.',403);}
   if(meta.endsAt && now>=meta.endsAt)return failure('Das Spiel ist bereits beendet.');
   const name=normName(input.name);if(name.length<2)return failure('Bitte gib einen Spielernamen mit mindestens 2 Zeichen an.');
   const others=await listPlayers(store,code);
   if(others.length>=PLAYER_LIMIT)return failure('Der Raum hat bereits die maximale Teilnehmerzahl.');
   const player={id:id(),token:secret(),name,avatar:normAvatar(input.avatar),joinedAt:now,index:0,
    score:0,correct:0,attempts:0,streak:0,lastAnswerAt:0,memoryMatches:[]};
   await store.setJSON(playerKey(code,player.id),player,{onlyIfNew:true});
   return response({token:player.token,playerId:player.id,...await roomState(store,meta,player,now)});
  }
  const pid=String(input.playerId||'');
  if(!/^[0-9a-f]{24}$/.test(pid))return failure('Ungültige Sitzung. Bitte Raum erneut betreten.',403);
  const pkey=playerKey(code,pid);
  const pEntry=await store.getWithMetadata(pkey,{type:'json',consistency:'strong'});
  if(!pEntry || !validSecret(input.token,pEntry.data.token))return failure('Sitzung ungültig. Bitte Raum erneut betreten.',403);
  const player=pEntry.data;
  if(mode==='state')return response(await roomState(store,meta,player,now));
  if(mode==='delete'){
   if(player.id!==meta.hostId)return failure('Nur die Spielleitung kann den Raum löschen.',403);
   const {blobs}=await store.list({prefix:playerPrefix(code)});
   await Promise.all(blobs.map(b=>store.delete(b.key)));
   await store.delete(roomKey(code));
   return response({ok:true,deleted:true});
  }
  if(mode==='start'){
   if(player.id!==meta.hostId)return failure('Nur die Person, die den Raum erstellt hat, kann starten.',403);
   if(!meta.startedAt){
    const next={...meta,startedAt:now+3000,endsAt:now+3000+(meta.durationMs||ROOM_LENGTH_MS)};
    const result=await store.setJSON(roomKey(code),next,{onlyIfMatch:metaEntry.etag});
    if(!result.modified)return failure('Das Duell wurde bereits gestartet. Lade den Raum neu.',409);
    return response(await roomState(store,next,player,now));
   }
   return response(await roomState(store,meta,player,now));
  }
  if(player.spectator)return failure('Die Spielleitung kann keine Quizantworten abgeben.',403);
  if(now<meta.startedAt || !meta.startedAt)return failure('Das Duell hat noch nicht begonnen.',409);
  if(now>=meta.endsAt)return failure('Die Spielzeit ist abgelaufen.',409);
  const q=QUESTION_BY_ID.get(meta.order[player.index]);
  if(!q)return failure('Du hast alle Aufgaben abgeschlossen.',409);
  if(q.id!==input.questionId)return failure('Diese Aufgabe ist nicht mehr aktuell. Bitte aktualisieren.',409);
  if(now-player.lastAnswerAt<350)return failure('Bitte bearbeite die nächste Aufgabe in Ruhe.',429);
  if(q.kind==='memory'){
   const choice=input.answer;
   if(!Array.isArray(choice)||choice.length!==2||!choice.every(x=>Number.isInteger(x)&&x>=0&&x<q.cards.length)||choice[0]===choice[1])return failure('Wähle zwei unterschiedliche Karten.');
   const already=player.memoryMatches||[];
   if(choice.some(x=>already.includes(x)))return failure('Dieses Paar ist schon gefunden worden.',409);
   const correct=q.answer[choice[0]]===q.answer[choice[1]];
   const nextMatches=correct?[...already,...choice]:already;
   const cleared=nextMatches.length===q.cards.length;
   const nextStreak=correct?player.streak+1:0;
   const gained=correct?70+(nextStreak%3===0?30:0):0;
   const next={...player,index:player.index+(cleared?1:0),memoryMatches:cleared?[]:nextMatches,
    correct:player.correct+(correct?1:0),attempts:player.attempts+1,streak:nextStreak,
    score:player.score+gained,lastAnswerAt:now};
   const result=await store.setJSON(pkey,next,{onlyIfMatch:pEntry.etag});
   if(!result.modified)return failure('Diese Karten wurden bereits geprüft. Bitte aktualisieren.',409);
   return response({correct,points:gained,cleared,me:publicPlayer(next),index:next.index,matched:next.memoryMatches,
    question:exposedQuestion(QUESTION_BY_ID.get(meta.order[next.index])),now,endsAt:meta.endsAt});
  }
  const correct=correctAnswer(q,input.answer);
  const nextStreak=correct?player.streak+1:0;
  const gained=correct?(POINTS[q.kind]||100)+(nextStreak%3===0?30:0):0;
  const next={...player,index:player.index+1,correct:player.correct+(correct?1:0),attempts:player.attempts+1,
    streak:nextStreak,score:player.score+gained,lastAnswerAt:now};
  const result=await store.setJSON(pkey,next,{onlyIfMatch:pEntry.etag});
  if(!result.modified)return failure('Die Aufgabe wurde bereits abgegeben. Bitte aktualisieren.',409);
  return response({correct,answer:q.answer,explanation:q.explanation,points:gained,me:publicPlayer(next),index:next.index,
   question:exposedQuestion(QUESTION_BY_ID.get(meta.order[next.index])),now,endsAt:meta.endsAt});
 };
}
