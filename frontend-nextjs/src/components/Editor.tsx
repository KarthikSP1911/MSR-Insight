"use client";

import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

interface TiptapEditorProps {
    content: string;
    onChange: (html: string) => void;
}

const TiptapEditor: React.FC<TiptapEditorProps> = ({ content, onChange }) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
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
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

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
