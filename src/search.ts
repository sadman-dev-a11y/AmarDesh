export const cleanSearch = (s:string) => s.normalize('NFKD').toLocaleLowerCase().replace(/[^\p{L}\p{M}\p{N}]+/gu,'');
export function editDistance(a:string,b:string) {
 const x=Array.from(a),y=Array.from(b);let row=y.map((_,i)=>i+1);row.unshift(0);
 for(let i=0;i<x.length;i++){const next=[i+1];for(let j=0;j<y.length;j++) next[j+1]=Math.min(next[j]+1,row[j+1]+1,row[j]+(x[i]===y[j]?0:1));row=next;}return row[y.length];
}
export function fuzzyMatch(query:string,value:string) {
 const a=cleanSearch(query),b=cleanSearch(value);if(b.includes(a))return true;
 if(a.length<4 || Math.abs(a.length-b.length)>2)return false;
 return editDistance(a,b)<=(a.length>=8?2:1);
}
