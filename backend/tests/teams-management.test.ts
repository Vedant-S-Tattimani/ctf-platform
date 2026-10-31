import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, newAgent, registerUser } from './helpers.js';

async function setupTeam() {
  const owner = newAgent();
  const ownerUser = await registerUser(owner);
  const created = await owner.post('/api/v1/teams').send({ name: `Roundtable ${Date.now()}` });
  expect(created.status).toBe(201);
  const team = created.body.team as { id: string; inviteCode: string };

  const member = newAgent();
  const memberUser = await registerUser(member);
  await member.post('/api/v1/teams/join').send({ inviteCode: team.inviteCode }).expect(200);

  return { owner, member, ownerUser, memberUser, team };
}

describe('team management', () => {
  it('lets the owner remove a member, who can then join elsewhere', async () => {
    const { owner, member, memberUser, team } = await setupTeam();

    const res = await owner.delete(`/api/v1/teams/me/members/${memberUser.id}`);
    expect(res.status).toBe(200);
    expect(res.body.team.memberCount).toBe(1);
    expect(res.body.team.members.some((m: { id: string }) => m.id === memberUser.id)).toBe(false);

    const mine = await member.get('/api/v1/teams/me');
    expect(mine.body.team).toBeNull();

    const newTeam = await member.post('/api/v1/teams').send({ name: `Fresh ${Date.now()}` });
    expect(newTeam.status).toBe(201);
    expect(newTeam.body.team.id).not.toBe(team.id);
  });

  it('guards removal to the owner and blocks removing yourself', async () => {
    const { owner, member, ownerUser } = await setupTeam();

    const byMember = await member.delete(`/api/v1/teams/me/members/${ownerUser.id}`);
    expect(byMember.status).toBe(403);

    const self = await owner.delete(`/api/v1/teams/me/members/${ownerUser.id}`);
    expect(self.status).toBe(400);

    const stranger = await owner.delete('/api/v1/teams/me/members/not-a-member');
    expect(stranger.status).toBe(404);

    const stillThere = await owner.get('/api/v1/teams/me');
    expect(stillThere.body.team.memberCount).toBe(2);
  });

  it('transfers ownership and moves the edit permission with it', async () => {
    const { owner, member, memberUser } = await setupTeam();

    const transfer = await owner.post('/api/v1/teams/me/transfer').send({ userId: memberUser.id });
    expect(transfer.status).toBe(200);
    expect(transfer.body.team.ownerId).toBe(memberUser.id);
    expect(transfer.body.team.memberCount).toBe(2);

    const formerOwnerEdit = await owner.patch('/api/v1/teams/me').send({ description: 'Nope' });
    expect(formerOwnerEdit.status).toBe(403);

    const newOwnerEdit = await member.patch('/api/v1/teams/me').send({ description: 'New captain' });
    expect(newOwnerEdit.status).toBe(200);
    expect(newOwnerEdit.body.team.description).toBe('New captain');

    const transferToSelf = await member.post('/api/v1/teams/me/transfer').send({ userId: memberUser.id });
    expect(transferToSelf.status).toBe(400);
  });

  it('rotates the invite code so the old one stops working', async () => {
    const { owner, member, team } = await setupTeam();

    const byMember = await member.post('/api/v1/teams/me/invite-code');
    expect(byMember.status).toBe(403);

    const rotated = await owner.post('/api/v1/teams/me/invite-code');
    expect(rotated.status).toBe(200);
    const freshCode = rotated.body.team.inviteCode as string;
    expect(freshCode).not.toBe(team.inviteCode);

    const third = newAgent();
    await registerUser(third);
    const oldCode = await third.post('/api/v1/teams/join').send({ inviteCode: team.inviteCode });
    expect(oldCode.status).toBe(404);

    const newCode = await third.post('/api/v1/teams/join').send({ inviteCode: freshCode });
    expect(newCode.status).toBe(200);
    expect(newCode.body.team.memberCount).toBe(3);
  });
});
