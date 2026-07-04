'use client';
import { useEffect, useCallback, useState } from 'react';
import ReactFlow, { Background, Controls, ConnectionMode } from 'reactflow';
import 'reactflow/dist/style.css';
import { CardNode } from './CardNode';
import { useCanvasStore } from '@/stores/canvas.store';
import type { Card } from '@/types/card';
import type { Node, Edge, Connection } from 'reactflow';
import { RefreshCw, Lightbulb } from 'lucide-react';

const nodeTypes = { cardNode: CardNode };

function cardToNode(card: Card, index: number): Node {
  return {
    id: card.id,
    type: 'cardNode',
    position: { x: (index % 4) * 280 + 50, y: Math.floor(index / 4) * 200 + 50 },
    data: { card },
  };
}

function connectionsToEdges(card: Card): Edge[] {
  return card.connections.map((conn, i) => ({
    id: `${card.id}-${conn.cardId}-${i}`,
    source: card.id,
    target: conn.cardId,
    style: {
      stroke: conn.source === 'ai' ? '#94a3b8' : '#3b82f6',
      strokeDasharray: conn.source === 'ai' ? '5,5' : 'none',
    },
    label: conn.reason,
  }));
}

/** Loading skeleton — a grid of placeholder cards */
function LoadingSkeleton() {
  return (
    <div className="absolute inset-0 grid grid-cols-4 gap-6 p-8 content-start opacity-50">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="h-28 rounded-lg bg-gray-100 animate-pulse"
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  );
}

/** Empty state — shown when there are zero cards */
function EmptyState({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
      <Lightbulb className="w-16 h-16 mb-4 opacity-30" />
      <p className="text-lg font-medium text-gray-500 mb-1">暂无灵感</p>
      <p className="text-sm text-gray-400 mb-4">
        前往 <a href="/capture" className="text-blue-500 underline">捕获页面</a> 存入第一条灵感
      </p>
      <button
        onClick={onRefresh}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        刷新
      </button>
    </div>
  );
}

/** Error state — shown when the API call fails */
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <span className="text-red-400 text-xl">!</span>
      </div>
      <p className="text-sm text-gray-500 mb-1">加载失败</p>
      <p className="text-xs text-gray-400 mb-4 max-w-xs text-center">{message}</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        重试
      </button>
    </div>
  );
}

export function Canvas() {
  const { cards, setCards, selectCard } = useCanvasStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCards = useCallback(() => {
    setIsLoading(true);
    setError(null);
    fetch('/api/search')
      .then((r) => {
        if (!r.ok) throw new Error(`请求失败 (${r.status})`);
        return r.json();
      })
      .then((data) => {
        setCards(data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message || '无法加载灵感数据');
        setIsLoading(false);
      });
  }, [setCards]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const nodes: Node[] = cards.map(cardToNode);
  const edges: Edge[] = cards.flatMap(connectionsToEdges);

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    selectCard(node.id);
  }, [selectCard]);

  /** Handle manual connection between two cards (user-dragged edge). */
  const onConnect = useCallback(
    async (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      if (connection.source === connection.target) return;

      const reason = window.prompt('关联原因（可选）:') || '手动关联';

      // Add connection bidirectionally — patch both cards
      const sourceCard = cards.find((c) => c.id === connection.source);
      const targetCard = cards.find((c) => c.id === connection.target);

      const newConn = { cardId: connection.target, reason, source: 'user' as const };
      const reverseConn = { cardId: connection.source, reason, source: 'user' as const };

      const sourceConns = sourceCard
        ? [...sourceCard.connections.filter((c) => c.cardId !== connection.target), newConn]
        : [newConn];
      const targetConns = targetCard
        ? [...targetCard.connections.filter((c) => c.cardId !== connection.source), reverseConn]
        : [reverseConn];

      await Promise.all([
        fetch(`/api/cards/${connection.source}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ connections: sourceConns }),
        }),
        fetch(`/api/cards/${connection.target}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ connections: targetConns }),
        }),
      ]);

      // Refresh canvas to show new edge
      fetchCards();
    },
    [cards, fetchCards],
  );

  if (error) {
    return (
      <div className="w-full h-full relative">
        <ErrorState message={error} onRetry={fetchCards} />
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      {isLoading && <LoadingSkeleton />}

      {!isLoading && cards.length === 0 && <EmptyState onRefresh={fetchCards} />}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={onNodeClick}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        className={isLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
