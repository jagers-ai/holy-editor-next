'use client';

import { useEditor, EditorContent, type Editor as TiptapEditor } from '@tiptap/react';
import type { JSONContent } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import Focus from '@tiptap/extension-focus';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Toolbar } from './Toolbar';
import SelectionMiniBar from './SelectionMiniBar';
import { BibleVerseExtension } from './extensions/BibleVerseExtension';
import { SermonInfoSection } from './SermonInfoSection';
import type { SermonInfo } from './SermonInfoSection';
import { useEditorContext } from '@/contexts/EditorContext';
import { api } from '@/utils/api';
import toast from 'react-hot-toast';
import { normalizeServiceType } from '@/lib/domain/sermon';
import { bindUserInteraction } from '@/lib/editor/userInteraction';

type TRPCErrorPayload = {
  data?: {
    code?: string;
  };
};

const EMPTY_DOC: JSONContent = { type: 'doc', content: [] };

const getErrorCode = (error: unknown): string | undefined => {
  if (!error || typeof error !== 'object') return undefined;
  const payload = error as TRPCErrorPayload;
  const code = payload.data?.code;
  return typeof code === 'string' ? code : undefined;
};

const toJsonContent = (value: unknown): JSONContent => {
  if (value && typeof value === 'object') {
    return value as JSONContent;
  }
  return EMPTY_DOC;
};

const extractSermonInfo = (value: unknown): Partial<SermonInfo> => {
  if (!value || typeof value !== 'object') return {};
  const root = value as { sermonInfo?: unknown };
  if (!root.sermonInfo || typeof root.sermonInfo !== 'object') return {};
  const info = root.sermonInfo as Record<string, unknown>;
  return {
    title: typeof info.title === 'string' ? info.title : undefined,
    pastor: typeof info.pastor === 'string' ? info.pastor : undefined,
    verse: typeof info.verse === 'string' ? info.verse : undefined,
    serviceType: typeof info.serviceType === 'string' ? (normalizeServiceType(info.serviceType) as SermonInfo['serviceType']) : undefined,
  };
};

interface HolyEditorProps {
  documentId?: string;
}

export default function HolyEditor({ documentId }: HolyEditorProps) {
  const {
    sermonInfo,
    setSermonInfo,
    setDocumentId,
    setEditorContent,
    currentFolderId,
    setCurrentFolderId,
    resetForNewDocument,
    syncServerHash,
    markClean,
    handleSave,
  } = useEditorContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const utils = api.useUtils();
  // 로컬 변경/초기 적용 가드(업로드 이미지 사라짐 방지)
  const hasLocalEditsRef = useRef(false);
  const initialContentAppliedRef = useRef(false);
  // 사용자가 실제로 입력했는지 여부(자동저장 가드)
  const userInteractedRef = useRef(false);
  const [showRevisionPanel, setShowRevisionPanel] = useState(false);
  const navigationGuardActiveRef = useRef(false);
  const leavingRef = useRef(false);
  
  // tRPC query for loading document
  const { data: document, isLoading } = api.document.getById.useQuery(
    { id: documentId! },
    { 
      enabled: !!documentId && documentId !== 'new',
      retry: 1, // 한 번만 재시도
    }
  );
  const folderListQuery = api.folder.list.useQuery(undefined, {
    staleTime: 60_000,
  });
  const folderOptions = useMemo(
    () =>
      (folderListQuery.data ?? []).map((folder) => ({
        id: folder.id,
        name: folder.name,
        icon: folder.icon ?? null,
      })),
    [folderListQuery.data]
  );
  // 새 문서의 경우 URL 쿼리에서 폴더ID 획득
  const folderIdFromQuery = searchParams?.get('folderId') || undefined;
  const derivedFolderId = documentId && documentId !== 'new'
    ? document?.folderId ?? currentFolderId
    : currentFolderId ?? folderIdFromQuery;
  const { data: activeFolder } = api.folder.getById.useQuery(
    { id: derivedFolderId as string },
    { enabled: !!derivedFolderId }
  );
  const selectedFolderId = currentFolderId ?? (documentId && documentId !== 'new' ? document?.folderId ?? undefined : folderIdFromQuery);
  const canUseRevisions = !!documentId && documentId !== 'new';
  const { data: revisions, isLoading: isLoadingRevisions, refetch: refetchRevisions, isFetching: isFetchingRevisions } = api.document.revisions.useQuery(
    { documentId: documentId! , limit: 10 },
    { enabled: canUseRevisions }
  );
  const restoreRevision = api.document.restoreFromRevision.useMutation({
    onSuccess: async (data) => {
      toast.success('이전 버전으로 복원했습니다');
      setShowRevisionPanel(false);
      await refetchRevisions();
      if (data?.content && editor) {
        try {
          const contentJson = toJsonContent(data.content);
          editor.commands.setContent(contentJson, { emitUpdate: false });
          hasLocalEditsRef.current = false;
          initialContentAppliedRef.current = true;
          userInteractedRef.current = false;
          setEditorContent(contentJson);
          const sermonData = extractSermonInfo(contentJson);
          setSermonInfo({
            title: data.title || sermonData.title || '',
            pastor: sermonData.pastor || '',
            verse: sermonData.verse || '',
            serviceType: sermonData.serviceType || '감사일기'
          });
          syncServerHash(contentJson);
          markClean();
        } catch (err) {
          console.error('복원 콘텐츠 적용 실패:', err);
        }
      }
      if (documentId) {
        await utils.document.getById.invalidate({ id: documentId });
      }
    },
    onError: (error) => {
      console.error('리비전 복원 실패:', error);
      const code = getErrorCode(error);
      if (code === 'UNAUTHORIZED') {
        toast.error('로그인이 필요합니다');
        router.push('/login');
        return;
      }
      toast.error('복원 중 오류가 발생했습니다');
    },
  });

  const handleRestoreRevision = async (revisionId: string) => {
    if (!documentId) return;
    const confirmed = window.confirm('선택한 저장본으로 되돌립니다. 현재 편집 중 내용은 사라집니다. 진행할까요?');
    if (!confirmed) return;
    await restoreRevision.mutateAsync({ documentId, revisionId });
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const guardState = { holyEditorGuard: true };
    if (!navigationGuardActiveRef.current) {
      window.history.pushState(guardState, '', window.location.href);
      navigationGuardActiveRef.current = true;
    }

    const onPopState = () => {
      if (leavingRef.current) return;

      window.history.pushState(guardState, '', window.location.href);

      if (!hasLocalEditsRef.current) {
        leavingRef.current = true;
        window.removeEventListener('popstate', onPopState);
        router.push('/documents');
        return;
      }

      const shouldSave = window.confirm('변경 사항을 저장하시겠습니까?');
      leavingRef.current = true;
      window.removeEventListener('popstate', onPopState);

      if (shouldSave) {
        (async () => {
          try {
            await handleSave();
          } catch (error) {
            console.error('저장 실패, 편집기 머무름:', error);
            leavingRef.current = false;
            window.addEventListener('popstate', onPopState);
          }
        })();
      } else {
        router.push('/documents');
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
      navigationGuardActiveRef.current = false;
      leavingRef.current = false;
    };
  }, [handleSave, router]);

  const toggleRevisionPanel = () => {
    setShowRevisionPanel((prev) => {
      const next = !prev;
      if (!prev && canUseRevisions) {
        void refetchRevisions();
      }
      return next;
    });
  };
  useEffect(() => {
    if (!documentId || documentId === 'new') {
      setShowRevisionPanel(false);
    }
  }, [documentId]);
  
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
    ({ editor }: { editor: TiptapEditor }) => {
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
    const unbind = bindUserInteraction(dom, () => { userInteractedRef.current = true; });
    return () => { unbind(); };
  }, [editor]);

  // 문서 불러오기 (DB 우선, localStorage 폴백)
  useEffect(() => {
    if (!editor) return;
    if (!documentId || documentId === 'new') return;
    
    // DB에서 문서 로드 성공
    if (document) {
      const hasContent = typeof document.content === 'object' && document.content !== null;
      const sermonData = hasContent ? extractSermonInfo(document.content) : {};
      setSermonInfo({
        title: document.title || sermonData.title || '',
        pastor: sermonData.pastor || '',
        verse: sermonData.verse || '',
        serviceType: sermonData.serviceType || '감사일기'
      });
      setCurrentFolderId(document.folderId ?? undefined);

      if (hasContent) {
        const contentJson = toJsonContent(document.content);
        setEditorContent(contentJson);
        syncServerHash(contentJson);
        if (!hasLocalEditsRef.current) {
          markClean();
        }
        if (!hasLocalEditsRef.current && !initialContentAppliedRef.current) {
          editor.commands.setContent(contentJson);
          initialContentAppliedRef.current = true;
        }
      }
      console.log('문서를 데이터베이스에서 불러왔습니다');
      return;
    }
    
    // DB에서 못 찾고, 로딩도 끝났으면 문서가 없는 것
    if (!isLoading && !document) {
      console.error('문서를 찾을 수 없습니다');
      router.push('/documents');
    }
  }, [editor, documentId, document, isLoading, setSermonInfo, setEditorContent, syncServerHash, markClean, router, setCurrentFolderId]);

  // 새 문서 진입 시: 전역 상태 초기화 + 에디터 내용 비우기(초기 업데이트 억제)
  useEffect(() => {
    if (!editor) return;
    if (documentId) return; // 기존 문서인 경우 스킵
    // 상태 리셋(폴더ID 전달)
    resetForNewDocument(folderIdFromQuery || undefined);
    // 에디터를 빈 문서로 설정하되 업데이트 이벤트는 발생시키지 않음
    try {
      editor.commands.setContent(EMPTY_DOC, { emitUpdate: false });
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
      {canUseRevisions && (
        <div className="mb-4 rounded-lg border bg-white px-3 py-2 text-xs text-gray-700">
          <div className="flex items-center justify-between">
            <span className="font-medium">임시저장 목록</span>
            <button
              type="button"
              onClick={toggleRevisionPanel}
              className="rounded bg-primary/10 px-2 py-1 font-semibold text-primary hover:bg-primary/20"
            >
              {showRevisionPanel ? '이전 버전 숨기기' : '이전 버전 보기'}
            </button>
          </div>
          {showRevisionPanel && (
            <div className="mt-2 max-h-56 space-y-2 overflow-y-auto">
              {isLoadingRevisions || isFetchingRevisions ? (
                <div className="text-[11px] text-muted-foreground">이전 버전을 불러오는 중...</div>
              ) : (revisions && revisions.length > 0 ? (
                revisions.map((rev) => {
                  const createdAt = rev.createdAt instanceof Date ? rev.createdAt : new Date(rev.createdAt as unknown as string);
                  const formatted = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(createdAt);
                  return (
                    <div key={rev.id} className="flex items-center justify-between rounded border px-3 py-2">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{formatted}</span>
                        <span className="text-[11px] text-gray-500">저장자: {rev.userId ? (rev.userId === document?.userId ? '나' : `${rev.userId.slice(0, 8)}…`) : '알 수 없음'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRestoreRevision(rev.id)}
                        className="rounded border border-primary px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/10 disabled:opacity-50"
                        disabled={restoreRevision.isPending}
                      >
                        복원
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="text-[11px] text-muted-foreground">저장된 이전 버전이 없습니다.</div>
              ))}
            </div>
          )}
        </div>
      )}
      <SermonInfoSection
        info={sermonInfo}
        onChange={setSermonInfo}
        folders={folderOptions}
        selectedFolderId={selectedFolderId}
        onSelectFolder={(value) => setCurrentFolderId(value)}
        isLoadingFolders={folderListQuery.isLoading}
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
