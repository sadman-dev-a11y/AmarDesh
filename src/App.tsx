import { useEffect, useRef, useState } from "react";
import { Context, useTravel } from "./context";
import { en, bn } from "./i18n";
import {
  Icon,
  Photo,
  Credit,
  PlaceCard,
  FoodCard,
  SourceList,
} from "./components";
import { Discovery } from "./Discovery";
import { Trips } from "./Trips";
import {
  districts,
  divisions,
  attractions,
  foods,
  sources,
  featured,
  districtById,
  primaryAttraction,
  loadState,
  parseState,
  chooseDistrict,
  searchAll,
  normalize,
  recommend,
  interestIds,
  type State,
  type Section,
  type Attraction,
  type Food,
  type Interest,
} from "./tourism";
import { quizFor, today } from "./model";
import { essentials, phrases } from "./essentials";
import credits from "../public/photos/credits.json";
import "@fontsource/noto-sans-bengali/400.css";
import "@fontsource/noto-sans-bengali/600.css";
import "./style.css";
const tabs = ["home", "explore", "food", "trips", "more"] as const;
export default function App() {
  const [state, setState] = useState(loadState),
    [route, setRoute] = useState(window.location.hash.slice(1) || "home"),
    [online, setOnline] = useState(navigator.onLine),
    [message, setMessage] = useState(""),
    [storageError, setStorageError] = useState(false);
  const depth = useRef(0);
  const t = state.lang === "bn" ? bn : en;
  const go = (path: string) => {
    if (path === window.location.hash.slice(1)) {
      window.scrollTo({ top: 0 });
      return;
    }
    depth.current++;
    window.location.hash = path;
  };
  const back = () => {
    if (depth.current > 0) {
      depth.current--;
      window.history.back();
    } else go("explore");
  };
  useEffect(() => {
    const hash = () => {
      setRoute(window.location.hash.slice(1) || "home");
      window.scrollTo({ top: 0, behavior: "instant" });
    };
    const network = () => setOnline(navigator.onLine);
    window.addEventListener("hashchange", hash);
    window.addEventListener("online", network);
    window.addEventListener("offline", network);
    return () => {
      window.removeEventListener("hashchange", hash);
      window.removeEventListener("online", network);
      window.removeEventListener("offline", network);
    };
  }, []);
  useEffect(() => {
    document.documentElement.lang = state.lang;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () =>
      document.documentElement.setAttribute(
        "data-theme",
        state.theme === "system"
          ? mq.matches
            ? "dark"
            : "light"
          : state.theme,
      );
    apply();
    mq.addEventListener?.("change", apply);
    try {
      localStorage.setItem("amardesh-v2", JSON.stringify(state));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
    return () => mq.removeEventListener?.("change", apply);
  }, [state]);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 4500);
    return () => clearTimeout(timer);
  }, [message]);
  const togglePlace = (id: string) =>
    setState((p) => ({
      ...p,
      savedPlaces: p.savedPlaces.includes(id)
        ? p.savedPlaces.filter((x) => x !== id)
        : [...p.savedPlaces, id],
    }));
  const toggleFood = (id: string) =>
    setState((p) => ({
      ...p,
      savedFoods: p.savedFoods.includes(id)
        ? p.savedFoods.filter((x) => x !== id)
        : [...p.savedFoods, id],
    }));
  const addStop = (id: string) => {
    setState((p) => {
      const active =
        p.trips.find((trip) => trip.id === p.activeTrip) || p.trips[0];
      if (!active) {
        const trip = {
          id: "trip-" + Date.now(),
          name:
            state.lang === "bn"
              ? "আমার বাংলাদেশ ভ্রমণ"
              : "My Bangladesh journey",
          start: "",
          days: 3,
          notes: "",
          budget: 0,
          stops: [{ id, day: 1, notes: "" }],
        };
        return { ...p, trips: [trip], activeTrip: trip.id };
      }
      return {
        ...p,
        activeTrip: active.id,
        trips: p.trips.map((trip) =>
          trip.id !== active.id || trip.stops.some((s) => s.id === id)
            ? trip
            : {
                ...trip,
                stops: [
                  ...trip.stops,
                  {
                    id,
                    day: Math.min(trip.days, trip.stops.length + 1),
                    notes: "",
                  },
                ],
              },
        ),
      };
    });
    setMessage(t.added);
  };
  const pieces = route.split("/");
  const district =
    pieces[0] === "district" ? districtById(pieces[1]) : undefined;
  const a =
    pieces[0] === "place"
      ? attractions.find((a) => a.id === pieces[1])
      : undefined;
  const f =
    pieces[0] === "dish" ? foods.find((f) => f.id === pieces[1]) : undefined;
  const section = (
    ["attractions", "food", "history", "guide"].includes(pieces[2])
      ? pieces[2]
      : "attractions"
  ) as Section;
  const active =
    route === "home"
      ? "home"
      : route === "trips"
        ? "trips"
        : route === "food" || f
          ? "food"
          : route === "more" ||
              ["essentials", "sources", "backup", "passport", "quiz"].includes(
                route,
              )
            ? "more"
            : "explore";
  useEffect(() => {
    if (district)
      setState((p) =>
        p.district === district.id ? p : chooseDistrict(p, district.id),
      );
  }, [district]);
  return (
    <Context.Provider
      value={{
        state,
        setState,
        t,
        go,
        togglePlace,
        toggleFood,
        addStop,
        notify: setMessage,
      }}
    >
      <a
        className="skip-link"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main")?.focus();
        }}
      >
        {state.lang === "bn" ? "মূল অংশে যান" : "Skip to content"}
      </a>
      <header className="topbar">
        <a href="#home" className="brand">
          <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" />
          <span>
            AmarDesh
            <small>
              {state.lang === "bn"
                ? "বাংলাদেশকে নতুন করে জানুন"
                : "BANGLADESH, BEYOND THE EXPECTED"}
            </small>
          </span>
        </a>
        <nav
          aria-label={
            state.lang === "bn" ? "প্রধান নেভিগেশন" : "Main navigation"
          }
        >
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => go(tab)}
              className={active === tab ? "active" : ""}
              aria-current={active === tab ? "page" : undefined}
            >
              <Icon name={tab === "explore" ? "compass" : tab} />
              <span>{t[tab]}</span>
            </button>
          ))}
        </nav>
        <div className="header-actions">
          <button
            className="icon-button"
            aria-label={t.search}
            onClick={() => go("explore")}
          >
            <Icon name="search" />
          </button>
          <button
            className="language-button"
            onClick={() =>
              setState((p) => ({ ...p, lang: p.lang === "en" ? "bn" : "en" }))
            }
            aria-label={
              state.lang === "en" ? "Switch to Bangla" : "Switch to English"
            }
          >
            {state.lang === "en" ? "বাংলা" : "EN"}
          </button>
        </div>
      </header>
      {storageError && (
        <div className="warning" role="alert">
          {t.storageError}
          <button onClick={() => go("backup")}>{t.backup}</button>
        </div>
      )}
      {!online && (
        <div className="network-banner" role="status">
          <Icon name="offline" size={16} />
          {t.offlineNow}
        </div>
      )}
      <main id="main" tabIndex={-1}>
        {!tabs.includes(route as (typeof tabs)[number]) && (
          <button className="back-button" onClick={back}>
            <Icon name="left" size={18} />
            {t.back}
          </button>
        )}
        {district ? (
          <DistrictGuide id={district.id} section={section} />
        ) : a ? (
          <AttractionGuide a={a} />
        ) : f ? (
          <DishGuide f={f} />
        ) : route === "home" ? (
          <Home />
        ) : route === "explore" ? (
          <Explore />
        ) : route === "food" ? (
          <FoodIndex />
        ) : route === "trips" ? (
          <Trips />
        ) : route === "more" ? (
          <More />
        ) : route === "essentials" ? (
          <Essentials />
        ) : route === "sources" ? (
          <Sources />
        ) : route === "backup" ? (
          <Backup />
        ) : route === "passport" ? (
          <Passport />
        ) : route === "quiz" ? (
          <Quiz />
        ) : (
          <div className="empty-state">
            <h1>{t.notFound}</h1>
            <button className="primary" onClick={() => go("home")}>
              {t.home}
            </button>
          </div>
        )}
        <section className="offline-card">
          <span className="offline-icon">
            <Icon name="offline" size={26} />
          </span>
          <div>
            <h3>{t.offline}</h3>
            <p>{t.offlineText}</p>
          </div>
          <span className="online-dot">
            {online ? t.onlineNow : t.offlineNow}
          </span>
        </section>
      </main>
      <footer>
        <div className="brand-footer">
          AmarDesh<span>2.0 · {t.journey}</span>
        </div>
        <button onClick={() => go("sources")}>
          {t.sources}
          <Icon name="arrow" size={16} />
        </button>
        <button onClick={() => go("backup")}>{t.backup}</button>
      </footer>
      {message && (
        <div className="toast" role="status">
          <Icon name="check" size={18} />
          {message}
        </div>
      )}
    </Context.Provider>
  );
}
function InterestPicker() {
  const { state, setState, t } = useTravel();
  const label = (id: Interest) =>
    id === "food"
      ? t.foodInterest
      : id === "history"
        ? t.historyInterest
        : t[id];
  return (
    <div className="interest-list" role="group" aria-label={t.interests}>
      {interestIds.map((id) => (
        <button
          key={id}
          aria-pressed={state.interests.includes(id)}
          onClick={() =>
            setState((p) => ({
              ...p,
              interests: p.interests.includes(id)
                ? p.interests.filter((x) => x !== id)
                : [...p.interests, id],
            }))
          }
        >
          {label(id)}
          {state.interests.includes(id) && <Icon name="check" size={14} />}
        </button>
      ))}
    </div>
  );
}
function Cards({ items }: { items: Attraction[] }) {
  const { state, t, go, togglePlace } = useTravel();
  return (
    <div className="place-grid">
      {items.map((a) => (
        <PlaceCard
          key={a.id}
          a={a}
          lang={state.lang}
          t={t}
          saved={state.savedPlaces.includes(a.id)}
          onSave={() => togglePlace(a.id)}
          onOpen={() => go("place/" + a.id)}
        />
      ))}
    </div>
  );
}
function Dishes({ items }: { items: Food[] }) {
  const { state, t, go, toggleFood } = useTravel();
  return (
    <div className="food-grid">
      {items.map((f) => (
        <FoodCard
          key={f.id}
          f={f}
          lang={state.lang}
          t={t}
          saved={state.savedFoods.includes(f.id)}
          onSave={() => toggleFood(f.id)}
          onOpen={() => go("dish/" + f.id)}
        />
      ))}
    </div>
  );
}
function Home() {
  const { state, setState, t, go, notify } = useTravel();
  const lang = state.lang;
  const suggestions = [
    {
      name: {
        en: "Mughal streets & merchant stories",
        bn: "মুঘল পথ ও বণিকের গল্প",
      },
      days: 2,
      districts: ["dhaka", "narayanganj"],
      description: {
        en: "Begin in Old Dhaka, then discover Sonargaon’s historic street.",
        bn: "পুরান ঢাকা থেকে শুরু করে সোনারগাঁয়ের ঐতিহাসিক পথ আবিষ্কার করুন।",
      },
    },
    {
      name: { en: "The southwest, slowly", bn: "ধীরে ধীরে দক্ষিণ-পশ্চিম" },
      days: 4,
      districts: ["bagerhat", "khulna"],
      description: {
        en: "Brick-built heritage, followed by a pre-arranged forest journey.",
        bn: "ইটের ঐতিহ্যের পরে আগে থেকে ব্যবস্থা করা বনভ্রমণ।",
      },
    },
    {
      name: { en: "A northern heritage trail", bn: "উত্তরের ঐতিহ্যের পথ" },
      days: 4,
      districts: ["bogura", "naogaon", "dinajpur"],
      description: {
        en: "Link archaeological sites with terracotta craftsmanship.",
        bn: "প্রত্নস্থানের সঙ্গে পোড়ামাটির কারুকাজের যোগসূত্র খুঁজুন।",
      },
    },
  ];
  const useSuggested = (s: (typeof suggestions)[number]) => {
    const trip = {
      id: "trip-" + Date.now(),
      name: s.name[lang],
      days: s.days,
      start: "",
      budget: 0,
      notes: t.suggestedNote,
      stops: s.districts.map((id, i) => ({
        id: primaryAttraction(id).id,
        day: Math.min(s.days, i + 1),
        notes: "",
      })),
    };
    setState((p) => ({ ...p, trips: [...p.trips, trip], activeTrip: trip.id }));
    notify(t.added);
    go("trips");
  };
  return (
    <>
      <section className="welcome">
        <Photo
          id="beach"
          alt={lang === "bn" ? "কক্সবাজার সমুদ্রসৈকত" : "Cox’s Bazar Sea Beach"}
          t={t}
          priority
        />
        <div className="hero-gradient" />
        <div className="hero-copy">
          <span className="hero-eyebrow">
            <span />
            {t.tagline}
          </span>
          <h1>
            {t.hero}
            <br />
            <em>{t.hero2}</em>
          </h1>
          <p>{t.intro}</p>
          <button
            className="primary warm"
            onClick={() =>
              document.getElementById("discover")?.scrollIntoView({
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
                  .matches
                  ? "instant"
                  : "smooth",
                block: "start",
              })
            }
          >
            {t.begin}
            <Icon name="arrow" size={20} />
          </button>
        </div>
        <div className="hero-foot">
          <span>
            08 <small>{t.division}</small>
          </span>
          <span>
            64 <small>{t.district}</small>
          </span>
          <span>
            {lang === "bn"
              ? "কক্সবাজার · বাংলাদেশ"
              : "COX’S BAZAR · BANGLADESH"}
          </span>
        </div>
      </section>
      <Discovery />
      <section className="section">
        <div className="section-title">
          <div>
            <span className="eyebrow">{t.journey}</span>
            <h2>{t.popular}</h2>
          </div>
          <button className="text-link" onClick={() => go("explore")}>
            {t.viewAll}
            <Icon name="arrow" size={18} />
          </button>
        </div>
        <Cards items={featured.slice(0, 6)} />
      </section>
      <section className="recommendation-section section">
        <div className="section-title">
          <div>
            <span className="eyebrow">
              <Icon name="spark" size={14} />
              {t.interests}
            </span>
            <h2>{t.recommend}</h2>
            <p>{t.interestIntro}</p>
          </div>
        </div>
        <InterestPicker />
        <Cards items={recommend(state.interests, 3).map((r) => r.item)} />
        {state.interests.length > 0 && (
          <p className="recommend-note">
            {t.matches}:{" "}
            {state.interests
              .map((i) =>
                i === "history"
                  ? t.historyInterest
                  : i === "food"
                    ? t.foodInterest
                    : t[i],
              )
              .join(" · ")}
          </p>
        )}
      </section>
      <section className="section taste-section">
        <div className="section-title">
          <div>
            <span className="eyebrow">{t.regional}</span>
            <h2>{t.taste}</h2>
          </div>
          <button className="text-link" onClick={() => go("food")}>
            {t.viewAll}
            <Icon name="arrow" size={18} />
          </button>
        </div>
        <Dishes items={foods.slice(0, 3)} />
      </section>
      <section className="section">
        <div className="section-title">
          <h2>{t.hidden}</h2>
        </div>
        <Cards
          items={["faridpur", "satkhira", "habiganj"].map((id) =>
            primaryAttraction(id),
          )}
        />
      </section>
      <section className="section">
        <div className="section-title">
          <h2>{t.heritage}</h2>
        </div>
        <Cards
          items={featured.filter((a) => a.category === "heritage").slice(-3)}
        />
      </section>
      <section className="section">
        <div className="section-title">
          <div>
            <span className="eyebrow">{t.trips}</span>
            <h2>{t.suggested}</h2>
            <p>{t.suggestedNote}</p>
          </div>
        </div>
        <div className="itinerary-grid">
          {suggestions.map((s, i) => (
            <article className="itinerary-card" key={s.name.en}>
              <span className="itinerary-number">0{i + 1}</span>
              <span className="eyebrow">
                {s.days} {t.days}
              </span>
              <h3>{s.name[lang]}</h3>
              <p>{s.description[lang]}</p>
              <div className="itinerary-stops">
                {s.districts.map((id) => (
                  <span key={id}>
                    {lang === "bn"
                      ? districtById(id)!.bn
                      : districtById(id)!.name}
                  </span>
                ))}
              </div>
              <button className="text-link" onClick={() => useSuggested(s)}>
                {t.saveTrip}
                <Icon name="arrow" size={18} />
              </button>
            </article>
          ))}
        </div>
      </section>
      <section className="essentials-teaser">
        <Icon name="guide" size={42} />
        <div>
          <span className="eyebrow">{t.essentials}</span>
          <h2>{t.essentialsIntro}</h2>
        </div>
        <button className="primary" onClick={() => go("essentials")}>
          {t.essentials}
          <Icon name="arrow" size={18} />
        </button>
      </section>
    </>
  );
}
function Explore() {
  const { state, t, go, setState } = useTravel();
  const [q, setQ] = useState(""),
    [division, setDivision] = useState(""),
    [kind, setKind] = useState("all");
  const searching = !!(q.trim() || division || kind !== "all");
  const hits = searchAll(q, division, kind);
  const lang = state.lang;
  return (
    <>
      <section className="page-heading">
        <span className="eyebrow">{t.explore}</span>
        <h1>{t.searchTitle}</h1>
      </section>
      <section className="global-search">
        <label className="search-input">
          <Icon name="search" />
          <input
            autoComplete="off"
            aria-label={t.search}
            placeholder={t.search}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q && (
            <button onClick={() => setQ("")} aria-label={t.close}>
              <Icon name="close" size={18} />
            </button>
          )}
        </label>
        <div className="search-filters">
          <select
            aria-label={t.division}
            value={division}
            onChange={(e) => setDivision(e.target.value)}
          >
            <option value="">{t.allDivisions}</option>
            {divisions.map((d) => (
              <option key={d.id} value={d.name.en}>
                {d.name[lang]}
              </option>
            ))}
          </select>
          <div className="filter-pills">
            {[
              ["all", t.all],
              ["attraction", t.attractions],
              ["food", t.localFood],
              ["district", t.district],
              ["division", t.division],
            ].map(([key, label]) => (
              <button
                key={key}
                aria-pressed={kind === key}
                onClick={() => setKind(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {searching && (
          <button
            className="text-link"
            onClick={() => {
              setQ("");
              setDivision("");
              setKind("all");
            }}
          >
            {t.resetFilters}
          </button>
        )}
        {searching ? (
          <div className="search-results" aria-live="polite">
            <span className="eyebrow">
              {hits.length} {t.results}
            </span>
            {hits.length ? (
              hits.slice(0, 120).map((h) => (
                <button
                  className="search-result"
                  key={h.kind + h.id}
                  onClick={() => {
                    if (h.kind === "division") {
                      const d = districts.find(
                        (d) => d.division === h.name.en,
                      )!;
                      setState((p) => chooseDistrict(p, d.id));
                      setQ("");
                      setDivision("");
                      setKind("all");
                      window.requestAnimationFrame(() =>
                        document
                          .getElementById("discover")
                          ?.scrollIntoView({
                            block: "start",
                            behavior: window.matchMedia(
                              "(prefers-reduced-motion: reduce)",
                            ).matches
                              ? "instant"
                              : "smooth",
                          }),
                      );
                    } else {
                      if (h.kind === "district")
                        setState((p) => chooseDistrict(p, h.id));
                      go(h.route);
                    }
                  }}
                >
                  <span className="result-icon">
                    <Icon
                      name={
                        h.kind === "food"
                          ? "food"
                          : h.kind === "attraction"
                            ? "nature"
                            : "compass"
                      }
                    />
                  </span>
                  <span>
                    <strong>{h.name[lang]}</strong>
                    <small>{h.context}</small>
                  </span>
                  <Icon name="arrow" size={19} />
                </button>
              ))
            ) : (
              <p className="empty-state">{t.searchEmpty}</p>
            )}
          </div>
        ) : (
          <p className="search-suggestions">{t.searchStart}</p>
        )}
      </section>
      {!searching && (
        <>
          <Discovery />
          <section className="section">
            <h2>{t.popular}</h2>
            <Cards items={featured} />
          </section>
        </>
      )}
    </>
  );
}
function FoodIndex() {
  const { state, t } = useTravel();
  const [query, setQuery] = useState(""),
    [division, setDivision] = useState("");
  const list = foods.filter(
    (f) =>
      (!division ||
        f.regions.some((id) => districtById(id)?.division === division)) &&
      [
        f.name.en,
        f.name.bn,
        ...f.regions.flatMap((id) => {
          const d = districtById(id)!;
          return [d.name, d.bn, ...d.aliases];
        }),
      ].some((x) => normalize(x).includes(normalize(query))),
  );
  return (
    <>
      <section className="page-heading">
        <span className="eyebrow">{t.regional}</span>
        <h1>{t.taste}</h1>
        <p>{t.noOrigin}</p>
      </section>
      <div className="food-filter">
        <label className="search-input">
          <Icon name="search" />
          <input
            value={query}
            aria-label={t.search}
            placeholder={t.search}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <select
          aria-label={t.division}
          value={division}
          onChange={(e) => setDivision(e.target.value)}
        >
          <option value="">{t.allDivisions}</option>
          {divisions.map((d) => (
            <option key={d.id} value={d.name.en}>
              {d.name[state.lang]}
            </option>
          ))}
        </select>
      </div>
      <Dishes items={list} />
      {!list.length && <p className="empty-state">{t.noFoodHelp}</p>}
    </>
  );
}
function DistrictGuide({ id, section }: { id: string; section: Section }) {
  const { state, setState, t, go } = useTravel();
  const d = districtById(id)!;
  const lang = state.lang;
  const list = attractions.filter((a) => a.district === id);
  const dishes = foods.filter((f) => f.regions.includes(id));
  const visit = state.visits[id];
  const sections: [Section, string][] = [
    ["attractions", t.attractions],
    ["food", t.localFood],
    ["history", t.history],
    ["guide", t.guide],
  ];
  return (
    <>
      <section className="district-heading">
        <div>
          <span className="eyebrow">
            {lang === "bn" ? d.divisionBn : d.division} · {t.district}
          </span>
          <h1>{lang === "bn" ? d.bn : d.name}</h1>
          <p>{d.description[lang]}</p>
          <button
            className="visit-button"
            onClick={() =>
              setState((p) => {
                const visits = { ...p.visits };
                if (visits[id]) delete visits[id];
                else visits[id] = { date: today(), note: "" };
                return { ...p, visits };
              })
            }
          >
            <Icon name={visit ? "check" : "passport"} size={18} />
            {visit ? t.removeVisit : t.markVisit}
          </button>
        </div>
        <Photo id={list[0]?.image} alt={list[0]?.name[lang] || d.name} t={t} />
      </section>
      <div className="section-tabs" role="group" aria-label={t.explore}>
        {sections.map(([key, label]) => (
          <button
            key={key}
            aria-pressed={section === key}
            onClick={() => go(`district/${id}/${key}`)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="district-content" key={id + section}>
        {section === "attractions" ? (
          <>
            <h2>{t.attractions}</h2>
            <Cards items={list} />
          </>
        ) : section === "food" ? (
          <>
            <h2>{t.localFood}</h2>
            {dishes.length ? (
              <Dishes items={dishes} />
            ) : (
              <section className="empty-state panel">
                <Icon name="food" size={36} />
                <h3>{t.noFood}</h3>
                <p>{t.noFoodHelp}</p>
                <button className="primary" onClick={() => go("food")}>
                  {t.browseFood}
                  <Icon name="arrow" size={18} />
                </button>
              </section>
            )}
          </>
        ) : section === "history" ? (
          <div className="reading-layout">
            <section className="reading panel">
              <span className="eyebrow">{t.history}</span>
              <h2>{lang === "bn" ? d.bn : d.name}</h2>
              <p>{d.history[lang]}</p>
              <h3>{t.culture}</h3>
              <p>{d.culture?.[lang] || d.description[lang]}</p>
              <p>
                {lang === "bn"
                  ? "নিচের স্থান ও তথ্যসূত্রে জেলার স্থাপত্য, ধর্মীয় ও স্থানীয় ঐতিহ্যের পরিচয় পাবেন।"
                  : "The following places and district references offer starting points for the area’s architectural, religious and local heritage."}
              </p>
              <SourceList ids={d.sourceIds} t={t} />
            </section>
            <aside>
              <Cards items={list.slice(0, 2)} />
            </aside>
          </div>
        ) : (
          <div className="reading-layout">
            <section className="reading panel">
              <h2>{t.guide}</h2>
              <h3>{t.location}</h3>
              <p>
                {lang === "bn"
                  ? `${d.bn}, ${d.divisionBn} বিভাগ।`
                  : `${d.name}, ${d.division} division.`}
              </p>
              <h3>{t.transport}</h3>
              <p>{list[0]?.transport[lang]}</p>
              <h3>{t.season}</h3>
              <p>{list[0]?.season[lang]}</p>
              <h3>{t.advice}</h3>
              <p>{list[0]?.advice[lang]}</p>
              <h3>{t.accessibility}</h3>
              <p>{essentials.find((e) => e.key === "accessibility")![lang]}</p>
              <p className="review-date">
                {t.reviewed}: {list[0]?.verified}
              </p>
              <SourceList ids={d.sourceIds} t={t} />
            </section>
            <aside className="panel guide-sidebar">
              <Icon name="guide" size={40} />
              <h3>{t.essentials}</h3>
              <p>{t.disclaimer}</p>
              <button className="primary" onClick={() => go("essentials")}>
                {t.essentials}
                <Icon name="arrow" size={18} />
              </button>
            </aside>
          </div>
        )}
      </div>
    </>
  );
}
function AttractionGuide({ a }: { a: Attraction }) {
  const { state, t, go, addStop, togglePlace } = useTravel();
  const lang = state.lang,
    d = districtById(a.district)!;
  return (
    <>
      <section className="detail-hero">
        <Photo id={a.image} alt={a.name[lang]} t={t} priority />
        <div className="detail-hero-copy">
          <span className="eyebrow">
            {lang === "bn" ? d.bn : d.name} ·{" "}
            {lang === "bn" ? d.divisionBn : d.division}
          </span>
          <h1>{a.name[lang]}</h1>
          <div className="detail-actions">
            <button className="primary" onClick={() => addStop(a.id)}>
              <Icon name="plus" size={18} />
              {t.addTrip}
            </button>
            <button
              className="secondary"
              aria-pressed={state.savedPlaces.includes(a.id)}
              onClick={() => togglePlace(a.id)}
            >
              <Icon name="bookmark" size={18} />
              {state.savedPlaces.includes(a.id) ? t.saved : t.save}
            </button>
          </div>
        </div>
      </section>
      <Credit id={a.image} t={t} />
      <div className="reading-layout">
        <article className="reading panel">
          <span className="eyebrow">{t.why}</span>
          <h2>{a.name[lang]}</h2>
          <p className="lead">{a.overview[lang]}</p>
          <h3>{t.activities}</h3>
          <ul className="activity-list">
            {a.activities[lang].split(";").map((x) => (
              <li key={x}>
                <Icon name="check" size={17} />
                {x}
              </li>
            ))}
          </ul>
          <h3>{t.transport}</h3>
          <p>{a.transport[lang]}</p>
          <h3>{t.season}</h3>
          <p>{a.season[lang]}</p>
          <h3>{t.advice}</h3>
          <p>{a.advice[lang]}</p>
          <p className="review-date">
            {t.reviewed}: {a.verified}
          </p>
          <SourceList ids={a.sourceIds} t={t} />
        </article>
        <aside className="panel guide-sidebar">
          <h3>{t.location}</h3>
          <p>
            {lang === "bn"
              ? `${d.bn} · ${d.divisionBn}`
              : `${d.name} · ${d.division}`}
          </p>
          <p>{t.noSchedule}</p>
          <button
            className="text-link"
            onClick={() => go(`district/${d.id}/guide`)}
          >
            {t.moreGuide}
            <Icon name="arrow" size={18} />
          </button>
          <button className="text-link" onClick={() => go("essentials")}>
            {t.essentials}
            <Icon name="arrow" size={18} />
          </button>
        </aside>
      </div>
      <section className="section">
        <h2>{t.nearby}</h2>
        <Cards
          items={attractions.filter(
            (x) => x.district === a.district && x.id !== a.id,
          )}
        />
      </section>
    </>
  );
}
function DishGuide({ f }: { f: Food }) {
  const { state, t, go, toggleFood } = useTravel();
  const lang = state.lang;
  return (
    <>
      <section className="dish-heading">
        <Photo id={f.image} alt={f.name[lang]} t={t} priority />
        <div>
          <span className="eyebrow">{t.regional}</span>
          <h1>{f.name[lang]}</h1>
          <p className="transliteration">
            {f.name.bn} · {f.transliteration}
          </p>
          <p className="lead">{f.overview[lang]}</p>
          <button
            className="primary"
            aria-pressed={state.savedFoods.includes(f.id)}
            onClick={() => toggleFood(f.id)}
          >
            <Icon name="bookmark" size={18} />
            {state.savedFoods.includes(f.id) ? t.saved : t.save}
          </button>
        </div>
      </section>
      <Credit id={f.image} t={t} />
      {f.image === "rasmalai" && (
        <p className="credit">
          {lang === "bn"
            ? "রসমালাইয়ের উদাহরণ ছবি; নির্দিষ্ট কুমিল্লার প্রস্তুতকারকের নয়।"
            : "Illustrative rasmalai photograph; not a specific Cumilla producer."}
        </p>
      )}
      <div className="reading-layout">
        <article className="reading panel">
          <h2>{t.ingredients}</h2>
          <div className="ingredient-tags">
            {f.ingredients[lang].split(";").map((x) => (
              <span key={x}>{x}</span>
            ))}
          </div>
          <h3>{t.flavour}</h3>
          <p>{f.flavor[lang]}</p>
          <h3>{t.culture}</h3>
          <p>{f.culture[lang]}</p>
          <h3>{t.occasions}</h3>
          <p>{f.occasion[lang]}</p>
          <h3>{t.diet}</h3>
          <p>{f.diet[lang]}</p>
          <SourceList ids={f.sourceIds} t={t} />
        </article>
        <aside className="panel guide-sidebar">
          <h3>{t.region}</h3>
          <div className="region-links">
            {f.regions.map((id) => {
              const d = districtById(id)!;
              return (
                <button key={id} onClick={() => go(`district/${id}/food`)}>
                  {lang === "bn" ? d.bn : d.name}
                  <Icon name="arrow" size={16} />
                </button>
              );
            })}
          </div>
          <p>{f.association[lang]}</p>
          <small>
            {t.reviewed}: {f.verified}
          </small>
        </aside>
      </div>
    </>
  );
}
function More() {
  const { state, setState, t, go } = useTravel();
  return (
    <>
      <section className="page-heading">
        <span className="eyebrow">{t.more}</span>
        <h1>{t.settings}</h1>
      </section>
      <section className="settings-grid">
        <div className="panel">
          <h2>{t.settings}</h2>
          <label>
            {t.language}
            <select
              value={state.lang}
              onChange={(e) =>
                setState((p) => ({
                  ...p,
                  lang: e.target.value === "bn" ? "bn" : "en",
                }))
              }
            >
              <option value="en">English</option>
              <option value="bn">বাংলা</option>
            </select>
          </label>
          <label>
            {t.theme}
            <select
              value={state.theme}
              onChange={(e) =>
                setState((p) => ({
                  ...p,
                  theme: e.target.value as State["theme"],
                }))
              }
            >
              <option value="system">{t.system}</option>
              <option value="light">{t.light}</option>
              <option value="dark">{t.dark}</option>
            </select>
          </label>
        </div>
        <div className="more-links">
          {[
            ["essentials", t.essentials, "guide"],
            ["passport", t.passport, "passport"],
            ["quiz", t.quiz, "spark"],
            ["backup", t.backup, "trips"],
            ["sources", t.sources, "history"],
          ].map(([route, label, icon]) => (
            <button key={route} onClick={() => go(route)}>
              <Icon name={icon} />
              <span>{label}</span>
              <Icon name="right" size={18} />
            </button>
          ))}
        </div>
      </section>
      <section className="panel reading">
        <h2>{t.about}</h2>
        <p>{t.aboutText}</p>
        <p>{t.migration}</p>
        <span className="edition">AmarDesh 2.0.1 · {t.local}</span>
        <a
          className="text-link"
          href="https://github.com/sadman-dev-a11y/AmarDesh"
          target="_blank"
          rel="noreferrer"
        >
          {t.openSource}
          <Icon name="arrow" size={18} />
        </a>
      </section>
    </>
  );
}
function Essentials() {
  const { state, t } = useTravel();
  const lang = state.lang;
  return (
    <>
      <section className="page-heading">
        <span className="eyebrow">{t.essentials}</span>
        <h1>{t.essentialsIntro}</h1>
        <p>{t.reviewed}: 2026-11-14</p>
      </section>
      <div className="essentials-grid">
        {essentials.map((e, i) => (
          <section className="panel reading" key={e.key}>
            <span className="eyebrow">{String(i + 1).padStart(2, "0")}</span>
            <h2>{t[e.key]}</h2>
            <p>{e[lang]}</p>
            {e.key === "safety" && (
              <a className="emergency" href="tel:999">
                999 <small>{t.safety}</small>
              </a>
            )}
            <div className="official-links">
              {e.urls.map((url) => (
                <a key={url} href={url} target="_blank" rel="noreferrer">
                  {new URL(url).hostname}
                  <Icon name="arrow" size={16} />
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>
      <section className="panel">
        <h2>{t.phrases}</h2>
        <div className="phrase-grid">
          {phrases.map(([latin, bangla, english, bengali]) => (
            <div key={latin}>
              <strong>{bangla}</strong>
              <span>{latin}</span>
              <small>{lang === "bn" ? bengali : english}</small>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
function Sources() {
  const { t } = useTravel();
  const [query, setQuery] = useState("");
  const list = sources.filter((s) =>
    [s.title, s.publisher, s.url].some((x) =>
      x.toLowerCase().includes(query.toLowerCase()),
    ),
  );
  const download = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(sources, null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "AmarDesh-Research-Sources.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <>
      <section className="page-heading">
        <span className="eyebrow">{t.content}</span>
        <h1>{t.sources}</h1>
        <p>{t.contentNote}</p>
      </section>
      <section className="panel reading">
        <h2>{t.sourceInventory}</h2>
        <p>
          {attractions.length} {t.attractions} · {foods.length} {t.localFood} ·{" "}
          {sources.length} {t.sources}
        </p>
        <label>
          {t.search}
          <input value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <button className="text-link" onClick={download}>
          {t.exportSources}
          <Icon name="arrow" size={17} />
        </button>
        <SourceList ids={list.map((s) => s.id)} t={t} />
      </section>
      <section className="panel">
        <h2>{t.credits}</h2>
        <div className="credits-grid">
          {credits.map((c) => (
            <article key={c.id}>
              <Photo id={c.id} alt={c.id} t={t} />
              <a href={c.source} target="_blank" rel="noreferrer">
                {c.author}
              </a>
              <a href={c.licenseUrl} target="_blank" rel="noreferrer">
                {c.license}
              </a>
              <small>{c.modifications}</small>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
function Backup() {
  const { state, setState, t, notify } = useTravel();
  const [value, setValue] = useState(JSON.stringify(state, null, 2));
  const download = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "AmarDesh-2-backup.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <>
      <section className="page-heading">
        <h1>{t.backup}</h1>
        <p>{t.backupNote}</p>
      </section>
      <section className="panel backup-panel">
        <label>
          {t.backupLabel}
          <textarea
            rows={15}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </label>
        <div className="button-row">
          <button className="primary" onClick={download}>
            {t.download}
          </button>
          <button
            className="secondary"
            onClick={() => {
              try {
                setState(parseState(JSON.parse(value)));
                notify(t.backupGood);
              } catch {
                notify(t.backupBad);
              }
            }}
          >
            {t.restore}
          </button>
        </div>
      </section>
    </>
  );
}
function Passport() {
  const { state, setState, t, go } = useTravel();
  const [selected, setSelected] = useState("");
  const d = districtById(selected);
  const visit = d ? state.visits[d.id] : null;
  return (
    <>
      <section className="page-heading">
        <span className="eyebrow">{t.passport}</span>
        <h1>{t.passportIntro}</h1>
        <p>
          {Object.keys(state.visits).length} / 64 {t.visited}
        </p>
      </section>
      {d && visit && (
        <section className="panel form-grid">
          <h2>{state.lang === "bn" ? d.bn : d.name}</h2>
          <label>
            {t.visitDate}
            <input
              type="date"
              value={visit.date}
              onChange={(e) => {
                if (e.target.value)
                  setState((p) => ({
                    ...p,
                    visits: {
                      ...p.visits,
                      [d.id]: { ...visit, date: e.target.value },
                    },
                  }));
              }}
            />
          </label>
          <label>
            {t.notes}
            <textarea
              value={visit.note}
              maxLength={2000}
              onChange={(e) =>
                setState((p) => ({
                  ...p,
                  visits: {
                    ...p.visits,
                    [d.id]: { ...visit, note: e.target.value },
                  },
                }))
              }
            />
          </label>
        </section>
      )}
      {divisions.map((v) => (
        <section className="passport-division" key={v.id}>
          <h2>{v.name[state.lang]}</h2>
          <div className="stamp-grid">
            {districts
              .filter((d) => d.division === v.name.en)
              .map((d) => (
                <button
                  key={d.id}
                  className={state.visits[d.id] ? "visited" : ""}
                  onClick={() =>
                    state.visits[d.id]
                      ? setSelected(d.id)
                      : go(`district/${d.id}/history`)
                  }
                >
                  <Icon
                    name={state.visits[d.id] ? "check" : "passport"}
                    size={24}
                  />
                  <strong>{state.lang === "bn" ? d.bn : d.name}</strong>
                  <small>{state.visits[d.id]?.date || "—"}</small>
                </button>
              ))}
          </div>
        </section>
      ))}
    </>
  );
}
function Quiz() {
  const { state, setState, t } = useTravel();
  const [index, setIndex] = useState(0),
    [answer, setAnswer] = useState("");
  const d = districts[(index * 17 + 7) % 64];
  const q = quizFor(d, (index % 32) * 2);
  return (
    <>
      <section className="page-heading">
        <span className="eyebrow">{t.quiz}</span>
        <h1>{t.quizQuestion}</h1>
        <p>
          {state.quiz.length} / 64 {t.learned}
        </p>
      </section>
      <section className="panel quiz-panel">
        <h2>{state.lang === "bn" ? d.bn : d.name}</h2>
        <div className="quiz-options">
          {q.options.map((v) => (
            <button
              key={v}
              disabled={!!answer}
              className={answer && v === q.answer ? "correct" : ""}
              onClick={() => {
                setAnswer(v);
                if (v === q.answer)
                  setState((p) => ({
                    ...p,
                    quiz: [...new Set([...p.quiz, d.id])],
                  }));
              }}
            >
              {state.lang === "bn"
                ? divisions.find((d) => d.name.en === v)?.name.bn
                : v}
            </button>
          ))}
        </div>
        {answer && (
          <div role="status">
            <h3>{answer === q.answer ? t.correct : t.incorrect}</h3>
            <p>
              {t.answer}: {state.lang === "bn" ? d.divisionBn : d.division}
            </p>
            <button
              className="primary"
              onClick={() => {
                setIndex((i) => i + 1);
                setAnswer("");
              }}
            >
              {t.nextQuestion}
              <Icon name="arrow" size={18} />
            </button>
          </div>
        )}
      </section>
    </>
  );
}
