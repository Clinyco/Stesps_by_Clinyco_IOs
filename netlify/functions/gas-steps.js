export async function handler(event){
  const deal = event.queryStringParameters.deal_id || '';
  const key  = event.queryStringParameters.key || 'preoperatorio-v1';
  const GAS_BASE = process.env.https://https://script.google.com/macros/s/AKfycbzlvP3lGBviiQvRi3wFiKz0FnnKhoY1n11YUnA3av9KfYFvvFrgqCZV6__1CqKB4rhx/exec
  const url = `${GAS_BASE}?api=1&action=listPublished&key=${encodeURIComponent(key)}&deal_id=${encodeURIComponent(deal)}`;
  try{
    const resp = await fetch(url);
    const text = await resp.text();
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
      body: text
    };
  } catch(err){
    return { statusCode: 502, body: JSON.stringify({ error:'Proxy failed', detail:String(err) }) };
  }
}
