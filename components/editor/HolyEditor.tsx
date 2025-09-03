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
import { useEditorContext } from '@/contexts/EditorContext';
import { api } from '@/utils/api';
import { getLocalStorageDocuments } from '@/utils/migration';

interface HolyEditorProps {
  documentId?: string;
}

export default function HolyEditor({ documentId }: HolyEditorProps) {
  const { sermonInfo, setSermonInfo, setDocumentId, setEditorContent } = useEditorContext();
  const router = useRouter();
  
  // tRPC query for loading document
  const { data: document, isLoading } = api.document.getById.useQuery(
    { id: documentId! },
    { 
      enabled: !!documentId && documentId !== 'new',
      retry: 1, // 한 번만 재시도
      onError: (error) => {
        console.log('DB에서 문서를 찾을 수 없음, localStorage 확인 중...');
      }
    }
  );
  
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

  // 문서 불러오기 (DB 우선, localStorage 폴백)
  useEffect(() => {
    if (!editor) return;
    if (!documentId || documentId === 'new') return;
    
    // DB에서 문서 로드 성공
    if (document) {
      // 설교정보 복원
      const sermonData = document.content?.sermonInfo || {};
      setSermonInfo({
        title: document.title || sermonData.title || '',
        pastor: sermonData.pastor || '',
        verse: sermonData.verse || '',
        serviceType: sermonData.serviceType || '주일설교',
        date: sermonData.date
      });
      
      // editor content 설정
      if (document.content) {
        editor.commands.setContent(document.content);
      }
      console.log('문서를 데이터베이스에서 불러왔습니다');
      return;
    }
    
    // DB에서 못 찾고, 로딩도 끝났으면 localStorage 확인
    if (!isLoading && !document) {
      try {
        const localDocs = getLocalStorageDocuments();
        const localDoc = localDocs.find(d => d.id === documentId);
        
        if (localDoc) {
          // 설교정보 복원
          if (localDoc.sermonInfo) {
            setSermonInfo(localDoc.sermonInfo);
          } else if (localDoc.title) {
            // 이전 버전 호환성
            setSermonInfo({
              title: localDoc.title,
              pastor: '',
              verse: '',
              serviceType: '주일설교'
            });
          }
          // editor content 설정
          if (localDoc.content) {
            editor.commands.setContent(localDoc.content);
          }
          console.log('문서를 localStorage에서 불러왔습니다');
        } else {
          console.error('문서를 찾을 수 없습니다');
          router.push('/documents');
        }
      } catch (error) {
        console.error('localStorage 문서 로드 실패:', error);
        router.push('/documents');
      }
    }
  }, [editor, documentId, document, isLoading, setSermonInfo, router]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">에디터 초기화 중...</div>
      </div>
    );
  }

  if (isLoading && documentId && documentId !== 'new') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">문서를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="editor-container mx-auto max-w-4xl pb-[calc(var(--toolbar-h)+env(safe-area-inset-bottom))] md:pb-0">
      <SermonInfoSection />
      
      <div className="editor-wrapper bg-background border rounded-lg shadow-sm">
        <Toolbar editor={editor} />
        <EditorContent 
          editor={editor} 
          className="editor-content"
        />
      </div>
    </div>
  );
}
