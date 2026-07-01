import { create } from 'zustand';
import type { Card } from '@/types/card';

interface CanvasState {
  cards: Card[];
  setCards: (cards: Card[]) => void;
  selectedCardId: string | null;
  selectCard: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  cards: [],
  setCards: (cards) => set({ cards }),
  selectedCardId: null,
  selectCard: (id) => set({ selectedCardId: id }),
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),
}));
