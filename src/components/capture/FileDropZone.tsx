'use client';

import { useRef, useState, useCallback, type DragEvent } from 'react';
import { Upload, X } from 'lucide-react';

interface FileDropZoneProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
}

export function FileDropZone({ files, onFilesChange }: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const dropped = Array.from(e.dataTransfer.files);
      if (dropped.length > 0) {
        onFilesChange([...files, ...dropped]);
      }
    },
    [files, onFilesChange],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files;
      if (selected && selected.length > 0) {
        onFilesChange([...files, ...Array.from(selected)]);
      }
      // Reset so the same file can be re-selected
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    },
    [files, onFilesChange],
  );

  const removeFile = useCallback(
    (index: number) => {
      onFilesChange(files.filter((_, i) => i !== index));
    },
    [files, onFilesChange],
  );

  return (
    <div className="w-full">
      {/* Drop zone */}
      <label
        className={`
          flex flex-col items-center justify-center gap-2 p-6
          border-2 border-dashed rounded-lg cursor-pointer
          transition-colors
          ${isDragging
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="w-6 h-6 text-gray-400" />
        <span className="text-sm text-gray-500">拖拽文件或点击上传</span>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      </label>

      {/* File list */}
      {files.length > 0 && (
        <ul className="mt-3 space-y-1">
          {files.map((file, i) => (
            <li
              key={`${file.name}-${i}`}
              className="flex items-center justify-between text-sm bg-white border rounded px-3 py-1.5"
            >
              <span className="text-gray-700 truncate mr-2">{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="text-gray-400 hover:text-red-500 flex-shrink-0"
                aria-label={`移除 ${file.name}`}
              >
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
