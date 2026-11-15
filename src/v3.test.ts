// @vitest-environment jsdom
import {beforeEach, expect, it, vi} from 'vitest';
const pref=vi.hoisted(()=>({get:vi.fn(),set:vi.fn()}));
vi.mock('@capacitor/preferences',()=>({Preferences:pref}));
import {readPersistent, savePersistent, validateBackup} from './native';
import {initialState, searchAll, parseState} from './tourism';
import {empty} from './model';
import {formatNumber,formatDate} from './format';
import {makeQuestion} from './Quiz';
import {distanceKm} from './geo';
beforeEach(()=>{localStorage.clear();pref.get.mockReset();pref.set.mockReset();});
it('migrates v1 with trip, note and passport and retains the old key',async()=>{
 const v1={...structuredClone(empty),visits:{dhaka:{date:'2026-11-12',note:'Family visit'}},trip:{...empty.trip,name:'Actual legacy shape',stops:[{id:'dhaka',day:2,notes:'Fort'}],food:500}};
 localStorage.setItem('amardesh-v1',JSON.stringify(v1));let value:string|null=null;
 pref.get.mockImplementation(async()=>({value}));pref.set.mockImplementation(async(o:{value:string})=>{value=o.value;});
 const s=await readPersistent();expect(s.visits.dhaka.note).toBe('Family visit');expect(s.trips[0].stops[0].id).toBe('dhaka--lalbagh-fort');expect(localStorage.getItem('amardesh-v1')).not.toBeNull();expect(JSON.parse(value!)).toEqual(s);
});
it('does not replace v2 or silently initialize when migration fails',async()=>{
 const v2={...initialState(),visits:{dhaka:{date:'2026-11-12',note:'Keep me'}}};localStorage.setItem('amardesh-v2',JSON.stringify(v2));pref.get.mockResolvedValue({value:null});pref.set.mockRejectedValue(Error('full'));
 await expect(readPersistent()).rejects.toThrow('full');expect(JSON.parse(localStorage.getItem('amardesh-v2')!)).toEqual(v2);
});
it('does not overwrite corrupt durable state',async()=>{pref.get.mockResolvedValue({value:'bad JSON'});await expect(readPersistent()).rejects.toThrow();expect(pref.set).not.toHaveBeenCalled();});
it('serializes rapid writes in user edit order',async()=>{const states:string[]=[];pref.set.mockImplementation(async({value}:{value:string})=>{await new Promise(r=>setTimeout(r,2));states.push(JSON.parse(value).district);});await Promise.all([savePersistent({...initialState(),district:'dhaka'}),savePersistent({...initialState(),district:'sylhet'})]);expect(states).toEqual(['dhaka','sylhet']);});
it('validates restore shape, caps input and preserves optional new state',()=>{expect(()=>validateBackup('{"version":2}')).toThrow();expect(()=>validateBackup('x'.repeat(5_000_001))).toThrow();const s={...initialState(),onboarded:true,learning:{date:'2026-11-15',streak:3}};expect(validateBackup(JSON.stringify(s))).toEqual(s);expect(parseState({...s,learning:{date:'invalid',streak:3}}).learning).toBeUndefined();});
it('formats Bangla numbers and dates without Latin digits',()=>{expect(formatNumber(1984,'bn')).toBe('১,৯৮৪');expect(formatNumber(3,'en')).toBe('3');expect(formatDate('2026-11-15','bn')).not.toMatch(/[0-9]/);});
it('matches common spellings and small typos with filters',()=>{for(const q of ['Comilla','Kumilla','cumila'])expect(searchAll(q,'Chattogram','district').some(x=>x.id==='cumilla')).toBe(true);expect(searchAll('cumila','Sylhet','district')).toEqual([]);expect(searchAll('অজানাশব্দ')).toEqual([]);});
it('generates four valid question types without ambiguous options',()=>{const types=new Set();for(let i=0;i<128;i++){const q=makeQuestion(i);types.add(q.type);expect(q.options).toHaveLength(4);expect(new Set(q.options).size).toBe(4);expect(q.options.filter(v=>v===q.answer)).toHaveLength(1);if(q.type===2)expect(q.options.filter(id=>q.food.regions.includes(id))).toHaveLength(1);}expect(types.size).toBe(4);});
it('calculates straight-line distance symmetrically and zero for equal points',()=>{const a={lat:23,lng:90},b={lat:24,lng:90};expect(distanceKm(a,a)).toBe(0);expect(distanceKm(a,b)).toBeCloseTo(111.195,2);expect(distanceKm(a,b)).toBe(distanceKm(b,a));});
