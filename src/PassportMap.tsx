import { useEffect, useState, useMemo } from 'react';
import { useTravel } from './context';
type Feature = { properties: { id:string; name:string; bn:string }; geometry: {type:string; coordinates:number[][][] | number[][][][]} };
const project = ([lng,lat]: number[]) => [(lng-87.8)*100, (26.8-lat)*110];
function path(f: Feature) {
 const polygons = f.geometry.type === 'Polygon' ? [f.geometry.coordinates as number[][][]] : f.geometry.coordinates as number[][][][];
 return polygons.flatMap(p => p.map(r => r.map((xy,i) => `${i?'L':'M'}${project(xy).map(n=>n.toFixed(1)).join(',')}`).join('')+'Z')).join('');
}
export function PassportMap() {
 const {state,go}=useTravel(); const [features,setFeatures]=useState<Feature[]>([]); const [error,setError]=useState(false);
 useEffect(()=>{let active=true;fetch(`${import.meta.env.BASE_URL}data/districts.geojson`).then(r=>{if(!r.ok)throw Error();return r.json();}).then(d=>{if(active)setFeatures(d.features);}).catch(()=>{if(active)setError(true);});return()=>{active=false;};},[]);
 const paths=useMemo(()=>features.map(f=>({...f, outline:path(f)})),[features]);
 const bn=state.lang==='bn';
 return <section className="panel passport-map"><h2>{bn?'আপনার বাংলাদেশ':'Your Bangladesh'}</h2><p>{bn?'সবুজ জেলাগুলো আপনি ঘুরেছেন। মানচিত্রে চাপ দিন অথবা নিচের জেলার বোতাম ব্যবহার করুন।':'Green districts are places you have visited. Tap the map or use the district buttons below.'}</p>{error?<p>{bn?'মানচিত্র লোড হয়নি। নিচের জেলা তালিকা ব্যবহার করুন।':'Map could not load. Use the district list below.'}</p>:<svg viewBox="0 0 500 720" aria-label={bn?'জেলা অনুযায়ী ভ্রমণের মানচিত্র':'District passport map'}>{paths.map(f=><path key={f.properties.id} d={f.outline} fill={state.visits[f.properties.id]?'#247a5e':'#d6dfc7'} stroke="#103f38" strokeWidth=".8" role="button" tabIndex={0} aria-label={bn?f.properties.bn:f.properties.name} onClick={()=>go(`district/${f.properties.id}/history`)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go(`district/${f.properties.id}/history`);}}}><title>{bn?f.properties.bn:f.properties.name}</title></path>)}</svg>}<p className="map-credit">{bn?'আনুমানিক সীমানা; পথনির্দেশ বা আইনি ব্যবহারের জন্য নয়।':'Approximate boundaries; not for navigation or legal use.'} <a href="https://www.geoboundaries.org/" target="_blank" rel="noreferrer">geoBoundaries / BBS / OCHA</a> · <a href="https://creativecommons.org/licenses/by/3.0/igo/" target="_blank" rel="noreferrer">CC BY 3.0 IGO</a></p></section>;
}
