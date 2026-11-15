export type Coordinates = {lat:number;lng:number};
export function hasCoordinates<T extends {lat?:number;lng?:number}>(x: T): x is T & Coordinates {return Number.isFinite(x.lat)&&Number.isFinite(x.lng);}
export function distanceKm(a:Coordinates,b:Coordinates) { const rad=Math.PI/180;const dLat=(b.lat-a.lat)*rad,dLng=(b.lng-a.lng)*rad;const h=Math.sin(dLat/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dLng/2)**2;return 6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h))); }
