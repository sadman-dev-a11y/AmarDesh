import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
class ErrorBoundary extends React.Component<{children:React.ReactNode},{error:boolean}>{state={error:false};static getDerivedStateFromError(){return {error:true}}render(){return this.state.error?<main className="empty-state"><h1>AmarDesh</h1><p>Something interrupted this view. / এই পাতায় একটি সমস্যা হয়েছে।</p><button onClick={()=>window.location.reload()}>Reload / আবার খুলুন</button></main>:this.props.children}}
createRoot(document.getElementById('root')!).render(<ErrorBoundary><App/></ErrorBoundary>);
if('serviceWorker' in navigator&&import.meta.env.PROD)navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(()=>{});
