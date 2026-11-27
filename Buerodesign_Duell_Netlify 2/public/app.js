(()=>{
'use strict';
const DATA=window.QUESTION_BANK;
if(!DATA){document.querySelector('#screen').textContent='Der Fragenpool konnte nicht geladen werden.';return;}
const BANK2=window.ARENA2_QUESTION_BANK;
const BY_ID=new Map([...DATA.questions,...(BANK2?.questions||[])].map(q=>[q.id,q]));
const CHECK=window.BD_COMPETENCY;
const TOPIC_INFO={
 grundlagen:{emoji:'💡',description:'Vom ersten Beleg bis zur Bilanz: Fachbegriffe sicher beherrschen.'},
 inventur:{emoji:'🔎',description:'Zählen, Messen, Wiegen, Schätzen und Buchinventur unterscheiden.'},
 inventar:{emoji:'🗂️',description:'Vermögen, Schulden und Reinvermögen richtig ordnen.'},
 bilanz:{emoji:'⚖️',description:'Aktiva und Passiva, Posten und Bilanzgliederung verstehen.'},
 rechnung:{emoji:'🧮',description:'Werte, Summen, Eigenkapital und neue Bestände berechnen.'},
 veraenderungen:{emoji:'🔄',description:'Alle vier Bilanzveränderungen an Geschäftsfällen erkennen.'},
 kontoarten:{emoji:'📗',description:'Aktiv- und Passivkonten sowie Soll und Haben sicher unterscheiden.'},
 eroeffnung:{emoji:'📖',description:'Konten eröffnen und Anfangsbestände aus dem EBK übernehmen.'},
 buchungen:{emoji:'✍️',description:'Geschäftsfälle den richtigen Bestandskonten zuordnen und buchen.'},
 abschluss:{emoji:'🧾',description:'Schlussbestände, Abschlussstriche und SBK verstehen.'}
};
const GAME_MODES=[
 {id:'mix',title:'Spiele-Mix',emoji:'🎲',desc:'Sechs Aufgabenarten wechseln sich ab. Ideal für die ganze Klasse.',kind:null},
 {id:'quiz',title:'Quiz-Arena',emoji:'🧠',desc:'Wissensfragen mit vier Antworten.',kind:'choice'},
 {id:'sort',title:'Sortier-Werkstatt',emoji:'🧩',desc:'Vier Bilanzposten den passenden Gruppen zuordnen.',kind:'sort'},
 {id:'board',title:'Zuordnungsfeld',emoji:'🗺️',desc:'Acht Karten frei auf eine Fläche mit Ablagebereichen ziehen – auch auf dem iPad.',kind:'board'},
 {id:'pair',title:'Paar-Finder',emoji:'🔗',desc:'Fachbegriffe und Erklärungen verbinden.',kind:'pair'},
 {id:'number',title:'Rechen-Rennen',emoji:'🧮',desc:'Werte und Bilanzsummen selbst berechnen.',kind:'number'},
 {id:'case',title:'Bilanz-Kompass',emoji:'🔄',desc:'Geschäftsfälle auf zwei Ebenen untersuchen.',kind:'case'},
 {id:'memory',title:'Memory · 2:30',emoji:'🃏',desc:'Sechs verdeckte Fachbegriffs-Paare finden. Nur 2 Minuten 30 Sekunden!',kind:'memory'}
];
const KINDS=['choice','sort','board','pair','number','case'];
const GAME_POINTS={choice:100,number:120,case:150,sort:180,board:220,pair:180};
const AVATARS=['🐼','🦊','🐯','🦉','🐧','🐨','🦁','🐙','🐸','🦄','🐺','🐻'];
const ls=(key,def)=>{try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):def}catch{return def}};
const save=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{}};
const el=id=>document.getElementById(id);
const escapeHTML=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const MAX_NAME=22;
const fmt=n=>new Intl.NumberFormat('de-DE').format(n);
const dateClock=ms=>{const seconds=Math.max(0,Math.ceil(ms/1000));return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;};
const shuffle=list=>{let arr=[...list];for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}return arr;};
const state={view:new URLSearchParams(location.search).has('raum')?'duel':new URLSearchParams(location.search).get('ansicht')==='lernarena2'?'arena2':'home',arena:new URLSearchParams(location.search).get('ansicht')==='lernarena2'?'2':'1',arena2Unlocked:false,arena2Status:'loading',stats2:ls('bd-duell.stats.arena2.v1',{byTopic:{},missedIds:[],maxStreak:0}),selectedTopic:'alle',selectedMode:'mix',soloDuration:0,duelMode:'mix',duelDuration:10,hostSpectator:true,solo:null,profile:ls('bd-duell.profile.v1',{name:'',avatar:'🐼'}),stats:ls('bd-duell.stats.v1',{byTopic:{},missedIds:[],maxStreak:0}),duel:null,online:null,checking:false,pending:false,serverOffset:0,checkSession:null,checkResults:ls('bd-duell.competencies.v1',{})};
let toastTimeout=null,polling=false;
function toast(text){const n=el('toast');n.textContent=text;n.hidden=false;clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>n.hidden=true,3900);}
function avatarPicker(){return `<div class="avatar-grid" aria-label="Spielfigur auswählen">${AVATARS.map(a=>`<button type="button" data-action="avatar" data-avatar="${a}" class="${state.profile.avatar===a?'selected':''}" aria-label="Spielfigur ${a}" aria-pressed="${state.profile.avatar===a}">${a}</button>`).join('')}</div>`;}
function syncDuelForm(){if(el('host-spectator'))state.hostSpectator=el('host-spectator').checked;saveProfile();}
function saveProfile(){state.profile.name=String(el('profile-name')?.value||state.profile.name).trim().slice(0,MAX_NAME);state.profile.avatar=AVATARS.includes(state.profile.avatar)?state.profile.avatar:'🐼';save('bd-duell.profile.v1',state.profile);}
function setView(v){state.view=v;render();window.scrollTo(0,0);}
function activeBank(){return state.arena==='2'&&BANK2?BANK2:DATA;}
function topicName(topic){return DATA.topics[topic]||BANK2?.topics[topic]||topic;}
function getTopicRows(){const bank=activeBank();return Object.entries(bank.topics).map(([id,name])=>({id,name,...TOPIC_INFO[id],total:bank.questions.filter(q=>q.topic===id).length}));}
function totals(arena=state.arena){const stats=arena==='2'?state.stats2:state.stats;const all=Object.values(stats.byTopic);return {attempts:all.reduce((n,s)=>n+s.attempts,0),correct:all.reduce((n,s)=>n+s.correct,0),maxStreak:stats.maxStreak||0};}
function updateStats(q,correct,streak=0){
 const arena=q.arena==='2'||String(q.id).startsWith('L2Q')?'2':'1';
 const stats=arena==='2'?state.stats2:state.stats;
 const entry=stats.byTopic[q.topic]||{attempts:0,correct:0};entry.attempts++;if(correct)entry.correct++;stats.byTopic[q.topic]=entry;
 stats.maxStreak=Math.max(stats.maxStreak||0,streak);
 const missed=new Set(stats.missedIds||[]);if(correct)missed.delete(q.id);else if(q.kind!=='memory')missed.add(q.id);
 stats.missedIds=[...missed].slice(-700);save(arena==='2'?'bd-duell.stats.arena2.v1':'bd-duell.stats.v1',stats);
}
function availableQuestions(topic,mode){const kind=GAME_MODES.find(m=>m.id===mode)?.kind;
 return activeBank().questions.filter(q=>(topic==='alle'||q.topic===topic)&&(kind?q.kind===kind:q.kind!=='memory'));}
function gameModeCards(current,action){const descriptions=state.arena==='2'?{mix:'Kontenarten, Buchungen, Rechnen und Zuordnen im Wechsel.',quiz:'Wissensfragen zu Bestandskonten und Buchungsregeln.',sort:'Vier Bestandskonten richtig zuordnen.',board:'Acht EBK-Anfangsbestände auf die richtige Kontenseite ziehen.',pair:'Fachbegriffe und Erklärungen verbinden.',number:'Bestände und Buchungen selbst berechnen.',case:'Geschäftsfall und Auswirkungen auf die Bilanzsumme untersuchen.',memory:'Sechs verdeckte Paare in 2:30 Minuten finden.'}:{};return `<div class="game-grid">${GAME_MODES.map(g=>`<button type="button" class="game-tile ${current===g.id?'active':''}" data-action="${action}" data-mode="${g.id}" aria-pressed="${current===g.id}"><span class="game-emoji">${g.emoji}</span><span><strong>${g.title}</strong><small>${descriptions[g.id]||g.desc}</small></span><span class="game-check">${current===g.id?'✓':''}</span></button>`).join('')}</div>`;}
function renderHome(){const released=state.arena2Unlocked;const status=state.arena2Status;
return `<div class="section-head"><div><span class="eyebrow">Bürodesign GmbH · Rechnungswesen</span><h1>Wähle deine Lernarena</h1><p>Übe in deinem Tempo oder spiele im Klassenduell. Die Kompetenzen werden getrennt trainiert.</p></div></div>
<div class="arena-landing">
 <article class="arena-tile"><span class="arena-index">LERNARENA 1 <span class="arena-status open">✓ Verfügbar</span></span><h2>Inventur, Inventar &amp; Bilanz</h2><p>Inventur, Inventar, Bilanzgliederung, Liquidität und Bilanzveränderungen. Acht Spielarten und eigene Kompetenzchecks.</p><div class="arena-buttons"><button class="primary" data-action="arena1-learn">◎ Selbst üben</button><button data-action="arena1-duel">⚔ Klassenduell</button></div></article>
 <article class="arena-tile ${released?'':'locked'}"><span class="arena-index">LERNARENA 2 <span class="arena-status ${released?'open':'locked'}">${status==='loading'?'Lädt …':status==='error'?'Verbindung prüfen':released?'✓ Freigegeben':'🔒 Gesperrt'}</span></span><h2>Bestandskonten &amp; Schlussbilanz</h2><p>Interaktive T-Konten eröffnen, 30 Geschäftsfälle üben, Konten abschließen und eine vollständige Gesamtwerkstatt bearbeiten.</p><div class="arena-buttons"><button class="primary" data-action="arena2-learn" ${!released?'disabled':''}>◎ Selbst üben</button><button data-action="arena2-duel" ${!released?'disabled':''}>⚔ Klassenduell</button></div></article>
</div>
<div class="arena-checkline"><div><span class="eyebrow">Dein Lernnachweis</span><h2>✓ Kompetenzcheck</h2><p>Sechs getrennte Kompetenzen in Lernarena 1 · mindestens 85 % und alle Kernaufgaben richtig. Lernarena 2 erhält später eigene Kompetenzchecks.</p></div><button data-action="go-check">Kompetenzcheck öffnen ›</button></div>
<details class="teacher-release"><summary>🔑 Lernarena 2 durch die Lehrkraft freigeben oder sperren</summary><div class="teacher-inner"><p>Einmal für die gesamte Netlify-App freigeben. Alle Schülerinnen und Schüler können anschließend beide Lernarenen unabhängig nutzen.</p><label for="teacher-pass">Lehrkraft-Passwort</label><input id="teacher-pass" type="password" autocomplete="off" placeholder="Passwort eingeben"><div class="arena-buttons"><button class="primary" data-action="teacher-release" data-enabled="true">Lernarena 2 freigeben</button><button data-action="teacher-release" data-enabled="false">Lernarena 2 sperren</button></div><p class="muted tiny">${status==='error'?'Der Freigabedienst ist momentan nicht erreichbar. Bitte Netlify Functions prüfen.':status==='local'?'Lokale Vorschau: Lernarena 2 ist zum Testen zugänglich.':'Die Freigabe wird serverseitig verwaltet. Das Passwort erscheint nicht auf der Schülerseite.'}</p></div></details>`;}
function renderArena2(){return `<div class="section-head"><div><span class="eyebrow">Lernarena 2 · Selbst üben</span><h1>Vom einzelnen T-Konto zur Gesamtwerkstatt</h1><p>Beginne mit kurzen Übungen und wähle anschließend den vollständigen Ablauf von der Schlussbilanz des Vorjahres über das EBK und fünf Buchungen bis zum neuen SBK.</p></div><button data-action="home-return">← Alle Lernarenen</button></div>
<div class="arena-step-grid">
 <a class="arena-module" href="./arena2/uebungen.html?bereich=opening"><span>📖 01 · KONTEN ERÖFFNEN</span><h3>Bestandskonto selbst einrichten</h3><p>Aktiv oder Passiv wählen, Kontenname und EBK-Anfangsbestand direkt im T-Konto eintragen. Schlussbilanz und EBK sind unabhängig aufklappbar.</p><strong>Übung öffnen ›</strong></a>
 <a class="arena-module" href="./arena2/uebungen.html?bereich=quiz"><span>🧠 02 · ZWISCHENFRAGEN</span><h3>Wissensquiz</h3><p>Soll/Haben, Kontenarten, EBK/SBK und Buchungsregeln verstehen.</p><strong>Übung öffnen ›</strong></a>
 <a class="arena-module" href="./arena2/uebungen.html?bereich=booking"><span>🧾 03 · GESCHÄFTSFÄLLE</span><h3>30 Buchungen trainieren</h3><p>In untereinander angeordneten T-Konten Nummer, Gegenkonto und Betrag nebeneinander eintragen. Jede Buchung einzeln prüfen.</p><strong>Übung öffnen ›</strong></a>
 <a class="arena-module" href="./arena2/uebungen.html?bereich=closing"><span>📐 04 · KONTOABSCHLUSS</span><h3>Konten richtig abschließen</h3><p>SBK, Summen und Buchhalternasen selbst eintragen. Linien einzeln ziehen, mit Zeichenhilfe und Radierer.</p><strong>Übung öffnen ›</strong></a>
</div><article class="arena-final"><div><span class="eyebrow">🏁 ABSCHLUSS-WERKSTATT</span><h2>Von Anfang bis Ende selbst buchen</h2><p>Aufklappbare Schlussbilanz des Vorjahres und EBK · acht Konten eröffnen · fünf Geschäftsfälle buchen · alle Konten abschließen · neues SBK erstellen · vollständige Abschlussübersicht und Druckansicht.</p></div><a class="primary arena-link" href="./arena2/gesamtwerkstatt.html">Gesamtwerkstatt starten ›</a></article>
<div class="arena-extra"><h3>🎲 Noch mehr üben?</h3><p>Zusätzlich stehen kurze Quiz-, Zuordnungs-, Rechen- und Memory-Aufgaben aus Lernarena 2 bereit.</p><button data-action="arena2-quiz">Spielerisches Schnelltraining öffnen ›</button></div>`;}
function renderLearn(){
 if(!state.solo){return `<div class="section-head"><div><span class="eyebrow">Lernarena ${state.arena}</span><h1>Dein persönliches Training</h1><p>Wähle ein Thema und eine Übungsform. Du erhältst nach jeder Antwort eine fachliche Erklärung.</p></div></div>
 <span class="eyebrow">01 / Schwerpunkt</span><div class="learn-toolbar"><button class="chip ${state.selectedTopic==='alle'?'active':''}" data-action="topic-filter" data-topic="alle">Alle Themen</button>${getTopicRows().map(t=>`<button class="chip ${state.selectedTopic===t.id?'active':''}" data-action="topic-filter" data-topic="${t.id}">${t.emoji} ${t.name}</button>`).join('')}</div><div class="mode-head"><span class="eyebrow">02 / Spielart wählen</span><p>Mit jedem Spiel übst du andere Fähigkeiten.</p></div>${gameModeCards(state.selectedMode,'solo-mode')}
 <div class="mode-head"><span class="eyebrow">03 / Übungszeit wählen</span><h2>Wie lange möchtest du üben?</h2><p>Nach Ablauf der gewählten Zeit erhältst du deine Auswertung.</p></div><div class="duel-duration-picker" role="group" aria-label="Übungszeit auswählen">${[0,5,10,15,20,30].map(n=>`<button type="button" data-action="solo-duration" data-minutes="${n}" class="chip ${state.soloDuration===n?'active':''}" ${state.selectedMode==='memory'?'disabled':''} aria-pressed="${state.soloDuration===n}">${n?n+' Min.':'Ohne Zeitlimit'}</button>`).join('')}</div>${state.selectedMode==='memory'?'<p class="muted tiny">Memory dauert immer 2:30 Minuten.</p>':''}<div class="duel-setup"><article class="panel"><span class="eyebrow">Trainingsmission</span><h2>${state.selectedMode==='memory'?'Memory · 2:30':'12-Fragen-Sprint'}</h2><p>${state.selectedMode==='memory'?'Finde in 150 Sekunden möglichst viele Paare. Mehrere Kartenrunden sind möglich.':'Zwölf ausgewählte Aufgaben. Ideal zum Start und zur kurzen Wiederholung.'}</p><button class="primary" data-action="solo-start" data-type="sprint">Sprint starten</button></article><article class="panel"><span class="eyebrow">Intensivtraining</span><h2>${state.selectedMode==='memory'?'Memory-Runden':`Bis zu ${availableQuestions(state.selectedTopic,state.selectedMode).length} Fragen`}</h2><p>${state.selectedMode==='memory'?'Verschiedene Kartenrunden mit insgesamt 2 Minuten 30 Sekunden Spielzeit.':state.soloDuration?`Arbeite ${state.soloDuration} Minuten durch einen umfangreichen Fragenpool.`:'Arbeite ohne Zeitlimit durch einen umfangreichen Fragenpool.'}</p><button class="primary" data-action="solo-start" data-type="full">Intensiv starten</button></article></div><div class="info">🎯 <b>Fehlertraining:</b> ${(state.arena==='2'?state.stats2:state.stats).missedIds.length} offene Aufgaben aus deinen bisherigen Fehlern. <button class="small" data-action="solo-start" data-type="errors" ${!(state.arena==='2'?state.stats2:state.stats).missedIds.length?'disabled':''}>Gezielt wiederholen</button></div>`;}
 let solo=state.solo;
 if(solo.done){const pct=solo.attempts?Math.round(solo.correct/solo.attempts*100):0;return `<div class="challenge"><div class="centered"><div class="big-figure">${pct>=80?'🏆':pct>=50?'🌟':'🌱'}</div><span class="eyebrow">Mission abgeschlossen</span><h1>${pct>=80?'Stark gemacht!':'Weiter geht’s!'}</h1><p>Du hast deine Lernmission abgeschlossen. Über die Erklärungen und das Fehlertraining kannst du offene Fragen wiederholen.</p><div class="result-score">${fmt(solo.score)} P.</div><div class="result-breakdown"><span>✅ ${solo.correct} ${solo.type==='memory'?'Paare':'richtig'}</span><span>📚 ${solo.attempts} bearbeitet</span><span>🎯 ${pct} %</span></div><div class="split-actions" style="justify-content:center"><button class="primary" data-action="learn-reset">Neue Mission</button><button data-action="solo-start" data-type="errors">Fehler üben</button></div></div></div>`;}
 const q=BY_ID.get(solo.ids[solo.index]);if(!q){solo.done=true;return renderLearn();}
 return `<div class="section-head"><div><span class="eyebrow">Lernarena ${state.arena} · ${escapeHTML(topicName(q.topic))}</span><h2>${escapeHTML(solo.type==='memory'?'Memory · 2:30':solo.type==='sprint'?'12-Fragen-Sprint':solo.type==='errors'?'Fehlertraining':'Intensivtraining')}</h2><p>Löse die Aufgabe und prüfe deine Antwort. Punkte und Lernfortschritt werden auf diesem Gerät gespeichert.</p></div><button data-action="learn-reset">Training beenden</button></div>
 ${renderChallenge(q,solo,'solo')}<div class="footer-note">Fragenpool: Bürodesign GmbH / Unterrichtseinheit LS 3.1. Bei Rechenaufgaben werden die Übungswerte in der Aufgabe genannt.</div>`;
}
function answerText(q,answer){
 if(q.kind==='number')return `${fmt(answer)} €`;
 if(q.kind==='choice')return String(answer);
 if(q.kind==='case')return `${answer[0]} · Bilanzsumme ${answer[1]}`;
 if(q.kind==='sort'||q.kind==='board')return q.items.map((t,i)=>`${t} → ${answer[i]}`).join(' | ');
 if(q.kind==='pair')return q.left.map((t,i)=>`${t} → ${q.right[answer[i]]}`).join(' | ');
 return String(answer);
}
function renderMemoryBoard(q,s){
 const matched=s.matched||s.memoryMatched||[],open=s.memoryOpen||[];
 const wrongWait=s.memoryBusy&&s.memoryWrongUntil>Date.now();
 const waitText=wrongWait?`Falsches Paar · Karten drehen in <b id="memory-wait-seconds">${Math.ceil((s.memoryWrongUntil-Date.now())/1000)}</b> s zurück`:s.memoryBusy?'Karten werden geprüft …':'Tippe zwei Karten an';
 return `<div class="memory-head"><span>🃏 <b>${Math.round(matched.length/2)} / ${q.cards.length/2}</b> Paare gefunden</span><span role="status" aria-live="polite">${waitText}</span></div><div class="memory-board">${q.cards.map((text,i)=>{const found=matched.includes(i),flipped=found||open.includes(i);return `<button type="button" class="memory-card ${flipped?'revealed':''} ${found?'matched':''}" data-action="memory-flip" data-index="${i}" ${found||s.memoryBusy?'disabled':''} aria-label="Karte ${i+1}: ${flipped?escapeHTML(text):'verdeckt'}" aria-pressed="${flipped}"><span class="memory-back" aria-hidden="true">✦</span><span class="memory-face">${escapeHTML(text)}</span></button>`;}).join('')}</div>`;
}
function memoryPick(i){
 const s=currentSession(),q=currentQuestion();if(!s||!q||q.kind!=='memory'||s.done||s.memoryBusy)return;
 if(state.view==='duel'&&s.room.phase!=='playing')return;
 if(state.view==='learn'&&Date.now()>=s.endsAt){s.done=true;render();return;}
 const matched=s.matched||s.memoryMatched||[];
 if(!Number.isInteger(i)||i<0||i>=q.cards.length||matched.includes(i))return;
 s.memoryOpen??=[];if(s.memoryOpen.includes(i)||s.memoryOpen.length>=2)return;
 s.memoryOpen.push(i);if(s.memoryOpen.length===1){render();return;}
 s.memoryBusy=true;render();
 s.memoryFlipAt=Date.now();
 if(state.view==='duel')submitMemoryPair(s,q,[...s.memoryOpen]);
 else scoreSoloMemory(s,q,[...s.memoryOpen]);
}
function scoreSoloMemory(s,q,selection){
 const correct=q.answer[selection[0]]===q.answer[selection[1]];
 s.attempts++;s.streak=correct?s.streak+1:0;
 const gained=correct?70+(s.streak%3===0?30:0):0;
 if(correct){s.memoryMatched.push(...selection);s.correct++;s.score+=gained;}
 updateStats(q,correct,s.streak);
 s.memoryWrongUntil=correct?0:s.memoryFlipAt+5000;
 if(!correct)render();
 setTimeout(()=>{
  if(state.solo!==s)return;
  s.memoryOpen=[];s.memoryBusy=false;s.memoryWrongUntil=0;
  if(s.memoryMatched.length===q.cards.length){s.index++;clearAnswers(s);clearMemoryRound(s);if(s.index>=s.ids.length)s.done=true;}
  if(Date.now()>=s.endsAt)s.done=true;
  render();
 },correct?560:Math.max(0,s.memoryWrongUntil-Date.now()));
}
async function submitMemoryPair(s,q,selection){
 try{
  const data=await gameAPI('answer',{...sessionData(),questionId:q.id,answer:selection});
  const changedBoard=data.question?.id!==q.id;
  s.me=data.me;s.index=data.index;s.matched=data.matched||[];
  state.serverOffset=data.now-Date.now();
  if(changedBoard){s.question=data.question;}
  s.memoryWrongUntil=data.correct?0:s.memoryFlipAt+5000;
  if(!data.correct)render();
  setTimeout(()=>{
   if(state.duel!==s)return;
   s.memoryOpen=[];s.memoryBusy=false;s.memoryWrongUntil=0;
   if(changedBoard)s.matched=[];
   render();
  },changedBoard?650:data.correct?450:Math.max(0,s.memoryWrongUntil-Date.now()));
 }catch(e){
  s.memoryOpen=[];s.memoryBusy=false;s.memoryWrongUntil=0;toast(e.message);
  if(/Zeit|Spielzeit|nicht mehr aktuell|bereits/.test(e.message))await pollRoom(true);else render();
 }
}
function challengeControls(q,s,disabled=false){
 if(q.kind==='choice')return `<div class="choices">${q.options.map((opt,i)=>{
  const selected=s.selection===i,good=s.feedback&&opt===s.feedback.answer,wrong=s.feedback&&selected&&!good;
  return `<button class="answer ${selected?'chosen':''} ${good?'good':''} ${wrong?'wrong':''}" data-action="choose" data-choice="${i}" ${disabled?'disabled':''} aria-pressed="${selected}"><span class="letter">${String.fromCharCode(65+i)}</span><span>${escapeHTML(opt)}</span></button>`;
 }).join('')}</div>`;
 if(q.kind==='number')return `<div class="amount-row"><input id="numeric-answer" type="text" inputmode="decimal" autocomplete="off" placeholder="z. B. 2.250 oder 2.250,00" aria-label="Betrag in Euro" ${disabled?'disabled':''} value="${escapeHTML(s.numeric||'')}"><span>€</span></div>`;
 if(q.kind==='sort'||q.kind==='board'){
  const isBoard=q.kind==='board',placements=s.placements||Array(q.items.length).fill(null),chosen=s.activeCard;
  const card=(i)=>`<button type="button" draggable="${!disabled}" data-sort-index="${i}" data-action="sort-pick" data-index="${i}" class="sort-card ${isBoard?'field-card':''} ${chosen===i?'selected':''}" ${disabled?'disabled':''} aria-label="${escapeHTML(q.items[i])} auswählen oder verschieben" aria-pressed="${chosen===i}"><span class="drag-icon" aria-hidden="true">⠿</span><span class="card-name">${escapeHTML(q.items[i])}</span></button>`;
  const unused=placements.filter(x=>x===null).length;
  const pool=`<div class="sort-pool ${isBoard?'field-pool':''}" data-action="sort-place" data-bin="__pool__" role="button" tabindex="0"><div class="field-heading"><h4>${isBoard?'Deine Karten':'Zuordnen'} <span>${unused} offen</span></h4>${isBoard?'<small>Ziehe Karten in einen Bereich und korrigiere die Ablage jederzeit.</small>':''}</div><div class="sort-cards">${q.items.map((item,i)=>placements[i]===null?card(i):'').join('')||'<span class="muted tiny">Alle Karten zugeordnet. Tippe auf eine abgelegte Karte, um sie zu verändern.</span>'}</div></div>`;
  const zones=q.bins.map((bin,j)=>`<div class="sort-lane ${isBoard?'field-lane':''}" role="button" tabindex="${disabled?'-1':'0'}" data-action="sort-place" data-bin="${escapeHTML(bin)}" aria-label="Ablagebereich ${escapeHTML(bin)}"><div class="lane-heading"><strong>${escapeHTML(bin)}</strong><span>${placements.filter(x=>x===bin).length}</span></div><div class="lane-cards">${q.items.map((item,i)=>placements[i]===bin?card(i):'').join('')||'<small>Hier ablegen</small>'}</div></div>`).join('');
  return `<div class="game-instruction">${isBoard?'Auf der Zuordnungsfläche: Ziehe die Karten mit dem Finger oder der Maus in den richtigen Bereich. Alternativ Karte antippen, dann einen Bereich antippen.':'Tippe auf eine Karte und anschließend auf den passenden Bereich – oder ziehe die Karte direkt dorthin.'}</div><div class="assignment-field ${isBoard?'large-field':''}">${pool}<div class="sort-grid ${isBoard?'field-grid':''}" style="--field-cols:${q.bins.length===2?2:Math.min(q.bins.length,4)}">${zones}</div></div><div class="field-progress" aria-live="polite">${q.items.length-unused} von ${q.items.length} Karten abgelegt${unused===0?' · Du kannst jetzt prüfen.':''}</div>`;
 }
 if(q.kind==='pair'){
  const links=s.links||Array(q.left.length).fill(null);
  return `<div class="game-instruction">Wähle links einen Fachbegriff und rechts die passende Erklärung. Du kannst eine Verbindung jederzeit ändern.</div><div class="pair-grid"><div class="pair-column"><h4>Fachbegriffe</h4>${q.left.map((term,i)=>`<button class="pair-choice ${s.activeLeft===i?'selected':''} ${Number.isInteger(links[i])?'linked':''}" data-action="pair-left" data-index="${i}" ${disabled?'disabled':''}><span class="pair-number">${i+1}</span><span>${escapeHTML(term)}</span>${Number.isInteger(links[i])?'<span class="paired-dot">✓</span>':''}</button>`).join('')}</div><div class="pair-column"><h4>Erklärungen</h4>${q.right.map((txt,i)=>`<button class="pair-choice ${links.includes(i)?'linked':''}" data-action="pair-right" data-index="${i}" ${disabled?'disabled':''}><span class="pair-number">${String.fromCharCode(65+i)}</span><span>${escapeHTML(txt)}</span></button>`).join('')}</div></div><div class="pair-summary">${q.left.map((term,i)=>`<span>${i+1} → ${links[i]===null?'?':String.fromCharCode(65+links[i])}</span>`).join('')}</div>`;
 }
 if(q.kind==='memory')return renderMemoryBoard(q,s);
 if(q.kind==='case'){
  const buttons=(key,values,selected)=>`<div class="case-buttons">${values.map(v=>`<button class="case-choice ${selected===v?'selected':''}" data-action="${key}" data-value="${v}" ${disabled?'disabled':''} aria-pressed="${selected===v}">${escapeHTML(v)}</button>`).join('')}</div>`;
  return `<div class="game-instruction">Untersuche den Geschäftsfall. Entscheide zuerst, auf welcher Seite Bilanzposten verändert werden. Bestimme danach, wie sich die Bilanzsumme verändert.</div><div class="case-step"><span class="case-stepno">1</span><div><h4>Welche Bilanzseite ist betroffen?</h4>${buttons('case-side',['Nur Aktiva','Nur Passiva','Aktiva und Passiva'],s.caseSide)}</div></div><div class="case-step"><span class="case-stepno">2</span><div><h4>Wie verändert sich die Bilanzsumme?</h4>${buttons('case-effect',['unverändert','steigt','sinkt'],s.caseEffect)}</div></div>`;
 }
 return '';
}
function renderChallenge(q,session,mode){
 const feedback=session.feedback,total=mode==='solo'?session.ids.length:null;
 const instruction={choice:'Wähle die passende Antwort.',number:'Rechne und trage den Betrag in Euro ein.',sort:'Ordne alle vier Karten zu.',board:'Ordne alle acht Karten auf der Fläche zu.',pair:'Finde alle drei Begriffspaare.',case:'Triff beide Entscheidungen.'};
 const game=GAME_MODES.find(g=>g.kind===q.kind);
 const footer=q.kind==='memory'?`<p class="memory-help">Finde die zusammengehörenden Paare. Für jedes passende Paar bekommst du <b>70 Punkte</b>, bei jeder dritten richtigen Lösung zusätzliche <b>30 Punkte</b>.</p>`:feedback?`<div class="feedback ${feedback.correct?'':'wrong'}" role="status"><strong>${feedback.correct?'✅ Richtig gelöst!':'💡 Gut zu wissen'} ${feedback.points?`+${feedback.points} Punkte`:''}</strong>${!feedback.correct?`${q.kind==='number'?`<p>Deine Eingabe: <b>${escapeHTML(feedback.submitted||'')}</b></p>`:''}<p>Richtige Lösung: <b>${escapeHTML(answerText(q,feedback.answer))}</b></p>`:''}<p>${escapeHTML(feedback.explanation)}</p></div><div class="q-actions"><span class="muted tiny">${feedback.correct?'Klasse – weiter so!':'Erklärung lesen und weiterüben.'}</span><button class="primary" data-action="${mode==='solo'?'solo-next':'duel-next'}">Nächste Aufgabe ›</button></div>`:
 `<div class="q-actions"><span class="muted tiny">${instruction[q.kind]}</span><button class="primary" data-action="${mode==='solo'?'solo-submit':'duel-submit'}" ${state.pending?'disabled':''}>${state.pending?'Wird geprüft …':'Antwort prüfen'}</button></div>`;
 return `<div class="challenge-layout ${q.kind==='memory'?'memory-layout':''} ${q.kind==='board'?'board-layout':''}"><article class="challenge"><div class="question-top"><span class="phase">${escapeHTML(topicName(q.topic))} · ${q.level===3?'Transfer':q.level===2?'Anwenden':'Grundwissen'}</span><span class="round-pill">${mode==='solo'?`Aufgabe ${session.index+1} / ${total}`:`Aufgabe ${session.index+1}`}</span></div><div class="mini-game-label">${game?.emoji||'📚'} ${game?.title||'Quiz-Arena'}</div><h3 class="q-text">${escapeHTML(q.question)}</h3>${mode==='solo'&&session.endsAt?`<div class="memory-timer">⏱ Restzeit <strong id="memory-solo-clock">${dateClock(session.endsAt-Date.now())}</strong></div>`:''}${challengeControls(q,session,!!feedback)}${footer}${mode==='solo'?`<div class="progress-rail"><span style="width:${Math.min(100,Math.round((session.index+(feedback?1:0))/total*100))}%"></span></div>`:''}</article>
 <aside><div class="panel"><h3>Dein Punktestand</h3><div class="quiz-side-stat"><span>⭐ Punkte</span><b>${fmt(session.score||session.me?.score||0)}</b></div><div class="quiz-side-stat"><span>✅ Richtig</span><b>${fmt(session.correct||session.me?.correct||0)}</b></div><div class="quiz-side-stat"><span>⚡ Serie</span><b>${fmt(session.streak||session.me?.streak||0)}</b></div><div class="hint-box"><b>Punkte-Regel</b><p>Quiz +100 · Rechnen +120 · Bilanzfälle +150 · Sortieren und Paare +180 · Zuordnungsfeld +220 · Memory je Paar +70 · Jede 3er-Serie +30. Fehler kosten keine Punkte.</p></div></div></aside></div>`;
}
function orderForTopic(topic,mode='mix'){
 const allowed=availableQuestions(topic,mode);
 if(mode!=='mix')return shuffle(allowed.map(q=>q.id));
 const buckets=KINDS.map(kind=>shuffle(allowed.filter(q=>q.kind===kind).map(q=>q.id))),out=[];
 for(let i=0;i<Math.max(...buckets.map(b=>b.length));i++)for(const b of buckets)if(b[i])out.push(b[i]);
 return out;
}
function clearMemoryRound(s){s.memoryOpen=[];s.memoryMatched=[];s.memoryBusy=false;s.memoryWrongUntil=0;s.memoryFlipAt=0;}
function clearAnswers(s){s.selection=null;s.numeric='';s.feedback=null;s.placements=null;s.links=null;s.activeCard=null;s.activeLeft=null;s.caseSide=null;s.caseEffect=null;}
function startSolo(type,topic=state.selectedTopic){const isMemory=type!=='errors'&&state.selectedMode==='memory';let ids=type==='errors'?shuffle((state.arena==='2'?state.stats2:state.stats).missedIds.filter(id=>BY_ID.has(id)&&BY_ID.get(id).kind!=='memory')):orderForTopic(topic,state.selectedMode);
 if(type==='sprint'&&!isMemory)ids=ids.slice(0,12);
 if(ids.length===0){toast('Für diese Kombination gibt es noch keine Aufgaben. Wähle einen anderen Modus oder „Alle Themen“.');return;}
 state.solo={type:isMemory?'memory':type,ids,index:0,score:0,correct:0,attempts:0,streak:0,done:false,endsAt:isMemory?Date.now()+150000:state.soloDuration?Date.now()+state.soloDuration*60000:null};clearAnswers(state.solo);clearMemoryRound(state.solo);setView('learn');}
function parseAmount(raw){return BD_AMOUNTS.parseWholeEuro(raw);}
function answerFromUI(q,s){
 if(q.kind==='choice')return Number.isInteger(s.selection)?q.options[s.selection]:null;
 if(q.kind==='number'){const t=el('numeric-answer');if(t)s.numeric=t.value;return parseAmount(s.numeric);}
 if(q.kind==='sort'||q.kind==='board')return Array.isArray(s.placements)&&s.placements.length===q.items.length&&s.placements.every(x=>q.bins.includes(x))?[...s.placements]:null;
 if(q.kind==='pair')return Array.isArray(s.links)&&s.links.length===q.left.length&&s.links.every(x=>Number.isInteger(x)&&x>=0&&x<q.right.length)?[...s.links]:null;
 if(q.kind==='case')return s.caseSide&&s.caseEffect?[s.caseSide,s.caseEffect]:null;
 return null;
}
function correctAnswer(q,a){if(q.kind==='choice'||q.kind==='number')return a===q.answer;
 return Array.isArray(a)&&Array.isArray(q.answer)&&a.length===q.answer.length&&a.every((v,i)=>v===q.answer[i]);}
function prepareChoice(index){const session=currentSession();if(!session||session.feedback||state.pending)return;
 session.selection=index;
 document.querySelectorAll('.answer').forEach((node,i)=>{node.classList.toggle('chosen',i===index);node.setAttribute('aria-pressed',String(i===index));});}
function currentSession(){return state.view==='duel'?state.duel:state.view==='check'?state.checkSession:state.solo;}
function currentQuestion(){const s=currentSession();return state.view==='duel'?s?.question:state.view==='check'?s?.questions?.[s.index]:BY_ID.get(s?.ids?.[s.index]);}
function chooseSort(i){const s=currentSession(),q=currentQuestion();if(!s||!q||!['sort','board'].includes(q.kind)||s.feedback)return;
 s.activeCard=i;s.placements??=Array(q.items.length).fill(null);render();}
function placeSort(bin){const s=currentSession(),q=currentQuestion();if(!s||!q||!['sort','board'].includes(q.kind)||s.feedback||(!q.bins.includes(bin)&&bin!=='__pool__')||!Number.isInteger(s.activeCard))return;
 s.placements??=Array(q.items.length).fill(null);s.placements[s.activeCard]=bin==='__pool__'?null:bin;s.activeCard=null;render();}
function choosePairLeft(i){const s=currentSession(),q=currentQuestion();if(!s||!q||q.kind!=='pair'||s.feedback)return;
 s.activeLeft=i;s.links??=Array(q.left.length).fill(null);render();}
function choosePairRight(i){const s=currentSession(),q=currentQuestion();if(!s||!q||q.kind!=='pair'||s.feedback||!Number.isInteger(s.activeLeft))return;
 s.links??=Array(q.left.length).fill(null);s.links=s.links.map((v,j)=>v===i&&j!==s.activeLeft?null:v);
 s.links[s.activeLeft]=i;s.activeLeft=null;render();}
function submitSolo(){const s=state.solo;if(!s||s.feedback||s.done)return;if(s.endsAt&&Date.now()>=s.endsAt){s.done=true;render();return;}const q=BY_ID.get(s.ids[s.index]);const a=answerFromUI(q,s);if(a===null){toast(q.kind==='number'?'Bitte einen gültigen Euro-Betrag eingeben, zum Beispiel 2250 oder 2.250,00.':'Bitte wähle zuerst eine Antwort oder trage einen Betrag ein.');return;}
 const correct=correctAnswer(q,a);s.streak=correct?s.streak+1:0;const points=correct?(GAME_POINTS[q.kind]||100)+(s.streak%3===0?30:0):0;
 s.attempts++;s.correct+=correct?1:0;s.score+=points;s.feedback={correct,answer:q.answer,explanation:q.explanation,points,submitted:s.numeric};
 updateStats(q,correct,s.streak);render();}
function nextSolo(){const s=state.solo;if(!s?.feedback)return;s.index++;clearAnswers(s);if(s.index>=s.ids.length)s.done=true;render();window.scrollTo(0,0);}
function profilePanel(){return `<div class="panel" style="margin-bottom:18px"><span class="eyebrow">Dein Spielerprofil</span><h3>Spielfigur auswählen</h3><p style="font-size:13px;margin:7px 0 13px">Wähle einen Spitznamen statt deines Klarnamens.</p><label>Spielername<input id="profile-name" autocomplete="nickname" maxlength="22" placeholder="z. B. Bilanzfuchs" value="${escapeHTML(state.profile.name||'')}"></label>${avatarPicker()}</div>`;}
function duelArenaChooser(){
 const ready=state.arena2Unlocked;
 return `<div class="duel-arena-picker" role="group" aria-label="Lernarena für das Duell auswählen">
   <button type="button" class="arena-choice ${state.arena==='1'?'active':''}" data-action="duel-arena" data-arena="1" aria-pressed="${state.arena==='1'}">📗 <strong>Lernarena 1</strong><small>Inventur · Inventar · Bilanz</small></button>
   <button type="button" class="arena-choice ${state.arena==='2'?'active':''}" data-action="duel-arena" data-arena="2" aria-pressed="${state.arena==='2'}" ${!ready?'disabled title="Erst von der Lehrkraft freigeben"':''}>📘 <strong>Lernarena 2</strong><small>${ready?'Bestandskonten · Buchungen':'🔒 Noch gesperrt'}</small></button>
 </div>`;
}
function duelDurationChooser(){return `<div class="duel-duration-picker" role="group" aria-label="Spieldauer wählen">${[5,10,15].map(n=>`<button type="button" data-action="duel-duration" data-minutes="${n}" class="chip ${state.duelDuration===n?'active':''}" aria-pressed="${state.duelDuration===n}" ${state.duelMode==='memory'?'disabled':''}>${n} Minuten</button>`).join('')}</div>${state.duelMode==='memory'?'<p class="muted tiny">Memory dauert immer 2:30 Minuten.</p>':''}`;}
function renderDuelSetup(){const codeFromLink=new URLSearchParams(window.location.search).get('raum')||'';
 return `<div class="section-head"><div><span class="eyebrow">⚔ Klassenduell</span><h1>Gemeinsam gegeneinander spielen</h1><p>Die Spielleitung legt die Lernarena, Spielart und Dauer für alle im Raum fest. Zum Mitspielen reicht der Raumcode.</p></div></div>
 <div class="duel-entry-grid">${profilePanel()}
 <article class="panel duel-join"><span class="eyebrow">Für Teilnehmende</span><h2>Mit Raumcode beitreten</h2><p>Der Raumcode übernimmt automatisch die Lernarena, Spielart und Spielzeit. Du musst nichts davon einstellen.</p><div class="duel-join-row"><label>Raumcode<input id="room-enter-code" style="text-transform:uppercase;letter-spacing:3px;font-weight:850" maxlength="6" value="${escapeHTML(codeFromLink.toUpperCase())}" placeholder="ABC123" autocomplete="off"></label><button class="primary" data-action="room-join" ${state.pending?'disabled':''}>Mitspielen ›</button></div></article></div>
 <article class="panel duel-config"><span class="eyebrow">Für die Spielleitung · Raum vorbereiten</span>
 <div class="mode-head"><span class="eyebrow">01 / Lernarena</span><h2>Welche Themen sollen gespielt werden?</h2></div>${duelArenaChooser()}
 <div class="mode-head"><span class="eyebrow">02 / Spielart</span><h2>Was möchtet ihr spielen?</h2><p>Wähle den Spiele-Mix oder eine einzelne Spielart.</p></div>${gameModeCards(state.duelMode,'duel-mode')}
 <div class="mode-head"><span class="eyebrow">03 / Spieldauer</span><h2>Wie lange soll das Duell dauern?</h2></div>${duelDurationChooser()}
 <div class="duel-create-bottom"><label class="spectator-option"><input id="host-spectator" type="checkbox" ${state.hostSpectator?'checked':''}> Ich leite nur und spiele nicht selbst mit</label><div class="duel-summary"><b>Ausgewählt:</b> Lernarena ${state.arena} · ${escapeHTML(GAME_MODES.find(x=>x.id===state.duelMode)?.title||'Spiele-Mix')} · ${state.duelMode==='memory'?'2:30 Minuten':`${state.duelDuration} Minuten`}</div><button class="primary" data-action="room-create" ${state.pending?'disabled':''}>⚔ Raum mit diesen Einstellungen erstellen</button></div>
 </article>
`;}
function renderRank(ranking,ownId){return `<div class="leaderboard">${!ranking?.length?'<p class="muted">Noch keine Spielerinnen und Spieler.</p>':ranking.map((p,i)=>`<div class="rankrow ${p.id===ownId?'self':''}"><span class="place">${i<3?['🥇','🥈','🥉'][i]:'#'+(i+1)}</span><span class="face" aria-hidden="true">${p.avatar}</span><span class="who" title="${escapeHTML(p.name)}">${escapeHTML(p.name)}${p.id===ownId?' · Du':''}</span><span class="pts">${fmt(p.score)} P.</span></div>`).join('')}</div>`;}
function renderDuel(){const d=state.duel;
 if(!d)return renderDuelSetup();const room=d.room;
 const head=`<div class="room-head"><div><span class="eyebrow">Raumcode · gemeinsam spielen</span><div class="room-code">${room.code}</div><div class="meta">${room.playerCount} Teilnehmende · Lernarena ${room.arena||'1'} · ${escapeHTML(room.modeName||'Spiele-Mix')} · ${Math.round((room.durationMs||600000)/60000*10)/10} Min. · ${room.phase==='lobby'?'Wartet auf den gemeinsamen Start':room.phase==='finished'?'Duell beendet':'Gemeinsames Klassenduell'}</div></div><div class="buttons"><button data-action="copy-code">Code kopieren</button><button data-action="copy-link">Einladungslink</button><button data-action="room-leave">Verlassen</button>${d.isHost?'<button data-action="room-delete" title="Raum und alle Punktestände löschen">Raum löschen</button>':''}</div></div>`;
 let center='';
 if(room.phase==='lobby')center=`<article class="panel centered"><div class="big">${d.me?.avatar||'🐼'}</div><span class="eyebrow">Warteraum</span><h2>Bereit für ${escapeHTML(room.modeName||'das Klassenduell')}?</h2><p>Gespielt wird: <b>Lernarena ${room.arena||'1'} · ${escapeHTML(room.modeName||'Spiele-Mix')} · ${dateClock(room.durationMs||600000)}</b>. Alle nutzen den Raumcode <strong>${room.code}</strong>. Die Zeit startet für alle gleichzeitig, sobald die Spielleitung das Duell freigibt.</p>${d.isHost?`<button class="primary" data-action="room-start">▶ ${room.mode==='memory'?'2:30-Minuten-Memory':`${Math.round((room.durationMs||600000)/60000)}-Minuten-Duell`} starten</button>`:'<div class="info">Die Spielleitung startet das Duell für alle. Das Spiel aktualisiert sich automatisch.</div>'}<div class="statusline">${room.playerCount} Personen sind beigetreten.</div></article>`;
 else if(room.phase==='countdown')center=`<article class="panel centered"><span class="eyebrow">Alle machen sich bereit</span><h2>Gleich geht es los!</h2><div id="pre-countdown" class="counterbox">3</div><p>Viel Erfolg! Alle spielen ${escapeHTML(room.modeName||'Spiele-Mix')} mit derselben Aufgabenabfolge.</p></article>`;
 else if(room.phase==='playing'){
  if(d.feedback){const prev=BY_ID.get(d.lastQuestionId)||null;
   center=`<article class="panel"><span class="eyebrow">Aufgabe ausgewertet</span><h2>${d.feedback.correct?'✅ Richtig – weiter so!':'💡 Nächste Chance!'}</h2><div class="feedback ${d.feedback.correct?'':'wrong'}"><strong>${d.feedback.correct?'+'+d.feedback.points+' Punkte':'Diese Aufgabe war noch nicht richtig.'}</strong>${d.feedback.correct?'':`${prev?.kind==='number'?`<p>Deine Eingabe: <b>${escapeHTML(d.feedback.submitted||'')}</b></p>`:''}<p>Richtige Antwort: <b>${escapeHTML(prev?answerText(prev,d.feedback.answer):String(d.feedback.answer))}</b></p>`}<p>${escapeHTML(d.feedback.explanation)}</p></div><div class="q-actions"><span class="muted tiny">Die Zeit läuft weiter.</span><button class="primary" data-action="duel-next">Weiter ›</button></div></article>`;
  }else if(d.me?.spectator)center='<article class="panel centered"><div class="big">👩‍🏫</div><span class="eyebrow">Spielleitung</span><h2>Das Klassenduell läuft!</h2><p>Du leitest das Spiel und musst selbst keine Fragen beantworten. Beobachte den Countdown und die Live-Rangliste der Klasse.</p></article>';
  else if(d.question)center=renderChallenge(d.question,d,'duel');
  else center='<article class="panel centered"><h2>Alle Aufgaben geschafft! 🌟</h2><p>Du hast den gesamten Aufgabenpool bearbeitet. Beobachte jetzt die Rangliste.</p></article>';
 }else{
  const place=(d.ranking||[]).findIndex(p=>p.id===d.me?.id)+1;
  if(d.me?.spectator){const first=d.ranking?.[0];center=`<article class="panel centered"><div class="big-figure">🏆</div><span class="eyebrow">Klassenduell beendet</span><h1>Die Spielzeit ist abgelaufen.</h1><p>${first?`Auf Platz 1: <b>${escapeHTML(first.avatar)} ${escapeHTML(first.name)}</b> mit ${fmt(first.score)} Punkten.`:'Die Rangliste ist abgeschlossen.'} Alle Ergebnisse stehen rechts in der Tabelle.</p><button class="primary" data-action="room-leave">Neues Duell vorbereiten</button></article>`;}else center=`<article class="panel centered"><div class="big-figure">${place===1?'🏆':'🎉'}</div><span class="eyebrow">Das Duell ist beendet</span><h1>${place===1?'Du führst die Rangliste an!':'Deine Spielzeit ist vorbei.'}</h1><p>Starke Übung! Jede beantwortete Frage hilft dabei, die Bilanz sicherer zu verstehen.</p><div class="result-score">${fmt(d.me?.score||0)} P.</div><div class="result-breakdown"><span>📊 Platz ${place||'–'}</span><span>✅ ${d.me?.correct||0} richtig</span><span>📚 ${d.me?.attempts||0} beantwortet</span></div><button class="primary" data-action="result-copy">Ergebnis kopieren</button><div class="q-actions"><button data-action="room-leave">Zum Start zurück</button></div></article>`;
 }
 return `${head}<div class="duel-layout"><div>${center}</div><aside><div class="timercard"><span class="eyebrow" style="margin-bottom:3px">${room.phase==='lobby'?'Wartezeit':'Verbleibende Zeit'}</span><div class="clock" id="duel-clock">${room.phase==='lobby'?dateClock(room.durationMs||600000):dateClock((room.endsAt||0)-(Date.now()+state.serverOffset))}</div><small>${room.phase==='finished'?'Zeit abgelaufen':'Serverzeit synchronisiert'}</small></div><div class="panel"><div class="leader-cap"><h3>🏅 Live-Rangliste</h3><span class="tiny muted" id="leader-status">${room.playerCount} im Raum</span></div><div id="rankings">${renderRank(d.ranking,d.me?.id)}</div><div class="statusline">Quiz +100 · Rechnen +120 · Bilanzfälle +150 · Sortieren/Paare +180 · Zuordnen +220 · Memory +70 je Paar · Serie +30</div></div></aside></div><p class="footer-note">Live-Punktestände werden etwa alle 6 Sekunden aktualisiert. Alle sehen dieselbe Aufgabenabfolge; niemand muss nach einer falschen Antwort warten.</p>`;
}
// Kompetenznachweise: getrennt vom Spielpunktestand. Keine Zeitboni, keine Hinweise während des Checks.
function checkCardTitle(id){return CHECK.COMPETENCIES.find(c=>c.id===id)?.title||'';}
function renderChecks(){
 if(!CHECK)return '<div class="info warning">Kompetenzmodul konnte nicht geladen werden.</div>';
 const s=state.checkSession;
 if(!s){const done=CHECK.COMPETENCIES.filter(c=>state.checkResults[c.id]?.passed).length;
  return `<div class="section-head"><div><span class="eyebrow">Lernstand 1 · Kompetenznachweise</span><h1>Sechs Kompetenzen. Sechs eigene Checks.</h1><p>Ein Check ist bei mindestens <b>85 %</b> und vollständig erfüllten <b>Kernaufgaben</b> bestanden. Ein erfolgreicher Durchlauf reicht. Keine Zeitbegrenzung, keine Serienboni und keine Hinweise während des Checks.</p></div></div>
  <div class="check-intro"><strong>✓ ${done} von 6 Kompetenzen bestanden</strong><p>Deine Nachweise werden auf diesem Gerät gespeichert. Das ist ein Lern-Selbstcheck, keine manipulationssichere Klassenarbeit.</p></div>
  <aside class="fobizz-checker" aria-label="Zusätzlicher Kann-Listen-Checker">
    <div class="fobizz-checker-copy"><span class="eyebrow">🤖 Zusätzliche Lernhilfe</span><h2>Kann-Listen-Checker</h2><p>Lass dich zu deiner Kann-Liste befragen. Melde dich dafür bei fobizz mit dem <strong>Zugangscode von Frau Mol</strong> an.</p></div>
    <a class="fobizz-checker-link" href="https://go.fobizz.com/" target="_blank" rel="noopener noreferrer" aria-label="Kann-Listen-Checker bei fobizz in neuem Tab öffnen">Zu go.fobizz.com ↗</a>
  </aside>
  <div class="topic-grid">${CHECK.COMPETENCIES.map(c=>{const r=state.checkResults[c.id]||{};return `<article class="topic competence-tile"><div class="top"><span class="emoji">${r.passed?'✅':'📘'}</span><span class="count">${r.passed?'Sicher beherrscht':r.attempts?'Weiter üben':'Noch nicht geprüft'}</span></div><h3>${escapeHTML(c.title)}</h3><p>${escapeHTML(c.description)}</p><div class="competency-meta">${r.attempts?`Bester Wert: <strong>${Number(r.bestPercent||0).toLocaleString('de-DE')} %</strong> · ${r.attempts} Versuch${r.attempts===1?'':'e'}`:'Acht Aufgaben einschließlich verpflichtender Anwendungsaufgaben'}</div><button data-action="check-start" data-id="${c.id}">${r.passed?'Freiwillig wiederholen':r.attempts?'Erneut prüfen':'Kompetenzcheck starten'} ›</button></article>`}).join('')}</div>`;
 }
 const c=CHECK.COMPETENCIES.find(x=>x.id===s.id);
 if(s.done){const r=s.result;return `<div class="section-head"><div><span class="eyebrow">Lernstand 1 · ${escapeHTML(c.title)}</span><h1>${r.passed?'✅ Kompetenz sicher beherrscht':'📘 Noch nicht vollständig nachgewiesen'}</h1></div></div>
 <div class="check-intro"><div class="check-score">${r.percent.toLocaleString('de-DE')} %</div><p><strong>${r.passed?'Bestanden':'Noch nicht bestanden'}</strong> · Erforderlich: mindestens 85 % und alle Kernaufgaben richtig.</p><p>${r.cores.every(x=>x.passed)?'✅ Alle Kernanforderungen erfüllt':'⚠️ Noch offene Kernanforderungen: '+r.cores.filter(x=>!x.passed).map(x=>'Aufgabe '+(x.index+1)).join(', ')}</p><p>Richtige Gesamtschritte: ${r.correct} von ${s.questions.length}. Teilpunkte innerhalb mehrteiliger Aufgaben sind in der Prozentzahl berücksichtigt.</p></div>
 <div class="competence-review">${s.questions.map((q,i)=>{const rr=r.results[i];return `<details><summary>${rr.correct?'✅':rr.ratio>0?'◐':'○'} Aufgabe ${i+1}${q.core?' · Kernanforderung':''} – ${Math.round(rr.ratio*100)} %</summary><p>${escapeHTML(q.question)}</p><p><b>Erklärung:</b> ${escapeHTML(q.explanation||'Die fachlichen Teilschritte wurden geprüft.')}</p></details>`}).join('')}</div>
 <div class="split-actions"><button class="primary" data-action="check-start" data-id="${s.id}">Mit neuen Aufgaben wiederholen</button><button data-action="check-cancel">Zu allen Kompetenzen</button></div>`;}
 const q=s.questions[s.index],isBank=['choice','number','sort','board','pair','case'].includes(q.kind);
 const controls=isBank?challengeControls(q,s):checkSpecialControls(q,s);
 return `<div class="section-head"><div><span class="eyebrow">Kompetenz ${s.id.slice(1)} / 6 · ${escapeHTML(c.title)}</span><h1>Kompetenzcheck</h1><p>Arbeite ohne Zeitdruck. Du erfährst erst am Ende, welche Aufgaben und Kernanforderungen richtig gelöst wurden.</p></div><button data-action="check-cancel">Check verlassen</button></div>
 <article class="challenge check-challenge"><div class="question-top"><span class="phase">${q.core?'★ Kernanforderung':'Übungs- und Anwendungsaufgabe'}</span><span class="round-pill">Aufgabe ${s.index+1} / ${s.questions.length}</span></div>
 <h3 class="q-text">${escapeHTML(q.question)}</h3>${controls}<div class="q-actions"><small>Bewertung erst nach Abschluss · kein Zeitbonus</small><button class="primary" data-action="check-submit">Antwort verbindlich abgeben ›</button></div><div class="progress-rail"><span style="width:${Math.round(s.index/s.questions.length*100)}%"></span></div></article>`;
}
function checkSpecialControls(q,s){
 if(q.kind==='sequence'){s.order??=[...q.items];return `<p class="muted">Nutze die Pfeile, um die Karten von oben nach unten richtig anzuordnen.</p><div class="check-order">${s.order.map((item,i)=>`<div class="check-order-item"><strong>${i+1}.</strong><span>${escapeHTML(item)}</span><button data-action="check-order-up" data-index="${i}" ${i===0?'disabled':''} aria-label="${escapeHTML(item)} nach oben">↑</button><button data-action="check-order-down" data-index="${i}" ${i===s.order.length-1?'disabled':''} aria-label="${escapeHTML(item)} nach unten">↓</button></div>`).join('')}</div>`;}
 if(q.kind==='inventar'){
  const options=['',...q.groups],tot=[['a','Summe Vermögen'],['d','Summe Schulden'],['e','Reinvermögen / Eigenkapital']];
  return `<p class="muted">Erstelle das Inventar aus den Einzelquellen. <strong>Die Ausgangsdaten stehen direkt auf jeder Karte.</strong> Berechne bei Mengenangaben Menge × Einzelwert, übernimm andernfalls den angegebenen Belegwert. Trage alle Werte in Euro ohne €-Zeichen ein.</p><div class="check-inventory-board">${q.rows.map((r,i)=>`<section class="check-inventory-card"><div class="check-inventory-heading"><span class="check-inventory-index">${i+1}</span><div><strong>${escapeHTML(r.label)}</strong><p class="check-source">${escapeHTML(r.source||'Einzelnachweis fehlt')}</p></div></div><div class="check-inventory-fields"><label>Inventargruppe<select aria-label="Gruppe für ${escapeHTML(r.label)}" data-check-group="${i}">${options.map(o=>`<option value="${escapeHTML(o)}">${escapeHTML(o||'Bitte wählen')}</option>`).join('')}</select></label><label>Positionswert in €<input type="text" inputmode="decimal" data-check-row="${i}" placeholder="Wert eintragen" aria-label="Positionswert ${escapeHTML(r.label)}"></label></div></section>`).join('')}</div><div class="check-totals">${tot.map(([k,name])=>`<label>${name}<input type="text" inputmode="decimal" data-check-total="${k}" placeholder="0" aria-label="${name}"></label>`).join('')}</div>`;
 }
 if(q.kind==='bilanz'){
  const options=['',...q.groups],tot=[['a','Summe Aktiva'],['p','Summe Passiva']];
  return `<p class="muted">Die Werte stammen aus dem Inventar. Ordne die Bilanzposten zu und berechne die Summen.</p><div class="check-table-scroll"><table class="check-table"><thead><tr><th>Bilanzposten</th><th>Einordnen</th><th>Inventarwert €</th></tr></thead><tbody>${q.rows.map((r,i)=>`<tr><td><strong>${escapeHTML(r.label)}</strong></td><td><select aria-label="Gruppe für ${escapeHTML(r.label)}" data-check-group="${i}">${options.map(o=>`<option value="${escapeHTML(o)}">${escapeHTML(o||'Bitte wählen')}</option>`).join('')}</select></td><td><strong>${r.value.toLocaleString('de-DE')} €</strong></td></tr>`).join('')}</tbody></table></div><div class="check-totals">${tot.map(([k,name])=>`<label>${name}<input type="text" inputmode="decimal" data-check-total="${k}" placeholder="0" aria-label="${name}"></label>`).join('')}</div>`;
 }
 if(q.kind==='impact'){const posts=[...new Set(['Bankguthaben','Kassenbestand','Kurzfristige Kredite','Langfristige Darlehen','Betriebs- und Geschäftsausstattung','Verbindlichkeiten aus Lieferungen und Leistungen'])];const opts={'p1':posts,'p2':posts,'d1':['nimmt zu','nimmt ab'],'d2':['nimmt zu','nimmt ab'],'type':['Aktivtausch','Passivtausch','Aktiv-Passiv-Mehrung','Aktiv-Passiv-Minderung'],'effect':['unverändert','steigt','sinkt']};const labels={p1:'Erster betroffener Bilanzposten',d1:'Veränderung dieses Postens',p2:'Zweiter betroffener Bilanzposten',d2:'Veränderung dieses Postens',type:'Art der Bilanzveränderung',effect:'Wirkung auf die Bilanzsumme'};
  return `<div class="check-fields">${Object.keys(labels).map(key=>`<label>${labels[key]}<select data-check-impact="${key}"><option value="">Bitte wählen</option>${opts[key].map(x=>`<option value="${escapeHTML(x)}">${escapeHTML(x)}</option>`).join('')}</select></label>`).join('')}</div>`;
 }
 return '';
}
function moveCheckOrder(index,offset){const s=state.checkSession;if(!s||s.done||!Array.isArray(s.order))return;const j=index+offset;if(j<0||j>=s.order.length)return;[s.order[index],s.order[j]]=[s.order[j],s.order[index]];render();}
function startCheck(id){if(!CHECK?.COMPETENCIES.some(c=>c.id===id))return;const attempts=state.checkResults[id]?.attempts||0;try{const questions=CHECK.buildAssessment(id,DATA.questions,((Math.random()*0xffffffff)>>>0)+attempts);state.checkSession={id,questions,index:0,answers:[],done:false,selection:null,numeric:'',placements:null,links:null,activeCard:null,activeLeft:null,caseSide:null,caseEffect:null,order:null,feedback:null};setView('check');}catch(e){toast('Kompetenzcheck konnte nicht vorbereitet werden: '+e.message);}}
function getCheckAnswer(q,s){if(q.kind==='sequence')return [...(s.order||q.items)];if(q.kind==='inventar'||q.kind==='bilanz')return {rows:q.rows.map((_,i)=>({group:document.querySelector(`[data-check-group="${i}"]`)?.value||'',value:document.querySelector(`[data-check-row="${i}"]`)?.value||''})),totals:Object.fromEntries(Object.keys(q.fields).map(k=>[k,document.querySelector(`[data-check-total="${k}"]`)?.value||'']))};if(q.kind==='impact')return Object.fromEntries(Object.keys(q.fields).map(k=>[k,document.querySelector(`[data-check-impact="${k}"]`)?.value||'']));return answerFromUI(q,s);}
function submitCheck(){const s=state.checkSession;if(!s||s.done)return;const q=s.questions[s.index],answer=getCheckAnswer(q,s);if(answer===null){toast(q.kind==='number'?'Bitte einen gültigen Euro-Betrag eingeben, zum Beispiel 2250 oder 2.250,00.':'Bitte bearbeite die Aufgabe vor dem Abgeben.');return;}
 if(['inventar','bilanz'].includes(q.kind)){const all=answer.rows.every(r=>r.group&&(q.kind==='bilanz'||String(r.value).trim()))&&Object.values(answer.totals).every(v=>String(v).trim());if(!all){toast('Bitte alle Positionen und Summen ausfüllen.');return;}}
 if(q.kind==='impact'&&Object.values(answer).some(v=>!v)){toast('Bitte alle sechs Angaben ergänzen.');return;}
 s.answers.push(answer);s.index++;clearAnswers(s);s.order=null;
 if(s.index===s.questions.length){const r=CHECK.grade(s.questions,s.answers),prev=state.checkResults[s.id]||{};s.result=r;s.done=true;state.checkResults[s.id]={attempts:(prev.attempts||0)+1,passed:!!prev.passed||r.passed,bestPercent:Math.max(prev.bestPercent||0,r.percent),lastPercent:r.percent,corePassed:r.cores.every(x=>x.passed),updatedAt:new Date().toISOString()};save('bd-duell.competencies.v1',state.checkResults);}
 render();window.scrollTo(0,0);
}
function renderProgress(){
 const modular=ls('buerodesign.arena2.modulareuebungen.ab-nummer.v2',null)?.data||{};
 const whole=ls('buerodesign.arena2.gesamtwerkstatt.2026.1',null)?.state||{};
 const maxOf=(v,n)=>Math.max(0,Math.min(n,Number(v)||0));
 const pract=state.arena==='2'?`<div class="arena-practice-status"><h2>Deine T-Konten-Werkstatt</h2><p>Die beiden praktischen Übungsformen speichern ihren Fortschritt auf diesem Gerät, unabhängig vom Kurzquiz.</p><div class="arena-practice-grid"><div><strong>Einzelübungen</strong><span>Konten eröffnen: ${maxOf(modular.openingIndex,8)} / 8</span><span>Geschäftsfälle: ${maxOf(modular.bookIndex,30)} / 30</span><span>Konten abschließen: ${maxOf(modular.closeIndex,4)} / 4</span><a href="./arena2/uebungen.html">Einzelübungen fortsetzen ›</a></div><div><strong>Gesamtwerkstatt</strong><span>Phase: ${({opening:'Konten eröffnen',booking:'Geschäftsfälle buchen',closing:'Konten abschließen',sbk:'SBK erstellen',finished:'Abgeschlossen'})[whole.phase]||'Noch nicht begonnen'}</span><span>Geprüfte Geschäftsfälle: ${maxOf(whole.bookIndex,5)} / 5</span><a href="./arena2/gesamtwerkstatt.html">Gesamtwerkstatt fortsetzen ›</a></div></div></div>`:'';
 const total=totals();const skillDone=CHECK?CHECK.COMPETENCIES.filter(c=>state.checkResults[c.id]?.passed).length:0;return `${pract}<div class="arena-progress-switch"><strong>Fortschritt je Lernarena</strong><div class="arena-buttons"><button data-action="progress-arena" data-arena="1" class="${state.arena==='1'?'primary':''}">Lernarena 1 · ${totals('1').correct} richtig</button><button data-action="progress-arena" data-arena="2" class="${state.arena==='2'?'primary':''}">Lernarena 2 · ${totals('2').correct} richtig</button></div><p class="muted tiny">Der Fortschritt in den großen T-Konten-Übungen wird direkt in den jeweiligen Übungen gespeichert.</p></div><div class="check-intro"><strong>Kompetenznachweise Lernstand 1: ${skillDone} von 6 bestanden</strong><p>Die Punkte aus dem Duell ersetzen keinen Kompetenzcheck.</p><button data-action="go-check">Zu meinen Kompetenzchecks ›</button></div>`+`<div class="section-head"><div><span class="eyebrow">Lernarena ${state.arena} · Dein Lernfortschritt</span><h1>So sicher sitzt das Wissen schon.</h1><p>Der persönliche Fortschritt bleibt auf diesem Gerät gespeichert. Hier geht es um Übung – nicht um Noten.</p></div></div><div class="statbar"><div class="stat"><span class="ic">📝</span><div><strong>${fmt(total.attempts)}</strong><small>Aufgaben bearbeitet</small></div></div><div class="stat"><span class="ic">✅</span><div><strong>${fmt(total.correct)}</strong><small>Richtig gelöst</small></div></div><div class="stat"><span class="ic">🎯</span><div><strong>${total.attempts?Math.round(total.correct/total.attempts*100):0}%</strong><small>Gesamt-Trefferquote</small></div></div></div><div class="progress-topics">${getTopicRows().map(t=>{const s=(state.arena==='2'?state.stats2:state.stats).byTopic[t.id]||{attempts:0,correct:0};const pct=s.attempts?Math.round(s.correct/s.attempts*100):0;return `<article class="progress-topic"><div class="line"><strong>${t.emoji} ${escapeHTML(t.name)}</strong><small>${s.correct}/${s.attempts} richtig</small></div><div class="rail"><span style="width:${pct}%"></span></div><small>${s.attempts?pct+' % richtig':'Noch nicht trainiert'}</small><div style="margin-top:12px"><button class="small" data-action="topic-start" data-topic="${t.id}">Weiterüben ›</button></div></article>`}).join('')}</div><div class="info">📌 <b>Noch zu üben:</b> ${(state.arena==='2'?state.stats2:state.stats).missedIds.length} offene Aufgaben im Fehlertraining. <button class="small" data-action="solo-start" data-type="errors" ${!(state.arena==='2'?state.stats2:state.stats).missedIds.length?'disabled':''}>Fehlertraining starten</button></div><p class="footer-note"><button class="small ghost" data-action="clear-progress">Lernfortschritt auf diesem Gerät zurücksetzen</button></p>`;}
function render(){
 document.body.classList.toggle('duel-view',state.view==='duel');
 document.body.classList.toggle('duel-room',state.view==='duel'&&!!state.duel);
 document.querySelectorAll('[data-nav]').forEach(b=>{const active=b.dataset.nav===state.view;b.classList.toggle('active',active);b.setAttribute('aria-current',active?'page':'false');});
 el('top-avatar').textContent=state.profile.avatar;el('top-name').textContent=state.profile.name||'Deine Lernarena';
 const screen=el('screen');screen.innerHTML=state.view==='home'?renderHome():state.view==='arena2'?renderArena2():state.view==='learn'?renderLearn():state.view==='duel'?renderDuel():state.view==='check'?renderChecks():renderProgress();tickClock();
}
function tickClock(){const solo=state.solo;const soloClock=el('memory-solo-clock');
 const pendingFlip=el('memory-wait-seconds'),session=currentSession();
 if(pendingFlip&&session?.memoryWrongUntil)pendingFlip.textContent=String(Math.max(0,Math.ceil((session.memoryWrongUntil-Date.now())/1000)));if(soloClock&&solo?.endsAt){const rest=Math.max(0,solo.endsAt-Date.now());soloClock.textContent=dateClock(rest);soloClock.classList.toggle('urgent',rest<30000);if(!rest&&!solo.done){solo.done=true;render();}}const n=el('duel-clock');const d=state.duel;if(n&&d){
  const now=Date.now()+state.serverOffset;
  if(d.room.phase==='lobby')n.textContent=dateClock(d.room.durationMs||600000);
  else if(d.room.phase==='countdown'){n.textContent=dateClock(d.room.durationMs||600000);const k=el('pre-countdown');if(k)k.textContent=String(Math.max(1,Math.ceil((d.room.startedAt-now)/1000)));if(now>=d.room.startedAt&&!polling)pollRoom(true);}
  else if(d.room.phase==='finished')n.textContent='00:00';
  else{const remaining=Math.max(0,d.room.endsAt-now);n.textContent=dateClock(remaining);n.classList.toggle('urgent',remaining<60000);if(!remaining&&!polling)pollRoom(true);}
 }}
async function gameAPI(action,extra={}){
 const method=action==='health'?'GET':'POST';const url='/api/game'+(method==='GET'?'?check=1':'');
 const options={method,cache:'no-store',headers:{'Accept':'application/json'},signal:AbortSignal.timeout(17000)};
 if(method==='POST'){options.headers['Content-Type']='application/json';options.body=JSON.stringify({action,...extra});}
 let resp;try{resp=await fetch(url,options);}catch(e){throw new Error('Der Multiplayer-Server ist nicht erreichbar. Prüfe die Netlify-Veröffentlichung und deine Internetverbindung.');}
 let data;try{data=await resp.json();}catch{throw new Error('Der Server hat keine gültige Antwort geliefert.');}
 if(!resp.ok)throw new Error(data.error||'Der Server antwortet mit einem Fehler.');return data;
}
function sessionData(){const s=state.duel;return s?{code:s.room.code,playerId:s.playerId,token:s.token}:null;}
function persistSession(){if(!state.duel)return;save('bd-duell.session.v1',sessionData());}
function acceptRoom(data,session={}){
 const prev=state.duel;
 const prevQuestion=prev?.question?.id||'';
 const nowId=data.question?.id||'';
 const feedback=prev?.feedback||null;
 state.serverOffset=data.now-Date.now();
 if(data.room?.arena){state.arena=data.room.arena;}
 state.duel=Object.assign(prev||{}, {...data,playerId:session.playerId||prev?.playerId,token:session.token||prev?.token,
  feedback,selection:prevQuestion===nowId?prev?.selection??null:null,numeric:prevQuestion===nowId?prev?.numeric||'':'',
  placements:prevQuestion===nowId?prev?.placements??null:null,links:prevQuestion===nowId?prev?.links??null:null,
  activeCard:prevQuestion===nowId?prev?.activeCard??null:null,activeLeft:prevQuestion===nowId?prev?.activeLeft??null:null,
  caseSide:prevQuestion===nowId?prev?.caseSide??null:null,caseEffect:prevQuestion===nowId?prev?.caseEffect??null:null,
  memoryOpen:prevQuestion===nowId?prev?.memoryOpen||[]:[],memoryBusy:prevQuestion===nowId?prev?.memoryBusy||false:false,
  memoryWrongUntil:prevQuestion===nowId?prev?.memoryWrongUntil||0:0,memoryFlipAt:prevQuestion===nowId?prev?.memoryFlipAt||0:0,
  matched:data.matched||[],lastQuestionId:prev?.lastQuestionId||''});
 return {before:prev?.room?.phase,after:data.room.phase,questionChanged:prevQuestion!==nowId};
}
async function roomCreate(){if(state.pending)return;saveProfile();const maybeHost=el('host-spectator')?.checked===true;if(!maybeHost&&state.profile.name.length<2){toast('Bitte gib zuerst einen Spielernamen mit mindestens zwei Zeichen ein.');return;}
 const hostSpectator=el('host-spectator')?.checked===true;state.hostSpectator=hostSpectator;
 if(hostSpectator&&state.profile.name.length<2){state.profile.name='Spielleitung';save('bd-duell.profile.v1',state.profile);}
 state.pending=true;render();try{const data=await gameAPI('create',{...state.profile,hostSpectator,gameMode:state.duelMode,arena:state.arena,durationMinutes:state.duelDuration});state.online=true;acceptRoom(data,{token:data.token,playerId:data.playerId});state.duel.feedback=null;persistSession();render();}
 catch(e){toast(e.message);state.online=false;render();}finally{state.pending=false;}}
async function roomJoin(){if(state.pending)return;const code=el('room-enter-code')?.value||'';saveProfile();if(state.profile.name.length<2){toast('Bitte gib zuerst einen Spielernamen ein.');return;}
 if(!/^[A-HJ-NP-Z2-9]{6}$/i.test(code.trim())){toast('Bitte gib einen gültigen sechsstelligen Raumcode ein.');return;}
 state.pending=true;render();try{const data=await gameAPI('join',{...state.profile,code:code.trim().toUpperCase()});state.online=true;acceptRoom(data,{token:data.token,playerId:data.playerId});state.duel.feedback=null;persistSession();render();}
 catch(e){toast(e.message);render();}finally{state.pending=false;}}
async function roomDelete(){if(!state.duel?.isHost)return; if(!confirm('Raum und alle gespeicherten Teilnehmenden und Ergebnisse dieses Raums wirklich löschen?'))return;
 try{await gameAPI('delete',sessionData());leaveRoom();toast('Raum und Ergebnisse wurden gelöscht.');}catch(e){toast(e.message);}}
async function roomStart(){if(state.pending||!state.duel?.isHost)return;state.pending=true;try{const data=await gameAPI('start',sessionData());acceptRoom(data);render();}catch(e){toast(e.message);await pollRoom(true);}finally{state.pending=false;}}
async function pollRoom(force=false){if(!state.duel||polling)return;polling=true;
 try{const prev=state.duel;const data=await gameAPI('state',sessionData());const changed=acceptRoom(data);
  if(state.view==='duel'){
   if(changed.before!==changed.after||changed.questionChanged || force && data.room.phase==='finished'){
    if(data.room.phase==='finished')state.duel.feedback=null;
    render();
   } else{
    const ranks=el('rankings');if(ranks)ranks.innerHTML=renderRank(data.ranking,prev.playerId);
    const cap=el('leader-status');if(cap)cap.textContent=`${data.room.playerCount} im Raum`;
    if(data.room.phase==='playing'&&!state.duel.feedback){const box=document.querySelector('.quiz-side-stat b');if(box)box.textContent=fmt(data.me.score);}
    tickClock();
   }
  }
 }catch(e){if(String(e.message).includes('Raum nicht gefunden')){leaveRoom();toast('Der Raum ist nicht mehr verfügbar.');}else if(force)toast(e.message);}finally{polling=false;}}
async function submitDuel(){const d=state.duel;if(!d||d.feedback||state.pending||d.room.phase!=='playing'||!d.question)return;
 const q=d.question,answer=answerFromUI(q,d);if(answer===null){toast(q.kind==='number'?'Bitte einen gültigen Euro-Betrag eingeben, zum Beispiel 2250 oder 2.250,00.':'Wähle zuerst eine Antwort oder gib einen Betrag ein.');return;}
 state.pending=true;const submit=document.querySelector('[data-action="duel-submit"]');if(submit){submit.disabled=true;submit.textContent='Wird geprüft …';}
 try{const data=await gameAPI('answer',{...sessionData(),questionId:q.id,answer});
  d.lastQuestionId=q.id;d.feedback={correct:data.correct,answer:data.answer,explanation:data.explanation,points:data.points,submitted:d.numeric};
  d.question=data.question;d.index=data.index;d.me=data.me;
  const qb=BY_ID.get(q.id);if(qb)updateStats(qb,data.correct,data.me.streak);
  state.serverOffset=data.now-Date.now();render();
 }catch(e){toast(e.message);await pollRoom(true);}finally{state.pending=false;if(submit){submit.disabled=false;submit.textContent='Antwort prüfen';}}
}
function nextDuel(){if(!state.duel?.feedback)return;state.duel.feedback=null;clearAnswers(state.duel);render();window.scrollTo(0,0);}
function leaveRoom(){state.duel=null;try{localStorage.removeItem('bd-duell.session.v1')}catch{};setView('duel');}
async function copyText(value){try{await navigator.clipboard.writeText(value);toast('In die Zwischenablage kopiert.');}catch{const inp=document.createElement('textarea');inp.value=value;document.body.appendChild(inp);inp.select();let ok=false;try{ok=document.execCommand('copy')}catch{}inp.remove();toast(ok?'Kopiert.':'Kopieren nicht verfügbar – markiere den Code und kopiere ihn manuell.');}}
async function checkOnline(){if(location.protocol==='file:'){state.online=false;return;}
 try{const res=await gameAPI('health');state.online=!!res.ok;}catch{state.online=false;}
 const d=el('online-dot'),l=el('online-label');if(d)d.classList.toggle('online',!!state.online);if(l)l.textContent=state.online?'Klassenduell verbunden':'Nur Solo-Training';
 if(state.view==='duel'&&!state.duel)render();}
async function loadArena2Status(){
 if(location.protocol==='file:'){state.arena2Unlocked=true;state.arena2Status='local';render();return;}
 try{const resp=await fetch('/api/arena-access',{cache:'no-store'});if(!resp.ok)throw Error('not ready');const body=await resp.json();state.arena2Unlocked=!!body.enabled;state.arena2Status='ready';}
 catch{state.arena2Unlocked=false;state.arena2Status='error';}
 render();
}
async function teacherRelease(enabled){
 const password=el('teacher-pass')?.value||'';if(!password){toast('Bitte das Lehrkraft-Passwort eingeben.');return;}
 if(location.protocol==='file:'){state.arena2Unlocked=enabled;state.arena2Status='local';render();toast(enabled?'Lokale Vorschau freigegeben.':'Lokale Vorschau gesperrt.');return;}
 try{const resp=await fetch('/api/arena-access',{method:'POST',headers:{'content-type':'application/json'},cache:'no-store',body:JSON.stringify({password,enabled})});const data=await resp.json();if(!resp.ok)throw Error(data.error||'Freigabe nicht möglich');state.arena2Unlocked=!!data.enabled;state.arena2Status='ready';render();toast(enabled?'Lernarena 2 wurde für alle freigegeben.':'Lernarena 2 ist wieder gesperrt.');}
 catch(e){toast(e.message||'Freigabe fehlgeschlagen.');}
}
function chooseArena(arena,destination){
 if(arena==='2'&&!state.arena2Unlocked){toast('Lernarena 2 muss zuerst durch die Lehrkraft freigegeben werden.');setView('home');return;}
 if(state.arena!==arena){state.arena=arena;state.selectedTopic='alle';state.selectedMode='mix';state.duelMode='mix';state.solo=null;}
 setView(destination);
}
function runAction(action,button){switch(action){
 case 'home-return':setView('home');break;
 case 'arena1-learn':chooseArena('1','learn');break;
 case 'arena1-duel':chooseArena('1','duel');break;
 case 'arena2-learn':chooseArena('2','arena2');break;
 case 'arena2-duel':chooseArena('2','duel');break;
 case 'arena2-quiz':chooseArena('2','learn');break;
 case 'teacher-release':teacherRelease(button.dataset.enabled==='true');break;
 case 'progress-arena':state.arena=button.dataset.arena==='2'?'2':'1';render();break;
 case 'go-learn':setView('learn');break;case 'go-duel':setView('duel');break;case 'go-check':state.checkSession=null;setView('check');break;
 case 'check-start':startCheck(button.dataset.id);break;case 'check-submit':submitCheck();break;case 'check-cancel':state.checkSession=null;render();break;
 case 'check-order-up':moveCheckOrder(Number(button.dataset.index),-1);break;case 'check-order-down':moveCheckOrder(Number(button.dataset.index),1);break;
 case 'topic-start':state.selectedTopic=button.dataset.topic;startSolo('sprint');break;
 case 'topic-filter':state.selectedTopic=button.dataset.topic;render();break;
 case 'solo-duration':{const n=Number(button.dataset.minutes);if(![0,5,10,15,20,30].includes(n)||state.selectedMode==='memory')break;state.soloDuration=n;render();break;}
  case 'solo-mode':state.selectedMode=button.dataset.mode;render();break;
 case 'duel-arena':{
   const arena=button.dataset.arena==='2'?'2':'1';
   if(arena==='2'&&!state.arena2Unlocked){toast('Lernarena 2 muss zuerst freigegeben werden.');break;}
   syncDuelForm();state.arena=arena;render();break;
  }
  case 'duel-duration':{
   const n=Number(button.dataset.minutes);
   if(![5,10,15].includes(n)||state.duelMode==='memory')break;
   syncDuelForm();state.duelDuration=n;render();break;
  }
  case 'duel-mode':syncDuelForm();state.duelMode=button.dataset.mode;render();break;
 case 'memory-flip':memoryPick(Number(button.dataset.index));break;
 case 'sort-pick':chooseSort(Number(button.dataset.index));break;
 case 'sort-place':placeSort(button.dataset.bin);break;
 case 'pair-left':choosePairLeft(Number(button.dataset.index));break;
 case 'pair-right':choosePairRight(Number(button.dataset.index));break;
 case 'case-side':{const s=currentSession();if(s&&!s.feedback){s.caseSide=button.dataset.value;render();}break;}
 case 'case-effect':{const s=currentSession();if(s&&!s.feedback){s.caseEffect=button.dataset.value;render();}break;}
 case 'solo-start':startSolo(button.dataset.type);break;
 case 'choose':prepareChoice(Number(button.dataset.choice));break;
 case 'solo-submit':submitSolo();break;case 'solo-next':nextSolo();break;
 case 'learn-reset':state.solo=null;render();break;
 case 'avatar':{
  const name=el('profile-name')?.value||state.profile.name;
  state.profile.name=name;state.profile.avatar=button.dataset.avatar;save('bd-duell.profile.v1',state.profile);render();break;
 }
 case 'room-create':roomCreate();break;case 'room-join':roomJoin();break;case 'room-start':roomStart();break;
 case 'room-leave':leaveRoom();break;case 'room-delete':roomDelete();break;case 'duel-submit':submitDuel();break;case 'duel-next':nextDuel();break;
 case 'copy-code':copyText(state.duel.room.code);break;
 case 'copy-link':copyText(`${location.origin}${location.pathname}?raum=${state.duel.room.code}`);break;
 case 'result-copy':copyText(`Bürodesign-Duell: ${state.duel.me?.name||'Spieler'} – ${state.duel.me?.score||0} Punkte · ${state.duel.me?.correct||0} richtig · ${state.duel.room?.modeName||'Klassenduell'}`);break;
 case 'clear-progress':if(confirm('Möchtest du alle auf diesem Gerät gespeicherten Übungen und Kompetenznachweise zurücksetzen?')){
  state.stats={byTopic:{},missedIds:[],maxStreak:0};save('bd-duell.stats.v1',state.stats);
  state.stats2={byTopic:{},missedIds:[],maxStreak:0};save('bd-duell.stats.arena2.v1',state.stats2);
  state.checkResults={};save('bd-duell.competencies.v1',{});
  try{localStorage.removeItem('buerodesign.arena2.modulareuebungen.ab-nummer.v2');localStorage.removeItem('buerodesign.arena2.gesamtwerkstatt.2026.1')}catch{}
  render();}break;
 default:break;
}}
document.addEventListener('click',e=>{const button=e.target.closest('[data-nav], [data-action]');if(!button)return;if(button.hasAttribute('data-nav')){const nav=button.dataset.nav;if(nav==='learn')chooseArena('1','learn');else if(nav==='arena2')chooseArena('2','arena2');else setView(nav);return;}runAction(button.dataset.action,button);});
document.addEventListener('change',e=>{if(e.target.id==='host-spectator')state.hostSpectator=e.target.checked;});
let touchDrag=null;
function dragHighlight(x,y){
 const zone=document.elementFromPoint(x,y)?.closest('[data-bin]');
 document.querySelectorAll('[data-bin]').forEach(el=>el.classList.toggle('drag-over',el===zone));
 return zone;
}
document.addEventListener('pointerdown',e=>{
 if(e.pointerType==='mouse' || e.button!==0 || e.target.closest('.memory-card'))return;
 const card=e.target.closest('[data-sort-index]');if(!card || card.disabled)return;
 const ss=currentSession(),q=currentQuestion();if(!ss||!q||!['sort','board'].includes(q.kind)||ss.feedback)return;
 touchDrag={id:e.pointerId,index:Number(card.dataset.sortIndex),x:e.clientX,y:e.clientY,origin:card,active:false,ghost:null};
});
document.addEventListener('pointermove',e=>{
 const d=touchDrag;if(!d||d.id!==e.pointerId)return;
 if(!d.active){if(Math.hypot(e.clientX-d.x,e.clientY-d.y)<9)return;
  d.active=true;const b=d.origin.getBoundingClientRect();
  const ghost=d.origin.cloneNode(true);ghost.classList.add('drag-ghost');ghost.removeAttribute('data-action');ghost.removeAttribute('data-sort-index');ghost.setAttribute('aria-hidden','true');ghost.style.width=Math.min(Math.max(b.width,160),285)+'px';
  document.body.appendChild(ghost);d.ghost=ghost;d.origin.classList.add('drag-source');
 }
 e.preventDefault();d.ghost.style.left=(e.clientX+10)+'px';d.ghost.style.top=(e.clientY+12)+'px';
 dragHighlight(e.clientX,e.clientY);
 if(e.clientY>window.innerHeight-65)window.scrollBy(0,13);
 else if(e.clientY<65)window.scrollBy(0,-13);
},{passive:false});
document.addEventListener('pointerup',e=>{
 const d=touchDrag;if(!d||d.id!==e.pointerId)return;
 touchDrag=null;
 if(!d.active)return;
 const zone=dragHighlight(e.clientX,e.clientY);
 d.ghost?.remove();d.origin.classList.remove('drag-source');document.querySelectorAll('[data-bin]').forEach(el=>el.classList.remove('drag-over'));
 // Prevent the release from also activating the card's click handler.
 const suppressClick=ev=>{ev.preventDefault();ev.stopImmediatePropagation();document.removeEventListener('click',suppressClick,true);};
 document.addEventListener('click',suppressClick,true);
 setTimeout(()=>document.removeEventListener('click',suppressClick,true),300);
 if(zone){const ss=currentSession();if(ss){ss.activeCard=d.index;placeSort(zone.dataset.bin);}}
});
document.addEventListener('pointercancel',()=>{touchDrag?.ghost?.remove();touchDrag?.origin?.classList.remove('drag-source');touchDrag=null;document.querySelectorAll('[data-bin]').forEach(el=>el.classList.remove('drag-over'));});
document.addEventListener('dragstart',e=>{const card=e.target.closest('[data-sort-index]');if(!card)return;
 const s=currentSession();if(!s||s.feedback)return;s.activeCard=Number(card.dataset.sortIndex);
 e.dataTransfer?.setData('text/plain',String(s.activeCard));if(e.dataTransfer)e.dataTransfer.effectAllowed='move';});
document.addEventListener('dragover',e=>{if(e.target.closest('[data-bin]'))e.preventDefault();});
document.addEventListener('drop',e=>{const zone=e.target.closest('[data-bin]');if(!zone)return;e.preventDefault();const s=currentSession();if(s&&e.dataTransfer){const i=Number(e.dataTransfer.getData('text/plain'));if(Number.isInteger(i))s.activeCard=i;}placeSort(zone.dataset.bin);});
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('.sort-lane, .sort-pool[data-bin]')){e.preventDefault();placeSort(e.target.dataset.bin);}});
document.addEventListener('input',e=>{if(e.target.id==='profile-name')state.profile.name=e.target.value.slice(0,MAX_NAME);
 if(e.target.id==='numeric-answer'){const ss=currentSession();if(ss)ss.numeric=e.target.value;}});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='numeric-answer'){e.preventDefault();if(state.view==='duel')submitDuel();else if(state.view==='check')submitCheck();else submitSolo();}
 if(e.key==='Enter'&&e.target.id==='room-enter-code'){e.preventDefault();roomJoin();}});
// Restore valid saved participant session; don't create a duplicate player on reload.
const cached=ls('bd-duell.session.v1',null);
if(cached&&/^[A-HJ-NP-Z2-9]{6}$/.test(cached.code||'') && cached.playerId && cached.token){state.duel={room:{code:cached.code,phase:'lobby',playerCount:0},playerId:cached.playerId,token:cached.token,ranking:[],me:null,feedback:null};state.view='duel';pollRoom(true);}
render();checkOnline();loadArena2Status();setInterval(tickClock,250);setInterval(()=>{if(state.duel)pollRoom();},6000);
})();
