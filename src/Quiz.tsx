import { useState } from 'react';
import { useTravel } from './context';
import { districts, divisions, foods, primaryAttraction } from './tourism';
import { today } from './model';
import { formatNumber } from './format';
import { haptic } from './native';
export function makeQuestion(index:number) {
 const d = districts[(index*17+7)%districts.length]; const type=index%4;
 const food=foods[index%foods.length];
 const answer=type===0?d.division:type===2?food.regions[0]:d.id;
 // For multi-region dishes only one associated district is included among options.
 const pool=type===0?divisions.map(v=>v.name.en):districts.map(d=>d.id).filter(id=>type!==2||!food.regions.includes(id));
 const options=[answer,...pool.filter(id=>id!==answer).slice(index%Math.max(1,pool.length-3),index%Math.max(1,pool.length-3)+3)];
 const rotate=index%4;
 return {d,type,food,answer,options:[...options.slice(rotate),...options.slice(0,rotate)]};
}
export function Quiz() {
 const {state,setState,t,go}=useTravel();const [index,setIndex]=useState(0),[answer,setAnswer]=useState(''); const q=makeQuestion(index);const bn=state.lang==='bn';
 const label=(id:string)=>q.type===0?(divisions.find(v=>v.name.en===id)?.name[state.lang]||id):(bn?districts.find(d=>d.id===id)?.bn:districts.find(d=>d.id===id)?.name)||id;
 const prompt=q.type===0?(bn?'জেলাটি কোন বিভাগে?':'Which division is this district in?'):q.type===1?(bn?'স্থানটি কোন জেলায়?':'Which district is this attraction in?'):q.type===2?(bn?'খাবারটির সঙ্গে কোন জেলার যোগ আছে?':'Which district is associated with this food?'):(bn?'বাংলা নামটির ইংরেজি নাম কোনটি?':'Match this Bangla district name');
 const subject=q.type===0?(bn?q.d.bn:q.d.name):q.type===1?primaryAttraction(q.d.id).name[state.lang]:q.type===2?q.food.name[state.lang]:q.d.bn;
 return <><section className="page-heading"><span className="eyebrow">{t.quiz}</span><h1>{prompt}</h1><p>{formatNumber(state.quiz.length,state.lang)} / {formatNumber(64,state.lang)} {t.learned}</p><button onClick={()=>{setIndex(Math.floor(Date.now()/86400000)%10000);setAnswer('');}}>{bn?'আজকের প্রশ্ন':'Daily question'}</button><p>{bn?'টানা অনুশীলনের দিন':'Practice streak'}: {formatNumber(state.learning?.streak||0,state.lang)}</p></section><section className="panel quiz-panel"><h2>{subject}</h2><div className="quiz-options">{q.options.map(v=><button key={v} disabled={!!answer} className={answer&&v===q.answer?'correct':''} onClick={()=>{
 setAnswer(v);if(v===q.answer) {void haptic();setState(p=>{const day=today();const yesterday=new Date(Date.now()-86400000).toLocaleDateString('en-CA');return {...p,quiz:[...new Set([...p.quiz,q.type===2?q.food.regions[0]:q.d.id])],learning:{date:day,streak:p.learning?.date===day?p.learning.streak:p.learning?.date===yesterday?p.learning.streak+1:1}};});}
 }}>{q.type===3?districts.find(d=>d.id===v)?.name:label(v)}</button>)}</div>{answer&&<div role="status"><h3>{answer===q.answer?t.correct:t.incorrect}</h3><p>{t.answer}: {q.type===3?districts.find(d=>d.id===q.answer)?.name:label(q.answer)}</p><div className="button-row"><button className="primary" onClick={()=>{setIndex(i=>i+1);setAnswer('');}}>{t.nextQuestion}</button><button onClick={()=>go(`district/${q.type===2?q.food.regions[0]:q.d.id}/history`)}>{bn?'আরও জানুন':'Learn more'}</button></div></div>}</section></>;
}
