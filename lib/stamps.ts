/**
 * Local persistence for stamps.
 *
 * Stamps are stored as JPEG files in `<documentDirectory>/stamps/`. We derive the
 * gallery by listing that directory, so there is no separate metadata store — the
 * creation time and aspect are encoded in the filename
 * (`stamp-<epochMs>-<aspect>.jpg`).
 *
 * Uses the SDK 54 `expo-file-system` API (File / Directory / Paths classes).
 */
import { Directory, File, Paths } from 'expo-file-system';

import type { StampAspect } from '@/features/stamp/stamp-path';
import type { Stamp } from '@/types/stamp';

const STAMPS_DIR = new Directory(Paths.document, 'stamps');
const STAMP_ASPECTS = ['portrait', 'square', 'landscape'] as const;

function ensureDir(): void {
  if (!STAMPS_DIR.exists) {
    STAMPS_DIR.create({ intermediates: true });
  }
}

function idFromName(name: string): string {
  return name.replace(/\.jpg$/i, '');
}

function createdAtFromId(id: string): number {
  const ms = Number(id.match(/^stamp-(\d+)/)?.[1]);
  return Number.isFinite(ms) ? ms : 0;
}

function aspectFromId(id: string): StampAspect {
  const aspect = id.match(/^stamp-\d+-(portrait|square|landscape)$/)?.[1];
  return STAMP_ASPECTS.find((value) => value === aspect) ?? 'portrait';
}

/** Copy a freshly captured photo into permanent storage and return its Stamp. */
export function saveStamp(sourceUri: string, aspect: StampAspect): Stamp {
  ensureDir();
  const createdAt = Date.now();
  const id = `stamp-${createdAt}-${aspect}`;
  const destination = new File(STAMPS_DIR, `${id}.jpg`);
  new File(sourceUri).copy(destination);
  return { id, uri: destination.uri, createdAt, aspect };
}

/** All saved stamps, newest first. */
export function listStamps(): Stamp[] {
  ensureDir();
  return STAMPS_DIR.list()
    .filter((entry): entry is File => entry instanceof File && /\.jpg$/i.test(entry.name))
    .map((file) => {
      const id = idFromName(file.name);
      return { id, uri: file.uri, createdAt: createdAtFromId(id), aspect: aspectFromId(id) };
    })
    .sort((a, b) => b.createdAt - a.createdAt);
}

/** Remove a stamp by id. */
export function deleteStamp(id: string): void {
  const file = new File(STAMPS_DIR, `${id}.jpg`);
  if (file.exists) {
    file.delete();
  }
}
