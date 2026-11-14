import { useState } from "react";
import { useTravel } from "./context";
import { attractions, foods, itinerarySummary, type Trip } from "./tourism";
import { Icon, PlaceCard, FoodCard } from "./components";
export function Trips() {
  const { state, setState, t, go, togglePlace, toggleFood, notify } =
    useTravel();
  const [name, setName] = useState(""),
    [summary, setSummary] = useState(""),
    [removed, setRemoved] = useState<Trip | null>(null);
  const lang = state.lang;
  const current =
    state.trips.find((x) => x.id === state.activeTrip) || state.trips[0];
  const update = (patch: Partial<Trip>) =>
    setState((p) => ({
      ...p,
      trips: p.trips.map((x) =>
        x.id === current?.id ? { ...x, ...patch } : x,
      ),
    }));
  const create = () => {
    if (!name.trim()) {
      notify(t.nameRequired);
      return;
    }
    const trip: Trip = {
      id: "trip-" + Date.now(),
      name: name.trim().slice(0, 100),
      start: "",
      days: 3,
      stops: [],
      notes: "",
      budget: 0,
    };
    setState((p) => ({ ...p, trips: [...p.trips, trip], activeTrip: trip.id }));
    setName("");
  };
  const share = async () => {
    if (!current) return;
    const text = itinerarySummary(current, lang);
    setSummary(text);
    try {
      if (navigator.share) await navigator.share({ title: current.name, text });
      else if (navigator.clipboard) await navigator.clipboard.writeText(text);
    } catch {
      /* The selectable summary remains available if sharing is cancelled. */
    }
    notify(t.shareReady);
  };
  const move = (i: number, direction: number) => {
    if (!current) return;
    const stops = [...current.stops];
    [stops[i], stops[i + direction]] = [stops[i + direction], stops[i]];
    update({ stops });
  };
  return (
    <>
      <section className="page-heading">
        <span className="eyebrow">{t.trips}</span>
        <h1>{t.tripsTitle}</h1>
        <p>{t.tripsIntro}</p>
      </section>
      <section className="new-trip panel">
        <label>
          {t.tripName}
          <input
            value={name}
            maxLength={100}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.newTrip}
          />
        </label>
        <button className="primary" onClick={create}>
          <Icon name="plus" size={18} />
          {t.create}
        </button>
      </section>
      {!current ? (
        <div className="empty-state">
          <Icon name="trips" size={42} />
          <p>{t.tripEmpty}</p>
        </div>
      ) : (
        <div className="trip-layout">
          <section className="panel trip-editor">
            <label>
              {t.tripSelect}
              <select
                value={current.id}
                onChange={(e) => {
                  setState((p) => ({ ...p, activeTrip: e.target.value }));
                  setSummary("");
                }}
              >
                {state.trips.map((trip) => (
                  <option key={trip.id} value={trip.id}>
                    {trip.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="trip-heading">
              <h2>{current.name}</h2>
              <button
                aria-label={t.share}
                className="icon-button"
                onClick={share}
              >
                <Icon name="share" />
              </button>
            </div>
            <div className="form-grid">
              <label>
                {t.tripName}
                <input
                  value={current.name}
                  maxLength={100}
                  onChange={(e) => update({ name: e.target.value })}
                />
              </label>
              <label>
                {t.start}
                <input
                  type="date"
                  value={current.start}
                  onChange={(e) => update({ start: e.target.value })}
                />
              </label>
              <label>
                {t.days}
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={current.days}
                  onChange={(e) => {
                    const days = Math.max(
                      1,
                      Math.min(30, Number(e.target.value) || 1),
                    );
                    update({
                      days,
                      stops: current.stops.map((s) => ({
                        ...s,
                        day: Math.min(days, s.day),
                      })),
                    });
                  }}
                />
              </label>
            </div>
            <label className="add-stop">
              {t.addPlace}
              <select
                value=""
                onChange={(e) =>
                  update({
                    stops: [
                      ...current.stops,
                      {
                        id: e.target.value,
                        day: Math.min(current.days, current.stops.length + 1),
                        notes: "",
                      },
                    ],
                  })
                }
              >
                <option value="" disabled>
                  {t.selectPlace}
                </option>
                {attractions
                  .filter((a) => !current.stops.some((s) => s.id === a.id))
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name[lang]}
                    </option>
                  ))}
              </select>
            </label>
            {!current.stops.length && (
              <p className="empty-state">{t.noStops}</p>
            )}
            {current.stops.map((stop, i) => {
              const a = attractions.find((a) => a.id === stop.id)!;
              return (
                <article className="trip-stop" key={stop.id + "-" + i}>
                  <span className="stop-number">{i + 1}</span>
                  <div>
                    <button
                      className="stop-name"
                      onClick={() => go("place/" + a.id)}
                    >
                      {a.name[lang]}
                      <Icon name="arrow" size={16} />
                    </button>
                    <label>
                      {t.day}
                      <select
                        aria-label={`${t.day}: ${a.name[lang]}`}
                        value={stop.day}
                        onChange={(e) =>
                          update({
                            stops: current.stops.map((s, j) =>
                              i === j
                                ? { ...s, day: Number(e.target.value) }
                                : s,
                            ),
                          })
                        }
                      >
                        {Array.from({ length: current.days }, (_, j) => (
                          <option key={j} value={j + 1}>
                            {j + 1}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="sr-only" htmlFor={"note" + i}>
                      {t.stopNotes}: {a.name[lang]}
                    </label>
                    <textarea
                      id={"note" + i}
                      maxLength={2000}
                      value={stop.notes}
                      placeholder={t.stopNotes}
                      onChange={(e) =>
                        update({
                          stops: current.stops.map((s, j) =>
                            i === j ? { ...s, notes: e.target.value } : s,
                          ),
                        })
                      }
                    />
                    <div className="stop-actions">
                      <button disabled={i === 0} onClick={() => move(i, -1)}>
                        {t.moveUp}
                      </button>
                      <button
                        disabled={i === current.stops.length - 1}
                        onClick={() => move(i, 1)}
                      >
                        {t.moveDown}
                      </button>
                      <button
                        onClick={() =>
                          update({
                            stops: current.stops.filter((_, j) => i !== j),
                          })
                        }
                      >
                        {t.remove}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
            <label>
              {t.notes}
              <textarea
                value={current.notes}
                maxLength={2000}
                onChange={(e) => update({ notes: e.target.value })}
              />
            </label>
            <button
              className="danger-text"
              onClick={() => {
                setRemoved(current);
                setState((p) => ({
                  ...p,
                  trips: p.trips.filter((x) => x.id !== current.id),
                  activeTrip:
                    p.trips.find((x) => x.id !== current.id)?.id || "",
                }));
                notify(t.tripDeleted);
              }}
            >
              {t.deleteTrip}
            </button>
            {summary && (
              <label className="shared-summary">
                {t.shareReady}
                <textarea value={summary} readOnly rows={8} />
              </label>
            )}
          </section>
          <aside className="panel budget">
            <span className="eyebrow">{t.journey}</span>
            <h3>{t.budget}</h3>
            <label>
              <span className="sr-only">{t.budget}</span>
              <input
                type="number"
                min={0}
                max={1e8}
                value={current.budget}
                onChange={(e) =>
                  update({
                    budget: Math.max(
                      0,
                      Math.min(1e8, Number(e.target.value) || 0),
                    ),
                  })
                }
              />
            </label>
            <p>{t.budgetNote}</p>
            <button className="primary" onClick={share}>
              <Icon name="share" size={18} />
              {t.share}
            </button>
            <p className="subtle">{t.suggestedNote}</p>
            <button className="text-link" onClick={() => go("essentials")}>
              {t.essentials}
              <Icon name="arrow" size={18} />
            </button>
          </aside>
        </div>
      )}
      {removed && (
        <div className="undo-bar">
          {t.tripDeleted}
          <button
            onClick={() => {
              setState((p) => ({
                ...p,
                trips: [...p.trips, removed],
                activeTrip: removed.id,
              }));
              setRemoved(null);
            }}
          >
            {t.undo}
          </button>
        </div>
      )}
      <section className="section">
        <div className="section-title">
          <h2>{t.savedPlaces}</h2>
          <span>{state.savedPlaces.length}</span>
        </div>
        {state.savedPlaces.length ? (
          <div className="place-grid">
            {attractions
              .filter((a) => state.savedPlaces.includes(a.id))
              .map((a) => (
                <PlaceCard
                  key={a.id}
                  a={a}
                  lang={lang}
                  t={t}
                  saved
                  onSave={() => togglePlace(a.id)}
                  onOpen={() => go("place/" + a.id)}
                />
              ))}
          </div>
        ) : (
          <p className="empty-state">{t.noSaved}</p>
        )}
      </section>
      <section className="section">
        <h2>{t.savedFoods}</h2>
        {state.savedFoods.length ? (
          <div className="food-grid">
            {foods
              .filter((f) => state.savedFoods.includes(f.id))
              .map((f) => (
                <FoodCard
                  key={f.id}
                  f={f}
                  lang={lang}
                  t={t}
                  saved
                  onSave={() => toggleFood(f.id)}
                  onOpen={() => go("dish/" + f.id)}
                />
              ))}
          </div>
        ) : (
          <p className="empty-state">{t.noSaved}</p>
        )}
      </section>
    </>
  );
}
