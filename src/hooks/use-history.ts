"use client";

import { useState, useCallback, useEffect } from "react";

export interface HistoryItem {
  id: string;
  title: string;
  date: string;
  duration: string;
  score: number;
}

const STORAGE_KEY = "voicecraft-history";
const MAX_ITEMS = 50;

function loadHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveHistory(items: HistoryItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // localStorage full or unavailable
  }
}

export function useHistory() {
  const [items, setItems] = useState<HistoryItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    setItems(loadHistory());
  }, []);

  const addItem = useCallback(
    (item: Omit<HistoryItem, "id">) => {
      setItems((prev) => {
        const newItems = [
          { ...item, id: String(Date.now()) },
          ...prev,
        ].slice(0, MAX_ITEMS);
        saveHistory(newItems);
        return newItems;
      });
    },
    [],
  );

  const clearHistory = useCallback(() => {
    setItems([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return { items, addItem, clearHistory };
}
