'use client';

import { useState, useCallback, type FormEvent } from 'react';
import { Send } from 'lucide-react';
import { FileDropZone } from './FileDropZone';

export function CaptureForm() {
  const [body, setBody] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [userNote, setUserNote] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      if (!body.trim() && files.length === 0) return;

      setSubmitting(true);

      try {
        const formData = new FormData();
        formData.append('body', body);
        if (sourceUrl.trim()) {
          formData.append('sourceUrl', sourceUrl.trim());
        }
        if (userNote.trim()) {
          formData.append('userNote', userNote.trim());
        }
        for (const file of files) {
          formData.append('attachments', file);
        }

        const res = await fetch('/api/cards', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          // Clear form
          setBody('');
          setSourceUrl('');
          setUserNote('');
          setFiles([]);

          // Show toast
          setToast('已保存');
          setTimeout(() => setToast(null), 2000);
        }
      } finally {
        setSubmitting(false);
      }
    },
    [body, sourceUrl, userNote, files],
  );

  return (
    <div className="relative">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow-lg text-sm z-50">
          {toast}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-lg w-full bg-white rounded-lg shadow-sm border p-6 space-y-4"
      >
        {/* Body textarea */}
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="贴入 URL、文字、截图，或上传任意文件"
          rows={6}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
        />

        {/* Optional URL */}
        <input
          type="url"
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          placeholder="来源链接（可选）"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
        />

        {/* File drop zone */}
        <FileDropZone files={files} onFilesChange={setFiles} />

        {/* Optional note */}
        <textarea
          value={userNote}
          onChange={(e) => setUserNote(e.target.value)}
          placeholder="简评（可选）"
          rows={1}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
        />

        {/* Submit button */}
        <button
          type="submit"
          disabled={submitting || (!body.trim() && files.length === 0)}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-medium py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-4 h-4" />
          {submitting ? '保存中...' : '保存'}
        </button>
      </form>
    </div>
  );
}
