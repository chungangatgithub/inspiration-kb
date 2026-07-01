'use client';
import { useEffect, useCallback } from 'react';
import ReactFlow, { Background, Controls, ConnectionMode } from 'reactflow';
import 'reactflow/dist/style.css';
import { CardNode } from './CardNode';
import { useCanvasStore } from '@/stores/canvas.store';
import type { Card } from '@/types/card';
import type { Node, Edge } from 'reactflow';

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

export function Canvas() {
  const { cards, setCards, selectCard } = useCanvasStore();

  useEffect(() => {
    fetch('/api/search').then(r => r.json()).then(setCards);
  }, [setCards]);

  const nodes: Node[] = cards.map(cardToNode);
  const edges: Edge[] = cards.flatMap(connectionsToEdges);

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    selectCard(node.id);
  }, [selectCard]);

  return (
    <div className="w-full h-full">
      <ReactFlow nodes={nodes} edges={edges} onNodeClick={onNodeClick}
        nodeTypes={nodeTypes} connectionMode={ConnectionMode.Loose} fitView>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
