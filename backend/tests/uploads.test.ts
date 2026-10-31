import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { prisma } from '../src/db/prisma.js';
import { createTestChallenge, ensureCategory, makeAdmin, newAgent } from './helpers.js';
import { app } from './helpers.js';

const PDF = Buffer.from('%PDF-1.4\n% a small handout\n%%EOF\n');

async function upload(
  adminAgent: ReturnType<typeof newAgent>,
  body: Buffer,
  name: string,
  type: string,
) {
  return adminAgent
    .post('/api/v1/admin/files')
    .set('Content-Type', type)
    .set('X-File-Name', encodeURIComponent(name))
    .send(body);
}

async function setup() {
  const adminAgent = newAgent();
  await makeAdmin(adminAgent);
  const categoryId = await ensureCategory(adminAgent, 'Uploads');
  return { adminAgent, categoryId };
}

describe('file uploads', () => {
  it('uploads, attaches and serves a handout', async () => {
    const { adminAgent, categoryId } = await setup();
    const challenge = await createTestChallenge(adminAgent, categoryId, { published: true });

    const uploaded = await upload(adminAgent, PDF, 'Brief (v2).pdf', 'application/pdf');
    expect(uploaded.status).toBe(201);
    expect(uploaded.body.asset).toMatchObject({
      name: 'Brief (v2).pdf',
      mimeType: 'application/pdf',
      sizeBytes: PDF.length,
    });
    expect(uploaded.body.asset).not.toHaveProperty('storedName');
    expect(uploaded.body.asset.downloadUrl).toBe(`/api/v1/files/${uploaded.body.asset.id}`);

    const attached = await adminAgent
      .post(`/api/v1/admin/challenges/${challenge.id}/files`)
      .send({ assetId: uploaded.body.asset.id });
    expect(attached.status).toBe(201);
    expect(attached.body.file).toMatchObject({
      name: 'Brief (v2).pdf',
      downloadUrl: `/api/v1/files/${uploaded.body.asset.id}`,
    });

    const detail = await request(app).get(`/api/v1/challenges/${challenge.id}`);
    expect(detail.status).toBe(200);
    expect(detail.body.challenge.files[0]).toMatchObject({
      name: 'Brief (v2).pdf',
      mimeType: 'application/pdf',
      downloadUrl: `/api/v1/files/${uploaded.body.asset.id}`,
    });

    const download = await request(app).get(`/api/v1/files/${uploaded.body.asset.id}`);
    expect(download.status).toBe(200);
    expect(download.headers['content-type']).toContain('application/pdf');
    expect(download.headers['content-disposition']).toContain('attachment');
    expect(download.headers['content-disposition']).toContain('filename*=');
    expect(download.headers['x-content-type-options']).toBe('nosniff');

    const removed = await adminAgent.delete(`/api/v1/admin/files/${attached.body.file.id}`);
    expect(removed.status).toBe(200);
    const gone = await request(app).get(`/api/v1/files/${uploaded.body.asset.id}`);
    expect(gone.status).toBe(404);
    expect(await prisma.fileAsset.findUnique({ where: { id: uploaded.body.asset.id } })).toBeNull();
  });

  it('keeps draft handouts away from the public and rejects unsafe types', async () => {
    const { adminAgent, categoryId } = await setup();
    const draft = await createTestChallenge(adminAgent, categoryId, { published: false });

    const asset = await upload(adminAgent, PDF, 'draft.pdf', 'application/pdf');
    expect(asset.status).toBe(201);
    await adminAgent
      .post(`/api/v1/admin/challenges/${draft.id}/files`)
      .send({ assetId: asset.body.asset.id })
      .expect(201);

    const anonymous = await request(app).get(`/api/v1/files/${asset.body.asset.id}`);
    expect(anonymous.status).toBe(404);

    const preview = await adminAgent.get(`/api/v1/files/${asset.body.asset.id}`);
    expect(preview.status).toBe(200);

    const html = await upload(adminAgent, Buffer.from('<script>alert(1)</script>'), 'x.html', 'text/html');
    expect(html.status).toBe(415);

    const svg = await upload(adminAgent, Buffer.from('<svg/>'), 'x.svg', 'image/svg+xml');
    expect(svg.status).toBe(415);

    const empty = await upload(adminAgent, Buffer.alloc(0), 'empty.pdf', 'application/pdf');
    expect(empty.status).toBe(400);

    const unknown = await adminAgent
      .post(`/api/v1/admin/challenges/${draft.id}/files`)
      .send({ assetId: 'missing-asset' });
    expect(unknown.status).toBe(404);

    const traversal = await request(app).get('/api/v1/files/..%2F..%2Fdev.db');
    expect(traversal.status).toBe(404);
  });

  it('refuses uploads above the configured limit', async () => {
    const { adminAgent } = await setup();
    const tooBig = Buffer.alloc(1024 * 1024 + 1, 0x41);
    const res = await upload(adminAgent, tooBig, 'big.pdf', 'application/pdf');
    expect(res.status).toBe(413);
  });

  it('requires authentication for uploads', async () => {
    const anonymous = await request(app)
      .post('/api/v1/admin/files')
      .set('Content-Type', 'application/pdf')
      .set('X-File-Name', 'x.pdf')
      .send(PDF);
    expect(anonymous.status).toBe(401);
  });
});
