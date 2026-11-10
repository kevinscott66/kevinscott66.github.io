export type ConnState='open';
export function subscribe(name:string, fn:(payload:unknown)=>void){const cb=()=>fn({});window.addEventListener('demo-update',cb);return()=>window.removeEventListener('demo-update',cb);}
export function onState(fn:(s:ConnState)=>void){fn('open');return()=>{};}
export function currentState(){return 'open';}export function close(){}
