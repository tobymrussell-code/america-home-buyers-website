import { validateLead, clean, safePage, attributionPage } from '../lead-validation.js';

const ORIGINS = new Set(['https://americahomebuyersnc.com','https://www.americahomebuyersnc.com']);
const HUBSPOT_URL = 'https://api.hsforms.com/submissions/v3/integration/submit/44205664/8e3f6d0d-8f94-41b2-b739-9a7722c56475';
const MAX_BODY = 12288;
function json(data,status,origin) {
  const headers={'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Vary':'Origin'};
  if(ORIGINS.has(origin))Object.assign(headers,{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type'});
  return new Response(JSON.stringify(data),{status,headers});
}
async function boundedText(response,limit=MAX_BODY) {
  const reader=response.body?.getReader();if(!reader)return '';
  const chunks=[];let size=0;
  try {while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>limit){await reader.cancel();throw new Error('body limit');}chunks.push(value);}}
  finally {reader.releaseLock();}
  const out=new Uint8Array(size);let offset=0;for(const c of chunks){out.set(c,offset);offset+=c.length;}return new TextDecoder().decode(out);
}
async function addressLookup(request,origin) {
  let data;try{data=JSON.parse(await boundedText(request));}catch{return json({error:'Check the address.'},400,origin);}
  const address=clean(data.address,250);
  if(address.length<8)return json({matches:[]},200,origin);
  const u=new URL('https://geocoding.geo.census.gov/geocoder/locations/onelineaddress');
  u.search=new URLSearchParams({address,benchmark:'Public_AR_Current',format:'json'}).toString();
  try {
    const r=await fetch(u,{signal:AbortSignal.timeout(7000)});if(!r.ok)throw new Error('lookup');
    const d=JSON.parse(await boundedText(r,150000));
    return json({matches:(d.result?.addressMatches||[]).slice(0,5).map(m=>{
      const a=m.addressComponents||{};
      return {label:m.matchedAddress,street:String(m.matchedAddress||'').split(',')[0],city:a.city,state:a.state,zip:a.zip};
    })},200,origin);
  }catch{return json({error:'Address lookup is unavailable. You can enter the property manually.'},503,origin);}
}
export async function handle(request,env) {
  const origin=request.headers.get('Origin')||'';const url=new URL(request.url);
  if(url.pathname==='/health' && request.method==='GET')return json({service:'ahb-lead-intake',ready:!!env.TURNSTILE_SECRET},200,origin);
  if(!ORIGINS.has(origin))return json({error:'This request is not allowed.'},403,origin);
  if(request.method==='OPTIONS')return json({},200,origin);
  if(request.method!=='POST' || !['/submit','/address'].includes(url.pathname))return json({error:'Not found.'},404,origin);
  if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'Use the website form.'},415,origin);
  if(Number(request.headers.get('Content-Length')||0)>MAX_BODY)return json({error:'The request is too large.'},413,origin);
  if(env.INTAKE_LIMIT){const rate=await env.INTAKE_LIMIT.limit({key:request.headers.get('CF-Connecting-IP')||'unknown'});if(!rate.success)return json({error:'Please wait a minute and try again, or call (336) 701-2230.'},429,origin);}
  if(url.pathname==='/address')return addressLookup(request,origin);
  let d;try{d=JSON.parse(await boundedText(request));if(!d||typeof d!=='object'||Array.isArray(d))throw new Error('schema');}catch{return json({error:'Please check the form and try again.'},400,origin);}
  if(typeof d.companyWebsite!=='string' || d.companyWebsite!=='')return json({error:'We could not verify this request. Please call (336) 701-2230.'},422,origin);
  const {errors,value}=validateLead(d);
  if(Object.keys(errors).length)return json({error:'Please correct the highlighted fields.',errors},422,origin);
  const page=safePage(d.pageUrl);if(!page||page.origin!==origin)return json({error:'Invalid page.'},400,origin);
  const token=d.turnstileToken;
  if(!env.TURNSTILE_SECRET || typeof token!=='string'||!token.length||token.length>2048)return json({error:'Please complete the security check and try again.'},403,origin);
  let verification;
  try {
    const body=new URLSearchParams({secret:env.TURNSTILE_SECRET,response:token});
    const ip=request.headers.get('CF-Connecting-IP');if(ip)body.set('remoteip',ip);
    const r=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body,signal:AbortSignal.timeout(10000)});
    if(!r.ok)throw new Error('verification');verification=JSON.parse(await boundedText(r));
  }catch{return json({error:'The security check is temporarily unavailable. Please try again or call (336) 701-2230.'},503,origin);}
  if(verification.success!==true || verification.action!=='seller_lead' || verification.hostname!==page.hostname)return json({error:'The security check expired or failed. Please try again.'},403,origin);
  const fields=[
    {objectTypeId:'0-1',name:'phone',value:'+1'+value.phone},
    {objectTypeId:'0-1',name:'address',value:[value.street,value.city,value.state,value.zip].filter(Boolean).join(', ')}
  ];
  for(const name of ['firstname','lastname','email'])if(value[name])fields.push({objectTypeId:'0-1',name,value:value[name]});
  const context={pageUri:attributionPage(d.pageUrl,d.attribution),pageName:clean(d.pageName,200)};
  if(typeof d.hutk==='string' && /^[a-f0-9]{32}$/i.test(d.hutk))context.hutk=d.hutk;
  const ip=request.headers.get('CF-Connecting-IP');if(ip)context.ipAddress=ip;
  try {
    const result=await fetch(HUBSPOT_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({submittedAt:String(Date.now()),fields,context}),signal:AbortSignal.timeout(12000)});
    if(!result.ok){
      // No identifiers, phone numbers, addresses, tokens or upstream response bodies are logged.
      console.warn(JSON.stringify({event:'hubspot_rejected',status:result.status}));
      return json({error:'Your request could not be saved. Please try again or call (336) 701-2230.'},502,origin);
    }
    await result.body?.cancel();
    return json({ok:true,submissionId:crypto.randomUUID()},200,origin);
  }catch{return json({error:'We could not confirm delivery. Please call (336) 701-2230 before sending again.'},502,origin);}
}
export default {async fetch(request,env){try{return await handle(request,env);}catch{return json({error:'Please try again or call (336) 701-2230.'},503,request.headers.get('Origin')||'');}}};
