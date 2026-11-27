/* Einheitliche und fehlertolerante Euro-Eingabe für alle Lernarenen.
   Akzeptiert deutsche und internationale Tausender-/Dezimaltrennzeichen. */
(function (root) {
 'use strict';
 function parseEuro(raw) {
  let text=String(raw??'').trim().replace(/[\s\u00a0\u202f€]/g,'').replace(/[’']/g,'');
  if(!text||!/^[0-9.,]+$/.test(text))return null;
  const dot=text.lastIndexOf('.'),comma=text.lastIndexOf(',');
  let whole=text,fraction='';
  if(dot>=0&&comma>=0){
   const decimal=dot>comma?'.':',';
   const pos=text.lastIndexOf(decimal);
   whole=text.slice(0,pos);fraction=text.slice(pos+1);
   if(!/^\d{1,2}$/.test(fraction))return null;
  }else if(dot>=0||comma>=0){
   const symbol=dot>=0?'.':',';
   const sections=text.split(symbol);
   if(sections.some(x=>!x))return null;
   if(sections.length===2&&sections[1].length<=2){whole=sections[0];fraction=sections[1];}
   else{whole=text;}
  }
  if(!/^(?:\d+|\d{1,3}(?:[.,]\d{3})+)$/.test(whole))return null;
  if(whole.includes('.')&&whole.includes(','))return null;
  if(fraction&&!/^\d{1,2}$/.test(fraction))return null;
  const units=Number(whole.replace(/[.,]/g,''));
  if(!Number.isSafeInteger(units))return null;
  const cents=Number(fraction.padEnd(2,'0'))||0;
  const result=units+cents/100;
  return Number.isFinite(result)&&Number.isSafeInteger(Math.round(result*100))?result:null;
 }
 function parseWholeEuro(raw) {
  const n=parseEuro(raw);
  return n!==null&&Number.isSafeInteger(n)?n:null;
 }
 root.BD_AMOUNTS=Object.freeze({parseEuro,parseWholeEuro});
})(typeof window!=='undefined'?window:globalThis);
