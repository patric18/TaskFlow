import { useState } from 'react';
import { Modal } from '../ui/Modal.jsx';
import { Input } from '../ui/Input.jsx';
import { Textarea } from '../ui/Textarea.jsx';
import { Button } from '../ui/Button.jsx';

const PROJECT_COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f97316',
  '#22c55e',
  '#14b8a6',
  '#eab308',
  '#ef4444',
];

export { PROJECT_COLORS };

export function CreateProjectModal({ open, onClose, onSubmit, loading }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    setError('');

    try {
      await onSubmit({ name: name.trim(), description, color });
      setName('');
      setDescription('');
      setColor(PROJECT_COLORS[0]);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create project">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
            {error}
          </div>
        )}

        <Input
          id="project-name"
          label="Project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Marketing Campaign"
          autoFocus
        />

        <Textarea
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this project about?"
        />

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Color</p>
          <div className="flex flex-wrap gap-2">
            {PROJECT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Select color ${c}`}
                className={`h-8 w-8 rounded-full ring-2 ring-offset-2 transition-transform hover:scale-110 dark:ring-offset-gray-900 ${
                  color === c ? 'ring-brand-500' : 'ring-transparent'
                }`}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Create project
          </Button>
        </div>
      </form>
    </Modal>
  );
}
