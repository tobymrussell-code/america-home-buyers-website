const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { webcrypto, createHash } = require('node:crypto');
const source = fs.readFileSync(new URL('../script.js', `file://${__filename}`), 'utf8');
const formId = '8e3f6d0d-8f94-41b2-b739-9a7722c56475';
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

function harness({ path = '/', gpc = false, fields, brokenPixel = false } = {}) {
  const events = new Map();
  const scripts = [];
  const redirects = [];
  const redirectTimers = [];
  const window = {
    location: { pathname: path, assign: url => redirects.push(url) },
    crypto: webcrypto,
    addEventListener: (type, callback) => events.set(type, callback),
    setTimeout: (callback, ms) => {
      if (ms === 700) { redirectTimers.push(callback); return { redirect: true }; }
      return setTimeout(callback, ms);
    },
    clearTimeout: timer => { if (!timer?.redirect) clearTimeout(timer); },
    HubSpotFormsV4: {
      getFormFromEvent: event => ({
        getConversionId: () => event.detail.conversionId,
        getFieldValue: async name => fields ? fields(name) : ({
          '0-1/email': '  SAMPLE@EXAMPLE.COM ',
          '0-1/phone': '+1 (336) 555-0100'
        }[name])
      })
    }
  };
  if (brokenPixel) window.oaiq = () => { throw Error('Blocked SDK'); };
  const document = {
    head: { appendChild: script => scripts.push(script) },
    createElement: () => ({}),
    addEventListener: () => {}
  };
  vm.runInNewContext(source, { window, document, navigator: { globalPrivacyControl: gpc }, TextEncoder, Uint8Array, Set });
  const consent = value => window._hsp[0][1](value);
  const emit = (type, detail) => events.get(type)?.({ detail });
  const success = (conversionId = 'sample-conversion') => emit('hs-form-event:on-submission:success', {
    formId, instanceId: 'sample-instance', conversionId
  });
  const calls = () => (window.oaiq?.q || []).map(args => Array.from(args));
  const leads = () => calls().filter(args => args[0] === 'measure' && args[1] === 'lead_created');
  const gaLeads = () => window.dataLayer.filter(args => args[0] === 'event' && args[1] === 'generate_lead');
  return { window, scripts, redirects, redirectTimers, consent, emit, success, calls, leads, gaLeads };
}

(async () => {
  const h = harness();
  assert.equal(h.scripts.length, 1, 'No pixel loads before the consent decision');
  h.consent({ allowed: true });
  h.consent({ allowed: true });
  assert.equal(h.scripts.filter(s => s.src.includes('oaiq.min.js')).length, 1);
  assert.equal(h.calls().filter(a => a[0] === 'init' && a[1].pixelId).length, 1);
  assert.equal(h.calls().filter(a => a[1] === 'page_viewed').length, 1);
  h.emit('hs-form-event:on-submission:failed', { formId });
  h.emit('hs-form-event:on-submission:success', { formId: 'another-form', instanceId: 'other' });
  assert.equal(h.gaLeads().length, 0, 'Failed/unrelated forms are not leads');
  h.success();
  h.success();
  await pause(20);
  assert.equal(h.leads().length, 1, 'Duplicate successful callbacks count once');
  assert.equal(h.gaLeads().length, 1);
  assert.equal(h.leads()[0][2].type, 'customer_action');
  assert.equal(h.leads()[0][3].event_id, 'sample-conversion');
  assert.equal(h.leads()[0][3].opt_out, true);
  const user = h.calls().find(a => a[0] === 'init' && a[1].user)[1].user;
  assert.equal(user.email_sha256, createHash('sha256').update('sample@example.com').digest('hex'));
  assert.equal(user.phone_number_sha256, createHash('sha256').update('13365550100').digest('hex'));
  assert(!JSON.stringify(h.calls()).includes('SAMPLE@EXAMPLE.COM'));
  assert(!JSON.stringify(h.calls()).includes('555-0100'));
  h.redirectTimers.forEach(callback => callback());
  assert.deepEqual(h.redirects, ['/thank-you.html']);
  h.success('sample-second-conversion');
  await pause(20);
  assert.equal(h.leads().length, 2, 'Distinct confirmed conversions remain distinct');

  const denied = harness();
  denied.consent({ allowed: true, categories: { advertisement: false } });
  denied.success();
  await pause(10);
  assert.equal(denied.leads().length, 0, 'Category denial overrides overall consent');
  assert.equal(denied.scripts.length, 1);
  assert.equal(denied.redirectTimers.length, 1);

  const gpc = harness({ gpc: true });
  gpc.consent({ allowed: true });
  assert.equal(gpc.scripts.length, 1, 'Global Privacy Control prevents pixel loading');

  const thankYou = harness({ path: '/thank-you.html' });
  thankYou.consent({ allowed: true });
  assert.equal(thankYou.leads().length, 0, 'Direct thank-you visits never create leads');

  const unavailable = harness({ fields: () => { throw Error('Unavailable form fields'); } });
  unavailable.consent({ allowed: true });
  unavailable.success();
  await pause(10);
  assert.equal(unavailable.leads().length, 1, 'Optional matching failure does not lose the lead');

  const slow = harness({ fields: () => new Promise(() => {}) });
  slow.consent({ allowed: true });
  slow.success();
  await pause(280);
  assert.equal(slow.leads().length, 1, 'Slow matching has a bounded wait');

  const withdrawn = harness({ fields: () => new Promise(() => {}) });
  withdrawn.consent({ allowed: true });
  withdrawn.success();
  withdrawn.consent({ allowed: false });
  await pause(280);
  assert.equal(withdrawn.leads().length, 0, 'Consent withdrawal suppresses pending measurement');

  const broken = harness({ brokenPixel: true });
  broken.consent({ allowed: true });
  broken.success();
  await pause(10);
  broken.redirectTimers.forEach(callback => callback());
  assert.deepEqual(broken.redirects, ['/thank-you.html'], 'SDK failure does not break the success redirect');
  console.log('PASS: consent, GPC, page views, confirmed submissions, duplicate prevention, matching hashes, timeout, failure isolation, and thank-you behavior. All values are synthetic; no network events or CRM submissions were sent.');
})().catch(error => { console.error(error); process.exitCode = 1; });
