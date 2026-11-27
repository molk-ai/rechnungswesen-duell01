import { getStore } from '@netlify/blobs';
import { createGameHandler } from './game-core.mjs';

// A site-wide store: every iPad accessing the same Netlify site sees the same room.
// Strong reads are needed for classroom scoreboard updates and to honor an exact 10-minute finish.
const handler = createGameHandler(() => getStore({name:'buerodesign-duell-classroom-v1',consistency:'strong',region:'eu-central-1'}));
export default async function game(req){
  try { return await handler(req); }
  catch (error){console.error('Buerodesign Duell server error:', error);
    return new Response(JSON.stringify({error:'Netlify konnte die Daten nicht laden. Bitte erneut versuchen.'}),{
      status:503,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
  }
}
