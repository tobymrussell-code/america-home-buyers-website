from pathlib import Path
from bs4 import BeautifulSoup
from urllib.parse import urljoin,urlsplit,unquote
import json,collections,xml.etree.ElementTree as ET
base='https://americahomebuyersnc.com/';titles=set();descs=set();urls=set();counts=collections.Counter()
def nodes(v):
 if isinstance(v,dict):
  yield v
  for x in v.values():yield from nodes(x)
 elif isinstance(v,list):
  for x in v:yield from nodes(x)
for p in Path('dist').rglob('*.html'):
 s=BeautifulSoup(p.read_text(),'html.parser')
 if p.name in ['404.html','thank-you.html']:continue
 if s.find('meta',attrs={'name':'robots','content':'noindex,nofollow'}):continue
 can=s.find('link',rel='canonical');assert can,p;url=can['href'];urls.add(url)
 assert url.startswith(base),p
 title=s.title.get_text();desc=s.find('meta',attrs={'name':'description'})['content'];assert title not in titles,(p,'title');assert desc not in descs,(p,'description');titles.add(title);descs.add(desc)
 data=[n for t in s.select('script[type="application/ld+json"]') for n in nodes(json.loads(t.string))];types=[n.get('@type') for n in data];counts.update(t for t in types if isinstance(t,str))
 qas=[{'@type':'Question','name':d.summary.get_text(' ',strip=True),'acceptedAnswer':{'@type':'Answer','text':d.p.get_text(' ',strip=True)}} for d in s.select('.faq details') if d.summary and d.p]
 faq=[n for n in data if n.get('@type')=='FAQPage'];assert len(faq)<=1,p
 if qas:assert faq[0]['mainEntity']==qas,p
 for tag in s.select('[href],[src]'):
  dest=urlsplit(urljoin(url,tag.get('href',tag.get('src',''))))
  if dest.hostname!='americahomebuyersnc.com':continue
  path=Path('dist')/unquote(dest.path).lstrip('/');path=path/'index.html' if path.is_dir() else path
  assert path.exists(),(p,dest.path)
 if 'ahb-lead-form-host' in str(s):assert s.select_one('script[src*="lead-forms.js"]'),p
mapped={n.text for n in ET.parse('sitemap.xml').iter() if n.tag.endswith('}loc')};assert urls==mapped,(urls-mapped,mapped-urls)
print(json.dumps({'pages':len(urls),'schema_counts':counts,'result':'PASS — JSON-LD, visible FAQs, titles, descriptions, internal paths, canonicals, sitemap and form scripts'},indent=2))
