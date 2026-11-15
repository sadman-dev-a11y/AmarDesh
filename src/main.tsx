import React from "react";
import { createRoot } from "react-dom/client";
import { loadContent } from "./content";
import { Capacitor } from "@capacitor/core";
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <main className="empty-state">
        <h1>AmarDesh</h1>
        <p>Something interrupted this view. / এই পাতায় একটি সমস্যা হয়েছে।</p>
        <button onClick={() => window.location.reload()}>
          Reload / আবার খুলুন
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}
const root = createRoot(document.getElementById("root")!);
root.render(<main style={{padding:'2rem',fontFamily:'sans-serif'}}><h1>AmarDesh</h1><p>Opening your offline guide… / ভ্রমণ সহায়িকা খুলছে…</p></main>);
loadContent().then(() => import('./App')).then(({default: App}) => {
  root.render(<ErrorBoundary><App /></ErrorBoundary>);
}).catch(() => {
  if (Capacitor.isNativePlatform()) void import("@capacitor/splash-screen").then(m => m.SplashScreen.hide()).catch(() => {});
  root.render(<main><h1>AmarDesh</h1><p>Unable to open the guide. / সহায়িকা খোলা যায়নি।</p><button onClick={() => window.location.reload()}>Retry / আবার চেষ্টা</button></main>);
});
if ("serviceWorker" in navigator && Capacitor.isNativePlatform()) {
  void navigator.serviceWorker.getRegistrations().then(rs => Promise.all(rs.map(r => r.unregister())));
  if ("caches" in window) void caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))));
}
if ("serviceWorker" in navigator && import.meta.env.PROD && !Capacitor.isNativePlatform())
  navigator.serviceWorker
    .register(`${import.meta.env.BASE_URL}sw.js`)
    .catch(() => {});
