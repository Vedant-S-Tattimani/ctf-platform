import { existsSync, writeFileSync, unlinkSync } from 'node:fs';
import type { FileAsset } from '@prisma/client';
import { env } from '../../config/env.js';
import { prisma } from '../../db/prisma.js';
import { HttpError } from '../../middleware/errorHandler.js';
import {
  assertAllowedMimeType,
  downloadUrlFor,
  ensureUploadRoot,
  newStoredName,
  normalizeMimeType,
  resolveStoredFile,
  sanitizeFileName,
} from '../../utils/files.js';

export interface AssetView {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
  downloadUrl: string;
}

export function toAssetView(asset: FileAsset): AssetView {
  return {
    id: asset.id,
    name: asset.name,
    mimeType: asset.mimeType,
    sizeBytes: asset.sizeBytes,
    createdAt: asset.createdAt,
    downloadUrl: downloadUrlFor(asset.id),
  };
}

function decodeHeaderName(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export async function storeAsset(buffer: unknown, rawName: string, rawMime: string): Promise<AssetView> {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new HttpError(400, 'The uploaded file is empty');
  }
  if (buffer.length > env.UPLOAD_MAX_BYTES) {
    throw new HttpError(413, 'That file is larger than the upload limit');
  }

  const name = sanitizeFileName(decodeHeaderName(rawName.trim()));
  const mimeType = assertAllowedMimeType(normalizeMimeType(rawMime) || 'application/octet-stream');
  const storedName = newStoredName();

  ensureUploadRoot();
  writeFileSync(resolveStoredFile(storedName), buffer, { flag: 'wx', mode: 0o600 });

  try {
    const asset = await prisma.fileAsset.create({
      data: { name, storedName, mimeType, sizeBytes: buffer.length },
    });
    return toAssetView(asset);
  } catch (error) {
    try {
      unlinkSync(resolveStoredFile(storedName));
    } catch {
      /* the row is gone either way */
    }
    throw error;
  }
}

/**
 * Assets are only downloadable once they are attached to a published
 * challenge. Admins may preview drafts; everyone else gets a uniform 404 so
 * unattached uploads cannot be enumerated.
 */
export async function findDownloadableAsset(assetId: string, isAdmin: boolean): Promise<FileAsset> {
  const asset = await prisma.fileAsset.findUnique({
    where: { id: assetId },
    include: { files: { select: { challenge: { select: { published: true } } } } },
  });
  if (!asset) throw new HttpError(404, 'File not found');
  const attachedToPublished = asset.files.some((file) => file.challenge.published);
  if (!isAdmin && !attachedToPublished) throw new HttpError(404, 'File not found');
  return asset;
}

export function storedFilePath(asset: FileAsset): string {
  const path = resolveStoredFile(asset.storedName);
  if (!existsSync(path)) throw new HttpError(404, 'File not found');
  return path;
}
