import { useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { cn } from '../../utils/cn.js';

export function RichTextEditor({ value, onChange, placeholder = 'Add a description...', className }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class:
          'min-h-[120px] px-3 py-2 text-sm text-gray-900 focus:outline-none dark:text-gray-100 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5',
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', false);
    }
  }, [editor, value]);

  return (
    <div
      className={cn(
        'rounded-lg border border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900',
        className,
      )}
    >
      <EditorContent editor={editor} />
    </div>
  );
}
