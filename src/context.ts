import {
  createContext,
  useContext,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { State } from "./tourism";
import type { Words } from "./i18n";
export type TravelContext = {
  state: State;
  setState: Dispatch<SetStateAction<State>>;
  t: Words;
  go: (route: string) => void;
  togglePlace: (id: string) => void;
  toggleFood: (id: string) => void;
  addStop: (id: string) => void;
  notify: (message: string) => void;
};
export const Context = createContext<TravelContext | null>(null);
export function useTravel() {
  const value = useContext(Context);
  if (!value) throw Error("Travel context missing");
  return value;
}
