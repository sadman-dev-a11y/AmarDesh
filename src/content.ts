import type districtData from './data/districts.json';
import type tourismData from './data/tourism.json';
export let districtContent: typeof districtData = [];
export let tourismContent: typeof tourismData = { divisions: [], attractions: [], foods: [], sources: [] };
export function setContent(districts: typeof districtData, tourism: typeof tourismData) { districtContent = districts; tourismContent = tourism; }
export async function loadContent() {
  const names = ['districts', 'divisions', 'attractions', 'foods', 'sources'];
  const values = await Promise.all(names.map(async name => {
    const response = await fetch(`${import.meta.env.BASE_URL}data/${name}.json`);
    if (!response.ok) throw Error(`Unable to load ${name}`);
    const file = await response.json();
    if (file.version !== 3 || !Array.isArray(file.items)) throw Error(`Invalid ${name}`);
    return file.items;
  }));
  setContent(values[0], { divisions: values[1], attractions: values[2], foods: values[3], sources: values[4] });
}
