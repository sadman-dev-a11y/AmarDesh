import { useState } from 'react';
import { useTravel } from './context';
import { exportFile, validateBackup, savePersistent } from './native';
import { formatNumber } from './format';
import type { State } from './tourism';
export function Backup() {
  const { state, setState, t, notify } = useTravel();
  const [value, setValue] = useState('');
  const [preview, setPreview] = useState<State | null>(null);
  const [busy, setBusy] = useState(false);
  const bn = state.lang === 'bn';
  const inspect = (text: string) => { try { setPreview(validateBackup(text)); } catch { setPreview(null); notify(t.backupBad); } };
  return <><section className="page-heading"><h1>{t.backup}</h1><p>{bn ? 'ফোন বদলানোর বা অ্যাপ সরানোর আগে ব্যাকআপ ফাইল সংরক্ষণ করুন।' : 'Save a backup file before changing phones or uninstalling the app.'}</p></section>
    <section className="panel backup-panel">
      <button className="primary" disabled={busy} onClick={async () => { setBusy(true); try { await exportFile('AmarDesh-3-backup.json', JSON.stringify(state, null, 2)); } catch { notify(bn ? 'ব্যাকআপ পাঠানো হয়নি। আবার চেষ্টা করুন।' : 'Backup was not shared. Please try again.'); } finally { setBusy(false); } }}>{bn ? 'ব্যাকআপ ফাইল সংরক্ষণ / শেয়ার' : 'Save / share backup file'}</button>
      <label>{bn ? 'ব্যাকআপ ফাইল বাছুন' : 'Choose a backup file'}<input type="file" accept="application/json,.json" onChange={async e => { const file = e.target.files?.[0]; if (!file) return; try { if (file.size > 5_000_000) throw Error(); inspect(await file.text()); } catch { notify(t.backupBad); } e.target.value = ''; }} /></label>
      <details><summary>{bn ? 'উন্নত বিকল্প: JSON পেস্ট করুন' : 'Advanced: paste JSON'}</summary><label>{t.backupLabel}<textarea rows={8} value={value} onChange={e => setValue(e.target.value)} /></label><button onClick={() => inspect(value)}>{bn ? 'ব্যাকআপ যাচাই' : 'Preview backup'}</button></details>
      {preview && <section role="dialog" aria-modal="true" aria-labelledby="restore-title" className="restore-preview"><h2 id="restore-title">{bn ? 'পুনরুদ্ধারের আগে দেখুন' : 'Review before restoring'}</h2><p>{formatNumber(preview.trips.length, state.lang)} {t.trips} · {formatNumber(Object.keys(preview.visits).length, state.lang)} {t.visited}</p><p>{bn ? 'এটি বর্তমান ভ্রমণ, পাসপোর্ট এবং পছন্দের তালিকা প্রতিস্থাপন করবে। আগে বর্তমান ব্যাকআপ রাখুন।' : 'This replaces your current trips, passport and saved lists. Export your current backup first.'}</p><div className="button-row"><button disabled={busy} className="primary" onClick={async () => { setBusy(true); try { await savePersistent(preview); setState(preview); setPreview(null); notify(t.backupGood); } catch { notify(t.backupBad); } finally { setBusy(false); } }}>{t.restore}</button><button data-dismiss-dialog onClick={() => setPreview(null)}>{bn ? 'বাতিল' : 'Cancel'}</button></div></section>}
    </section></>;
}
