import { useState } from "react";
import type { Lang } from "./model";
import { sources, districtById, type Attraction, type Food } from "./tourism";
import type { Words } from "./i18n";
import credits from "../public/photos/credits.json";
const paths: Record<string, string> = {
  home: "M3 10 12 3l9 7v11h-6v-7H9v7H3Z",
  compass: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM16 8l-3 5-5 3 3-5Z",
  food: "M4 3v7a3 3 0 0 0 6 0V3M7 3v19M19 3c-4 4-4 9 0 9h2M21 3v19",
  trips: "M5 7h14a2 2 0 0 1 2 2v11H3V9a2 2 0 0 1 2-2ZM8 7V3h8v4M7 11v5M17 11v5",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  search: "M20 20l-5-5M17 10a7 7 0 1 0-14 0 7 7 0 0 0 14 0Z",
  arrow: "M4 12h16M14 6l6 6-6 6",
  left: "M15 5 8 12l7 7",
  right: "M9 5l7 7-7 7",
  bookmark: "M6 3h12v19l-6-4-6 4Z",
  history: "M3 9h18M5 9v11M10 9v11M15 9v11M20 9v11M3 21h18M2 8l10-6 10 6",
  nature: "M5 19C-1 8 8 2 21 3c0 12-7 20-16 16ZM4 21 16 9",
  guide: "M3 4l6-2 6 2 6-2v18l-6 2-6-2-6 2ZM9 2v18M15 4v18",
  close: "M5 5l14 14M5 19 19 5",
  check: "m4 12 5 5L20 6",
  moon: "M21 13A9 9 0 0 1 11 3a9 9 0 1 0 10 10Z",
  sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 2v2M12 20v2M2 12h2M20 12h2M5 5l1 1M18 18l1 1M5 19l1-1M18 6l1-1",
  offline:
    "M3 7a15 15 0 0 1 18 0M6 11a10 10 0 0 1 12 0M9 15a5 5 0 0 1 6 0M12 20h.01",
  plus: "M12 4v16M4 12h16",
  share: "M12 16V3M7 8l5-5 5 5M5 13v8h14v-8",
  passport: "M5 2h14v20H5ZM8 7h8M8 11h8M8 16h4",
  spark: "m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z",
};
export function Icon({ name, size = 22 }: { name: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={name === "more" ? 4 : 1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] || paths.compass} />
    </svg>
  );
}
export function Photo({
  id,
  alt,
  className = "",
  priority = false,
  caption = false,
  t,
}: {
  id?: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
  caption?: boolean;
  t: Words;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`photo ${className} ${!id || failed ? "illustrated" : ""}`}>
      {id && !failed ? (
        <img
          src={`${import.meta.env.BASE_URL}photos/${id}.jpg`}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="illustration" aria-label={alt}>
          <Icon name="compass" size={44} />
          <span>{alt}</span>
          {failed && (
            <button className="image-retry" onClick={() => setFailed(false)}>
              {t.photoRetry}
            </button>
          )}
        </div>
      )}
      {caption && (
        <span className="photo-caption">
          {id && !failed ? alt : t.illustration}
        </span>
      )}
    </div>
  );
}
export function Credit({ id, t }: { id: string | null | undefined; t: Words }) {
  const c = credits.find((c) => c.id === id);
  return c ? (
    <p className="credit">
      <a href={c.source} target="_blank" rel="noreferrer">
        {t.photoAttribution}: {c.author} · {c.license}
      </a>
    </p>
  ) : null;
}
export function SourceList({ ids, t }: { ids: string[]; t: Words }) {
  return (
    <section className="source-list">
      <h3>{t.sources}</h3>
      {[...new Set(ids)].map((id) => {
        const s = sources.find((s) => s.id === id);
        return s ? (
          <article key={id}>
            <a href={s.url} target="_blank" rel="noreferrer">
              {s.title}
              <Icon name="arrow" size={15} />
            </a>
            <small>
              {s.publisher} {s.published && `· ${t.published}: ${s.published}`}{" "}
              · {t.verification}: {s.verified}
            </small>
          </article>
        ) : null;
      })}
    </section>
  );
}
export function PlaceCard({
  a,
  lang,
  t,
  saved,
  onSave,
  onOpen,
  small = false,
}: {
  a: Attraction;
  lang: Lang;
  t: Words;
  saved: boolean;
  onSave: () => void;
  onOpen: () => void;
  small?: boolean;
}) {
  const d = districtById(a.district)!;
  return (
    <article className={`place-card ${small ? "small" : ""}`}>
      <div className="card-photo">
        <button
          className="cover-button"
          onClick={onOpen}
          aria-label={`${t.place}: ${a.name[lang]}`}
        >
          <Photo id={a.image} alt={a.name[lang]} t={t} />
        </button>
        <button
          className={`save-button ${saved ? "is-saved" : ""}`}
          aria-label={`${saved ? t.saved : t.save}: ${a.name[lang]}`}
          aria-pressed={saved}
          onClick={onSave}
        >
          <Icon name="bookmark" size={18} />
        </button>
        <span className="category-pill">
          {a.category === "heritage"
            ? t.history
            : a.category === "coast"
              ? t.beaches
              : a.category === "nature"
                ? t.nature
                : t.culture}
        </span>
      </div>
      <div className="card-copy">
        <span className="eyebrow">
          {lang === "bn" ? d.bn : d.name} ·{" "}
          {lang === "bn" ? d.divisionBn : d.division}
        </span>
        <button className="card-title" onClick={onOpen}>
          {a.name[lang]}
          <Icon name="arrow" size={18} />
        </button>
        <p>{a.overview[lang]}</p>
      </div>
    </article>
  );
}
export function FoodCard({
  f,
  lang,
  t,
  saved,
  onSave,
  onOpen,
}: {
  f: Food;
  lang: Lang;
  t: Words;
  saved: boolean;
  onSave: () => void;
  onOpen: () => void;
}) {
  return (
    <article className="food-card">
      <div className="card-photo">
        <button
          className="cover-button"
          onClick={onOpen}
          aria-label={`${t.dish}: ${f.name[lang]}`}
        >
          <Photo id={f.image} alt={f.name[lang]} t={t} />
        </button>
        <button
          className={`save-button ${saved ? "is-saved" : ""}`}
          aria-label={`${saved ? t.saved : t.save}: ${f.name[lang]}`}
          aria-pressed={saved}
          onClick={onSave}
        >
          <Icon name="bookmark" size={18} />
        </button>
      </div>
      <div className="card-copy">
        <span className="eyebrow">
          {f.regions
            .slice(0, 2)
            .map((id) => {
              const d = districtById(id)!;
              return lang === "bn" ? d.bn : d.name;
            })
            .join(" · ")}
        </span>
        <button className="card-title" onClick={onOpen}>
          {f.name[lang]}
          <Icon name="arrow" size={18} />
        </button>
        <p>{f.overview[lang]}</p>
      </div>
    </article>
  );
}
