import { useState } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { useTravel } from './context';
import { districts, divisions } from './tourism';
import { formatNumber } from './format';
import { native } from './native';
export function ProgressCard(){const {state,notify}=useTravel();const [busy,setBusy]=useState(false);const bn=state.lang==='bn';return <button className="primary" disabled={busy} onClick={async()=>{
 setBusy(true);try{
 await document.fonts.ready;const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1350;const c=canvas.getContext('2d');if(!c)throw Error();
 c.fillStyle='#f6f3e9';c.fillRect(0,0,1080,1350);c.fillStyle='#103f38';c.fillRect(0,0,1080,380);c.fillStyle='#f6f3e9';c.font='600 44px "Noto Sans Bengali", sans-serif';c.fillText('AmarDesh',72,100);c.font='600 92px "Noto Sans Bengali", sans-serif';c.fillText(`${formatNumber(Object.keys(state.visits).length,state.lang)} / ${formatNumber(64,state.lang)}`,72,235);c.font='32px "Noto Sans Bengali", sans-serif';c.fillText(bn?'জেলা ঘুরেছি • আমার ভ্রমণ পাসপোর্ট':'districts visited • my travel passport',72,310);
 divisions.forEach((v,i)=>{const total=districts.filter(d=>d.division===v.name.en).length;const count=districts.filter(d=>d.division===v.name.en&&state.visits[d.id]).length;const y=455+i*96;c.fillStyle='#103f38';c.font='600 28px "Noto Sans Bengali", sans-serif';c.fillText(v.name[state.lang],72,y);c.textAlign='right';c.fillText(`${formatNumber(count,state.lang)} / ${formatNumber(total,state.lang)}`,1008,y);c.textAlign='left';c.fillStyle='#d8dfce';c.fillRect(72,y+18,936,15);c.fillStyle='#26795d';c.fillRect(72,y+18,936*count/total,15);});
 c.fillStyle='#4c6256';c.font='24px "Noto Sans Bengali", sans-serif';c.fillText(bn?'পরবর্তী গল্পটা কোথায়?':'Where will your next story begin?',72,1290);
 const data=canvas.toDataURL('image/png');if(native){const {uri}=await Filesystem.writeFile({path:'AmarDesh-passport.png',data:data.split(',')[1],directory:Directory.Cache});await Share.share({title:'AmarDesh',files:[uri]});}else{const a=document.createElement('a');a.href=data;a.download='AmarDesh-passport.png';a.click();}
 }catch{notify(bn?'ছবি সংরক্ষণ হয়নি। আবার চেষ্টা করুন।':'Image was not saved. Please try again.');}finally{setBusy(false);}
 }}>{bn?'পাসপোর্টের ছবি শেয়ার':'Share passport image'}</button>}
