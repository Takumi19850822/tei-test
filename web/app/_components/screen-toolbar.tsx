"use client";

import { ReactNode } from "react";

type Props = {
  children?: ReactNode;
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  showSearch?: boolean;
};

export function ScreenToolbar({
  children,
  searchPlaceholder = "一覧を検索…",
  searchValue,
  onSearchChange,
  showSearch = true,
}: Props) {
  return (
    <div className="screen-toolbar">
      {showSearch ? (
        <input
          type="search"
          className="list-search-input"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          autoComplete="off"
          aria-label="一覧検索"
        />
      ) : null}
      {children ? <div className="screen-toolbar-actions">{children}</div> : null}
    </div>
  );
}
