/* Bürodesign GmbH – Kompetenznachweise Lernstand 1.
   Formative Selbstchecks: lokale Ergebnisse sind keine manipulationssicheren Prüfungsnachweise.
   Ein Versuch besteht bei >=85 Prozent UND allen Kernaufgaben. */
(function(root){
'use strict';
const REQUIRED_PERCENT=85;
const ACTIV_ORDER=['Grundstücke und Gebäude','Technische Anlagen und Maschinen','Betriebs- und Geschäftsausstattung','Fuhrpark','Rohstoffe','Handelswaren / Vorprodukte','Fertige Erzeugnisse','Forderungen aus Lieferungen und Leistungen','Bankguthaben','Kassenbestand'];
const PASSIV_ORDER=['Eigenkapital','Hypotheken','Langfristige Darlehen','Kurzfristige Kredite','Verbindlichkeiten aus Lieferungen und Leistungen'];
const COMPETENCIES=[
 {id:'k1',title:'Von der Inventur zur Bilanz',description:'Bestandsaufnahme, Inventar und Bilanz erklären und den Gesamtprozess nachvollziehen.',coreLabel:'Reihenfolge und Bedeutung der drei Schritte',slots:[
  {type:'sequence',order:['Inventur','Inventar','Bilanz'],core:true},
  {type:'bank',ids:['BD0002']},{type:'bank',ids:['BD0003']},{type:'bank',ids:['BD0004']},
  {type:'bank',ids:['BD0025']},{type:'bank',ids:['BD0041']},{type:'bank',ids:['BD0027']},{type:'bank',ids:['BD0005']}
 ]},
 {id:'k2',title:'Aus Inventurdaten ein Inventar erstellen',description:'Einzelpositionen erfassen, bewerten, gliedern und Reinvermögen berechnen.',coreLabel:'Inventar aus Daten aufbauen und korrekt berechnen',slots:[
  {type:'inventar',core:true},{type:'bank',ids:['BD0026']},{type:'bank',ids:['BD0027']},
  {type:'bank',ids:['BD0029','BD0030']},{type:'bank',ids:['BD0031','BD0033']},
  {type:'bank',ids:['BD0032']},{type:'bank',ids:['BD0140','BD0141','BD0142','BD0143','BD0144']},
  {type:'bank',ids:['G-Z001','G-Z003','G-Z005']}
 ]},
 {id:'k3',title:'Aus dem Inventar eine Bilanz erstellen',description:'Bilanzposten zuordnen, korrekt gliedern und beide Summen berechnen.',coreLabel:'Bilanzaufbau und vollständige Reihenfolge der Aktiva',slots:[
  {type:'bilanz',core:true},{type:'sequence',order:ACTIV_ORDER,core:true},
  {type:'bank',ids:['BD0035']},{type:'bank',ids:['BD0038']},{type:'bank',ids:['BD0039']},
  {type:'bank',ids:['BD0040']},{type:'bank',ids:['BD0046']},{type:'sequence',order:PASSIV_ORDER}
 ]},
 {id:'k4',title:'Gemischte Aufgaben bearbeiten',description:'Inventur, Inventar und Bilanz gemeinsam auf unterschiedliche Situationen anwenden.',coreLabel:'Inventur, Inventar und Bilanz jeweils richtig anwenden',slots:[
  {type:'bank',ids:['BD0015','BD0016','BD0017'],core:true},
  {type:'bank',ids:['BD0020','BD0021','BD0022']},
  {type:'bank',ids:['BD0025','BD0026'],core:true},
  {type:'bank',ids:['BD0031','BD0033']},
  {type:'bank',ids:['BD0035','BD0036'],core:true},
  {type:'bank',ids:['BD0042','BD0043']},
  {type:'bank',ids:['BD0145','BD0146','BD0147']},
  {type:'bank',ids:['G-S001','G-S002','G-S003']}
 ]},
 {id:'k5',title:'Bilanzgleichungen vervollständigen',description:'Vermögen, Eigenkapital und Fremdkapital jeweils als gesuchte Größe ermitteln.',coreLabel:'Alle drei gesuchten Größen korrekt berechnen',slots:[
  {type:'equation',target:'V',core:true},{type:'equation',target:'E',core:true},{type:'equation',target:'F',core:true},
  {type:'equation',target:'V'},{type:'equation',target:'E'},{type:'equation',target:'F'},
  {type:'equation',target:'E'},{type:'equation',target:'V'}
 ]},
 {id:'k6',title:'Bilanzveränderungen erläutern',description:'Vier Veränderungsarten, betroffene Posten und Wirkung auf die Bilanzsumme beurteilen.',coreLabel:'Alle vier Bilanzveränderungsarten fachlich richtig analysieren',slots:[
  {type:'impact',index:0,core:true},{type:'impact',index:1,core:true},
  {type:'impact',index:2,core:true},{type:'impact',index:3,core:true},
  {type:'bank',ids:['G-F001','G-F012','G-F023']},{type:'bank',ids:['G-F004','G-F015','G-F026']},
  {type:'bank',ids:['G-F006','G-F017','G-F028']},{type:'bank',ids:['G-F009','G-F020','G-F031']}
 ]}
];
// Jede Inventarposition besitzt einen sichtbaren Einzelnachweis.
// Bei Mengenpositionen wird nur Menge × Einzelwert gezeigt; der Gesamtwert ist selbst zu berechnen.
// Bei bereits bewerteten Belegen ist der Stichtagswert ausdrücklich angegeben.
const INVENTAR_CASES=[
 {rows:[
  ['Bürostühle in der Verwaltung','Anlagevermögen',500,'Zählprotokoll: 5 Stück × 100,00 € je Stück',true],
  ['Maschine im Betrieb','Anlagevermögen',5200,'Bestandsnachweis: 5.200,00 €',false],
  ['Rohstoffe im Lager','Umlaufvermögen',800,'Lagerliste: Stichtagswert 800,00 €',false],
  ['Bankguthaben','Umlaufvermögen',2600,'Bankbestätigung: Guthaben 2.600,00 €',false],
  ['Kassenbestand','Umlaufvermögen',400,'Kassenprotokoll: gezählt 400,00 €',false],
  ['Langfristiges Darlehen','Schulden',3000,'Kreditbestätigung: Restschuld 3.000,00 €',false],
  ['Offene Lieferantenrechnungen','Schulden',700,'Eingangsrechnungen: noch offen 700,00 €',false]
 ]},
 {rows:[
  ['Schreibtische in der Verwaltung','Anlagevermögen',600,'Zählprotokoll: 3 Stück × 200,00 € je Stück',true],
  ['Fuhrpark','Anlagevermögen',5600,'Fuhrparkverzeichnis: Stichtagswert 5.600,00 €',false],
  ['Fertige Erzeugnisse im Lager','Umlaufvermögen',2400,'Lagerliste: Stichtagswert 2.400,00 €',false],
  ['Bankguthaben','Umlaufvermögen',1800,'Bankbestätigung: Guthaben 1.800,00 €',false],
  ['Kassenbestand','Umlaufvermögen',300,'Kassenprotokoll: gezählt 300,00 €',false],
  ['Hypothekenschulden','Schulden',3300,'Kreditbestätigung: Restschuld 3.300,00 €',false],
  ['Offene Lieferantenrechnungen','Schulden',900,'Eingangsrechnungen: noch offen 900,00 €',false]
 ]},
 {rows:[
  ['Betriebs- und Geschäftsausstattung','Anlagevermögen',1400,'Bestandsaufnahme: 4 Regale × 350,00 € je Stück',true],
  ['Technische Anlagen und Maschinen','Anlagevermögen',7300,'Bestandsaufnahme: 2 Maschinen × 3.650,00 € je Stück',true],
  ['Rohstoffe im Lager','Umlaufvermögen',1200,'Lagerliste: Stichtagswert 1.200,00 €',false],
  ['Bankguthaben','Umlaufvermögen',1300,'Bankbestätigung: Guthaben 1.300,00 €',false],
  ['Kassenbestand','Umlaufvermögen',250,'Kassenprotokoll: gezählt 250,00 €',false],
  ['Langfristiges Darlehen','Schulden',3600,'Kreditbestätigung: Restschuld 3.600,00 €',false],
  ['Kurzfristiger Kredit','Schulden',450,'Kreditbestätigung: Restschuld 450,00 €',false]
 ]}
];
const BILANZ_CASES=[
 {rows:[['Betriebs- und Geschäftsausstattung','Anlagevermögen',6000],['Fuhrpark','Anlagevermögen',1500],['Rohstoffe','Umlaufvermögen',2000],['Fertige Erzeugnisse','Umlaufvermögen',1000],['Bankguthaben','Umlaufvermögen',500],['Kassenbestand','Umlaufvermögen',100],['Eigenkapital','Eigenkapital',6000],['Langfristige Darlehen','Fremdkapital',4500],['Verbindlichkeiten aus Lieferungen und Leistungen','Fremdkapital',600]]},
 {rows:[['Betriebs- und Geschäftsausstattung','Anlagevermögen',4000],['Fuhrpark','Anlagevermögen',3000],['Rohstoffe','Umlaufvermögen',1300],['Fertige Erzeugnisse','Umlaufvermögen',2000],['Bankguthaben','Umlaufvermögen',700],['Kassenbestand','Umlaufvermögen',200],['Eigenkapital','Eigenkapital',5800],['Langfristige Darlehen','Fremdkapital',4400],['Verbindlichkeiten aus Lieferungen und Leistungen','Fremdkapital',1000]]}
];
const IMPACTS=[
 {question:'Die Bürodesign GmbH hebt 500 € vom Bankkonto ab und legt das Bargeld in die Geschäftskasse.',p1:'Bankguthaben',d1:'nimmt ab',p2:'Kassenbestand',d2:'nimmt zu',type:'Aktivtausch',effect:'unverändert'},
 {question:'Ein kurzfristiger Kredit über 1.000 € wird ohne Geldfluss in ein langfristiges Darlehen umgewandelt.',p1:'Kurzfristige Kredite',d1:'nimmt ab',p2:'Langfristige Darlehen',d2:'nimmt zu',type:'Passivtausch',effect:'unverändert'},
 {question:'Neue Büroausstattung über 1.200 € wird auf Rechnung geliefert. Die Rechnung bleibt offen.',p1:'Betriebs- und Geschäftsausstattung',d1:'nimmt zu',p2:'Verbindlichkeiten aus Lieferungen und Leistungen',d2:'nimmt zu',type:'Aktiv-Passiv-Mehrung',effect:'steigt'},
 {question:'Eine bereits erfasste Lieferantenrechnung über 600 € wird per Banküberweisung bezahlt.',p1:'Bankguthaben',d1:'nimmt ab',p2:'Verbindlichkeiten aus Lieferungen und Leistungen',d2:'nimmt ab',type:'Aktiv-Passiv-Minderung',effect:'sinkt'}
];
function random(seed){let x=(seed>>>0)||7187;return ()=>((x=(Math.imul(x,1664525)+1013904223)>>>0)/4294967296);}
function shuffle(x,r){const a=[...x];for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function buildAssessment(id,bank,seed){const spec=COMPETENCIES.find(c=>c.id===id);if(!spec)throw Error('Unbekannte Kompetenz.');const rnd=random(seed);return spec.slots.map((slot,i)=>{
  if(slot.type==='bank'){const possibles=slot.ids.map(k=>bank.find(q=>q.id===k)).filter(Boolean);if(!possibles.length)throw Error('Fehlende Aufgabe: '+slot.ids);const b=possibles[Math.floor(rnd()*possibles.length)];return {...b,id:`${id}-q${i+1}`,sourceId:b.id,core:!!slot.core};}
  if(slot.type==='sequence')return {id:`${id}-q${i+1}`,kind:'sequence',core:!!slot.core,question:'Ordne diese Schritte bzw. Bilanzposten in der vereinbarten Unterrichtsreihenfolge (von oben nach unten).',items:shuffle(slot.order,rnd),answer:[...slot.order],explanation:slot.order.join(' → ')};
  if(slot.type==='inventar'||slot.type==='bilanz'){const c=(slot.type==='inventar'?INVENTAR_CASES:BILANZ_CASES)[Math.floor(rnd()*(slot.type==='inventar'?INVENTAR_CASES.length:BILANZ_CASES.length))];const groups=slot.type==='inventar'?['Anlagevermögen','Umlaufvermögen','Schulden']:['Anlagevermögen','Umlaufvermögen','Eigenkapital','Fremdkapital'];
    const rows=shuffle(c.rows.map(([label,group,value,source,calculate])=>({label,group,value,source,calculate:!!calculate})),rnd);const assets=rows.filter(z=>['Anlagevermögen','Umlaufvermögen'].includes(z.group)).reduce((n,z)=>n+z.value,0);const debts=rows.filter(z=>z.group==='Schulden').reduce((n,z)=>n+z.value,0);const equity=slot.type==='inventar'?assets-debts:rows.filter(z=>z.group==='Eigenkapital').reduce((n,z)=>n+z.value,0);const pass=slot.type==='inventar'?debts:rows.filter(z=>['Eigenkapital','Fremdkapital'].includes(z.group)).reduce((n,z)=>n+z.value,0);
    return {id:`${id}-q${i+1}`,kind:slot.type,core:!!slot.core,question:slot.type==='inventar'?'Erstelle aus diesen Inventurdaten ein vereinfachtes Inventar. Bestimme den Wert jeder Position, gliedere sie und berechne Vermögen, Schulden sowie Reinvermögen.':'Erstelle aus den folgenden Inventarwerten die vereinfachte Bilanz. Ordne jeden Posten zu und berechne die Bilanzsummen.',groups,rows,fields:slot.type==='inventar'?{a:assets,d:debts,e:equity}:{a:assets,p:pass},explanation:slot.type==='inventar'?`Vermögen ${assets} € − Schulden ${debts} € = Reinvermögen ${equity} €.`:`Aktiva ${assets} € = Passiva ${pass} €.`};}
  if(slot.type==='equation'){const eqIndex=i+Math.floor(rnd()*100);const equity=2500+(eqIndex*173)%9000,debt=1200+(eqIndex*211)%7000,total=equity+debt;const target=slot.target;return {id:`${id}-q${i+1}`,kind:'number',core:!!slot.core,question:`Vermögen = Eigenkapital + Fremdkapital. Vermögen: ${target==='V'?'?':total+' €'}, Eigenkapital: ${target==='E'?'?':equity+' €'}, Fremdkapital: ${target==='F'?'?':debt+' €'}. Berechne den fehlenden Wert in €!`,answer:target==='V'?total:target==='E'?equity:debt,explanation:`${total} € = ${equity} € + ${debt} €.`};}
  if(slot.type==='impact'){const c=IMPACTS[slot.index];return {id:`${id}-q${i+1}`,kind:'impact',core:!!slot.core,question:c.question,fields:{p1:c.p1,d1:c.d1,p2:c.p2,d2:c.d2,type:c.type,effect:c.effect},explanation:`${c.type}: ${c.p1} ${c.d1}; ${c.p2} ${c.d2}. Bilanzsumme ${c.effect}.`};}
  throw Error('Unbekannter Aufgabentyp: '+slot.type);
 });}
const strictNumber=v=>root.BD_AMOUNTS.parseWholeEuro(v);
function evaluate(task,answer){
  if(answer===null||answer===undefined)return {ratio:0,correct:false,details:[]};
  if(task.kind==='choice'||task.kind==='number'){const correct=task.kind==='number'?strictNumber(answer)===task.answer:answer===task.answer;return {ratio:correct?1:0,correct,details:[]};}
  if(task.kind==='sort'||task.kind==='board'||task.kind==='pair'||task.kind==='case'||task.kind==='sequence'){
    const n=task.answer.length;const ok=Array.isArray(answer)&&answer.length===n?task.answer.map((v,i)=>v===answer[i]):Array(n).fill(false);const ratio=ok.filter(Boolean).length/n;return {ratio,correct:ratio===1,details:ok};
  }
  if(task.kind==='inventar'||task.kind==='bilanz'){
    const results=[];task.rows.forEach((row,i)=>{results.push(answer.rows?.[i]?.group===row.group);if(task.kind==='inventar')results.push(strictNumber(answer.rows?.[i]?.value)===row.value);});Object.entries(task.fields).forEach(([key,value])=>results.push(strictNumber(answer.totals?.[key])===value));const ratio=results.filter(Boolean).length/results.length;return {ratio,correct:ratio===1,details:results};
  }
  if(task.kind==='impact'){const results=Object.entries(task.fields).map(([k,value])=>answer[k]===value);const ratio=results.filter(Boolean).length/results.length;return {ratio,correct:ratio===1,details:results};}
  throw Error('Unbekannte Bewertung: '+task.kind);
}
function grade(tasks,answers){if(!Array.isArray(tasks)||tasks.length!==8)throw Error('Genau acht Aufgaben pro Kompetenz erforderlich.');const results=tasks.map((q,i)=>evaluate(q,answers[i]));const raw=results.reduce((n,x)=>n+x.ratio,0)/tasks.length*100;const cores=tasks.flatMap((q,i)=>q.core?[{index:i,passed:results[i].correct}]:[]);return {percent:Math.floor((raw+1e-9)*10)/10,rawPercent:raw,passed:raw+1e-9>=REQUIRED_PERCENT&&cores.every(c=>c.passed),cores,results,completed:results.length,correct:results.filter(q=>q.correct).length};}
root.BD_COMPETENCY={REQUIRED_PERCENT,ACTIV_ORDER,PASSIV_ORDER,COMPETENCIES,buildAssessment,evaluate,grade,strictNumber};
})(typeof window!=='undefined'?window:globalThis);
