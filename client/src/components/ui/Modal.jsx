import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../utils/cn.js';

export function Modal({ open, onClose, title, children, className }) {
  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.button
            type="button"
            aria-label="Close modal"
            className="absolute inset-0 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'relative z-10 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl',
              'dark:border-gray-800 dark:bg-gray-900',
              className,
            )}
          >
            {title && (
              <h2
                id="modal-title"
                className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100"
              >
                {title}
              </h2>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
