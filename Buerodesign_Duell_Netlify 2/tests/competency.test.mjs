import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const win={};vm.runInNewContext(fs.readFileSync(new URL('../public/competency.js',import.meta.url),'utf8'),{window:win});
const C=win.BD_COMPETENCY;
const bank=JSON.parse(fs.readFileSync(new URL('../shared/questions.json',import.meta.url),'utf8')).questions;
const right=q=>q.kind==='choice'?q.answer:q.kind==='number'?q.answer:q.kind==='sequence'||q.kind==='sort'||q.kind==='board'||q.kind==='case'||q.kind==='pair'?[...q.answer]:q.kind==='impact'?{...q.fields}:{rows:q.rows.map(r=>({group:r.group,value:r.value})),totals:{...q.fields}};
test('Six independently assessable competencies, eight questions each, including required applied tasks',()=>{
 assert.equal(C.REQUIRED_PERCENT,85);assert.equal(C.COMPETENCIES.length,6);
 for(const skill of C.COMPETENCIES){const tasks=C.buildAssessment(skill.id,bank,123456);assert.equal(tasks.length,8);assert(tasks.some(q=>q.core));assert.equal(new Set(tasks.map(q=>q.id)).size,8);const result=C.grade(tasks,tasks.map(right));assert.equal(result.percent,100);assert.equal(result.passed,true);}
});
test('Exactly 85% passes, below 85% does not; percentage rounding never changes pass threshold',()=>{
 const cs=Array.from({length:8},(_,i)=>({kind:i===6?'sequence':'choice',answer:i===6?Array.from({length:5},(_,j)=>'v'+j):'right',core:i===0}));
 const ans=cs.map((q,i)=>i===6?['v0','v1','v2','v3','bad']:i===7?'wrong':'right');
 // 6 complete + 4/5 + 0 => 85%.
 assert.equal(C.grade(cs,ans).rawPercent,85);assert.equal(C.grade(cs,ans).passed,true);
 const below=ans.map((a,i)=>i===6?['v0','v1','v2','bad','bad2']:a);
 assert(C.grade(cs,below).rawPercent<85);assert.equal(C.grade(cs,below).passed,false);
});
test('Even 98.75% is not enough when a mandatory application task is incomplete',()=>{
 const task={kind:'sequence',answer:Array.from({length:10},(_,i)=>String(i)),core:true};
 const tasks=[task,...Array.from({length:7},()=>({kind:'choice',answer:'right',core:false}))];
 const attempt=[['0','1','2','3','4','5','6','7','X','9'],...Array(7).fill('right')];
 const result=C.grade(tasks,attempt);
 assert(result.rawPercent>85);assert.equal(result.cores[0].passed,false);assert.equal(result.passed,false);
});
test('Every competency has a real core and Activa order places BGA before Fuhrpark',()=>{
 assert(C.ACTIV_ORDER.indexOf('Betriebs- und Geschäftsausstattung')+1===C.ACTIV_ORDER.indexOf('Fuhrpark'));
 const k2=C.buildAssessment('k2',bank,4),k3=C.buildAssessment('k3',bank,6),k5=C.buildAssessment('k5',bank,19),k6=C.buildAssessment('k6',bank,19);
 assert(k2.some(q=>q.core&&q.kind==='inventar'));
 assert(k3.some(q=>q.core&&q.kind==='bilanz'));
 assert(k3.some(q=>q.core&&q.kind==='sequence'&&q.answer.length===10));
 assert.equal(k5.filter(q=>q.core).length,3);
 assert.equal(k6.filter(q=>q.core&&q.kind==='impact').length,4);
});
test('Inventar and Bilanz applied tasks calculate balances, and each correct field counts',()=>{
 for(const skill of ['k2','k3']){
  const q=C.buildAssessment(skill,bank,4).find(x=>x.kind=== (skill==='k2'?'inventar':'bilanz'));
  const full=right(q);assert.equal(C.evaluate(q,full).correct,true);
  const flawed={...full,rows:full.rows.map((r,i)=>i===0?{...r,group:'wrong'}:r)};
  const partial=C.evaluate(q,flawed);assert(partial.ratio>0&&partial.ratio<1);assert.equal(partial.correct,false);
  assert.equal(q.fields.a,q.kind==='bilanz'?q.fields.p:q.fields.d+q.fields.e);
 }
});
test('All four balance-change cases use two correct postings and distinct change types',()=>{
 const cases=C.buildAssessment('k6',bank,34).filter(q=>q.kind==='impact');assert.equal(new Set(cases.map(q=>q.fields.type)).size,4);
 for(const q of cases){assert.equal(C.evaluate(q,right(q)).correct,true);assert.equal(C.evaluate(q,{...q.fields,type:'wrong'}).correct,false);}
});
test('German amount parsing only accepts whole euro input with optional zero cents',()=>{
 assert.equal(C.strictNumber('1.200'),1200);assert.equal(C.strictNumber('1.200,00 €'),1200);
 assert.equal(C.strictNumber('1200'),1200);assert.equal(C.strictNumber('1.20'),null);
 assert.equal(C.strictNumber('1abc'),null);assert.equal(C.strictNumber(''),null);
});

test('Competency 2 explicitly displays every input value needed for the inventory calculation',()=>{
 for(const seed of [1,4,99,830,10000]){
  const q=C.buildAssessment('k2',bank,seed).find(x=>x.kind==='inventar');
  assert.equal(q.rows.length,7);
  for(const r of q.rows){
   assert.equal(typeof r.source,'string');
   assert(r.source.includes('€'),`Ausgangswert fehlt bei ${r.label}`);
   assert(r.source.length>=20);
   if(r.calculate){
    const m=r.source.match(/(\d+) (?:Stück|Regale|Maschinen) × ([\d.,]+) €/);
    assert(m,`Keine klar ausgewiesene Mengenrechnung: ${r.label}`);
    const each=Number(m[2].replaceAll('.','').replace(',','.'));
    assert.equal(Number(m[1])*each,r.value);
   }else{
    assert(r.source.includes(r.value.toLocaleString('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2})+' €'),`Belegwert passt nicht bei ${r.label}`);
   }
  }
  assert(q.rows.some(r=>r.calculate));
  assert(q.rows.some(r=>!r.calculate));
 }
});
