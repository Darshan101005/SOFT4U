'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Globe, ImagePlus, Library, Link2, Search, Trash2, Upload, X } from 'lucide-react';
import type { MediaAsset } from '@/lib/db/types';
import { Badge, Button, Input, Modal, Spinner, api, cx, errMsg, toast } from './ui';
import { fileToDataUri } from './format';

type Kind = 'products' | 'categories' | 'library' | 'banners';

interface SearchResult {
  source: 'library' | 'wikimedia' | 'svgl' | 'simpleicons';
  title: string;
  thumbUrl: string;
  url: string;
  publicId?: string;
}

const ACCEPT = 'image/png,image/jpeg,image/webp,image/svg+xml';
const MAX_BYTES = 5 * 1024 * 1024;
const SOURCE_LABEL: Record<SearchResult['source'], string> = {
  library: 'Your library',
  svgl: 'svgl.app',
  simpleicons: 'Simple Icons',
  wikimedia: 'Wikimedia',
};

/** Big rasters are scaled to 1200 px WebP in the browser first (keeps uploads under the 4.5 MB request cap). */
async function prepareFile(file: File): Promise<string> {
  const raw = await fileToDataUri(file);
  if (file.type === 'image/svg+xml' || file.size < 1.5 * 1024 * 1024) return raw;
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Could not read the image'));
    img.src = raw;
  });
  const scale = Math.min(1, 1200 / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/webp', 0.92);
}

/**
 * Image control used by products, categories, payment logos, banners and testimonials.
 * Upload a file, paste a link, search logos by name (own library first, then free
 * sources) or pick from the library. Every new image is processed on the server
 * (trimmed, centred, 512x512 transparent PNG; banners keep their proportions).
 */
export function ImagePicker({
  value,
  onChange,
  kind = 'products',
  name,
  label = 'Image',
  hint,
  wide,
}: {
  value?: string;
  onChange: (url: string) => void;
  kind?: Kind;
  /** Product / category name: used as the default search term and file name. */
  name?: string;
  label?: string;
  hint?: string;
  wide?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'search' | 'upload' | 'url' | 'library'>('search');
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [library, setLibrary] = useState<MediaAsset[] | null>(null);
  const [libFilter, setLibFilter] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const process = async (source: string, sourceName?: string) => {
    setBusy(true);
    try {
      const res = await api<{ image: { url: string } }>('/api/admin/media/upload', {
        body: { source, kind, name: sourceName || name || 'image', tags: name ? [name.toLowerCase()] : [] },
      });
      onChange(res.image.url);
      setOpen(false);
      toast.success('Image processed and saved');
    } catch (err) {
      toast.error(errMsg(err, 'Could not process this image'));
    } finally {
      setBusy(false);
    }
  };

  const runSearch = async (term: string) => {
    const q = term.trim();
    if (q.length < 2) return;
    setSearching(true);
    try {
      const res = await api<{ results: SearchResult[] }>(`/api/admin/media?q=${encodeURIComponent(q)}`);
      setResults(res.results);
    } catch (err) {
      toast.error(errMsg(err));
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (!open || tab !== 'library' || library) return;
    api<{ library: MediaAsset[] }>('/api/admin/media')
      .then(d => setLibrary(d.library))
      .catch(err => {
        toast.error(errMsg(err));
        setLibrary([]);
      });
  }, [open, tab, library]);

  const openPicker = () => {
    const term = (name || '').trim();
    setQuery(term);
    setResults(null);
    setTab('search');
    setOpen(true);
    if (term.length >= 2) void runSearch(term);
  };

  const onFile = async (file?: File | null) => {
    if (!file) return;
    if (!ACCEPT.split(',').includes(file.type)) return toast.error('Use a PNG, JPG, WebP or SVG image');
    if (file.size > MAX_BYTES) return toast.error('The image is larger than 5 MB');
    try {
      const data = await prepareFile(file);
      await process(data, name || file.name.replace(/\.[a-z0-9]+$/i, ''));
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const pick = (r: SearchResult) => {
    if (r.source === 'library') {
      onChange(r.url);
      setOpen(false);
      toast.success('Library image selected');
      return;
    }
    void process(r.url, name || r.title);
  };

  const removeFromLibrary = async (m: MediaAsset) => {
    try {
      await api(`/api/admin/media?id=${encodeURIComponent(m.id)}`, { method: 'DELETE' });
      setLibrary(prev => (prev || []).filter(x => x.id !== m.id));
      toast.success('Removed from library');
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const filteredLib = (library || []).filter(m => !libFilter || m.name.toLowerCase().includes(libFilter.toLowerCase()) || m.tags.some(t => t.includes(libFilter.toLowerCase())));

  return (
    <div className="space-y-1.5">
      <div className="text-xs font-bold text-charcoal">{label}</div>
      <div className="flex items-center gap-3">
        <div className={cx('rounded-2xl border border-charcoal-border bg-gradient-to-br from-pista-50 to-pista-100 flex items-center justify-center overflow-hidden shrink-0', wide ? 'w-40 h-20' : 'w-24 h-24')}>
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="w-full h-full object-contain p-2" />
          ) : (
            <ImagePlus className="w-7 h-7 text-pista-dark/60" />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Button size="sm" variant="secondary" icon={ImagePlus} onClick={openPicker}>
            {value ? 'Change image' : 'Add image'}
          </Button>
          {value && (
            <Button size="sm" variant="ghost" icon={X} onClick={() => onChange('')}>
              Remove
            </Button>
          )}
        </div>
      </div>
      <p className="text-[11px] text-charcoal-subtle">
        {hint || 'PNG, JPG, WebP or SVG, up to 5 MB. Any photo is trimmed, centred and saved as a 512×512 transparent PNG.'}
      </p>

      <Modal open={open} onClose={() => !busy && setOpen(false)} title={label} description="Search a logo, upload a file, paste a link or reuse a library image." size="xl">
        <div className="flex flex-wrap gap-2 mb-4">
          {(
            [
              ['search', 'Search by name', Search],
              ['upload', 'Upload file', Upload],
              ['url', 'Paste link', Link2],
              ['library', 'Library', Library],
            ] as const
          ).map(([key, text, Icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cx(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border',
                tab === key ? 'bg-pista border-pista text-charcoal' : 'bg-white border-charcoal-border text-charcoal-muted hover:border-pista',
              )}
            >
              <Icon className="w-3.5 h-3.5" /> {text}
            </button>
          ))}
        </div>

        {busy && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-pista-lighter text-sm font-semibold text-pista-darker">
            <Spinner className="w-4 h-4" /> Processing image: trimming, centring and saving as 512×512 PNG…
          </div>
        )}

        {tab === 'search' && (
          <div className="space-y-4">
            <form
              onSubmit={e => {
                e.preventDefault();
                e.stopPropagation();
                void runSearch(query);
              }}
              className="flex gap-2"
            >
              <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="e.g. hotstar, netflix, chatgpt" autoFocus />
              <Button type="submit" icon={Search} loading={searching}>
                Search
              </Button>
            </form>
            {searching && !results ? (
              <div className="py-10 flex justify-center">
                <Spinner className="w-6 h-6" />
              </div>
            ) : results && results.length === 0 ? (
              <p className="text-sm text-charcoal-subtle py-6 text-center">No logo found. Try another spelling, upload a file or paste a link.</p>
            ) : results ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {results.map(r => (
                  <button
                    key={r.url}
                    type="button"
                    disabled={busy}
                    onClick={() => pick(r)}
                    className="group rounded-xl border border-charcoal-border hover:border-pista bg-white p-2 text-left disabled:opacity-50"
                    title={r.title}
                  >
                    <div className="aspect-square rounded-lg bg-gradient-to-br from-pista-50 to-pista-100 flex items-center justify-center overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={r.thumbUrl} alt={r.title} loading="lazy" className="w-full h-full object-contain p-2" />
                    </div>
                    <div className="mt-1.5 text-[10px] font-semibold text-charcoal truncate">{r.title}</div>
                    <Badge tone={r.source === 'library' ? 'green' : 'gray'} className="mt-1">
                      {r.source === 'library' ? <Library className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                      {SOURCE_LABEL[r.source]}
                    </Badge>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-charcoal-subtle">Type a brand name. Your own library is searched first, then free logo sources.</p>
            )}
          </div>
        )}

        {tab === 'upload' && (
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault();
              void onFile(e.dataTransfer.files?.[0]);
            }}
            className="rounded-2xl border-2 border-dashed border-pista-light bg-pista-50 p-10 text-center"
          >
            <Upload className="w-8 h-8 text-pista-dark mx-auto mb-2" />
            <p className="text-sm font-bold text-charcoal">Drop an image here or choose a file</p>
            <p className="text-xs text-charcoal-subtle mt-1">PNG, JPG, WebP or SVG · up to 5 MB · any size, it is squared to 512×512</p>
            <input ref={fileRef} type="file" accept={ACCEPT} className="hidden" onChange={e => void onFile(e.target.files?.[0])} />
            <Button className="mt-4" icon={Upload} loading={busy} onClick={() => fileRef.current?.click()}>
              Choose file
            </Button>
          </div>
        )}

        {tab === 'url' && (
          <form
            onSubmit={e => {
              e.preventDefault();
              e.stopPropagation();
              if (!/^https?:\/\//i.test(url.trim())) return toast.error('Paste a link that starts with https://');
              void process(url.trim());
            }}
            className="space-y-3"
          >
            <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com/logo.png" />
            <p className="text-xs text-charcoal-subtle">The server downloads the image, checks it is a PNG, JPG, WebP or SVG under 5 MB, then processes it.</p>
            <Button type="submit" icon={Link2} loading={busy}>
              Use this link
            </Button>
          </form>
        )}

        {tab === 'library' && (
          <div className="space-y-3">
            <Input value={libFilter} onChange={e => setLibFilter(e.target.value)} placeholder="Filter library by name" />
            {!library ? (
              <div className="py-10 flex justify-center">
                <Spinner className="w-6 h-6" />
              </div>
            ) : filteredLib.length === 0 ? (
              <p className="text-sm text-charcoal-subtle py-6 text-center">No library image matches.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {filteredLib.map(m => (
                  <div key={m.id} className={cx('relative rounded-xl border bg-white p-2 group', value === m.url ? 'border-pista ring-2 ring-pista/30' : 'border-charcoal-border hover:border-pista')}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(m.url);
                        setOpen(false);
                      }}
                      className="w-full text-left"
                      title={m.name}
                    >
                      <div className="aspect-square rounded-lg bg-gradient-to-br from-pista-50 to-pista-100 flex items-center justify-center overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={m.url} alt={m.name} loading="lazy" className="w-full h-full object-contain p-2" />
                      </div>
                      <div className="mt-1.5 text-[10px] font-semibold text-charcoal truncate">{m.name}</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeFromLibrary(m)}
                      className="absolute top-1 right-1 p-1 rounded-md bg-white/90 text-charcoal-subtle hover:text-accent-rose opacity-0 group-hover:opacity-100"
                      aria-label="Remove from library"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
