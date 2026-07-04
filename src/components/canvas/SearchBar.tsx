'use client';
import { useState, useCallback, type FormEvent } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { useCanvasStore } from '@/stores/canvas.store';

export function SearchBar() {
  const { searchQuery, setSearchQuery, setCards } = useCanvasStore();
  const [value, setValue] = useState(searchQuery);
  const [searching, setSearching] = useState(false);

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    setSearchQuery(value);
    setSearching(true);
    try {
      const params = new URLSearchParams();
      if (value) params.set('q', value);
      const res = await fetch(`/api/search?${params.toString()}`);
      const cards = await res.json();
      setCards(cards);
    } finally {
      setSearching(false);
    }
  }, [value, setSearchQuery, setCards]);

  const handleClear = useCallback(() => {
    setValue('');
    setSearchQuery('');
    // Reload all cards
    fetch('/api/search')
      .then((r) => r.json())
      .then(setCards);
  }, [setSearchQuery, setCards]);

  return (
    <form onSubmit={handleSubmit} className="relative flex-1 max-w-sm">
      {searching ? (
        <Loader2 size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
      ) : (
        <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="搜索灵感..."
        className="w-full pl-8 pr-8 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 transition-shadow"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="清除搜索"
        >
          <X size={14} />
        </button>
      )}
    </form>
  );
}
