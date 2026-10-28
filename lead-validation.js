// US numbering-plan patterns from libphonenumber-js 1.13.15 (MIT); includes US territories.
export const US_PHONE = new RegExp("^(?:(?:983[2-57-9]\\d{6}|(?:2(?:0[1-35-9]|1[02-9]|2[03-57-9]|3[1459]|4[08]|5[1-46]|6[0279]|7[02469]|8[13])|3(?:0[1-57-9]|1[02-9]|2[013-79]|3[0-24679]|4[167]|5[0-3]|6[01349]|8[056])|4(?:0[124-9]|1[02-579]|2[3-5]|3[0245]|4[023578]|58|6[349]|7[02589]|8[04])|5(?:0[1-57-9]|1[0235-8]|20|3[0149]|4[01]|5[179]|6[1-47]|7[0-5]|8[0256])|6(?:0[1-35-9]|1[024-9]|2[03689]|3[016]|4[0156]|5[01679]|6[0-279]|78|8[0-269])|7(?:0[1-46-8]|1[2-9]|2[04-8]|3[0-2478]|4[0378]|5[47]|6[02359]|7[0-59]|8[156])|8(?:0[1-68]|1[02-8]|2[0168]|3[0-2589]|4[03578]|5[046-9]|6[02-5]|7[028])|9(?:0[1346-9]|1[02-9]|2[0589]|3[0146-8]|4[01357-9]|5[12469]|7[0-3589]|8[04-69]))[2-9]\\d{6})|(?:)|(?:8(?:00|33|44|55|66|77|88)[2-9]\\d{6})|(?:900[2-9]\\d{6})|(?:52(?:3(?:[2-46-9][02-9]\\d|5(?:[02-46-9]\\d|5[0-46-9]))|4(?:[2-478][02-9]\\d|5(?:[034]\\d|2[024-9]|5[0-46-9])|6(?:0[1-9]|[2-9]\\d)|9(?:[05-9]\\d|2[0-5]|49)))\\d{4}|52[34][2-9]1[02-9]\\d{4}|5(?:00|2[125-9]|3[23]|44|66|77|88)[2-9]\\d{6})|(?:(?:787|939)[2-9]\\d{6})|(?:340(?:2(?:0\\d|10|2[06-8]|4[49]|77)|3(?:32|44)|4(?:2[23]|44|7[34]|89)|5(?:1[34]|55)|6(?:2[56]|4[23]|77|9[023])|7(?:1[2-57-9]|2[57]|7\\d)|884|998)\\d{4})|(?:671(?:2\\d\\d|3(?:00|3[39]|4[349]|55|6[26])|4(?:00|56|7[1-9]|8[02-9])|5(?:55|6[2-5]|88)|6(?:3[2-578]|4[24-9]|5[34]|78|8[235-9])|7(?:[0479]7|2[0167]|3[45]|8[7-9])|8(?:[2-57-9]8|6[478])|9(?:2[29]|6[79]|7[1279]|8[7-9]|9[16-9]))\\d{4})|(?:670(?:2(?:3[3-7]|56|8[4-8])|32[1-38]|4(?:33|8[348])|5(?:32|55|88)|6(?:64|70|82)|78[3589]|8[3-9]8|989)\\d{4})|(?:684(?:274|6(?:22|33|44|55|77|88|9[19]))\\d{4})|(?:684(?:2(?:48|5[2468]|7[246])|7(?:3[13]|70|82))\\d{4}))$");
export const STATES = 'AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY AS GU MP PR VI'.split(' ');
export const ATTRIBUTION_KEYS = ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','utm_id','gclid','gbraid','wbraid','msclkid','fbclid','ttclid','oppref'];
export function normalizePhone(raw) {
  if (typeof raw !== 'string' || /[^\d\s()+.\-]/.test(raw)) return '';
  let n=raw.replace(/\D/g,'');
  if (n.length===11 && n[0]==='1') n=n.slice(1);
  if (n.length!==10 || !US_PHONE.test(n) || n.slice(3,6)==='555' || /^(\d)\1{9}$/.test(n) || /^(\d)\1{6}$/.test(n.slice(3)) || ['1234567890','0123456789','9876543210'].includes(n)) return '';
  return n;
}
export function formatPhone(raw) {
  let n=String(raw).replace(/\D/g,'');
  if(n.length===11 && n[0]==='1')n=n.slice(1);
  n=n.slice(0,10);
  if(n.length<4)return n;
  if(n.length<7)return '('+n.slice(0,3)+') '+n.slice(3);
  return '('+n.slice(0,3)+') '+n.slice(3,6)+'-'+n.slice(6);
}
export function clean(value,max=150) {
  return typeof value==='string' ? value.trim().replace(/\s+/g,' ').slice(0,max) : '';
}
export function validateLead(d) {
  const errors={}; const phone=normalizePhone(d.phone);
  if(!phone)errors.phone='Enter a valid 10-digit U.S. phone number. Placeholder numbers cannot be used.';
  const street=clean(d.street,200),city=clean(d.city,100),state=clean(d.state,100).toUpperCase(),zip=clean(d.zip,10);
  const simple=street.toLowerCase().replace(/[^a-z0-9]/g,'');
  if(street.length<4 || !/[a-z]/i.test(street) || /^(test|fake|sample|dummy|placeholder|example)(address|property|house)?\d*$/i.test(simple) || /^123main(st|street)?(apt\d+)?$/i.test(simple)) errors.street='Enter the real property address, road name, or parcel description.';
  if(city.length<2 || !/[a-z]/i.test(city) || /^(test|fake|dummy|sample)$/i.test(city))errors.city='Enter the city or nearest town.';
  if(!STATES.includes(state))errors.state='Choose the property state.';
  if(zip && !/^\d{5}(-\d{4})?$/.test(zip))errors.zip='Use a 5-digit ZIP code, or leave it blank.';
  const email=clean(d.email,254);
  if(email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))errors.email='Check the email address, or leave it blank.';
  return {errors,value:{firstname:clean(d.firstname,80),lastname:clean(d.lastname,80),email,phone,street,city,state,zip}};
}
export function safePage(raw) {
  try {const u=new URL(raw);if(u.protocol!=='https:' || !['americahomebuyersnc.com','www.americahomebuyersnc.com'].includes(u.hostname) || u.port || u.username || u.password)return null;return u;}catch{return null;}
}
export function attributionPage(raw,attribution={}) {
  const u=safePage(raw);if(!u)return null;
  const q=new URLSearchParams();
  for(const key of ATTRIBUTION_KEYS){const v=clean(attribution[key] || u.searchParams.get(key),250);if(v)q.set(key,v);}
  u.search=q.toString();u.hash='';return u.href;
}
