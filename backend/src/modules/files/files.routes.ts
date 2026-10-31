import { createReadStream } from 'node:fs';
import { Router } from 'express';
import { optionalAuth } from '../../middleware/auth.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { attachmentHeader } from '../../utils/files.js';
import { findDownloadableAsset, storedFilePath } from './files.service.js';

export const filesRouter = Router();

filesRouter.get(
  '/:id',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const asset = await findDownloadableAsset(
      req.params.id as string,
      req.user?.role === 'ADMIN',
    );
    const path = storedFilePath(asset);

    res.setHeader('Content-Type', asset.mimeType);
    res.setHeader('Content-Length', String(asset.sizeBytes));
    res.setHeader('Content-Disposition', attachmentHeader(asset.name));
    res.setHeader('Cache-Control', 'private, max-age=300');

    const stream = createReadStream(path);
    stream.on('error', () => {
      if (!res.headersSent) res.status(404).end();
      else res.destroy();
    });
    stream.pipe(res);
  }),
);
