import data from "./data/tourism.json";
import {
  districts,
  loadProgress,
  parseProgress,
  type Lang,
  type Progress,
} from "./model";
export { districts };
export const { divisions, attractions, foods, sources } = data;
export type Attraction = (typeof attractions)[number];
export type Food = (typeof foods)[number];
export type Section = "attractions" | "food" | "history" | "guide";
export const districtById = (id: string) => districts.find((d) => d.id === id);
export const primaryAttraction = (id: string) =>
  attractions.find((a) => a.district === id)!;
export const featured = attractions.filter((a) => a.featured);
export const interestIds = [
  "beaches",
  "nature",
  "hills",
  "history",
  "architecture",
  "food",
  "photography",
  "relaxation",
  "wildlife",
] as const;
export type Interest = (typeof interestIds)[number];
export type Trip = {
  id: string;
  name: string;
  start: string;
  days: number;
  stops: { id: string; day: number; notes: string }[];
  notes: string;
  budget: number;
};
export type State = {
  version: 2;
  lang: Lang;
  theme: "light" | "dark" | "system";
  division: string;
  district: string;
  interests: Interest[];
  savedPlaces: string[];
  savedFoods: string[];
  trips: Trip[];
  activeTrip: string;
  visits: Progress["visits"];
  quiz: string[];
};
export function initialState(): State {
  return {
    version: 2,
    lang: "en",
    theme: "system",
    division: "Chattogram",
    district: "cox-s-bazar",
    interests: [],
    savedPlaces: [],
    savedFoods: [],
    trips: [],
    activeTrip: "",
    visits: {},
    quiz: [],
  };
}
const text = (v: unknown, max = 2000) =>
  typeof v === "string" ? v.slice(0, max) : "";
const num = (v: unknown, max: number) =>
  typeof v === "number" && Number.isFinite(v)
    ? Math.max(0, Math.min(max, v))
    : 0;
export function migrate(p: Progress): State {
  const s = initialState();
  return {
    ...s,
    lang: p.lang,
    savedPlaces: p.favorites.map((d) => primaryAttraction(d).id),
    visits: p.visits,
    quiz: p.quiz,
    trips: p.trip.stops.length
      ? [
          {
            id: "legacy-trip",
            name: p.trip.name,
            start: p.trip.start,
            days: p.trip.days,
            stops: p.trip.stops.map((stop) => ({
              ...stop,
              id: primaryAttraction(stop.id).id,
            })),
            notes: "",
            budget: p.trip.transport + p.trip.stay + p.trip.food,
          },
        ]
      : [],
    activeTrip: p.trip.stops.length ? "legacy-trip" : "",
  };
}
export function parseState(value: unknown): State {
  if (!value || typeof value !== "object") throw Error("Invalid backup");
  const v = value as Record<string, unknown>;
  if (v.version === 1) return migrate(parseProgress(v));
  if (v.version !== 2) throw Error("Unsupported backup");
  const s = initialState();
  const d = districtById(text(v.district));
  s.division = d?.division || s.division;
  s.district = d?.id || s.district;
  s.lang = v.lang === "bn" ? "bn" : "en";
  s.theme = ["light", "dark", "system"].includes(String(v.theme))
    ? (v.theme as State["theme"])
    : "system";
  const ids = (list: unknown, valid: Set<string>): string[] =>
    Array.isArray(list)
      ? [
          ...new Set(
            list.filter(
              (id): id is string => typeof id === "string" && valid.has(id),
            ),
          ),
        ]
      : [];
  s.interests = ids(v.interests, new Set(interestIds)) as Interest[];
  s.savedPlaces = ids(v.savedPlaces, new Set(attractions.map((a) => a.id)));
  s.savedFoods = ids(v.savedFoods, new Set(foods.map((f) => f.id)));
  s.visits = parseProgress({ version: 1, visits: v.visits }).visits;
  s.quiz = ids(v.quiz, new Set(districts.map((d) => d.id)));
  if (Array.isArray(v.trips))
    s.trips = v.trips
      .filter((t) => t && typeof t === "object")
      .slice(0, 30)
      .map((raw, i) => {
        const t = raw as Record<string, unknown>;
        const days = Math.max(1, Math.floor(num(t.days, 30)));
        const valid = new Set(attractions.map((a) => a.id));
        const stopList = Array.isArray(t.stops)
          ? t.stops
              .filter(
                (x) => x && typeof x === "object" && valid.has(String(x.id)),
              )
              .slice(0, 100)
          : [];
        return {
          id: "trip-" + i,
          name: text(t.name, 100) || "My journey",
          start: /^\d{4}-\d{2}-\d{2}$/.test(String(t.start))
            ? String(t.start)
            : "",
          days,
          stops: stopList.map((x) => ({
            id: String(x.id),
            day: Math.max(1, Math.min(days, Math.floor(num(x.day, 30)))),
            notes: text(x.notes),
          })),
          notes: text(t.notes),
          budget: num(t.budget, 1e8),
        };
      });
  const activeIndex = Array.isArray(v.trips)
    ? v.trips.findIndex(
        (t) =>
          t &&
          typeof t === "object" &&
          (t as Record<string, unknown>).id === v.activeTrip,
      )
    : -1;
  s.activeTrip = s.trips[Math.max(0, activeIndex)]?.id || "";
  return s;
}
export function loadState() {
  try {
    const raw = localStorage.getItem("amardesh-v2");
    return raw ? parseState(JSON.parse(raw)) : migrate(loadProgress());
  } catch {
    return initialState();
  }
}
export function chooseDivision(s: State, name: string): State {
  const first = districts.find((d) => d.division === name);
  return first ? { ...s, division: name, district: first.id } : s;
}
export function chooseDistrict(s: State, id: string): State {
  const d = districtById(id);
  return d ? { ...s, division: d.division, district: id } : s;
}
export function recommend(interests: Interest[], limit = 6) {
  return featured
    .map((a) => ({
      item: a,
      matched: interests.filter(
        (i) =>
          a.tags.includes(i) ||
          (i === "food" && foods.some((f) => f.regions.includes(a.district))),
      ),
    }))
    .sort(
      (a, b) =>
        b.matched.length - a.matched.length ||
        a.item.id.localeCompare(b.item.id),
    )
    .slice(0, limit);
}
export type SearchHit = {
  kind: "attraction" | "food" | "district" | "division";
  id: string;
  name: { en: string; bn: string };
  context: string;
  route: string;
};
export const normalize = (s: string) =>
  s
    .normalize("NFKD")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");
export function searchAll(
  query: string,
  division = "",
  kind = "all",
): SearchHit[] {
  const q = normalize(query);
  if (!q) return [];
  const matches = (...parts: (string | undefined)[]) =>
    parts.some((s) => s && normalize(s).includes(q));
  const out: SearchHit[] = [];
  for (const div of divisions)
    if (
      (!division || div.name.en === division) &&
      matches(div.name.en, div.name.bn)
    )
      out.push({
        kind: "division",
        id: div.id,
        name: div.name,
        context: "8 divisions",
        route: "explore",
      });
  for (const d of districts) {
    if (division && d.division !== division) continue;
    if (matches(d.name, d.bn, ...d.aliases))
      out.push({
        kind: "district",
        id: d.id,
        name: { en: d.name, bn: d.bn },
        context: d.division,
        route: `district/${d.id}/attractions`,
      });
    for (const a of attractions.filter((a) => a.district === d.id))
      if (
        matches(
          a.name.en,
          a.name.bn,
          d.name,
          d.bn,
          ...d.aliases,
          d.division,
          d.divisionBn,
          a.category,
          ...a.tags,
        )
      )
        out.push({
          kind: "attraction",
          id: a.id,
          name: a.name,
          context: d.name,
          route: `place/${a.id}`,
        });
  }
  for (const f of foods) {
    const regions = f.regions.map((id) => districtById(id)!);
    if (division && !regions.some((d) => d.division === division)) continue;
    if (
      matches(
        f.name.en,
        f.name.bn,
        f.transliteration,
        ...regions.flatMap((d) => [d.name, d.bn, ...d.aliases]),
        "food cuisine",
      )
    )
      out.push({
        kind: "food",
        id: f.id,
        name: f.name,
        context: regions.map((d) => d.name).join(", "),
        route: `dish/${f.id}`,
      });
  }
  return kind === "all" ? out : out.filter((h) => h.kind === kind);
}
export function itinerarySummary(trip: Trip, lang: Lang) {
  return [
    trip.name,
    trip.start,
    ...trip.stops.map(
      (s, i) =>
        `${i + 1}. ${lang === "bn" ? "দিন" : "Day"} ${s.day}: ${attractions.find((a) => a.id === s.id)?.name[lang]}${s.notes ? " — " + s.notes : ""}`,
    ),
    trip.notes,
    lang === "bn"
      ? "নিজের পরিকল্পনা; নিশ্চিত যাতায়াতের সময়সূচি নয়।"
      : "Personal itinerary; not a verified transport schedule.",
  ]
    .filter(Boolean)
    .join("\n");
}
