import React, { useState, useRef } from 'react';
import Markdown from 'react-markdown';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Eye,
  Edit3,
  Sparkles,
  Feather,
  Highlighter
} from 'lucide-react';

interface FormattedTextEditorProps {
  label?: React.ReactNode;
  value: string;
  onChange: (newValue: string) => void;
  rows?: number;
  placeholder?: string;
  className?: string;
  allowCursiveToggle?: boolean;
}

export const FormattedTextEditor: React.FC<FormattedTextEditorProps> = ({
  label,
  value,
  onChange,
  rows = 4,
  placeholder = 'Enter formatted text or notes...',
  className = '',
  allowCursiveToggle = true
}) => {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'split'>('edit');
  const [useCursiveFont, setUseCursiveFont] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Helper to insert formatting at selection
  const insertFormatting = (prefix: string, suffix: string = '', defaultText: string = 'text') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const textToWrap = selectedText || defaultText;

    const newText =
      value.substring(0, start) +
      prefix +
      textToWrap +
      suffix +
      value.substring(end);

    onChange(newText);

    // Restore selection focus
    setTimeout(() => {
      textarea.focus();
      const newCursorStart = start + prefix.length;
      const newCursorEnd = newCursorStart + textToWrap.length;
      textarea.setSelectionRange(newCursorStart, newCursorEnd);
    }, 0);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header with Label and Edit/Preview Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {label && <div className="text-xs font-serif font-bold text-amber-200">{label}</div>}

        <div className="flex items-center gap-1 bg-stone-900 border border-stone-800 p-0.5 rounded-lg text-[11px] font-mono">
          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded transition cursor-pointer ${
              activeTab === 'edit'
                ? 'bg-amber-900/80 text-amber-200 font-bold shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
            title="Edit raw text & markdown"
          >
            <Edit3 className="w-3 h-3" /> Edit
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded transition cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-amber-900/80 text-amber-200 font-bold shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
            title="Preview formatted text"
          >
            <Eye className="w-3 h-3" /> Preview
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('split')}
            className={`hidden sm:flex items-center gap-1 px-2 py-0.5 rounded transition cursor-pointer ${
              activeTab === 'split'
                ? 'bg-amber-900/80 text-amber-200 font-bold shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
            title="Side-by-side edit & preview"
          >
            Split
          </button>

          {allowCursiveToggle && (
            <button
              type="button"
              onClick={() => setUseCursiveFont(prev => !prev)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded transition border ml-1 cursor-pointer ${
                useCursiveFont
                  ? 'bg-purple-950 text-purple-200 border-purple-600 font-bold'
                  : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200'
              }`}
              title="Toggle Cursive / Calligraphy Font Style"
            >
              <Feather className="w-3 h-3 text-purple-400" />
              <span>Cursive</span>
            </button>
          )}
        </div>
      </div>

      {/* Editor & Preview Container */}
      <div className="bg-stone-950 border border-stone-800 rounded-xl overflow-hidden shadow-inner focus-within:border-amber-600/60 transition">
        {/* Formatting Toolbar (Visible in edit or split modes) */}
        {(activeTab === 'edit' || activeTab === 'split') && (
          <div className="bg-stone-900/90 border-b border-stone-800 p-1.5 flex flex-wrap items-center gap-1 text-stone-300">
            <button
              type="button"
              onClick={() => insertFormatting('**', '**', 'bold text')}
              className="p-1.5 hover:bg-stone-800 rounded text-stone-300 hover:text-amber-300 transition cursor-pointer"
              title="Bold (**text**)"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => insertFormatting('*', '*', 'italic text')}
              className="p-1.5 hover:bg-stone-800 rounded text-stone-300 hover:text-amber-300 transition cursor-pointer"
              title="Italic / Cursive (*text*)"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => insertFormatting('<u>', '</u>', 'underlined text')}
              className="p-1.5 hover:bg-stone-800 rounded text-stone-300 hover:text-amber-300 transition cursor-pointer"
              title="Underline (<u>text</u>)"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => insertFormatting('~~', '~~', 'strikethrough')}
              className="p-1.5 hover:bg-stone-800 rounded text-stone-300 hover:text-amber-300 transition cursor-pointer"
              title="Strikethrough (~~text~~)"
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>

            <div className="w-px h-4 bg-stone-800 mx-0.5" />

            <button
              type="button"
              onClick={() => insertFormatting('### ', '', 'Heading')}
              className="p-1.5 hover:bg-stone-800 rounded text-stone-300 hover:text-amber-300 transition cursor-pointer"
              title="Heading (### Heading)"
            >
              <Heading2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => insertFormatting('- ', '', 'List item')}
              className="p-1.5 hover:bg-stone-800 rounded text-stone-300 hover:text-amber-300 transition cursor-pointer"
              title="Bullet List (- item)"
            >
              <List className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => insertFormatting('1. ', '', 'Numbered item')}
              className="p-1.5 hover:bg-stone-800 rounded text-stone-300 hover:text-amber-300 transition cursor-pointer"
              title="Numbered List (1. item)"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => insertFormatting('> ', '', 'Quote or lore text')}
              className="p-1.5 hover:bg-stone-800 rounded text-stone-300 hover:text-amber-300 transition cursor-pointer"
              title="Quote / Lore (> text)"
            >
              <Quote className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => insertFormatting('<mark>', '</mark>', 'highlighted text')}
              className="p-1.5 hover:bg-stone-800 rounded text-stone-300 hover:text-amber-300 transition cursor-pointer"
              title="Highlight (<mark>text</mark>)"
            >
              <Highlighter className="w-3.5 h-3.5 text-amber-400" />
            </button>

            <div className="w-px h-4 bg-stone-800 mx-0.5" />

            <button
              type="button"
              onClick={() => insertFormatting('<span style="font-family: cursive; font-style: italic;">', '</span>', 'Cursive Calligraphy')}
              className="px-2 py-0.5 hover:bg-purple-950/80 rounded text-purple-300 hover:text-purple-200 transition text-[11px] font-bold border border-purple-800/40 cursor-pointer flex items-center gap-1"
              title="Insert Inline Cursive Tag"
            >
              <Feather className="w-3 h-3 text-purple-400" />
              <span>Cursive Tag</span>
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className={`grid ${activeTab === 'split' ? 'grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-stone-800' : 'grid-cols-1'}`}>
          {/* Edit Area */}
          {(activeTab === 'edit' || activeTab === 'split') && (
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              rows={rows}
              placeholder={placeholder}
              className={`w-full bg-transparent p-3 text-xs text-stone-200 leading-relaxed focus:outline-none resize-y ${
                useCursiveFont ? 'font-serif italic text-amber-100 text-sm' : 'font-sans'
              }`}
            />
          )}

          {/* Formatted Preview Area */}
          {(activeTab === 'preview' || activeTab === 'split') && (
            <div
              className={`p-3 text-xs text-stone-200 leading-relaxed overflow-y-auto max-h-[400px] min-h-[80px] bg-stone-950/40 ${
                useCursiveFont ? 'font-serif italic text-amber-100 text-sm' : ''
              }`}
            >
              {value ? (
                <div className="markdown-body space-y-2">
                  <Markdown
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                      strong: ({ children }) => <strong className="font-bold text-amber-300">{children}</strong>,
                      em: ({ children }) => <em className="italic text-purple-200 font-serif">{children}</em>,
                      h1: ({ children }) => <h1 className="text-base font-serif font-bold text-amber-400 border-b border-stone-800 pb-1 mb-2">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-sm font-serif font-bold text-amber-300 mb-1">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-xs font-serif font-bold text-amber-200 mb-1">{children}</h3>,
                      ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2 text-stone-300">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2 text-stone-300">{olChildren(children)}</ol>,
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-2 border-amber-500/80 pl-3 italic text-amber-200/90 my-2 bg-amber-950/20 py-1 rounded-r">
                          {children}
                        </blockquote>
                      )
                    }}
                  >
                    {value}
                  </Markdown>
                </div>
              ) : (
                <span className="text-stone-600 italic text-[11px]">No content entered yet. Switch to Edit mode to write notes.</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper for ol children
function olChildren(children: React.ReactNode) {
  return children;
}
