import * as organizationService from '../services/organizationService.js';
import * as memberService from '../services/memberService.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const listOrganizations = asyncHandler(async (req, res) => {
  const organizations = await organizationService.getUserOrganizations(req.user.id);
  res.json({ organizations });
});

export const getOrganization = asyncHandler(async (req, res) => {
  const organization = await organizationService.getOrganizationById(
    req.user.id,
    req.params.id,
  );
  res.json({ organization });
});

export const updateOrganization = asyncHandler(async (req, res) => {
  const organization = await memberService.updateOrganization(
    req.user.id,
    req.params.id,
    req.body,
  );
  res.json({ organization });
});

export const listMembers = asyncHandler(async (req, res) => {
  const members = await organizationService.listOrganizationMembers(
    req.user.id,
    req.params.id,
  );
  res.json({ members });
});

export const inviteMember = asyncHandler(async (req, res) => {
  const member = await memberService.inviteOrganizationMember(
    req.user.id,
    req.params.id,
    req.body,
  );
  res.status(201).json({ member });
});

export const updateMemberRole = asyncHandler(async (req, res) => {
  const member = await memberService.updateOrganizationMemberRole(
    req.user.id,
    req.params.id,
    req.params.userId,
    req.body,
  );
  res.json({ member });
});

export const removeMember = asyncHandler(async (req, res) => {
  const result = await memberService.removeOrganizationMember(
    req.user.id,
    req.params.id,
    req.params.userId,
  );
  res.json(result);
});
