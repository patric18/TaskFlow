import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth.js';
import { usersApi } from '../../api/auth.js';
import { useAuthStore } from '../../store/authStore.js';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { ThemeSelector } from '../../components/theme/ThemeSelector.jsx';

export default function ProfileSettingsPage() {
  const { user } = useAuth();
  const setUser = useAuthStore((state) => state.setUser);
  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(user?.name || '');
  }, [user?.name]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const { data } = await usersApi.updateMe({ name: name.trim() });
      setUser(data.user);
      toast.success('Profile updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Profile</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Update your personal information</p>

        <form onSubmit={handleSubmit} className="mt-6 max-w-md space-y-4">
          <Input label="Email" value={user?.email || ''} disabled />
          <Input
            label="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button type="submit" loading={loading}>
            Save profile
          </Button>
        </form>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Appearance</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Choose light or dark theme. Your preference is saved on this device.
        </p>
        <div className="mt-4">
          <ThemeSelector />
        </div>
      </div>
    </div>
  );
}
