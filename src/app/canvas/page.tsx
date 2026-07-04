'use client';
import { Canvas } from '@/components/canvas/Canvas';
import { SearchBar } from '@/components/canvas/SearchBar';
import { CardDetailSheet } from '@/components/canvas/CardDetailSheet';
import { FilterPanel } from '@/components/canvas/FilterPanel';

export default function CanvasPage() {
  return (
    <main className="h-screen flex flex-col">
      <header className="p-3 border-b bg-white flex items-center gap-4 flex-shrink-0 flex-wrap">
        <h1 className="font-semibold text-sm sm:text-base whitespace-nowrap">灵感画布</h1>
        <SearchBar />
        <FilterPanel />
      </header>
      <div className="flex-1 relative min-h-0">
        <Canvas />
        <CardDetailSheet />
      </div>
    </main>
  );
}
