import { useEffect, useRef, useState } from "react";
import { useTravel } from "./context";
import {
  chooseDivision,
  chooseDistrict,
  districts,
  divisions,
  districtById,
  type Section,
  normalize,
} from "./tourism";
import { Icon, Photo } from "./components";
export function Discovery() {
  const { state, setState, t, go } = useTravel();
  const { lang } = state;
  const track = useRef<HTMLDivElement>(null),
    swiping = useRef(false),
    timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [q, setQ] = useState("");
  const current = divisions.findIndex((v) => v.name.en === state.division);
  const district = districtById(state.district)!;
  useEffect(() => () => clearTimeout(timer.current), []);
  const center = (index: number, behavior: ScrollBehavior) => {
    const root = track.current;
    const card = root?.children[index] as HTMLElement | undefined;
    if (root && card)
      root.scrollTo({
        left:
          card.offsetLeft -
          root.offsetLeft -
          (root.clientWidth - card.clientWidth) / 2,
        behavior,
      });
  };
  useEffect(() => {
    swiping.current = false;
    clearTimeout(timer.current);
    center(current, "instant");
  }, [current]);
  const select = (index: number) => {
    swiping.current = false;
    clearTimeout(timer.current);
    const next = (index + divisions.length) % divisions.length;
    setState((p) => chooseDivision(p, divisions[next].name.en));
    center(
      next,
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    );
  };
  const matches = q.trim()
    ? districts.filter((d) =>
        [d.name, d.bn, ...d.aliases].some((x) =>
          normalize(x).includes(normalize(q)),
        ),
      )
    : [];
  const sections: [Section, string, string, string][] = [
    ["attractions", t.attractions, t.attractionsHint, "nature"],
    ["food", t.localFood, t.foodHint, "food"],
    ["history", t.history, t.historyHint, "history"],
    ["guide", t.guide, t.guideHint, "compass"],
  ];
  return (
    <section className="discovery section" id="discover">
      <div className="section-title">
        <div>
          <span className="eyebrow">{t.step1}</span>
          <h2>{t.where}</h2>
        </div>
        <div className="carousel-controls">
          <button
            onClick={() => select(current - 1)}
            aria-label={`${t.previous} ${t.division}`}
          >
            <Icon name="left" />
          </button>
          <button
            onClick={() => select(current + 1)}
            aria-label={`${t.next} ${t.division}`}
          >
            <Icon name="right" />
          </button>
        </div>
      </div>
      <div
        className="division-track"
        ref={track}
        role="group"
        aria-label={t.division}
        onPointerDown={() => {
          swiping.current = true;
        }}
        onWheel={() => {
          swiping.current = true;
        }}
        onScroll={() => {
          if (!swiping.current) return;
          clearTimeout(timer.current);
          timer.current = setTimeout(() => {
            const root = track.current;
            if (!root) return;
            const center = root.scrollLeft + root.clientWidth / 2;
            const cards = Array.from(root.children) as HTMLElement[];
            let nearest = 0;
            let distance = Infinity;
            cards.forEach((c, i) => {
              const diff = Math.abs(
                c.offsetLeft - root.offsetLeft + c.clientWidth / 2 - center,
              );
              if (diff < distance) {
                distance = diff;
                nearest = i;
              }
            });
            setState((p) => chooseDivision(p, divisions[nearest].name.en));
            swiping.current = false;
          }, 160);
        }}
      >
        {divisions.map((v, i) => (
          <button
            key={v.id}
            className={`division-card ${v.name.en === state.division ? "selected" : ""}`}
            onClick={() => select(i)}
            aria-pressed={v.name.en === state.division}
            aria-label={v.name[lang]}
          >
            <Photo id={v.image} alt={v.caption[lang]} t={t} />
            <span className="division-shade" />
            <span className="division-copy">
              <small>
                {districts.filter((d) => d.division === v.name.en).length}{" "}
                {t.countDistricts}
              </small>
              <strong>{v.name[lang]}</strong>
              <span>{v.tagline[lang]}</span>
            </span>
            <span className="division-check">
              <Icon
                name={v.name.en === state.division ? "check" : "arrow"}
                size={17}
              />
            </span>
          </button>
        ))}
      </div>
      <div className="district-selection">
        <div className="district-bar">
          <div>
            <span className="eyebrow">{t.step2}</span>
            <h3>{t.chooseDistrict}</h3>
          </div>
          <label className="district-find">
            <Icon name="search" size={18} />
            <input
              aria-label={t.searchDistrict}
              placeholder={t.searchDistrict}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>
        </div>
        {q.trim() && (
          <div
            className="district-suggestions"
            role="group"
            aria-label={t.results}
          >
            {matches.map((d) => (
              <button
                key={d.id}
                onClick={() => {
                  setState((p) => chooseDistrict(p, d.id));
                  setQ("");
                }}
              >
                {lang === "bn" ? d.bn : d.name}
                <small>{lang === "bn" ? d.divisionBn : d.division}</small>
              </button>
            ))}
            {!matches.length && <p>{t.searchEmpty}</p>}
          </div>
        )}
        <div
          className="district-chips"
          role="group"
          aria-label={t.chooseDistrict}
        >
          {districts
            .filter((d) => d.division === state.division)
            .map((d) => (
              <button
                key={d.id}
                onClick={() => setState((p) => chooseDistrict(p, d.id))}
                aria-pressed={d.id === state.district}
              >
                {lang === "bn" ? d.bn : d.name}
              </button>
            ))}
        </div>
      </div>
      <div className="selected-district" key={district.id}>
        <div className="selected-title">
          <div>
            <span className="eyebrow">{t.step3}</span>
            <h2>
              {lang === "bn"
                ? `${district.bn} ঘুরে দেখুন`
                : `Explore ${district.name}`}
            </h2>
            <p>{district.description[lang]}</p>
          </div>
          <span className="coordinates-label">
            <Icon name="compass" size={36} />
          </span>
        </div>
        <div className="exploration-grid">
          {sections.map(([key, title, hint, icon]) => (
            <button
              key={key}
              onClick={() => go(`district/${district.id}/${key}`)}
              className={`exploration-card ${key}`}
            >
              <span className="option-icon">
                <Icon name={icon} size={25} />
              </span>
              <span>
                <strong>{title}</strong>
                <small>{hint}</small>
              </span>
              <Icon name="arrow" size={19} />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
