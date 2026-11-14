// @vitest-environment jsdom
import { afterEach, beforeEach, it, expect, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import App from "./App";
import { en } from "./i18n";
import { attractions } from "./tourism";
beforeEach(() => {
  localStorage.clear();
  window.location.hash = "explore";
  window.scrollTo = vi.fn();
  HTMLElement.prototype.scrollTo = vi.fn();
  window.matchMedia = vi
    .fn()
    .mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
});
afterEach(cleanup);
const nav = (name: string) =>
  fireEvent.click(screen.getAllByRole("button", { name })[0]);
it("selects a division, district and all four exploration routes", async () => {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Dhaka" }));
  fireEvent.click(screen.getByRole("button", { name: "Narayanganj" }));
  expect(
    screen.getByRole("heading", { name: "Explore Narayanganj" }),
  ).toBeTruthy();
  fireEvent.click(
    screen.getByRole("button", { name: new RegExp(en.historyHint) }),
  );
  await waitFor(() =>
    expect(window.location.hash).toContain("district/narayanganj/history"),
  );
  await waitFor(() =>
    expect(
      screen.getByRole("heading", { name: "Narayanganj", level: 1 }),
    ).toBeTruthy(),
  );
  expect(JSON.parse(localStorage.getItem("amardesh-v2")!).district).toBe(
    "narayanganj",
  );
});
it("searches attractions, opens their detail, bookmarks and plans an actual place", async () => {
  render(<App />);
  fireEvent.change(screen.getByPlaceholderText(en.search), {
    target: { value: "Lalbagh" },
  });
  fireEvent.click(screen.getAllByRole("button", { name: /Lalbagh Fort/ })[0]);
  await waitFor(() =>
    expect(
      screen.getByRole("heading", { name: "Lalbagh Fort", level: 1 }),
    ).toBeTruthy(),
  );
  fireEvent.click(screen.getByRole("button", { name: en.save }));
  fireEvent.click(screen.getByRole("button", { name: en.addTrip }));
  const s = JSON.parse(localStorage.getItem("amardesh-v2")!);
  expect(s.savedPlaces).toHaveLength(1);
  expect(s.trips[0].stops[0].id).toBe(s.savedPlaces[0]);
  nav(en.trips);
  await waitFor(() =>
    expect(screen.getByRole("heading", { name: en.tripsTitle })).toBeTruthy(),
  );
  expect(screen.getByLabelText(en.addPlace)).toBeTruthy();
});
it("switches language and dark theme and persists both", async () => {
  window.location.hash = "more";
  render(<App />);
  fireEvent.change(screen.getByLabelText(en.theme), {
    target: { value: "dark" },
  });
  expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  fireEvent.click(screen.getByRole("button", { name: "Switch to Bangla" }));
  expect(document.documentElement.lang).toBe("bn");
  expect(JSON.parse(localStorage.getItem("amardesh-v2")!).lang).toBe("bn");
});
it("creates two trips, clamps days, edits notes, shares, deletes and restores", async () => {
  window.location.hash = "trips";
  render(<App />);
  fireEvent.change(screen.getByLabelText(en.tripName), {
    target: { value: "Coast" },
  });
  nav(en.create);
  fireEvent.change(screen.getByLabelText(en.addPlace), {
    target: { value: attractions[0].id },
  });
  fireEvent.change(screen.getByLabelText(en.days), { target: { value: "1" } });
  fireEvent.change(screen.getByLabelText(en.notes), {
    target: { value: "Bring water" },
  });
  fireEvent.change(screen.getAllByLabelText(en.tripName)[0], {
    target: { value: "Heritage" },
  });
  nav(en.create);
  expect(JSON.parse(localStorage.getItem("amardesh-v2")!).trips).toHaveLength(
    2,
  );
  nav(en.deleteTrip);
  expect(JSON.parse(localStorage.getItem("amardesh-v2")!).trips).toHaveLength(
    1,
  );
  nav(en.undo);
  expect(JSON.parse(localStorage.getItem("amardesh-v2")!).trips).toHaveLength(
    2,
  );
});
it("opens a regional dish and saves it without relying on network", async () => {
  window.location.hash = "dish/mezban";
  render(<App />);
  expect(screen.getByRole("heading", { level: 1 })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: en.save }));
  expect(JSON.parse(localStorage.getItem("amardesh-v2")!).savedFoods).toEqual([
    "mezban",
  ]);
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value: false,
  });
  window.dispatchEvent(new Event("offline"));
  await waitFor(() =>
    expect(screen.getAllByText(en.offlineNow).length).toBeGreaterThan(0),
  );
});
it.each(["attractions", "food", "history", "guide"])(
  "opens the district %s page directly",
  (section) => {
    window.location.hash = "district/dhaka/" + section;
    render(<App />);
    expect(
      screen.getByRole("heading", { name: "Dhaka", level: 1 }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: en.markVisit })).toBeTruthy();
  },
);
it("records a passport visit and retains it through navigation", async () => {
  window.location.hash = "district/dhaka/history";
  render(<App />);
  nav(en.markVisit);
  expect(
    JSON.parse(localStorage.getItem("amardesh-v2")!).visits.dhaka.date,
  ).toMatch(/^2026-/);
  window.location.hash = "passport";
  window.dispatchEvent(new Event("hashchange"));
  await waitFor(() =>
    expect(
      screen.getByRole("heading", { name: en.passportIntro }),
    ).toBeTruthy(),
  );
  expect(screen.getByText("1 / 64 Visited")).toBeTruthy();
});
it("records a correct quiz answer and advances", () => {
  window.location.hash = "quiz";
  render(<App />);
  nav("Dhaka");
  expect(screen.getByText(en.correct)).toBeTruthy();
  expect(JSON.parse(localStorage.getItem("amardesh-v2")!).quiz).toHaveLength(1);
  nav(en.nextQuestion);
  expect(screen.queryByText(en.correct)).toBeNull();
});
it("rejects an invalid restore while keeping saved progress", () => {
  window.location.hash = "backup";
  render(<App />);
  fireEvent.change(screen.getByLabelText(en.backupLabel), {
    target: { value: "not JSON" },
  });
  nav(en.restore);
  expect(screen.getByText(en.backupBad)).toBeTruthy();
  expect(JSON.parse(localStorage.getItem("amardesh-v2")!).version).toBe(2);
});
