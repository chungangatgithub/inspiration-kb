'use client';
import { useMemo, useCallback } from 'react';
import { Filter, X } from 'lucide-react';
import { useCanvasStore } from '@/stores/canvas.store';

const TYPE_LABELS: Record<string, string> = {
  webpage: '网页',
  video: '视频',
  book: '书籍',
  social_post: '社交',
  game: '游戏',
  screenshot: '截图',
  thought: '想法',
};

export function FilterPanel() {
  const { cards, setCards } = useCanvasStore();

  const { themes, tags, types } = useMemo(() => {
    const themeSet = new Set<string>();
    const tagSet = new Set<string>();
    const typeSet = new Set<string>();
    for (const card of cards) {
      for (const t of card.ai_themes) themeSet.add(t);
      for (const t of card.ai_tags) tagSet.add(t);
      if (card.source.type) typeSet.add(card.source.type);
    }
    return {
      themes: Array.from(themeSet).sort(),
      tags: Array.from(tagSet).sort(),
      types: Array.from(typeSet).sort(),
    };
  }, [cards]);

  const fetchFiltered = useCallback(
    async (key: string, value: string | null) => {
      const params = new URLSearchParams();
      if (value) params.set(key, value);
      const res = await fetch(`/api/search?${params.toString()}`);
      const data = await res.json();
      setCards(data);
    },
    [setCards],
  );

  const fetchAll = useCallback(async () => {
    const res = await fetch('/api/search');
    const data = await res.json();
    setCards(data);
  }, [setCards]);

  if (themes.length === 0 && tags.length === 0 && types.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap text-xs">
      <Filter size={14} className="text-gray-400 flex-shrink-0" />

      {/* Theme filter */}
      {themes.length > 0 && (
        <select
          onChange={(e) => {
            if (e.target.value) fetchFiltered('theme', e.target.value);
            else fetchAll();
          }}
          className="border border-gray-200 rounded px-2 py-1 bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer"
          defaultValue=""
        >
          <option value="">全部主题</option>
          {themes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      )}

      {/* Tag filter */}
      {tags.length > 0 && (
        <select
          onChange={(e) => {
            if (e.target.value) fetchFiltered('tag', e.target.value);
            else fetchAll();
          }}
          className="border border-gray-200 rounded px-2 py-1 bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer"
          defaultValue=""
        >
          <option value="">全部标签</option>
          {tags.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      )}

      {/* Type filter */}
      {types.length > 0 && (
        <select
          onChange={(e) => {
            if (e.target.value) fetchFiltered('type', e.target.value);
            else fetchAll();
          }}
          className="border border-gray-200 rounded px-2 py-1 bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer"
          defaultValue=""
        >
          <option value="">全部类型</option>
          {types.map((t) => (
            <option key={t} value={t}>{TYPE_LABELS[t] || t}</option>
          ))}
        </select>
      )}

      {/* Clear all */}
      <button
        onClick={fetchAll}
        className="flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors"
        title="清除筛选"
      >
        <X size={12} />
      </button>
    </div>
  );
}
