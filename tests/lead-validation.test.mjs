import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizePhone,formatPhone,validateLead,attributionPage} from '../lead-validation.js';
import {handle} from '../server/lead-worker.js';
const good={firstname:'Website',lastname:'QA',phone:'3367012230',street:'Land on Forest Drive',city:'Thomasville',state:'NC',companyWebsite:'',pageUrl:'https://americahomebuyersnc.com/contact.html',turnstileToken:'fresh-token'};
test('reject placeholders, repeats, non-US numbers and incorrect length',()=>{
  for(const p of ['5551234567','0000000000','1111111111','3365551234','3361111111','1234567890','4162345678','336701223','336701223012'])assert.equal(normalizePhone(p),'',p);
  assert.equal(normalizePhone('+1 (336) 701-2230'),'3367012230');
  assert.equal(formatPhone('3367012230'),'(336) 701-2230');
});
test('manual rural and vacant land accepted, city and state required',()=>{
  assert.deepEqual(validateLead(good).errors,{});
  for(const street of ['123 Main St','Test Address','fake address'])assert.ok(validateLead({...good,street}).errors.street,street);
  assert.ok(validateLead({...good,city:''}).errors.city);
  assert.ok(validateLead({...good,state:''}).errors.state);
  assert.deepEqual(validateLead({...good,street:'Parcel 12 on County Road 8',zip:''}).errors,{});
});
test('attribution retains allowed campaign IDs and removes unknown query data',()=>{
  const u=attributionPage(good.pageUrl+'?email=private@example.org&utm_source=google&gclid=click-id',{utm_campaign:'as-is'});
  assert.match(u,/utm_campaign=as-is/);assert.match(u,/utm_source=google/);assert.match(u,/gclid=click-id/);assert.ok(!u.includes('email'));
  assert.equal(attributionPage('https://attacker.example/'),null);
});
function req(body=good,origin='https://americahomebuyersnc.com'){return new Request('https://forms.americahomebuyersnc.com/submit',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)});}
test('invalid requests never reach HubSpot',async()=>{
  const original=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;throw new Error('must not call');};
  try{
    for(const [data,status] of [[{...good,phone:'0000000000'},422],[{...good,street:'Test Address'},422],[{...good,companyWebsite:'spam'},422],[{...good,city:''},422],[{...good,turnstileToken:''},403]])assert.equal((await handle(req(data),{TURNSTILE_SECRET:'test-secret'})).status,status);
    assert.equal((await handle(req(good,'https://attacker.example'),{TURNSTILE_SECRET:'test-secret'})).status,403);
    assert.equal(calls,0);
  }finally{globalThis.fetch=original;}
});
test('server checks action and hostname, fails closed on token replay and outage',async()=>{
  const original=globalThis.fetch;
  try{
    for(const result of [{success:false},{success:true,action:'other',hostname:'americahomebuyersnc.com'},{success:true,action:'seller_lead',hostname:'localhost'},{success:true,action:'seller_lead',hostname:'attacker.example'}]){
      let calls=0;globalThis.fetch=async()=>{calls++;return Response.json(result);};assert.equal((await handle(req(),{TURNSTILE_SECRET:'test-secret'})).status,403);assert.equal(calls,1);
    }
    globalThis.fetch=async()=>{throw new Error('unavailable');};assert.equal((await handle(req(),{TURNSTILE_SECRET:'test-secret'})).status,503);
  }finally{globalThis.fetch=original;}
});
test('every form page uses the same successful server path with attribution',async()=>{
  const {readFileSync,readdirSync}=await import('node:fs');const {join}=await import('node:path');
  function files(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()&&!['.git','assets','dist','tests','server'].includes(e.name)?files(join(dir,e.name)):e.isFile()&&e.name.endsWith('.html')?[join(dir,e.name)]:[]);}
  const pages=files('.').filter(p=>readFileSync(p,'utf8').includes('data-form-id="8e3f6d0d-8f94-41b2-b739-9a7722c56475"')||readFileSync(p,'utf8').includes('ahb-lead-form-host'));
  assert.ok(pages.length>=12);const original=globalThis.fetch;
  try{
    for(const page of pages){let payload;
      globalThis.fetch=async(url,options)=>{
        if(String(url).includes('siteverify'))return Response.json({success:true,action:'seller_lead',hostname:'americahomebuyersnc.com'});
        payload=JSON.parse(options.body);return Response.json({inlineMessage:'Thank you'});
      };
      const r=await handle(req({...good,pageUrl:'https://americahomebuyersnc.com/'+page.replace(/^\.\//,''),attribution:{utm_source:'qa',utm_campaign:'validation'},hutk:'a'.repeat(32)}),{TURNSTILE_SECRET:'test-secret'});
      assert.equal(r.status,200,page);assert.equal((await r.json()).ok,true);assert.match(payload.context.pageUri,/utm_campaign=validation/);assert.equal(payload.context.hutk,'a'.repeat(32));assert.equal(payload.fields.find(f=>f.name==='phone').value,'+13367012230');assert.match(payload.fields.find(f=>f.name==='address').value,/Thomasville, NC/);
    }
  }finally{globalThis.fetch=original;}
});
