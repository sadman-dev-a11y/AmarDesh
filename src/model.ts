import raw from "./data/districts.json";
export type Lang = "en" | "bn";
export type District = (typeof raw)[number];
export const districts = raw;
export const divisions = [
  ...new Map(
    districts.map((d) => [d.division, { en: d.division, bn: d.divisionBn }]),
  ).values(),
];
export const colors = [
  "#609d77",
  "#96b39b",
  "#d5ad6e",
  "#b6c88a",
  "#659e9d",
  "#b49e78",
  "#b0bb68",
  "#7f9fbd",
];
export const categories = {
  all: { en: "Everything", bn: "সবকিছু" },
  heritage: { en: "Heritage", bn: "ঐতিহ্য" },
  nature: { en: "Nature", bn: "প্রকৃতি" },
  coast: { en: "Coast & islands", bn: "সৈকত ও দ্বীপ" },
  culture: { en: "Culture", bn: "সংস্কৃতি" },
};
export type Stop = { id: string; day: number; notes: string };
export type Progress = {
  version: 1;
  lang: Lang;
  favorites: string[];
  visits: Record<string, { date: string; note: string }>;
  quiz: string[];
  trip: {
    name: string;
    start: string;
    days: number;
    stops: Stop[];
    transport: number;
    stay: number;
    food: number;
  };
};
export const empty: Progress = {
  version: 1,
  lang: "en",
  favorites: [],
  visits: {},
  quiz: [],
  trip: {
    name: "My Bangladesh journey",
    start: "",
    days: 3,
    stops: [],
    transport: 0,
    stay: 0,
    food: 0,
  },
};
const valid = new Set(districts.map((d) => d.id));
export function parseProgress(value: unknown): Progress {
  if (!value || typeof value !== "object") throw new Error("Invalid backup");
  const p = value as Progress;
  if (p.version !== 1) throw new Error("Unsupported backup version");
  const safeIds = (a: unknown) =>
    Array.isArray(a)
      ? [...new Set(a.filter((x) => typeof x === "string" && valid.has(x)))]
      : [];
  const visits: Progress["visits"] = {};
  if (p.visits && typeof p.visits === "object")
    for (const [id, v] of Object.entries(p.visits))
      if (
        valid.has(id) &&
        v &&
        typeof v.date === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(v.date)
      )
        visits[id] = {
          date: v.date,
          note: typeof v.note === "string" ? v.note.slice(0, 2000) : "",
        };
  const t = p.trip || empty.trip;
  const num = (n: unknown, max: number) =>
    typeof n === "number" && Number.isFinite(n)
      ? Math.max(0, Math.min(max, n))
      : 0;
  const days = Math.max(1, Math.floor(num(t.days, 30)));
  return {
    version: 1,
    lang: p.lang === "bn" ? "bn" : "en",
    favorites: safeIds(p.favorites),
    visits,
    quiz: safeIds(p.quiz),
    trip: {
      name: typeof t.name === "string" ? t.name.slice(0, 100) : empty.trip.name,
      start:
        typeof t.start === "string" && /^\d{4}-\d{2}-\d{2}$/.test(t.start)
          ? t.start
          : "",
      days,
      stops: Array.isArray(t.stops)
        ? t.stops
            .filter((s) => s && valid.has(s.id))
            .slice(0, 64)
            .map((s) => ({
              id: s.id,
              day: Math.max(1, Math.min(days, Math.floor(num(s.day, 30)))),
              notes: typeof s.notes === "string" ? s.notes.slice(0, 2000) : "",
            }))
        : [],
      transport: num(t.transport, 1e8),
      stay: num(t.stay, 1e8),
      food: num(t.food, 1e8),
    },
  };
}
export function loadProgress(): Progress {
  try {
    return parseProgress(
      JSON.parse(localStorage.getItem("amardesh-v1") || "null"),
    );
  } catch {
    return structuredClone(empty);
  }
}
export function searchDistricts(
  query: string,
  division: string,
  category: string,
  favoriteIds?: string[],
) {
  const q = query.toLocaleLowerCase().trim();
  return districts.filter(
    (d) =>
      (!division || d.division === division) &&
      (category === "all" || d.category === category) &&
      (!favoriteIds || favoriteIds.includes(d.id)) &&
      [
        d.name,
        d.bn,
        d.aliases.join(" "),
        d.sight.en,
        d.sight.bn,
        ...d.morePlaces.flatMap((p) => [p.en, p.bn]),
        d.division,
        d.divisionBn,
        d.food?.en,
        d.food?.bn,
      ].some((x) => x?.toLocaleLowerCase().includes(q)),
  );
}
export function quizFor(d: District, index: number) {
  const landmark = (index + Math.floor(index / 64)) % 2 === 1;
  const answer = landmark ? d.id : d.division;
  const pool = landmark
    ? districts.map((x) => x.id)
    : divisions.map((x) => x.en);
  const distractors = pool
    .filter((x) => x !== answer)
    .sort((a, b) => a.localeCompare(b));
  const opts = [
    answer,
    ...distractors.slice(
      (index * 3) % Math.max(1, distractors.length - 3),
      ((index * 3) % Math.max(1, distractors.length - 3)) + 3,
    ),
  ];
  const rotate = index % 4;
  return {
    landmark,
    answer,
    options: [...opts.slice(rotate), ...opts.slice(0, rotate)],
  };
}
export const today = () => new Date().toLocaleDateString("en-CA");
