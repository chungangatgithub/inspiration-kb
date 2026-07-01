'use client';
import { useEffect, useState } from 'react';
import { X, Save } from 'lucide-react';
import { useCanvasStore } from '@/stores/canvas.store';
import { TypeIcon } from '@/components/shared/TypeIcon';
import type { Card } from '@/types/card';

export function CardDetailSheet() {
  const { selectedCardId, selectCard, cards } = useCanvasStore();
  const [body, setBody] = useState<string | null>(null);
  const [card, setCard] = useState<Card | null>(null);
  const [editing, setEditing] = useState<{
    ai_tags: string;
    ai_themes: string;
    ai_summary: string;
    ai_review: string;
    user_note: string;
    user_review: string;
  }>({
    ai_tags: '',
    ai_themes: '',
    ai_summary: '',
    ai_review: '',
    user_note: '',
    user_review: '',
  });
  const [saving, setSaving] = useState(false);

  // Load card when selection changes
  useEffect(() => {
    if (!selectedCardId) {
      setCard(null);
      setBody(null);
      return;
    }

    // First check store
    const found = cards.find((c) => c.id === selectedCardId);
    if (found) {
      setCard(found);
      setEditing({
        ai_tags: found.ai_tags.join(', '),
        ai_themes: found.ai_themes.join(', '),
        ai_summary: found.ai_summary || '',
        ai_review: found.ai_review || '',
        user_note: found.user_note || '',
        user_review: found.user_review || '',
      });
    }

    // Fetch body
    fetch(`/api/cards/${selectedCardId}`)
      .then((r) => r.json())
      .then((data) => {
        setCard((prev) => (prev ? { ...prev, ...data } : data));
        if (data.body) setBody(data.body);
      })
      .catch(() => {});
  }, [selectedCardId, cards]);

  if (!selectedCardId || !card) return null;

  const handleSave = async (field: string) => {
    setSaving(true);
    let payload: Record<string, unknown> = {};
    switch (field) {
      case 'ai_tags':
        payload = { ai_tags: editing.ai_tags.split(',').map((s) => s.trim()).filter(Boolean) };
        break;
      case 'ai_themes':
        payload = { ai_themes: editing.ai_themes.split(',').map((s) => s.trim()).filter(Boolean) };
        break;
      case 'ai_summary':
        payload = { ai_summary: editing.ai_summary };
        break;
      case 'ai_review':
        payload = { ai_review: editing.ai_review };
        break;
      case 'user_note':
        payload = { user_note: editing.user_note };
        break;
      case 'user_review':
        payload = { user_review: editing.user_review };
        break;
    }
    await fetch(`/api/cards/${selectedCardId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setSaving(false);
  };

  return (
    <aside className="absolute top-0 right-0 h-full w-80 bg-white border-l border-gray-200 shadow-lg overflow-y-auto z-10">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <TypeIcon type={card.source.type} size={16} />
          <span className="text-sm font-medium text-gray-700">
            {card.source.title || '未命名灵感'}
          </span>
        </div>
        <button
          onClick={() => selectCard(null)}
          className="p-1 rounded hover:bg-gray-100"
          aria-label="关闭"
        >
          <X size={16} />
        </button>
      </div>

      <div className="p-3 space-y-4">
        {/* Source info */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase mb-1">来源</h3>
          <p className="text-sm">
            类型: {card.source.type || '未知'}
          </p>
          {card.source.url && (
            <a
              href={card.source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-500 hover:underline break-all"
            >
              {card.source.url}
            </a>
          )}
          {card.source.meta && (
            <pre className="text-xs text-gray-500 mt-1 overflow-x-auto">
              {JSON.stringify(card.source.meta, null, 2)}
            </pre>
          )}
        </section>

        {/* Digestion status */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase mb-1">消化状态</h3>
          <span
            className={`text-xs px-2 py-0.5 rounded ${
              card.digestion_status === 'done'
                ? 'bg-green-100 text-green-700'
                : card.digestion_status === 'processing'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {card.digestion_status}
          </span>
        </section>

        {/* Editable field helper */}
        {['ai_summary', 'ai_review', 'user_note', 'user_review'].map((field) => (
          <EditableSection
            key={field}
            label={fieldLabels[field]}
            value={(editing as Record<string, string>)[field]}
            onChange={(v) => setEditing({ ...editing, [field]: v })}
            onSave={() => handleSave(field)}
            saving={saving}
          />
        ))}

        {/* Tags - comma separated editable */}
        <EditableSection
          label="AI 标签"
          value={editing.ai_tags}
          onChange={(v) => setEditing({ ...editing, ai_tags: v })}
          onSave={() => handleSave('ai_tags')}
          saving={saving}
        />

        {/* Themes */}
        <EditableSection
          label="AI 主题"
          value={editing.ai_themes}
          onChange={(v) => setEditing({ ...editing, ai_themes: v })}
          onSave={() => handleSave('ai_themes')}
          saving={saving}
        />

        {/* Body */}
        {body && (
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-1">正文</h3>
            <pre className="text-xs text-gray-700 whitespace-pre-wrap bg-gray-50 p-2 rounded max-h-48 overflow-y-auto">
              {body}
            </pre>
          </section>
        )}

        {/* Captured at */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase mb-1">时间</h3>
          <p className="text-xs text-gray-500">
            捕获: {new Date(card.captured_at).toLocaleString()}
          </p>
          <p className="text-xs text-gray-500">
            更新: {new Date(card.updated_at).toLocaleString()}
          </p>
        </section>
      </div>
    </aside>
  );
}

const fieldLabels: Record<string, string> = {
  ai_summary: 'AI 摘要',
  ai_review: 'AI 点评',
  user_note: '用户笔记',
  user_review: '用户点评',
};

function EditableSection({
  label,
  value,
  onChange,
  onSave,
  saving,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs font-semibold text-gray-400 uppercase">{label}</h3>
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 disabled:opacity-50"
        >
          <Save size={12} />
          保存
        </button>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full text-sm border border-gray-200 rounded p-1.5 resize-y focus:outline-none focus:ring-1 focus:ring-blue-400"
      />
    </section>
  );
}
