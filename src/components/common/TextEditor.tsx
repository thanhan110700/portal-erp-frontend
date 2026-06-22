import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  StrikethroughOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  LinkOutlined,
  DisconnectOutlined,
  PictureOutlined,
  CodeOutlined,
  MinusOutlined,
  TableOutlined,
  RedoOutlined,
  UndoOutlined,
  DeleteOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { Button, Input, Popover, Tooltip, Divider, Space } from "antd";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// ToolbarButton — small icon toggle button
// ─────────────────────────────────────────────────────────────────────────────

type ToolbarButtonProps = {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
};

const ToolbarButton = memo(
  forwardRef<HTMLButtonElement, ToolbarButtonProps>(
    ({ onClick, active, disabled, title, children }, ref) => {
      return (
        <Tooltip title={title} placement="top">
          <button
            ref={ref}
            type="button"
            title={title}
            disabled={disabled}
            onClick={onClick}
            className={cn(
              "inline-flex items-center justify-center w-7 h-7 rounded border-none transition-colors duration-150 text-sm text-inherit",
              disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer",
              active ? "bg-foreground/8" : "bg-transparent",
            )}
          >
            {children}
          </button>
        </Tooltip>
      );
    },
  ),
);
ToolbarButton.displayName = "ToolbarButton";

// ─────────────────────────────────────────────────────────────────────────────
// TextEditor — headless Tiptap rich text editor with full toolbar
// ─────────────────────────────────────────────────────────────────────────────

export type TextEditorProps = {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  /** Minimum height of the content area. Defaults to 240px. */
  minHeight?: string;
};

export const TextEditor = memo(function TextEditor({
  value,
  onChange,
  placeholder = "Write something…",
  disabled = false,
  style,
  minHeight = "240px",
}: TextEditorProps) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [htmlMode, setHtmlMode] = useState(false);
  const [htmlDraft, setHtmlDraft] = useState("");

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          style: "color: #1677ff; text-decoration: underline; cursor: pointer;",
          rel: "noopener noreferrer",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          style: "border-radius: 4px; max-width: 100%; height: auto;",
        },
      }),
      Placeholder.configure({ placeholder }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          style:
            "border-collapse: collapse; width: 100%; margin: 16px 0; border: 1px solid #d9d9d9;",
        },
      }),
      TableRow.configure({
        HTMLAttributes: { style: "border-bottom: 1px solid #d9d9d9;" },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          style:
            "border: 1px solid #d9d9d9; padding: 8px 12px; font-weight: 600; text-align: left; background: #fafafa;",
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          style: "border: 1px solid #d9d9d9; padding: 8px 12px;",
        },
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps -- static for editor lifetime
    [],
  );

  const editor = useEditor({
    extensions,
    content: value ?? "",
    onUpdate: ({ editor: e }) => {
      onChange?.(e.getHTML());
    },
    editable: !disabled,
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  useEffect(() => {
    if (!editor || editor.isFocused) return;
    const incoming = value ?? "";
    if (incoming !== editor.getHTML()) {
      editor.commands.setContent(incoming, { emitUpdate: false });
    }
  }, [value, editor]);

  const handleLinkOpen = useCallback(() => {
    if (!editor) return;
    const href = editor.getAttributes("link").href;
    setLinkUrl(typeof href === "string" ? href : "");
    setLinkOpen(true);
  }, [editor]);

  const handleLinkApply = useCallback(() => {
    if (!editor) return;
    const url = linkUrl.trim();
    if (!url) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
    }
    setLinkOpen(false);
    setLinkUrl("");
  }, [editor, linkUrl]);

  const handleLinkRemove = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setLinkOpen(false);
    setLinkUrl("");
  }, [editor]);

  const handleToggleHtmlMode = useCallback(() => {
    if (!editor) return;
    if (!htmlMode) {
      setHtmlDraft(editor.getHTML());
      setHtmlMode(true);
    } else {
      editor.commands.setContent(htmlDraft, { emitUpdate: true });
      setHtmlMode(false);
    }
  }, [editor, htmlMode, htmlDraft]);

  const tb = useMemo(() => {
    if (!editor) return null;
    return {
      undo: () => editor.chain().focus().undo().run(),
      redo: () => editor.chain().focus().redo().run(),
      h1: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      h2: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      h3: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      bold: () => editor.chain().focus().toggleBold().run(),
      italic: () => editor.chain().focus().toggleItalic().run(),
      underline: () => editor.chain().focus().toggleUnderline().run(),
      strike: () => editor.chain().focus().toggleStrike().run(),
      code: () => editor.chain().focus().toggleCode().run(),
      bulletList: () => editor.chain().focus().toggleBulletList().run(),
      orderedList: () => editor.chain().focus().toggleOrderedList().run(),
      blockquote: () => editor.chain().focus().toggleBlockquote().run(),
      codeBlock: () => editor.chain().focus().toggleCodeBlock().run(),
      hr: () => editor.chain().focus().setHorizontalRule().run(),
      insertTable: () =>
        editor
          .chain()
          .focus()
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run(),
      addColBefore: () => editor.chain().focus().addColumnBefore().run(),
      addColAfter: () => editor.chain().focus().addColumnAfter().run(),
      deleteCol: () => editor.chain().focus().deleteColumn().run(),
      addRowBefore: () => editor.chain().focus().addRowBefore().run(),
      addRowAfter: () => editor.chain().focus().addRowAfter().run(),
      deleteRow: () => editor.chain().focus().deleteRow().run(),
      deleteTable: () => editor.chain().focus().deleteTable().run(),
      openMedia: () => {
        const url = window.prompt("Enter image URL:");
        if (url) {
          editor.chain().focus().setImage({ src: url }).run();
        }
      },
    };
  }, [editor]);

  if (!editor || !tb) return null;

  const toolbarDivider = (
    <Divider type="vertical" className="!h-5 !my-0 !mx-0.5" />
  );

  const linkPopoverContent = (
    <div className="flex flex-col gap-2 w-[240px]">
      <span className="text-xs text-muted-foreground">Link URL</span>
      <Space.Compact>
        <Input
          size="small"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleLinkApply();
            }
          }}
          placeholder="https://example.com"
          autoFocus
        />
        <Button size="small" type="primary" onClick={handleLinkApply}>
          Apply
        </Button>
      </Space.Compact>
      {editor.isActive("link") && (
        <button
          type="button"
          onClick={handleLinkRemove}
          className="flex items-center gap-1 text-xs text-[#ff4d4f] bg-none border-none cursor-pointer p-0"
        >
          <DisconnectOutlined />
          Remove link
        </button>
      )}
    </div>
  );

  return (
    <div
      className={cn(
        "border border-[#d9d9d9] dark:border-border rounded-md overflow-hidden bg-white dark:bg-[#1c1c1e]",
        disabled ? "opacity-60 pointer-events-none" : "pointer-events-auto",
      )}
      style={style}
    >
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-0.5 py-1.5 px-2 border-b border-[#d9d9d9] dark:border-border bg-[#fafafa] dark:bg-[#252527]">
        {/* History */}
        <ToolbarButton
          onClick={tb.undo}
          disabled={!editor.can().undo()}
          title="Undo (⌘Z)"
        >
          <UndoOutlined />
        </ToolbarButton>
        <ToolbarButton
          onClick={tb.redo}
          disabled={!editor.can().redo()}
          title="Redo (⌘⇧Z)"
        >
          <RedoOutlined />
        </ToolbarButton>

        {toolbarDivider}

        {/* Headings */}
        <ToolbarButton
          active={editor.isActive("heading", { level: 1 })}
          onClick={tb.h1}
          title="Heading 1"
        >
          <span className="font-bold text-[11px]">H1</span>
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("heading", { level: 2 })}
          onClick={tb.h2}
          title="Heading 2"
        >
          <span className="font-bold text-[11px]">H2</span>
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("heading", { level: 3 })}
          onClick={tb.h3}
          title="Heading 3"
        >
          <span className="font-bold text-[11px]">H3</span>
        </ToolbarButton>

        {toolbarDivider}

        {/* Text marks */}
        <ToolbarButton
          active={editor.isActive("bold")}
          onClick={tb.bold}
          title="Bold (⌘B)"
        >
          <BoldOutlined />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("italic")}
          onClick={tb.italic}
          title="Italic (⌘I)"
        >
          <ItalicOutlined />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("underline")}
          onClick={tb.underline}
          title="Underline (⌘U)"
        >
          <UnderlineOutlined />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("strike")}
          onClick={tb.strike}
          title="Strikethrough"
        >
          <StrikethroughOutlined />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("code")}
          onClick={tb.code}
          title="Inline code"
        >
          <CodeOutlined />
        </ToolbarButton>

        {toolbarDivider}

        {/* Lists */}
        <ToolbarButton
          active={editor.isActive("bulletList")}
          onClick={tb.bulletList}
          title="Bullet list"
        >
          <UnorderedListOutlined />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("orderedList")}
          onClick={tb.orderedList}
          title="Numbered list"
        >
          <OrderedListOutlined />
        </ToolbarButton>

        {toolbarDivider}

        {/* Link */}
        <Popover
          open={linkOpen}
          onOpenChange={setLinkOpen}
          content={linkPopoverContent}
          trigger="click"
          placement="bottom"
        >
          <ToolbarButton
            active={editor.isActive("link")}
            onClick={handleLinkOpen}
            title="Insert link"
          >
            <LinkOutlined />
          </ToolbarButton>
        </Popover>

        {/* Image */}
        <ToolbarButton onClick={tb.openMedia} title="Insert image">
          <PictureOutlined />
        </ToolbarButton>

        {toolbarDivider}

        {/* HR */}
        <ToolbarButton onClick={tb.hr} title="Horizontal rule">
          <MinusOutlined />
        </ToolbarButton>

        {toolbarDivider}

        {/* Table */}
        <ToolbarButton onClick={tb.insertTable} title="Insert table">
          <TableOutlined />
        </ToolbarButton>

        {editor.isActive("table") && (
          <>
            {toolbarDivider}
            <ToolbarButton onClick={tb.addColBefore} title="Add column before">
              <ArrowLeftOutlined />
            </ToolbarButton>
            <ToolbarButton onClick={tb.addColAfter} title="Add column after">
              <ArrowRightOutlined />
            </ToolbarButton>
            <ToolbarButton onClick={tb.deleteCol} title="Delete column">
              <span className="text-[10px] font-bold">-C</span>
            </ToolbarButton>
            {toolbarDivider}
            <ToolbarButton onClick={tb.addRowBefore} title="Add row before">
              <ArrowUpOutlined />
            </ToolbarButton>
            <ToolbarButton onClick={tb.addRowAfter} title="Add row after">
              <ArrowDownOutlined />
            </ToolbarButton>
            <ToolbarButton onClick={tb.deleteRow} title="Delete row">
              <span className="text-[10px] font-bold">-R</span>
            </ToolbarButton>
            {toolbarDivider}
            <ToolbarButton onClick={tb.deleteTable} title="Delete table">
              <DeleteOutlined className="text-[#ff4d4f]" />
            </ToolbarButton>
          </>
        )}

        <div className="ml-auto">
          <ToolbarButton
            onClick={handleToggleHtmlMode}
            active={htmlMode}
            title="Edit HTML"
          >
            <FileTextOutlined />
          </ToolbarButton>
        </div>
      </div>

      {/* ── HTML source editor ── */}
      {htmlMode ? (
        <textarea
          value={htmlDraft}
          onChange={(e) => {
            setHtmlDraft(e.target.value);
            onChange?.(e.target.value);
          }}
          className="w-full resize-y bg-white dark:bg-[#1c1c1e] py-3 px-4 font-mono text-xs border-none outline-none text-foreground"
          style={{ minHeight }}
          spellCheck={false}
        />
      ) : null}

      {/* ── Editor content ── */}
      <div className={htmlMode ? "hidden" : "block"}>
        <EditorContent
          editor={editor}
          style={{ "--editor-min-height": minHeight } as React.CSSProperties}
          className="tiptap-editor"
        />
      </div>

      <style>{`
        .tiptap-editor .tiptap {
          min-height: ${minHeight};
          padding: 12px 16px;
          outline: none;
        }
        .tiptap-editor .tiptap p.is-editor-empty:first-child::before {
          color: #bfbfbf;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .tiptap-editor .tiptap h1 { font-size: 1.75em; font-weight: 700; margin: 0.75em 0 0.5em; }
        .tiptap-editor .tiptap h2 { font-size: 1.4em; font-weight: 600; margin: 0.75em 0 0.5em; }
        .tiptap-editor .tiptap h3 { font-size: 1.15em; font-weight: 600; margin: 0.75em 0 0.5em; }
        .tiptap-editor .tiptap p { margin: 0.5em 0; }
        .tiptap-editor .tiptap ul, .tiptap-editor .tiptap ol { padding-left: 1.5em; margin: 0.5em 0; }
        .tiptap-editor .tiptap blockquote {
          border-left: 3px solid #d9d9d9;
          margin: 0.75em 0;
          padding-left: 1em;
          color: #595959;
        }
        .tiptap-editor .tiptap code {
          background: #f5f5f5;
          border-radius: 3px;
          padding: 0.1em 0.3em;
          font-family: monospace;
          font-size: 0.85em;
        }
        .tiptap-editor .tiptap pre {
          background: #f5f5f5;
          border-radius: 4px;
          padding: 12px 16px;
          margin: 0.75em 0;
          overflow-x: auto;
        }
        .tiptap-editor .tiptap pre code {
          background: none;
          padding: 0;
        }
        .tiptap-editor .tiptap hr {
          border: none;
          border-top: 1px solid #d9d9d9;
          margin: 1em 0;
        }
        [data-theme="dark"] .tiptap-editor .tiptap blockquote {
          border-left-color: var(--border);
          color: var(--muted-foreground);
        }
        [data-theme="dark"] .tiptap-editor .tiptap code {
          background: #2c2c2e;
          color: #ffffff;
        }
        [data-theme="dark"] .tiptap-editor .tiptap pre {
          background: #2c2c2e;
        }
        [data-theme="dark"] .tiptap-editor .tiptap hr {
          border-top-color: var(--border);
        }
      `}</style>
    </div>
  );
});
TextEditor.displayName = "TextEditor";
