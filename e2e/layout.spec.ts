import {test, expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
const tourism = JSON.parse(readFileSync(new URL('../src/data/tourism.json',import.meta.url),'utf8'));
const sizes = [
 {width:320,height:640,scale:100}, {width:360,height:800,scale:160},
 {width:390,height:844,scale:130}, {width:412,height:915,scale:100},
 {width:320,height:640,scale:200}, {width:768,height:1024,scale:100},
 {width:1280,height:800,scale:100},
];
for(const lang of ['en','bn']) for(const size of sizes) {
 test(`${lang} ${size.width}px ${size.scale}% all screens fit`, async({page})=>{
  test.setTimeout(150000);
  await page.setViewportSize(size);
  await page.addInitScript(({lang})=>{
   if(!localStorage.getItem('amardesh-v2')) localStorage.setItem('amardesh-v2',JSON.stringify({version:2,lang,theme:'dark',district:'dhaka',savedPlaces:[],savedFoods:[],trips:[],visits:{},quiz:[],onboarded:true}));
  },{lang});
  const routes=['home','explore','food','trips','more','essentials','sources','backup','passport','quiz','district/chapainawabganj/history','district/dhaka/guide','place/dhaka--lalbagh-fort',`dish/${tourism.foods[0].id}`];
  for(const route of routes) {
   await page.goto('/#'+route);
   await expect(page.locator('#main')).toBeVisible();
   await page.evaluate(scale=>{
    document.documentElement.style.fontSize=scale+'%';
    document.documentElement.style.setProperty('--safe-area-inset-top','28px');
    document.documentElement.style.setProperty('--safe-area-inset-bottom','24px');
   },size.scale);
   await page.evaluate(()=>document.fonts.ready);
   await expect(page.locator('#main .skeleton-page')).toHaveCount(0);
   const layout=await page.evaluate(()=>{
    const clipped=[...document.querySelectorAll<HTMLElement>('button')].filter(e=>e.offsetWidth>0&&e.scrollWidth>e.clientWidth+2).map(e=>({text:e.textContent,cls:e.className,width:e.clientWidth,scroll:e.scrollWidth}));
    return {width:innerWidth,scroll:document.documentElement.scrollWidth,clipped,overflow:[...document.querySelectorAll<HTMLElement>("#main *,header *")].filter(e=>e.getBoundingClientRect().right>innerWidth+1&&!e.closest(".division-track,.district-chips,.section-tabs")).map(e=>({tag:e.tagName,cls:e.className,text:e.textContent?.slice(0,60)})).slice(0,20)};
   });
   expect(layout.scroll,route+JSON.stringify(layout)).toBeLessThanOrEqual(layout.width+1);
   expect(layout.clipped,route).toEqual([]);
   await page.evaluate(()=>window.scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));
   const footerClear=await page.evaluate(()=>{
    const nav=document.querySelector('.topbar nav')!;
    return getComputedStyle(nav).position!=='fixed'||[...document.querySelectorAll('footer button')].every(b=>b.getBoundingClientRect().bottom<=nav.getBoundingClientRect().top+1);
   });
   expect(footerClear,route+' footer must remain above navigation').toBe(true);
   await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
   if(route==='home') {
    const geometry=await page.evaluate(()=>{
     const box=(s:string)=>document.querySelector(s)!.getBoundingClientRect();
     return {ctaBottom:box('.hero-copy .primary').bottom,statsTop:box('.hero-foot').top,statsBottom:box('.hero-foot').bottom,heroBottom:box('.welcome').bottom};
    });
    expect(geometry.ctaBottom).toBeLessThanOrEqual(geometry.statsTop);
    expect(geometry.statsBottom).toBeLessThanOrEqual(geometry.heroBottom);
    if(size.width===360||size.width===320&&size.scale===200) {
     await page.screenshot({animations:'disabled',path:`release/screenshots/layout-${lang}-${size.width}-${size.scale}-hero.png`});
     await page.locator('.district-chips').scrollIntoViewIfNeeded();
     await page.screenshot({animations:'disabled',path:`release/screenshots/layout-${lang}-${size.width}-${size.scale}-districts.png`});
    }
   }
  }
 });
}
