'use client';

import { useState, useEffect, useRef, useCallback } from "react";

interface SearchAutocompleteProps {
  menuItems: { itemName: string; category: string | null }[];
  onSearch: (query: string) => void;
  placeholder?: string;
}

export default function SearchAutocomplete({
  menuItems,
  onSearch,
  placeholder = "Search drinks...",
}: SearchAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("menu-recent-searches");
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch {
        setRecentSearches([]);
      }
    }
  }, []);

  const saveRecentSearch = useCallback((search: string) => {
    if (!search.trim()) return;
    const trimmed = search.trim();
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 5);
      localStorage.setItem("menu-recent-searches", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);
      onSearch(value);

      if (value.trim().length >= 1) {
        const lowerValue = value.toLowerCase();
        const matches = menuItems
          .filter((item) =>
            item.itemName.toLowerCase().includes(lowerValue)
          )
          .slice(0, 8)
          .map((item) => item.itemName);
        setSuggestions(matches);
        setShowSuggestions(true);
        setHighlightedIndex(-1);
      } else if (value.trim().length === 0) {
        setSuggestions(recentSearches);
        setShowSuggestions(recentSearches.length > 0);
        setHighlightedIndex(-1);
      } else {
        setShowSuggestions(false);
        setHighlightedIndex(-1);
      }
    },
    [menuItems, onSearch, recentSearches]
  );

  const handleFocus = useCallback(() => {
    if (query.trim().length === 0 && recentSearches.length > 0) {
      setSuggestions(recentSearches);
      setShowSuggestions(true);
    } else if (query.trim().length >= 1) {
      setShowSuggestions(true);
    }
  }, [query, recentSearches]);

  const handleBlur = useCallback(() => {
    setTimeout(() => setShowSuggestions(false), 150);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showSuggestions || suggestions.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
            const selected = suggestions[highlightedIndex];
            setQuery(selected);
            onSearch(selected);
            saveRecentSearch(selected);
            setShowSuggestions(false);
            setHighlightedIndex(-1);
          } else if (query.trim()) {
            saveRecentSearch(query.trim());
          }
          break;
        case "Escape":
          setShowSuggestions(false);
          setHighlightedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    },
    [showSuggestions, suggestions, highlightedIndex, query, onSearch, saveRecentSearch]
  );

  const selectSuggestion = useCallback(
    (suggestion: string) => {
      setQuery(suggestion);
      onSearch(suggestion);
      saveRecentSearch(suggestion);
      setShowSuggestions(false);
      setHighlightedIndex(-1);
      inputRef.current?.focus();
    },
    [onSearch, saveRecentSearch]
  );

  const clearSearch = useCallback(() => {
    setQuery("");
    onSearch("");
    setShowSuggestions(false);
    setHighlightedIndex(-1);
  }, [onSearch]);

  const displaySuggestions = showSuggestions
    ? query.trim().length === 0
      ? recentSearches.map((s, i) => ({
          label: s,
          index: i,
          isRecent: true,
        }))
      : suggestions.map((s, i) => ({
          label: s,
          index: i,
          isRecent: false,
        }))
    : [];

  return (
    <div className="relative w-full">
      <label htmlFor="menu-search" className="sr-only">
        Search menu
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          id="menu-search"
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full bg-white border border-dark-brown/30 rounded-xl px-4 py-3 pl-11 font-roboto-mono text-dark-brown focus:outline-none focus:ring-2 focus:ring-amber-800/30 placeholder:text-dark-brown/50 transition-all duration-150"
          aria-label="Search drinks"
          aria-autocomplete="list"
          aria-controls="search-suggestions"
          aria-expanded={showSuggestions && displaySuggestions.length > 0}
          autoComplete="off"
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-brown/40 pointer-events-none" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </div>
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-brown/40 hover:text-dark-brown transition-colors p-1 rounded-lg hover:bg-amber-100"
            aria-label="Clear search"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {showSuggestions && displaySuggestions.length > 0 && (
        <ul
          ref={listRef}
          id="search-suggestions"
          role="listbox"
          aria-label="Search suggestions"
          className="absolute top-full left-0 right-0 z-30 mt-1.5 bg-white border border-dark-brown/20 rounded-xl shadow-lg overflow-hidden"
        >
          {query.trim().length === 0 && recentSearches.length > 0 && (
            <li className="px-3 py-1.5 border-b border-dark-brown/10">
              <p className="text-xs font-roboto-condensed tracking-wider text-dark-brown/50 uppercase">
                Recent searches
              </p>
            </li>
          )}
          {displaySuggestions.map(({ label, index, isRecent }) => (
            <li key={`${label}-${index}`}>
              <button
                type="button"
                role="option"
                aria-selected={index === highlightedIndex}
                onClick={() => selectSuggestion(label)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`w-full px-4 py-3 text-left font-roboto-mono text-sm transition-colors ${
                  index === highlightedIndex
                    ? "bg-amber-50 text-dark-brown"
                    : "text-dark-brown/80 hover:bg-amber-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={isRecent ? "text-amber-500" : "text-dark-brown/40"}
                    aria-hidden="true"
                  >
                    {isRecent ? (
                      <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    ) : (
                      <circle cx="11" cy="11" r="8" />
                    )}
                    {!isRecent && <path d="M21 21l-4.35-4.35" />}
                  </svg>
                  <span>{label}</span>
                  {isRecent && (
                    <span className="ml-auto text-xs text-dark-brown/40 font-roboto-condensed">
                      Recent
                    </span>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}