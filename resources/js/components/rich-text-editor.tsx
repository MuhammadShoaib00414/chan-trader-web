import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Bold, Italic, Link, List, ListOrdered, Underline } from 'lucide-react';
import { useEffect, useRef } from 'react';

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
};

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const exec = (command: string, arg?: string) => {
    document.execCommand(command, false, arg);
    editorRef.current?.focus();
    onChange(editorRef.current?.innerHTML ?? '');
  };

  const handleInput = () => {
    onChange(editorRef.current?.innerHTML ?? '');
  };

  return (
    <div className={cn('rounded-md border', className)}>
      <div className="flex flex-wrap gap-1 border-b bg-muted/40 p-2">
        <Button type="button" size="sm" variant="ghost" onClick={() => exec('bold')} aria-label="Bold">
          <Bold className="h-4 w-4" />
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => exec('italic')} aria-label="Italic">
          <Italic className="h-4 w-4" />
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => exec('underline')} aria-label="Underline">
          <Underline className="h-4 w-4" />
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => exec('insertUnorderedList')} aria-label="Bullet list">
          <List className="h-4 w-4" />
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => exec('insertOrderedList')} aria-label="Numbered list">
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => {
            const url = window.prompt('Enter URL');
            if (url) exec('createLink', url);
          }}
          aria-label="Insert link"
        >
          <Link className="h-4 w-4" />
        </Button>
      </div>
      <div
        ref={editorRef}
        className="min-h-[220px] bg-background p-3 text-sm focus:outline-none dark:bg-background [&_a]:text-primary [&_a]:underline [&_ol]:ml-6 [&_ol]:list-decimal [&_ul]:ml-6 [&_ul]:list-disc"
        contentEditable
        role="textbox"
        aria-multiline
        data-placeholder={placeholder}
        onInput={handleInput}
        suppressContentEditableWarning
      />
    </div>
  );
}
