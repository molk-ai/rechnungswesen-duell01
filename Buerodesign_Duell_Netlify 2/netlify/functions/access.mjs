import { getStore } from '@netlify/blobs';
import {createHash, timingSafeEqual} from 'node:crypto';
const KEY='v1/config/arena2';
const res=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const valid=(a,b)=>{
  if(typeof a!=='string'||!a)return false;
  const ha=createHash('sha256').update(a,'utf8').digest();
  const hb=createHash('sha256').update(b,'utf8').digest();
  return timingSafeEqual(ha,hb);
};
export default async function handler(request){
  if(!['GET','POST'].includes(request.method))return res({error:'Methode nicht erlaubt'},405);
  try{
    const store=getStore({name:'buerodesign-duell-classroom-v1',consistency:'strong',region:'eu-central-1'});
    if(request.method==='GET'){
      const value=await store.get(KEY,{type:'json',consistency:'strong'});
      return res({enabled:!!value?.enabled});
    }
    const payload=await request.text();if(payload.length>1000)return res({error:'Anfrage zu groß'},413);
    let body;try{body=JSON.parse(payload)}catch{return res({error:'Ungültige Daten'},400)}
    const secret=process.env.BD_TEACHER_PASSWORD||'FrauMol';
    if(!valid(body.password,secret))return res({error:'Passwort nicht korrekt'},403);
    if(typeof body.enabled!=='boolean')return res({error:'Freigabestatus fehlt'},400);
    await store.setJSON(KEY,{enabled:body.enabled,updatedAt:Date.now()});
    return res({enabled:body.enabled});
  }catch(e){console.error('Lernarena-Freigabe:',e);return res({error:'Freigabestatus vorübergehend nicht verfügbar'},503)}
}
