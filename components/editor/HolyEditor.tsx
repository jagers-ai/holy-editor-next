'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import Focus from '@tiptap/extension-focus';
import { useEffect, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Toolbar } from './Toolbar';
import SelectionMiniBar from './SelectionMiniBar';
import { BibleVerseExtension } from './extensions/BibleVerseExtension';
import { SermonInfoSection } from './SermonInfoSection';
import type { SermonInfo } from './SermonInfoSection';
import { useEditorContext } from '@/contexts/EditorContext';
import { api } from '@/utils/api';
import toast from 'react-hot-toast';

interface HolyEditorProps {
  documentId?: string;
}

export default function HolyEditor({ documentId }: HolyEditorProps) {
  const { sermonInfo, setSermonInfo, setDocumentId, setEditorContent, setCurrentFolderId, resetForNewDocument } = useEditorContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  // 로컬 변경/초기 적용 가드(업로드 이미지 사라짐 방지)
  const hasLocalEditsRef = useRef(false);
  const initialContentAppliedRef = useRef(false);
  // 사용자가 실제로 입력했는지 여부(자동저장 가드)
  const userInteractedRef = useRef(false);
  
  // tRPC query for loading document
  const { data: document, isLoading } = api.document.getById.useQuery(
    { id: documentId! },
    { 
      enabled: !!documentId && documentId !== 'new',
      retry: 1, // 한 번만 재시도
    }
  );
  // 새 문서의 경우 URL 쿼리에서 폴더ID 획득
  const folderIdFromQuery = searchParams?.get('folderId') || undefined;
  const activeFolderId = (documentId && documentId !== 'new') ? (document as any)?.folderId : folderIdFromQuery;
  const { data: activeFolder } = api.folder.getById.useQuery(
    { id: activeFolderId as string },
    { enabled: !!activeFolderId }
  );
  // 폴더 미선택 가드: 새 문서인데 폴더 미지정이면 폴더 페이지로 유도
  useEffect(() => {
    if (!documentId && !folderIdFromQuery) {
      toast.error('먼저 폴더를 선택해주세요');
      router.push('/folders');
    }
  }, [documentId, folderIdFromQuery, router]);
  
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
    Focus.configure({
      className: 'is-focused',
      mode: 'deepest',
    }),
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

  // ⚡ onUpdate 최적화 - 사용자 입력 시에만 컨텍스트 반영
  const handleUpdate = useMemo(() => 
    ({ editor }: any) => {
      if (!userInteractedRef.current) return; // 초기 하이드레이션 업데이트 무시
      hasLocalEditsRef.current = true;
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

  // 에디터 DOM에서 사용자 입력 이벤트를 감지하여 실제 입력임을 표시
  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom as HTMLElement;
    const mark = () => { userInteractedRef.current = true; };
    dom.addEventListener('keydown', mark);
    dom.addEventListener('paste', mark);
    dom.addEventListener('drop', mark);
    dom.addEventListener('compositionend', mark);
    dom.addEventListener('input', mark);
    return () => {
      dom.removeEventListener('keydown', mark);
      dom.removeEventListener('paste', mark);
      dom.removeEventListener('drop', mark);
      dom.removeEventListener('compositionend', mark);
      dom.removeEventListener('input', mark);
    };
  }, [editor]);

  // 문서 불러오기 (DB 우선, localStorage 폴백)
  useEffect(() => {
    if (!editor) return;
    if (!documentId || documentId === 'new') return;
    
    // DB에서 문서 로드 성공
    if (document) {
      // 과거 인코딩 오류로 저장된 serviceType 정규화
      type ServiceType = SermonInfo['serviceType'];
      const allowed: ServiceType[] = ['주일설교','수요예배','금요예배','새벽예배','청년예배','큐티','기타'];
      const normalizeServiceType = (raw: any): ServiceType | undefined => {
        if (typeof raw !== 'string') return undefined;
        const map: Record<string, ServiceType> = {
          '���ϼ���': '주일설교',
          '�����⵵': '수요예배',
          '�ݿ�⵵': '금요예배',
          '����⵵': '새벽예배',
          '����ȸ': '청년예배',
          '��Ÿ': '기타',
        };
        if (map[raw]) return map[raw];
        if ((allowed as readonly string[]).includes(raw)) return raw as ServiceType;
        return '기타';
      };
      // 설교정보 복원
      const contentObj = typeof document.content === 'object' && document.content !== null 
        ? document.content as any 
        : {};
      const sermonData = contentObj.sermonInfo || {};
      setSermonInfo({
        title: document.title || sermonData.title || '',
        pastor: sermonData.pastor || '',
        verse: sermonData.verse || '',
        serviceType: normalizeServiceType(sermonData.serviceType) || '주일설교'
      });
      
      // editor content 설정: 로컬 편집이 없고, 아직 초기 적용 전일 때만 1회 적용
      if (
        document.content &&
        typeof document.content === 'object' &&
        !hasLocalEditsRef.current &&
        !initialContentAppliedRef.current
      ) {
        editor.commands.setContent(document.content as any);
        initialContentAppliedRef.current = true;
      }
      console.log('문서를 데이터베이스에서 불러왔습니다');
      return;
    }
    
    // DB에서 못 찾고, 로딩도 끝났으면 문서가 없는 것
    if (!isLoading && !document) {
      console.error('문서를 찾을 수 없습니다');
      router.push('/folders');
    }
  }, [editor, documentId, document, isLoading, setSermonInfo, router]);

  // 새 문서 진입 시: 전역 상태 초기화 + 에디터 내용 비우기(초기 업데이트 억제)
  useEffect(() => {
    if (!editor) return;
    if (documentId) return; // 기존 문서인 경우 스킵
    // 상태 리셋(폴더ID 전달)
    resetForNewDocument(folderIdFromQuery || undefined);
    // 에디터를 빈 문서로 설정하되 업데이트 이벤트는 발생시키지 않음
    try {
      editor.commands.setContent({ type: 'doc', content: [] } as any, { emitUpdate: false });
    } catch {
      editor.commands.clearContent();
    }
    userInteractedRef.current = false;
    hasLocalEditsRef.current = false;
    initialContentAppliedRef.current = true;
  }, [documentId, editor, resetForNewDocument, folderIdFromQuery]);

  // 현재 폴더 ID를 Context에 반영
  useEffect(() => {
    setCurrentFolderId(activeFolderId);
  }, [activeFolderId, setCurrentFolderId]);

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
    <div className="editor-container mx-auto max-w-4xl pb-0 pt-[var(--toolbar-h)]">
      {activeFolder && (
        <div className="mb-2 flex items-center gap-2 px-1 text-xs text-muted-foreground">
          <span>현재 폴더</span>
          <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 bg-white">
            <span>{activeFolder.icon ?? '📁'}</span>
            <span className="font-medium text-gray-700">{activeFolder.name}</span>
          </span>
        </div>
      )}
      <SermonInfoSection 
        info={sermonInfo} 
        onChange={setSermonInfo} 
      />
      
      <div className="editor-wrapper bg-background border rounded-lg shadow-sm">
        <Toolbar editor={editor} />
        <EditorContent 
          editor={editor} 
          className="editor-content"
        />
        {/* 모바일 선택 시 떠는 보조 미니바 */}
        <SelectionMiniBar editor={editor} enabled={true} />
      </div>
    </div>
  );
}
