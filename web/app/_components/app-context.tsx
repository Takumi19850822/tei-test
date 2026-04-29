"use client";

import { createContext, useContext } from "react";

type AppContextValue = {
  loginId: string;
  setLoginId: (value: string) => void;
};

export const AppContext = createContext<AppContextValue | null>(null);

export function useAppContext() {
  const value = useContext(AppContext);
  if (!value) {
    throw new Error("useAppContext must be used within AppContext provider.");
  }
  return value;
}
