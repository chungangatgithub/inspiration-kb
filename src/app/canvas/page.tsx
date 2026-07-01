'use client';
import { Canvas } from '@/components/canvas/Canvas';
import { SearchBar } from '@/components/canvas/SearchBar';
import { CardDetailSheet } from '@/components/canvas/CardDetailSheet';

export default function CanvasPage() {
  return (
    <main className="h-screen flex flex-col">
      <header className="p-3 border-b bg-white flex items-center gap-4">
        <h1 className="font-semibold">灵感画布</h1>
        <SearchBar />
      </header>
      <div className="flex-1 relative">
        <Canvas />
      </div>
      <CardDetailSheet />
    </main>
  );
}
