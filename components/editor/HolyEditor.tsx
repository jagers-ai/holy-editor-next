'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Toolbar } from './Toolbar';
import { BibleVerseExtension } from './extensions/BibleVerseExtension';
import { toast } from 'sonner';

interface HolyEditorProps {
  documentId?: string;
}

export default function HolyEditor({ documentId }: HolyEditorProps) {
  const [title, setTitle] = useState('새 문서');
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

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
      BibleVerseExtension
    ],
    content: '',
    immediatelyRender: false, // SSR 하이드레이션 문제 해결
    onUpdate: ({ editor }) => {
      // 자동 저장 (debounce 필요)
      // TODO: debounce 구현
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

  // 저장 함수
  const handleSave = useCallback(() => {
    if (!editor) return;
    
    setIsSaving(true);
    
    try {
      const docs = JSON.parse(localStorage.getItem('holy-documents') || '[]');
      const docId = documentId === 'new' || !documentId ? Date.now().toString() : documentId;
      
      const newDoc = {
        id: docId,
        title: title || '제목 없음',
        content: editor.getJSON(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // 기존 문서 업데이트 vs 새 문서 추가
      const existingIndex = docs.findIndex((d: any) => d.id === docId);
      
      if (existingIndex >= 0) {
        // 기존 문서 업데이트 (createdAt 보존)
        newDoc.createdAt = docs[existingIndex].createdAt;
        docs[existingIndex] = newDoc;
      } else {
        // 새 문서 추가
        docs.push(newDoc);
      }
      
      localStorage.setItem('holy-documents', JSON.stringify(docs));
      
      setIsSaving(false);
      toast.success('문서가 저장되었습니다');
      
      // 새 문서인 경우 URL 업데이트
      if (documentId === 'new' || !documentId) {
        router.replace(`/editor/${docId}`);
      }
      
    } catch (error) {
      console.error('저장 실패:', error);
      setIsSaving(false);
      toast.error('저장 중 오류가 발생했습니다');
    }
  }, [editor, documentId, title, router]);

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col h-dvh max-w-2xl mx-auto overflow-hidden">
      {/* 헤더 */}
      <div className="border-b px-4 py-3 flex items-center justify-between shrink-0">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-lg font-semibold bg-transparent border-none outline-none flex-1"
          placeholder="문서 제목"
        />
        <div className="flex items-center gap-2">
          {isSaving && <span className="text-xs text-muted-foreground">저장 중...</span>}
          <button
            onClick={handleSave}
            className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
          >
            저장
          </button>
        </div>
      </div>

      {/* 에디터 */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain pb-[calc(var(--toolbar-h)+env(safe-area-inset-bottom)+var(--keyboard-inset,0px))] md:pb-0 [scroll-padding-bottom:calc(var(--toolbar-h)+env(safe-area-inset-bottom)+var(--keyboard-inset,0px))] md:[scroll-padding-bottom:0]">
        <EditorContent editor={editor} />
      </div>

      {/* 하단 툴바 */}
      <div className="shrink-0">
        <Toolbar editor={editor} />
      </div>
    </div>
  );
}
