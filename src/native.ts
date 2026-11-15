import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Haptics, NotificationType } from '@capacitor/haptics';
import { parseState, loadState, initialState, type State } from './tourism';
export const native = Capacitor.isNativePlatform();
export const storageKey = 'amardesh-v3';
export async function readPersistent(): Promise<State> {
  const { value } = await Preferences.get({ key: storageKey });
  if (value) return parseState(JSON.parse(value));
  // Do not delete either legacy key: migration is committed only after read-back.
  const legacy = localStorage.getItem('amardesh-v2') || localStorage.getItem('amardesh-v1');
  const state = legacy ? parseState(JSON.parse(legacy)) : initialState();
  await Preferences.set({ key: storageKey, value: JSON.stringify(state) });
  const check = await Preferences.get({ key: storageKey });
  if (check.value !== JSON.stringify(state)) throw Error('Migration verification failed');
  return state;
}
let writes: Promise<void> = Promise.resolve();
export function savePersistent(state: State) {
  const value = JSON.stringify(state);
  // Serialize writes so an earlier edit can never overwrite a newer edit.
  writes = writes.catch(() => {}).then(() => Preferences.set({ key: storageKey, value }));
  return writes;
}
export function fallbackState() { return loadState(); }
export async function haptic() {
  if (native) await Haptics.notification({ type: NotificationType.Success }).catch(() => {});
}
export async function shareText(title: string, text: string) {
  if (native) await Share.share({ title, text });
  else if (navigator.share) await navigator.share({ title, text });
  else await navigator.clipboard?.writeText(text);
}
export async function exportFile(name: string, data: string, mime = 'application/json') {
  if (native) {
    const { uri } = await Filesystem.writeFile({ path: name, data, directory: Directory.Cache, encoding: Encoding.UTF8 });
    await Share.share({ title: name, files: [uri] });
  } else {
    const url = URL.createObjectURL(new Blob([data], { type: mime }));
    const link = document.createElement('a'); link.href = url; link.download = name; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
}
export function validateBackup(text: string): State {
  if (text.length > 5_000_000) throw Error('Backup too large');
  const raw = JSON.parse(text);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw Error('Invalid backup');
  if (raw.version !== 1 && raw.version !== 2) throw Error('Unsupported backup');
  if (!raw.visits || typeof raw.visits !== 'object' || Array.isArray(raw.visits)) throw Error('Invalid visits');
  if (raw.version === 2 && (!Array.isArray(raw.trips) || !Array.isArray(raw.savedPlaces) || !Array.isArray(raw.savedFoods))) throw Error('Invalid backup collections');
  return parseState(raw);
}
