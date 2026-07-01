'use client';
import { useState, FormEvent } from 'react';
import { Search } from 'lucide-react';
import { useCanvasStore } from '@/stores/canvas.store';

export function SearchBar() {
  const { searchQuery, setSearchQuery, setCards } = useCanvasStore();
  const [value, setValue] = useState(searchQuery);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSearchQuery(value);
    const params = new URLSearchParams();
    if (value) params.set('q', value);
    const res = await fetch(`/api/search?${params.toString()}`);
    const cards = await res.json();
    setCards(cards);
  };

  return (
    <form onSubmit={handleSubmit} className="relative flex-1 max-w-sm">
      <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="搜索灵感..."
        className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
    </form>
  );
}
