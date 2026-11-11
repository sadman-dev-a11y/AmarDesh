"""Rebuild curated data from the reviewed district register and pinned boundary file.
Source research notes were reviewed on 2026-11-12. No live scraping is required.
"""
import json,pathlib,re,urllib.parse
root=pathlib.Path(__file__).resolve().parents[1]
rows=[s.split('|') for s in (root/'scripts/districts.tsv').read_text().splitlines() if s]
alias={'Barishal':'Barisal','Bogura':'Bogra','Brahmanbaria':'Brahamanbaria','Chattogram':'Chittagong','Cumilla':'Comilla','Jashore':'Jessore','Jhalakathi':'Jhalokati','Moulvibazar':'Maulvibazar','Chapai Nawabganj':'Nawabganj','Netrokona':'Netrakona'}
wiki={'Brahmanbaria':'Brahmanbaria','Chapai Nawabganj':'Nawabganj','Netrokona':'Netrokona'}
extra={
'Dhaka':'https://www.beautifulbangladesh.gov.bd/cat/heritage/4',
'Bandarban':'https://beautifulbangladesh.gov.bd/',
'Feni':'https://feni.gov.bd/pages/tourist-spot',
'Jhalakathi':'https://jhalakathi.gov.bd/pages/tourist-spot',
'Jhenaidah':'https://jhenaidah.gov.bd/pages/tourist-spot',
'Magura':'https://parjatan.gov.bd/pages/static-pages/6922dbd3933eb65569e0ccf9',
'Manikganj':'https://archaeology.gov.bd/pages/static-pages/6922df4b933eb65569e21196',
'Narsingdi':'https://www.narsingdi.gov.bd/en/site/view/tourist_spot',
'Nilphamari':'https://nilphamari.gov.bd/pages/tourist-spot',
'Noakhali':'https://noakhali.gov.bd/pages/static-pages/6990cf2635ce18e1c0719ad9',
'Pabna':'https://archaeology.portal.gov.bd/pages/static-pages/6922dea1933eb65569e1c28b',
'Pirojpur':'https://pirojpur.gov.bd/pages/tourist-spot',
'Sirajganj':'https://rkb.shahjadpur.sirajganj.gov.bd/pages/static-pages/697f6dd735ce18e1c06b1ea9',
'Sunamganj':'https://beautifulbangladesh.gov.bd/district-destination/sunamganj/land-of-rivers/121',
'Sylhet':'https://beautifulbangladesh.gov.bd/cat/landmarks',
'Mymensingh':'https://beautifulbangladesh.gov.bd/cat/landmarks',
'Naogaon':'https://whc.unesco.org/en/list/322/',
'Bagerhat':'https://whc.unesco.org/en/list/321/',
'Khulna':'https://whc.unesco.org/en/list/798/',
"Cox's Bazar":'https://beautifulbangladesh.gov.bd/cat/sea-beaches',
'Chapai Nawabganj':'https://chapainawabganj.gov.bd/pages/tourist-spot'}
years={'Bandarban':1981,'Barishal':1797,'Bogura':1821,'Chattogram':1666,'Dinajpur':1786,'Faridpur':1815,'Jamalpur':1978,'Jashore':1781,'Khulna':1882,'Kushtia':1947,'Mymensingh':1787,'Noakhali':1821,'Pabna':1832,'Patuakhali':1969,'Rajshahi':1772,'Rangamati':1983,'Sylhet':1782,'Tangail':1969}
# These 1984 formations are explicitly recorded in the reviewed Banglapedia articles.
y1984='Bagerhat Barguna Brahmanbaria Chandpur Chuadanga Feni Gaibandha Gazipur Gopalganj Habiganj Jhalakathi Jhenaidah Joypurhat Kishoreganj Kurigram Lakshmipur Lalmonirhat Madaripur Magura Manikganj Moulvibazar Meherpur Munshiganj Naogaon Narail Narayanganj Narsingdi Natore Netrokona Nilphamari Panchagarh Pirojpur Rajbari Satkhira Shariatpur Sherpur Sirajganj Sunamganj Thakurgaon'.split()
for n in y1984:years[n]=1984
foodsource='https://www.bssnews.net/bangla/special-report/307129'
foods={'Bogura':('Sweet yogurt','মিষ্টি দই',foodsource),'Cumilla':('Rasmalai','রসমালাই',foodsource),'Natore':('Kanchagolla','কাঁচাগোল্লা',foodsource),'Tangail':('Porabari Chomchom','পোড়াবাড়ির চমচম','https://tangail.gov.bd/pages/static-pages/6995975d35ce18e1c0786874'),'Mymensingh':('Muktagacha Monda','মুক্তাগাছার মণ্ডা','https://tangail.gov.bd/pages/static-pages/6995975d35ce18e1c0786874')}
# Independently transcribed factual descriptions; no source article text is reproduced.
notes={
'Dhaka':('An unfinished Mughal fort preserves part of Old Dhaka’s architectural story.','পুরান ঢাকার মুঘল স্থাপত্যের স্মৃতি ধরে রেখেছে এই অসমাপ্ত দুর্গ।'),
'Bagerhat':('The historic mosque city is inscribed on UNESCO’s World Heritage List.','ঐতিহাসিক মসজিদের এই শহর ইউনেস্কোর বিশ্ব ঐতিহ্য তালিকাভুক্ত।'),
'Naogaon':('Somapura Mahavihara at Paharpur is a UNESCO-listed Buddhist monastic site.','পাহাড়পুরের সোমপুর মহাবিহার ইউনেস্কো তালিকাভুক্ত বৌদ্ধ প্রত্নস্থান।'),
'Khulna':('Tidal creeks and mangrove islands define the Sundarbans landscape.','জোয়ারভাটার খাঁড়ি ও ম্যানগ্রোভ দ্বীপ সুন্দরবনের ভূদৃশ্য গড়ে তুলেছে।'),
'Rangamati':('Kaptai Lake is a notable water body of the district.','কাপ্তাই হ্রদ এই জেলার উল্লেখযোগ্য জলাশয়।'),
'Sirajganj':('The Shahjadpur estate house is associated with Rabindranath Tagore.','শাহজাদপুরের কাছারিবাড়ি রবীন্দ্রনাথ ঠাকুরের স্মৃতিবিজড়িত।'),
'Sunamganj':('Tanguar Haor is a wetland destination in the northeast.','উত্তর-পূর্বাঞ্চলের জলাভূমি ভ্রমণের একটি গন্তব্য টাঙ্গুয়ার হাওর।'),
'Patuakhali':('Kuakata offers views of both sunrise and sunset over the sea.','কুয়াকাটায় সমুদ্রের ওপর সূর্যোদয় ও সূর্যাস্ত দেখা যায়।'),
'Narsingdi':('Wari and Bateshwar are villages associated with archaeological discoveries.','উয়ারী ও বটেশ্বর গ্রাম প্রত্নতাত্ত্বিক আবিষ্কারের জন্য পরিচিত।')}
catdesc={'heritage':('architecture and archaeological heritage','স্থাপত্য ও প্রত্নতাত্ত্বিক ঐতিহ্য'),'nature':('landscapes and natural places','ভূপ্রকৃতি ও প্রাকৃতিক স্থান'),'culture':('cultural places and local memory','সাংস্কৃতিক স্থান ও স্থানীয় স্মৃতি'),'coast':('coastal and island landscapes','উপকূল ও দ্বীপের ভূদৃশ্য')}
# Culture terms are factual names from each district article, not copied passages.
terms={'baul':('Baul music','বাউল গান'),'bhatiali':('Bhatiyali songs','ভাটিয়ালি গান'),'bhatiyali':('Bhatiyali songs','ভাটিয়ালি গান'),'bhawaiya':('Bhawaiya songs','ভাওয়াইয়া গান'),'jarigan':('Jari songs','জারি গান'),'sarigan':('Sari songs','সারি গান'),'kavigan':('Kabi songs','কবিগান'),'dhamail':('Dhamail songs','ধামাইল গান'),'jatra':('Jatra theatre','যাত্রা'),'maimansingha gitika':('Mymensingh ballads','ময়মনসিংহ গীতিকা'),'nabanna':('Nabanna celebrations','নবান্ন উৎসব')}
geo=json.load(open(root/'public/data/districts.geojson')) if (root/'public/data/districts.geojson').exists() else json.load(open('/tmp/bgd-real.json'))
byname={f['properties'].get('shapeName',f['properties'].get('boundaryName')):f for f in geo['features']}
result=[];features=[]
for name,bn,div,divbn,sight,sightbn,cat,kw in rows:
 boundary=alias.get(name,name); f=byname[boundary]; id=re.sub('[^a-z0-9]+','-',name.lower()).strip('-'); source='https://en.banglapedia.org/index.php?title='+urllib.parse.quote(wiki.get(name,boundary).replace(' ','_')+'_District')
 research=pathlib.Path('/tmp/amardesh-research')/(boundary+'.txt'); txt=research.read_text() if research.exists() else ''; match=re.search('folk culture',txt,re.I); culturetext=txt[match.start():match.start()+1000].lower() if match else ''
 culture=next((v for k,v in terms.items() if k in culturetext),None)
 desc=notes.get(name,(f'{sight} is a starting point for exploring {name}’s {catdesc[cat][0]}.',f'{name if not bn else bn} জেলার {catdesc[cat][1]} আবিষ্কারের একটি গন্তব্য {sightbn}।'))
 year=years.get(name); hist=(f'The district’s administrative formation is recorded in {year}.' if year else f'{name} is one of the districts of {div} division.',f'প্রশাসনিক জেলা হিসেবে গঠনের সাল {year}।' if year else f'{bn} {divbn} বিভাগের একটি জেলা।')
 food=foods.get(name)
 sources=[{'label':'National Portal · district register','url':'https://bangladesh.gov.bd/views/district-list/','reviewed':'2026-11-12'}]
 if txt: sources.append({'label':'Banglapedia · '+wiki.get(name,boundary)+' District','url':source,'reviewed':'2026-11-12'})
 if name in extra:sources.append({'label':'Tourism / heritage reference','url':extra[name],'reviewed':'2026-11-12'})
 if food:sources.append({'label':'Regional food reference','url':food[2],'reviewed':'2026-11-12'})
 props={'id':id,'name':name,'bn':bn,'division':div,'divisionBn':divbn,'boundaryName':boundary,'category':cat,'sight':{'en':sight,'bn':sightbn},'description':dict(zip(['en','bn'],desc)),'history':dict(zip(['en','bn'],hist)),'culture':dict(zip(['en','bn'],culture)) if culture else None,'food':{'en':food[0],'bn':food[1]} if food else None,'sources':sources}
 result.append(props); f['properties']={'shapeName':boundary,'id':id,'name':name,'bn':bn,'division':div,'divisionBn':divbn};f['id']=len(features);features.append(f)
(root/'src/data/districts.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
(root/'public/data/districts.geojson').write_text(json.dumps({'type':'FeatureCollection','features':features},ensure_ascii=False,separators=(',',':')))
print('Built',len(result),'district profiles;',len(set(d['division'] for d in result)),'divisions; culture:',sum(bool(d['culture']) for d in result))
