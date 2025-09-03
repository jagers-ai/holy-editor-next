'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Toolbar } from './Toolbar';
import { BibleVerseExtension } from './extensions/BibleVerseExtension';
import { toast } from 'sonner';
import { useEditorContext } from '@/contexts/EditorContext';

interface HolyEditorProps {
  documentId?: string;
}

export default function HolyEditor({ documentId }: HolyEditorProps) {
  const { title, setTitle, setDocumentId, setEditorContent } = useEditorContext();
  const router = useRouter();
  
  // Context에 documentId 설정
  useEffect(() => {
    setDocumentId(documentId);
  }, [documentId, setDocumentId]);

  // 성경 데이터 로드
  useEffect(() => {
    if (!window.bibleData) {
      fetch('/bible-data.json')
        .then(res => res.json())
        .then(data => {
          window.bibleData = data;
        })
        .catch(err => console.error('성경 데이터 로드 실패:', err));
    }
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        },
        undoRedo: {
          depth: 100,
          newGroupDelay: 500
        }
      }),
      BibleVerseExtension,
      Image.extend({
        addKeyboardShortcuts() {
          return {
            'Backspace': ({ editor }) => {
              const { selection } = editor.state;
              const pos = selection.$anchor.pos;
              const node = editor.state.doc.nodeAt(pos - 1);
              
              // 이미지 바로 뒤에서 백스페이스 누르면 이미지 삭제
              if (node && node.type.name === 'image') {
                editor.chain()
                  .focus()
                  .setNodeSelection(pos - 1)
                  .deleteSelection()
                  .run();
                return true;
              }
              return false;
            }
          }
        }
      }).configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        }
      })
    ],
    content: '',
    immediatelyRender: false, // SSR 하이드레이션 문제 해결
    onUpdate: ({ editor }) => {
      // Context에 에디터 콘텐츠 업데이트
      setEditorContent(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px] px-4 py-6'
      }
    }
  });

  // 문서 불러오기
  useEffect(() => {
    if (!editor) return;
    if (!documentId || documentId === 'new') return;
    
    try {
      const docs = JSON.parse(localStorage.getItem('holy-documents') || '[]');
      const doc = docs.find((d: any) => d.id === documentId);
      
      if (doc) {
        setTitle(doc.title);
        // editor가 준비된 후 content 설정
        if (doc.content) {
          editor.commands.setContent(doc.content);
        }
        toast.success('문서를 불러왔습니다');
      } else {
        toast.error('문서를 찾을 수 없습니다');
        router.push('/documents');
      }
    } catch (error) {
      console.error('문서 로드 실패:', error);
      toast.error('문서 로드 중 오류가 발생했습니다');
    }
  }, [editor, documentId, router]);

  // 초기 에디터 콘텐츠 설정
  useEffect(() => {
    if (editor) {
      setEditorContent(editor.getJSON());
    }
  }, [editor, setEditorContent]);

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col h-dvh max-w-2xl mx-auto overflow-hidden">
      {/* 에디터 */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain pb-[calc(var(--toolbar-h)+env(safe-area-inset-bottom)+var(--keyboard-inset,0px))] md:pb-0 [scroll-padding-bottom:calc(var(--toolbar-h)+env(safe-area-inset-bottom)+var(--keyboard-inset,0px))] md:[scroll-padding-bottom:0]">
        <div className="px-4 pt-4 pb-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-2xl font-bold border-none outline-none bg-transparent"
            placeholder="설교 제목을 입력하세요"
          />
        </div>
        <EditorContent editor={editor} />
      </div>

      {/* 하단 툴바 */}
      <div className="shrink-0">
        <Toolbar editor={editor} />
      </div>
    </div>
  );
}
