'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Toolbar } from './Toolbar';
import { BibleVerseExtension } from './extensions/BibleVerseExtension';
import { SermonInfoSection } from './SermonInfoSection';
// Toast functionality removed - to be replaced with shadcn/ui
import { useEditorContext } from '@/contexts/EditorContext';

interface HolyEditorProps {
  documentId?: string;
}

export default function HolyEditor({ documentId }: HolyEditorProps) {
  const { sermonInfo, setSermonInfo, setDocumentId, setEditorContent } = useEditorContext();
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

  // ⚡ extensions 메모이제이션으로 재생성 방지
  const extensions = useMemo(() => [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3]
      },
      undoRedo: {
        depth: 100,
        newGroupDelay: 500
      }
    }),
    BibleVerseExtension,  // 새로운 성경구절 노드
    Highlight.configure({
      multicolor: true,
      HTMLAttributes: {
        class: 'highlight',
      }
    }),
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
    }),
    Placeholder.configure({
      placeholder: '설교 내용을 입력해주세요',
      emptyEditorClass: 'is-editor-empty',
    })
  ], []);

  // ⚡ onUpdate 최적화 - 디바운싱 고려
  const handleUpdate = useMemo(() => 
    ({ editor }: any) => {
      setEditorContent(editor.getJSON());
    },
    [setEditorContent]
  );

  const editor = useEditor({
    extensions,
    content: '',
    immediatelyRender: false, // SSR 하이드레이션 문제 해결
    onUpdate: handleUpdate,
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none min-h-[400px] px-4 py-6'
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
        // 설교정보 복원
        if (doc.sermonInfo) {
          setSermonInfo(doc.sermonInfo);
        } else if (doc.title) {
          // 이전 버전 호환성
          setSermonInfo({
            title: doc.title,
            pastor: '',
            verse: '',
            serviceType: '주일설교'
          });
        }
        // editor가 준비된 후 content 설정
        if (doc.content) {
          editor.commands.setContent(doc.content);
        }
        // TODO: Add toast notification
        // toast.success('문서를 불러왔습니다');
      } else {
        // TODO: Add toast notification
        // toast.error('문서를 찾을 수 없습니다');
        router.push('/documents');
      }
    } catch (error) {
      console.error('문서 로드 실패:', error);
      // TODO: Add toast notification
      // toast.error('문서 로드 중 오류가 발생했습니다');
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
      {/* 스크롤 가능한 영역 */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain pb-[calc(var(--toolbar-h)+env(safe-area-inset-bottom)+var(--keyboard-inset,0px))] md:pb-0 [scroll-padding-bottom:calc(var(--toolbar-h)+env(safe-area-inset-bottom)+var(--keyboard-inset,0px))] md:[scroll-padding-bottom:0]">
        {/* 설교정보 섹션 */}
        <SermonInfoSection 
          info={sermonInfo}
          onChange={setSermonInfo}
        />
        
        {/* 설교 본문 에디터 */}
        <EditorContent editor={editor} className="px-4 py-4" />
      </div>

      {/* 하단 툴바 */}
      <div className="shrink-0">
        <Toolbar editor={editor} />
      </div>
    </div>
  );
}
