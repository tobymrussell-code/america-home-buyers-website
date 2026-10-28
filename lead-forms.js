import {STATES,ATTRIBUTION_KEYS,formatPhone,validateLead} from './lead-validation.js?v=20261028-1';

const API='https://forms.americahomebuyersnc.com';
const SITEKEY='0x4AAAAAAFpeaki88iljx53_';
const panels=[...document.querySelectorAll('.ahb-lead-form-host')];
const current=Object.fromEntries(ATTRIBUTION_KEYS.map(k=>[k,new URL(location.href).searchParams.get(k)]).filter(([,v])=>v));
let attribution={};
try {
  attribution=JSON.parse(sessionStorage.getItem('ahb-attribution')||'{}');
  if(Object.keys(current).length){attribution={...attribution,...current};sessionStorage.setItem('ahb-attribution',JSON.stringify(attribution));}
}catch{attribution=current;}

let turnstileReady;
function loadTurnstile(){
  if(!turnstileReady)turnstileReady=new Promise((resolve,reject)=>{
    if(window.turnstile){resolve(window.turnstile);return;}
    const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async=true;script.onload=()=>resolve(window.turnstile);script.onerror=()=>reject(new Error('Security check unavailable. Please reload or call (336) 701-2230.'));document.head.append(script);
  });return turnstileReady;
}
function field(form,name){return form.elements.namedItem(name);}
function errors(form,values){
  for(const name of ['phone','street','city','state','zip','email']){
    const input=field(form,name),error=form.querySelector(`[data-error="${name}"]`);
    input.setCustomValidity(values[name]||'');input.setAttribute('aria-invalid',values[name]?'true':'false');error.textContent=values[name]||'';
  }
}
function cookie(name){const value=document.cookie.split('; ').find(c=>c.startsWith(name+'='));return value?value.slice(name.length+1):'';}
function setup(host,index){
  const prefix='ahb-lead-'+index;
  // Introduced after load, submit is handled by JS, and explicitly opted out of automatic
  // non-HubSpot form collection. The server is the only submission destination.
  const form=document.createElement('form');form.className='ahb-lead-form hs-do-not-collect';form.dataset.hsDoNotCollect='true';
  form.setAttribute('aria-label','Request an as-is offer');form.noValidate=true;
  const input=(name,label,type='text',required=false,autocomplete='off')=>`<div class="ahb-field"><label for="${prefix}-${name}">${label}${required?' *':''}</label><input id="${prefix}-${name}" name="${name}" type="${type}" ${required?'required':''} autocomplete="${autocomplete}" aria-describedby="${prefix}-${name}-error"><span class="ahb-field-error" id="${prefix}-${name}-error" data-error="${name}"></span></div>`;
  form.innerHTML=`<div class="ahb-name-row">${input('firstname','First name','text',false,'given-name')}${input('lastname','Last name','text',false,'family-name')}</div>
    ${input('email','Email (optional)','email',false,'email')}
    ${input('phone','Phone number','tel',true,'tel-national')}
    <p class="ahb-form-help">Property in Thomasville, Lexington, Davidson County, or nearby Triad communities? Enter its location below.</p>
    ${input('street','Property address or parcel / road description','text',true,'off')}
    <button class="ahb-address-lookup" type="button">Look up this address</button>
    <p class="ahb-form-help" data-lookup-status role="status">Include the city and state for a better match, or enter them below. Rural property or vacant land? Manual entry is always available.</p>
    <div data-address-matches></div>
    <div class="ahb-location-row">${input('city','City or nearest town','text',true,'off')}
    <div class="ahb-field"><label for="${prefix}-state">State *</label><select id="${prefix}-state" name="state" required aria-describedby="${prefix}-state-error"><option value="">Choose state</option>${STATES.map(s=>`<option value="${s}">${s}</option>`).join('')}</select><span class="ahb-field-error" id="${prefix}-state-error" data-error="state"></span></div></div>
    ${input('zip','ZIP code (optional)','text',false,'off')}
    <div class="ahb-honeypot" aria-hidden="true"><label for="${prefix}-company">Leave this field empty</label><input id="${prefix}-company" name="companyWebsite" type="text" tabindex="-1" autocomplete="off"></div>
    <div data-turnstile></div><p class="ahb-form-status" role="status" aria-live="polite"></p>
    <button class="button yellow" type="submit">Get My Offer</button>
    <p class="ahb-security-note">Protected by Cloudflare Turnstile. <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener">Privacy</a> · <a href="https://www.cloudflare.com/website-terms/" target="_blank" rel="noopener">Terms</a></p>`;
  host.replaceChildren(form);
  const phone=field(form,'phone');phone.inputMode='tel';phone.maxLength=18;phone.addEventListener('input',()=>{phone.value=formatPhone(phone.value);phone.setCustomValidity('');});
  field(form,'zip').inputMode='numeric';field(form,'zip').maxLength=10;
  for(const name of ['email','phone','street','city','state','zip'])field(form,name).addEventListener('input',()=>{field(form,name).setCustomValidity('');field(form,name).removeAttribute('aria-invalid');form.querySelector(`[data-error="${name}"]`).textContent='';});
  let widgetId,token='',busy=false;
  const status=form.querySelector('.ahb-form-status');
  const submitButton=form.querySelector('[type=submit]');submitButton.disabled=true;submitButton.textContent='Loading security check…';
  loadTurnstile().then(ts=>{
    widgetId=ts.render(form.querySelector('[data-turnstile]'),{sitekey:SITEKEY,action:'seller_lead',callback:v=>{token=v;if(!busy){status.textContent='';submitButton.disabled=false;submitButton.textContent='Get My Offer';}},'expired-callback':()=>{token='';submitButton.disabled=true;submitButton.textContent='Loading security check…';ts.reset(widgetId);},'error-callback':()=>{token='';status.textContent='The security check could not load. Please reload or call (336) 701-2230.';}});
  }).catch(e=>{status.textContent=e.message;});
  const lookup=form.querySelector('.ahb-address-lookup');
  lookup.addEventListener('click',async()=>{
    const address=field(form,'street').value;const lookupStatus=form.querySelector('[data-lookup-status]'),matches=form.querySelector('[data-address-matches]');
    matches.replaceChildren();lookupStatus.textContent='Looking up the address…';lookup.disabled=true;
    try{
      const query=[address,field(form,'city').value,field(form,'state').value,field(form,'zip').value].filter(Boolean).join(', ');
      const r=await fetch(API+'/address',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({address:query}),signal:AbortSignal.timeout(10000)});
      const result=await r.json();if(!r.ok)throw new Error(result.error);
      if(!result.matches?.length){lookupStatus.textContent='No match found. You can still submit: enter the property description, city or nearest town, and state below.';return;}
      lookupStatus.textContent='Choose the matching property. If none is right, keep your manual entry.';
      for(const m of result.matches){const button=document.createElement('button');button.type='button';button.className='ahb-address-match';button.textContent=m.label;button.addEventListener('click',()=>{for(const key of ['street','city','state','zip'])field(form,key).value=m[key]||'';matches.replaceChildren();lookupStatus.textContent='Address selected. Check the details below before submitting.';});matches.append(button);}
    }catch{lookupStatus.textContent='Address lookup is unavailable. You can still enter the property manually below.';}finally{lookup.disabled=false;}
  });
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(busy)return;
    const values=Object.fromEntries(new FormData(form));const result=validateLead(values);errors(form,result.errors);
    if(Object.keys(result.errors).length){status.textContent='Please correct the highlighted fields.';form.reportValidity();return;}
    if(!token){status.textContent='The security check is still loading. Please wait, reload, or call (336) 701-2230.';return;}
    busy=true;const submit=form.querySelector('[type=submit]');submit.disabled=true;submit.textContent='Sending…';status.textContent='Sending your property details…';
    try{
      const response=await fetch(API+'/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...values,turnstileToken:token,pageUrl:location.href,pageName:document.title,attribution,hutk:cookie('hubspotutk')}),signal:AbortSignal.timeout(26000)});
      const data=await response.json();if(!response.ok){errors(form,data.errors||{});throw new Error(data.error||'Please try again or call (336) 701-2230.');}
      if(data.ok!==true||!data.submissionId)throw new Error('We could not confirm delivery. Please call (336) 701-2230.');
      status.textContent='Your property details were received. Thank you!';
      window.dispatchEvent(new CustomEvent('ahb:lead-confirmed',{detail:{submissionId:data.submissionId,email:values.email,phone:result.value.phone}}));
      setTimeout(()=>location.assign('/thank-you.html'),700);
    }catch(e){status.textContent=e.name==='TimeoutError'?'We could not confirm delivery. Please call (336) 701-2230 before sending again.':e.message;busy=false;submit.disabled=false;submit.textContent='Get My Offer';}
    finally{token='';if(widgetId!==undefined&&window.turnstile)window.turnstile.reset(widgetId);}
  });
}
panels.forEach(setup);
