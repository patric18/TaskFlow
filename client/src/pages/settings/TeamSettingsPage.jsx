import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTeam } from '../../hooks/useTeam.js';
import { useAuth } from '../../hooks/useAuth.js';
import { Avatar } from '../../components/ui/Avatar.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';

const ROLE_COLORS = {
  OWNER: 'yellow',
  ADMIN: 'blue',
  MEMBER: 'gray',
};

export default function TeamSettingsPage() {
  const { user } = useAuth();
  const {
    members,
    isLoading,
    currentOrganization,
    inviteMember,
    updateMemberRole,
    removeMember,
    isInviting,
  } = useTeam();

  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [error, setError] = useState('');

  const canManage = currentOrganization?.role !== 'MEMBER';
  const isOwner = currentOrganization?.role === 'OWNER';
  const memberLimit = currentOrganization?.plan === 'PRO' ? 'Unlimited' : '5 max (Free plan)';

  const handleInvite = async (event) => {
    event.preventDefault();
    setError('');

    try {
      await inviteMember({ email: email.trim(), role });
      toast.success('Member invited');
      setEmail('');
      setRole('MEMBER');
      setShowInvite(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to invite member');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateMemberRole({ userId, role: newRole });
      toast.success('Role updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleRemove = async (member) => {
    if (!window.confirm(`Remove ${member.name} from the team?`)) return;

    try {
      await removeMember(member.userId);
      toast.success('Member removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Team</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {currentOrganization?.name} · {members.length} members · {memberLimit}
            </p>
          </div>
          {canManage && (
            <Button onClick={() => setShowInvite(true)}>Invite member</Button>
          )}
        </div>

        {isLoading ? (
          <div className="mt-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : members.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="No team members"
              description="Invite colleagues to collaborate on projects."
              action={canManage ? <Button onClick={() => setShowInvite(true)}>Invite member</Button> : null}
            />
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 dark:border-gray-800">
                  <th className="pb-3 font-medium">Member</th>
                  <th className="pb-3 font-medium">Role</th>
                  {canManage && <th className="pb-3 font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.userId} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={member.name} src={member.avatar} size="md" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {member.name}
                            {member.userId === user?.id && (
                              <span className="ml-2 text-xs text-gray-500">(you)</span>
                            )}
                          </p>
                          <p className="text-gray-500">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      {canManage &&
                      member.role !== 'OWNER' &&
                      (isOwner || member.role === 'MEMBER') ? (
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.userId, e.target.value)}
                          className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-900"
                        >
                          <option value="MEMBER">Member</option>
                          {isOwner && <option value="ADMIN">Admin</option>}
                        </select>
                      ) : (
                        <Badge color={ROLE_COLORS[member.role] || 'gray'}>{member.role}</Badge>
                      )}
                    </td>
                    {canManage && (
                      <td className="py-3">
                        {member.role !== 'OWNER' &&
                          member.userId !== user?.id &&
                          (isOwner || member.role === 'MEMBER') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemove(member)}
                            >
                              Remove
                            </Button>
                          )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={showInvite} onClose={() => setShowInvite(false)} title="Invite team member">
        <form onSubmit={handleInvite} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
              {error}
            </div>
          )}

          <Input
            id="invite-email"
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="colleague@company.com"
            autoFocus
          />

          {isOwner && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
              >
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          )}

          <p className="text-xs text-gray-500">
            The user must already have a TaskFlow account with this email.
          </p>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setShowInvite(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isInviting}>
              Send invite
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
