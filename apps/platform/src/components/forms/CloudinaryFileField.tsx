'use client';

import { useRef, useState } from 'react';
import { FileText, Image as ImageIcon, Loader2, RefreshCw, UploadCloud, X } from 'lucide-react';
import { uploadMedia } from '@/lib/api';

export interface StoredMediaValue {
  storage: 'cloudinary';
  fileName: string;
  contentType: string;
  secureUrl: string;
  publicId: string;
  resourceType: string;
  bytes: number;
  uploadedAt: string;
}

export function isStoredMediaValue(value: unknown): value is StoredMediaValue {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const media = value as Partial<StoredMediaValue>;
  return media.storage === 'cloudinary'
    && typeof media.fileName === 'string'
    && typeof media.secureUrl === 'string'
    && media.secureUrl.startsWith('https://')
    && typeof media.publicId === 'string';
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CloudinaryFileField({
  value,
  imageOnly = false,
  disabled = false,
  required = false,
  className = '',
  onChange,
  onUploadingChange,
}: {
  value: unknown;
  imageOnly?: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  onChange: (value: StoredMediaValue | null) => void;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stored = isStoredMediaValue(value) ? value : null;

  const choose = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    onUploadingChange?.(true);
    setError(null);
    try {
      const uploaded = await uploadMedia(file);
      onChange({
        storage: 'cloudinary',
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
        secureUrl: uploaded.data.secureUrl,
        publicId: uploaded.data.publicId,
        resourceType: uploaded.data.resourceType,
        bytes: uploaded.data.bytes,
        uploadedAt: new Date().toISOString(),
      });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'File upload failed');
      if (inputRef.current) inputRef.current.value = '';
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
    }
  };

  if (stored) {
    return (
      <div className={`mt-1 flex min-h-12 items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/[0.06] px-3 py-2 ${className}`}>
        {stored.contentType.startsWith('image/') ? <ImageIcon size={17} className="shrink-0 text-emerald-700" /> : <FileText size={17} className="shrink-0 text-emerald-700" />}
        <a href={stored.secureUrl} target="_blank" rel="noreferrer" className="min-w-0 flex-1" title="Open uploaded file">
          <span className="block truncate text-[11px] font-semibold text-[var(--crm-text)]">{stored.fileName}</span>
          <span className="block text-[9px] text-[var(--crm-muted)]">Cloudinary · {formatBytes(stored.bytes)}</span>
        </a>
        {!disabled && (
          <>
            <button type="button" onClick={() => inputRef.current?.click()} className="rounded-md p-1.5 text-[var(--crm-muted)] hover:bg-[var(--crm-card)]" title="Replace file"><RefreshCw size={14} /></button>
            <button type="button" onClick={() => { onChange(null); if (inputRef.current) inputRef.current.value = ''; }} className="rounded-md p-1.5 text-rose-600 hover:bg-rose-500/10" title="Remove file"><X size={14} /></button>
          </>
        )}
        <input ref={inputRef} type="file" hidden disabled={disabled || uploading} required={required && !stored} accept={imageOnly ? 'image/jpeg,image/png,image/gif,image/webp' : 'image/jpeg,image/png,image/gif,image/webp,application/pdf,.pdf'} onChange={(event) => void choose(event.target.files?.[0])} />
      </div>
    );
  }

  return (
    <div className={className}>
      <button type="button" disabled={disabled || uploading} onClick={() => inputRef.current?.click()} className="mt-1 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--crm-border)] bg-[var(--crm-card)] px-3 text-[10px] font-medium text-[var(--crm-muted)] transition hover:border-[var(--tenant-primary)] hover:text-[var(--tenant-primary)] disabled:opacity-50">
        {uploading ? <Loader2 size={15} className="animate-spin" /> : <UploadCloud size={15} />}
        {uploading ? 'Uploading to Cloudinary…' : imageOnly ? 'Choose image' : 'Choose image or PDF'}
      </button>
      <input ref={inputRef} type="file" hidden disabled={disabled || uploading} required={required} accept={imageOnly ? 'image/jpeg,image/png,image/gif,image/webp' : 'image/jpeg,image/png,image/gif,image/webp,application/pdf,.pdf'} onChange={(event) => void choose(event.target.files?.[0])} />
      {error && <p className="mt-1 text-[9px] text-rose-600">{error}</p>}
    </div>
  );
}
