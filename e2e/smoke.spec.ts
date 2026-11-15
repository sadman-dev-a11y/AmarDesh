import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
for(const lang of ['en','bn']) for(const theme of ['light','dark']) {
 test(`${lang} ${theme}: guide, passport, trip, restore and contrast`,async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(({lang,theme})=>localStorage.getItem('amardesh-v2') || localStorage.setItem('amardesh-v2',JSON.stringify({version:2,lang,theme,district:'dhaka',savedPlaces:[],savedFoods:[],trips:[],visits:{},quiz:[],onboarded:true})),{lang,theme});
  await page.goto('/');await expect(page.locator('.welcome h1')).toBeVisible();
  await page.screenshot({path:`release/screenshots/home-${lang}-${theme}.png`,fullPage:false});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.goto('/#district/dhaka/history');await expect(page.locator('.district-content')).toBeVisible();await page.locator('.visit-button').click();
  await page.goto('/#passport');await expect(page.locator('.passport-map svg path')).toHaveCount(64);await page.screenshot({path:`release/screenshots/passport-${lang}-${theme}.png`,fullPage:true});
  await page.goto('/#place/dhaka--lalbagh-fort');await page.locator('.detail-actions .primary').click();
  await page.goto('/#trips');await expect(page.locator('.checklist')).toBeVisible();await page.locator('.checklist input').first().check();
  await page.reload();await expect(page.locator('.checklist input').first()).toBeChecked();
  await page.goto('/#backup');await expect(page.locator('input[type=file]')).toBeVisible();
  const backup=await page.evaluate(()=>localStorage.getItem('amardesh-v2'));
  await page.locator('input[type=file]').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(backup!)});
  await expect(page.getByRole('dialog')).toBeVisible();await page.locator('[data-dismiss-dialog]').click();
  const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa']).analyze();
  expect(results.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))).toEqual([]);
  expect(errors).toEqual([]);
 });
}
test('offline guides and map remain available after reload',async({page,context})=>{
 await page.goto('/');await expect(page.locator('.welcome h1')).toBeVisible();
 // Block external requests; local packaged assets must suffice.
 await context.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:4173')?route.continue():route.abort());
 await page.goto('/#passport');await expect(page.locator('.passport-map svg path')).toHaveCount(64);
});
