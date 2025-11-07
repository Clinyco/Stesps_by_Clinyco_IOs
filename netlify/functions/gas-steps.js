export async function handler(event){
  const key = event.queryStringParameters.key || 'client-onboarding-v1';
  const GAS_BASE = process.env.GAS_WEBAPP_BASE_URL; https://script.google.com/macros/s/AKfycbxlVy81nqAgA88zgGbiDAkW5mQhEev-UWMWsgRwxZ5YkAhP9xGMpvi3HVr715OwFADi/exec
  const url = `${GAS_BASE}?api=1&action=listPublished&key=${encodeURIComponent(key)}`;
  try{
    const resp = await fetch(url);
    const text = await resp.text();
    return {
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
        'access-control-allow-origin': '*'
      },
      body: text
    };
  } catch(err){
    return { statusCode: 502, body: JSON.stringify({ error:'Proxy failed', detail:String(err) }) };
  }
}
