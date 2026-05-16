"use client";

import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

interface TiptapEditorProps {
    content: string;
    onChange: (html: string) => void;
    placeholder?: string;
}

const TiptapEditor: React.FC<TiptapEditorProps> = ({ content, onChange, placeholder }) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                // Disable all formatting extensions to keep it plain-text based but structured
                bold: false,
                italic: false,
                strike: false,
                bulletList: false,
                orderedList: false,
                heading: false,
                codeBlock: false,
                blockquote: false,
                code: false,
            }),
        ],
        content: content,
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        onFocus: ({ editor }) => {
            if (placeholder && editor.getText().trim() === placeholder.trim()) {
                editor.commands.clearContent();
            }
        },
        onBlur: ({ editor }) => {
            if (placeholder && editor.isEmpty) {
                editor.commands.setContent(`<p>${placeholder}</p>`);
            }
        },
    });

    // Handle external content updates (crucial for async data fetching)
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content);
        }
    }, [content, editor]);

    if (!editor) {
        return null;
    }

    return (
        <div className="tiptap-editor-container plain-text">
            <EditorContent editor={editor} className="tiptap-content" />
        </div>
    );
};

export default TiptapEditor;
