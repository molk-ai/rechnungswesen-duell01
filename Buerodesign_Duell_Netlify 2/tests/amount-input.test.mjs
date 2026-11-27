import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { BANK } from '../shared/questions.mjs';
import { ARENA2_BANK } from '../shared/arena2-questions.mjs';
const root={};
vm.runInNewContext(fs.readFileSync(new URL('../public/amounts.js',import.meta.url),'utf8'),{window:root});
const {parseEuro,parseWholeEuro}=root.BD_AMOUNTS;
const validCases={'2250':2250,'2.250':2250,'2.250,00':2250,'2250,00':2250,'2,250':2250,'2,250.00':2250,'2250.00':2250,'2 250 €':2250,'€2.250,00':2250,'2\u202f250,00':2250,"2'250,00":2250,'0':0,'1.000.000':1_000_000,'1,000,000.00':1_000_000};
test('Zahleneingabe akzeptiert alle üblichen deutschen und internationalen Schreibweisen',()=>{
 for(const [s,want] of Object.entries(validCases)){
  assert.equal(parseEuro(s),want,`Euro-Wert ${s}`);
  assert.equal(parseWholeEuro(s),want,`Ganzzahliger Euro-Wert ${s}`);
 }
 for(const bad of ['', '  ', '2+2', '2x250', '2.25.0','abc','-100','1.20.3','1,2,3','1e3'])assert.equal(parseEuro(bad),null,`Ungültige Eingabe: ${bad}`);
 assert.equal(parseEuro('1.234,56'),1234.56);
 assert.equal(parseEuro('1,234.56'),1234.56);
 assert.equal(parseWholeEuro('1.234,56'),null);
});
test('Alle 233 Rechenaufgaben akzeptieren richtige Antworten in sechs Formaten',()=>{
 const numbers=[...BANK.questions,...ARENA2_BANK.questions].filter(q=>q.kind==='number');
 assert.equal(numbers.length,233);
 for(const q of numbers){
  const want=q.answer;
  const de=want.toLocaleString('de-DE');
  const en=want.toLocaleString('en-US');
  for(const input of [String(want),de,`${de},00`,`${de} €`,en,`${en}.00`]){
   assert.equal(parseWholeEuro(input),want,`${q.id} Eingabe ${input} sollte ${want} sein`);
  }
 }
});
test('Alle 76 Arena-2-Rechenfragen zeigen deutsche Tausendertrennzeichen',()=>{
 for(const q of ARENA2_BANK.questions.filter(q=>q.kind==='number')){
  for(const field of ['question','explanation'])assert.doesNotMatch(q[field],/(?<![\d.,])\d{1,3}(?:,\d{3})+(?=\s*€)/,`${q.id} ${field}`);
 }
});
