'use client';
import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { TypeIcon } from '@/components/shared/TypeIcon';
import type { Card } from '@/types/card';

// Map theme names to left-border colors
const themeColors: Record<string, string> = {
  设计: 'border-l-rose-400',
  编程: 'border-l-blue-500',
  写作: 'border-l-amber-500',
  音乐: 'border-l-purple-500',
  商业: 'border-l-emerald-500',
  摄影: 'border-l-cyan-500',
  游戏: 'border-l-indigo-500',
  影视: 'border-l-red-500',
};

function themeBorder(theme: string): string {
  return themeColors[theme] || 'border-l-gray-300';
}

const digestLabels: Record<string, string> = {
  done: '✓',
  processing: '⏳',
  partial: '◐',
  pending: '○',
};

interface CardNodeProps {
  data: { card: Card };
}

export const CardNode = memo(function CardNode({ data: { card } }: CardNodeProps) {
  const displayText =
    card.ai_summary || card.user_note || card.source.title || '未命名灵感';

  const primaryTheme = card.ai_themes[0];
  const borderClass = primaryTheme ? themeBorder(primaryTheme) : 'border-l-gray-300';

  return (
    <div
      className={`bg-white rounded-lg shadow-md border border-gray-200 ${borderClass} border-l-4 px-3 py-2 min-w-[200px] max-w-[260px] cursor-pointer hover:shadow-lg transition-shadow`}
    >
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />
      <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />

      {/* Header: type icon + digest badge */}
      <div className="flex items-center justify-between mb-1">
        <TypeIcon type={card.source.type} size={14} />
        <span className="text-xs text-gray-400" title={card.digestion_status}>
          {digestLabels[card.digestion_status] || '○'}
        </span>
      </div>

      {/* Main text — single line, truncated */}
      <p className="text-sm text-gray-800 truncate mb-1">{displayText}</p>

      {/* Tags on overflow line */}
      {card.ai_tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {card.ai_tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded"
            >
              {tag}
            </span>
          ))}
          {card.ai_tags.length > 3 && (
            <span className="text-xs text-gray-400">+{card.ai_tags.length - 3}</span>
          )}
        </div>
      )}
    </div>
  );
});
