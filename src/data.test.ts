import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import {
  districts,
  divisions,
  attractions,
  foods,
  sources,
  initialState,
  chooseDivision,
  chooseDistrict,
  searchAll,
  recommend,
  parseState,
  migrate,
  itinerarySummary,
} from "./tourism";
import { empty, quizFor } from "./model";
import credits from "../public/photos/credits.json";
describe("tourism register", () => {
  it("covers the official eight divisions and 64 unique districts", () => {
    expect(districts).toHaveLength(64);
    expect(new Set(districts.map((d) => d.id)).size).toBe(64);
    expect(
      Object.fromEntries(
        divisions.map((v) => [
          v.name.en,
          districts.filter((d) => d.division === v.name.en).length,
        ]),
      ),
    ).toEqual({
      Dhaka: 13,
      Chattogram: 11,
      Rajshahi: 8,
      Khulna: 10,
      Barishal: 6,
      Sylhet: 4,
      Rangpur: 8,
      Mymensingh: 4,
    });
  });
  it("selects every division and district with consistent relationships", () => {
    for (const v of divisions) {
      const s = chooseDivision(initialState(), v.name.en);
      expect(districts.find((d) => d.id === s.district)?.division).toBe(
        v.name.en,
      );
    }
    for (const d of districts) {
      const s = chooseDistrict(initialState(), d.id);
      expect(s.district).toBe(d.id);
      expect(s.division).toBe(d.division);
    }
  });
  it("has bilingual, sourced attraction and food records without orphan references", () => {
    expect(attractions.length).toBeGreaterThanOrEqual(100);
    expect(foods).toHaveLength(13);
    for (const d of districts)
      expect(attractions.some((a) => a.district === d.id)).toBe(true);
    for (const item of [...attractions, ...foods]) {
      expect(item.name.bn).toMatch(/[\u0980-\u09ff]/);
      expect(item.overview.en.length).toBeGreaterThan(20);
      expect(item.overview.bn).toMatch(/[\u0980-\u09ff]/);
      expect(item.sourceIds.length).toBeGreaterThan(0);
      for (const id of item.sourceIds)
        expect(sources.some((s) => s.id === id)).toBe(true);
    }
    for (const f of foods)
      for (const id of f.regions)
        expect(districts.some((d) => d.id === id)).toBe(true);
    for (const s of sources) {
      expect(new URL(s.url).protocol).toBe("https:");
      expect(s.verified).toMatch(/^2026-11-/);
    }
  });
  it("can find every record in both languages and combine type and division filters", () => {
    for (const d of districts)
      for (const q of [d.name, d.bn])
        expect(searchAll(q).some((h) => h.id === d.id)).toBe(true);
    for (const a of attractions)
      for (const q of [a.name.en, a.name.bn])
        expect(searchAll(q).some((h) => h.id === a.id)).toBe(true);
    for (const f of foods)
      expect(searchAll(f.name.bn, "", "food").some((h) => h.id === f.id)).toBe(
        true,
      );
    expect(searchAll("Chittagong").some((h) => h.id === "chattogram")).toBe(
      true,
    );
    expect(searchAll("Lalbagh", "Sylhet")).toHaveLength(0);
    expect(searchAll("Lalbagh", "Dhaka", "attraction")).toHaveLength(1);
    expect(searchAll("xyznotfound")).toHaveLength(0);
  });
  it("ranks relevant local recommendations and explains matching interests", () => {
    const r = recommend(["beaches"], 20);
    expect(r[0].matched).toContain("beaches");
    expect(new Set(r.map((x) => x.item.id)).size).toBe(r.length);
  });
  it("ships licensed local photos and no map dependency or boundary download", () => {
    for (const c of credits) {
      expect(
        existsSync(
          new URL("../public/photos/" + c.id + ".jpg", import.meta.url),
        ),
      ).toBe(true);
      expect(c.author.length).toBeGreaterThan(2);
      expect(c.licenseUrl).toMatch(
        /creativecommons.org|commons.wikimedia.org\/wiki\/Template:PD-self/,
      );
    }
    for (const a of attractions)
      if (a.image) expect(credits.some((c) => c.id === a.image)).toBe(true);
    for (const d of divisions)
      expect(credits.some((c) => c.id === d.image)).toBe(true);
    expect(
      readFileSync(new URL("../package.json", import.meta.url), "utf8"),
    ).not.toContain("maplibre");
    expect(
      existsSync(new URL("../public/data/districts.geojson", import.meta.url)),
    ).toBe(false);
  });
  it("keeps division quiz answers unambiguous through all districts", () => {
    for (let i = 0; i < 64; i++) {
      const d = districts[(i * 17 + 7) % 64],
        q = quizFor(d, (i % 32) * 2);
      expect(q.landmark).toBe(false);
      expect(q.answer).toBe(d.division);
      expect(new Set(q.options).size).toBe(4);
    }
  });
});
describe("progress, backup and itinerary", () => {
  it("migrates v1 favorites, passport, quiz and the existing trip", () => {
    const old = {
      ...structuredClone(empty),
      favorites: ["dhaka"],
      visits: { dhaka: { date: "2026-11-12", note: "Museum day" } },
      quiz: ["dhaka"],
      trip: {
        ...empty.trip,
        name: "Old trip",
        stops: [{ id: "dhaka", day: 2, notes: "Fort" }],
        food: 500,
      },
    };
    const s = migrate(old);
    expect(s.savedPlaces[0]).toContain("dhaka--");
    expect(s.visits).toEqual(old.visits);
    expect(s.quiz).toEqual(old.quiz);
    expect(s.trips[0].budget).toBe(500);
    expect(s.trips[0].stops[0].day).toBe(2);
    expect(parseState(old)).toEqual(s);
  });
  it("round trips multiple trips, saves, theme and notes safely", () => {
    const s = {
      ...initialState(),
      theme: "dark" as const,
      savedFoods: ["mezban"],
      trips: [
        {
          id: "one",
          name: "Coast",
          start: "2026-12-01",
          days: 2,
          notes: "Train first",
          budget: 3000,
          stops: [{ id: attractions[0].id, day: 2, notes: "Call ahead" }],
        },
        {
          id: "two",
          name: "Second",
          start: "",
          days: 1,
          notes: "",
          budget: 0,
          stops: [],
        },
      ],
      activeTrip: "two",
    };
    const restored = parseState(JSON.parse(JSON.stringify(s)));
    expect(restored.trips.map((t) => t.name)).toEqual(["Coast", "Second"]);
    expect(restored.activeTrip).toBe(restored.trips[1].id);
    expect(restored.theme).toBe("dark");
    expect(restored.savedFoods).toEqual(["mezban"]);
    expect(itinerarySummary(restored.trips[0], "en")).toContain("Call ahead");
  });
  it("rejects invalid backups and removes stale or hostile values", () => {
    expect(() => parseState(null)).toThrow();
    expect(() => parseState({ version: 9 })).toThrow();
    const s = parseState({
      version: 2,
      savedPlaces: ["fake"],
      savedFoods: ["mezban", "mezban", "fake"],
      district: "fake",
      trips: [
        {
          id: "x",
          days: 100,
          budget: -5,
          stops: [{ id: "fake" }, { id: attractions[0].id, day: 999 }],
        },
      ],
    });
    expect(s.savedPlaces).toEqual([]);
    expect(s.savedFoods).toEqual(["mezban"]);
    expect(s.trips[0].days).toBe(30);
    expect(s.trips[0].budget).toBe(0);
    expect(s.trips[0].stops).toHaveLength(1);
    expect(s.trips[0].stops[0].day).toBe(30);
  });
});
