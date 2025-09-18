'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef, Dispatch, SetStateAction, startTransition } from 'react';
import type { JSONContent } from '@tiptap/core';
import { useRouter } from 'next/navigation';
import { SermonInfo } from '@/components/editor/SermonInfoSection';
import { api } from '@/utils/api';
import toast from 'react-hot-toast';
import { attachSermonInfo } from '@/lib/editor/content';
import { fingerprintJson as fingerprint } from '@/lib/utils/json';

type TRPCErrorPayload = {
  data?: {
    code?: string;
  };
};

const getErrorCode = (error: unknown): string | undefined => {
  if (!error || typeof error !== 'object') return undefined;
  const payload = error as TRPCErrorPayload;
  const code = payload.data?.code;
  return typeof code === 'string' ? code : undefined;
};

interface EditorContextType {
  sermonInfo: SermonInfo;
  setSermonInfo: (info: SermonInfo) => void;
  isSaving: boolean;
  handleSave: () => void;
  documentId?: string;
  setDocumentId: (id: string | undefined) => void;
  editorContent: JSONContent | null;
  setEditorContent: (content: JSONContent | null) => void;
  currentFolderId?: string;
  setCurrentFolderId: Dispatch<SetStateAction<string | undefined>>;
  lastAutoSavedAt?: Date;
  /** 새 문서 진입 시 상태를 초기화합니다. (dirty/hash/내용/설교정보/문서ID/폴더ID) */
  resetForNewDocument: (folderId?: string) => void;
  /** 서버에서 불러온 최신 content 해시를 동기화합니다. */
  syncServerHash: (content: JSONContent | null) => void;
  /** 강제 덮어쓰기 후 더티 플래그를 수동으로 초기화합니다. */
  markClean: () => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export function EditorProvider({ children }: { children: ReactNode }) {
  const [sermonInfo, setSermonInfo] = useState<SermonInfo>({
    title: '',
    pastor: '',
    verse: '',
    serviceType: '감사일기'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [documentId, setDocumentId] = useState<string | undefined>(undefined);
  const [editorContent, _setEditorContent] = useState<JSONContent | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(undefined);
  const [lastAutoSavedAt, setLastAutoSavedAt] = useState<Date | undefined>(undefined);
  const dirtyRef = useRef(false);
  const autoSavingRef = useRef(false);
  const redirectOnSaveRef = useRef(false);
  const lastSavedHashRef = useRef<string | undefined>(undefined);
  const router = useRouter();
  const utils = api.useUtils();
  const documentUtils = utils.document;
  const folderUtils = utils.folder;
  // 리셋 중 더티 플래그를 건드리지 않기 위한 가드
  const resettingRef = useRef(false);
  
  // setEditorContent 래퍼: 더티 플래그 표시
  const setEditorContent = useCallback((content: JSONContent | null) => {
    _setEditorContent(content);
    if (!resettingRef.current) {
      dirtyRef.current = true;
    }
  }, []);

  // 새 문서 진입 시 컨텍스트 상태 초기화
  const resetForNewDocument = useCallback((folderId?: string) => {
    try {
      resettingRef.current = true;
      // 설교 정보 초기화
      setSermonInfo({ title: '', pastor: '', verse: '', serviceType: '감사일기' });
      // 에디터 컨텐츠/플래그 초기화
      _setEditorContent(null);
      dirtyRef.current = false;
      lastSavedHashRef.current = undefined;
      // 문서ID/폴더ID 초기화
      setDocumentId(undefined);
      setCurrentFolderId(folderId);
      setLastAutoSavedAt(undefined);
    } finally {
      resettingRef.current = false;
    }
  }, []);

  const syncServerHash = useCallback((content: JSONContent | null) => {
    if (content) {
      lastSavedHashRef.current = fingerprint(content);
    } else {
      lastSavedHashRef.current = undefined;
    }
  }, []);

  const markClean = useCallback(() => {
    dirtyRef.current = false;
  }, []);
  
  // tRPC mutations
  const handleRedirectAfterSave = useCallback(() => {
    if (!redirectOnSaveRef.current) return;
    redirectOnSaveRef.current = false;
    startTransition(() => {
      router.push('/documents');
    });
  }, [router]);

  const createDocument = api.document.create.useMutation({
    onSuccess: (data) => {
      console.log('문서 생성 성공:', data.id);
      toast.success('문서를 저장했습니다');
      // 캐시 무효화 후 수동 저장 요청이 있었다면 목록으로 리디렉션
      documentUtils.list.invalidate();
      handleRedirectAfterSave();
    },
    onError: (error) => {
      console.error('문서 생성 실패:', error);
      const code = getErrorCode(error);
      if (code === 'UNAUTHORIZED') {
        toast.error('로그인이 필요합니다');
        router.push('/login?returnTo=' + encodeURIComponent('/editor/new'));
      } else {
        toast.error('저장 중 오류가 발생했습니다');
      }
    },
  });
  
  const updateDocument = api.document.update.useMutation({
    onSuccess: (data) => {
      console.log('문서 업데이트 성공:', data.id);
      toast.success('문서를 저장했습니다');
      documentUtils.list.invalidate();
      handleRedirectAfterSave();
    },
    onError: (error) => {
      console.error('문서 업데이트 실패:', error);
      const code = getErrorCode(error);
      if (code === 'UNAUTHORIZED') {
        toast.error('로그인이 필요합니다');
        router.push('/login?returnTo=' + encodeURIComponent(`/editor/${documentId ?? 'new'}`));
        return;
      }
      if (code === 'CONFLICT') {
        toast.error('다른 기기에서 먼저 저장되었습니다. 페이지 새로고침 후 복구 메뉴를 이용해주세요.');
        if (documentId) {
          documentUtils.getById.invalidate({ id: documentId });
        }
        return;
      }
      if (code === 'BAD_REQUEST') {
        toast.error('비어 있는 내용으로는 저장할 수 없습니다. 내용을 확인해주세요.');
        return;
      }
      toast.error('저장 중 오류가 발생했습니다');
    },
  });

  // 자동저장용 silent 뮤테이션 (토스트/네비 없음)
  const createDocumentSilent = api.document.create.useMutation();
  const updateDocumentSilent = api.document.update.useMutation();

  const handleSave = useCallback(async () => {
    if (!currentFolderId && (!documentId || documentId === 'new')) {
      toast.error('먼저 폴더를 선택해주세요');
      return;
    }

    redirectOnSaveRef.current = true;
    setIsSaving(true);

    try {
      // content JSON 안에 sermonInfo를 병합 저장하여
      // 목록/상세에서 바로 읽을 수 있게 함
      const emptyDoc: JSONContent = { type: 'doc', content: [] };
      const contentWithMeta = attachSermonInfo(editorContent || emptyDoc, sermonInfo);

      const documentData = {
        title: sermonInfo.title || '제목 없음',
        content: contentWithMeta,
        isPublic: false,
      } satisfies Parameters<typeof createDocument.mutateAsync>[0];
      const previousHash = lastSavedHashRef.current;
      const newHash = fingerprint(documentData.content);

      const saveStart = new Date();
      console.log('[SAVE] manual start', { id: documentId ?? 'new', at: saveStart.toISOString(), hash: newHash, previousHash });

      let targetId = documentId;
      if (documentId && documentId !== 'new') {
        await updateDocument.mutateAsync({ 
          id: documentId, 
          data: {
            ...documentData,
            // 편집 중 폴더가 바뀌는 시나리오 고려(선택적)
            ...(currentFolderId ? { folderId: currentFolderId } : {}),
          },
          expectedHash: previousHash,
        });
      } else {
        const created = await createDocument.mutateAsync({
          ...documentData,
          folderId: currentFolderId,
        });
        targetId = created?.id ?? targetId;
      }

      lastSavedHashRef.current = newHash;
      dirtyRef.current = false;

      // 서버 반영 검증 1회
      try {
        if (targetId) {
          const fresh = await documentUtils.getById.fetch({ id: targetId });
          const serverHash = fingerprint(fresh?.content);
          if (serverHash !== newHash) {
            console.warn('[SAVE] verify mismatch', { targetId, expected: newHash, server: serverHash });
            toast.error('서버에 다른 내용이 저장되어 있습니다. 복구 메뉴에서 확인해주세요.');
            lastSavedHashRef.current = serverHash;
          } else {
            console.log('[SAVE] verify ok', { targetId, hash: serverHash });
          }
        }
      } catch (e) {
        console.warn('[SAVE] verify fetch failed', e);
      }

      console.log('문서가 저장되었습니다');
      // 목록/폴더 캐시 무효화
      try {
        await Promise.all([
          documentUtils.list.invalidate(),
          folderUtils?.list?.invalidate?.(),
          currentFolderId ? folderUtils?.getDocuments?.invalidate({ folderId: currentFolderId }) : Promise.resolve(),
        ]);
      } catch (invalidateError) {
        console.warn('document cache invalidation failed', invalidateError);
      }
    } catch (error) {
      console.error('저장 실패:', error);
      redirectOnSaveRef.current = false;
      toast.error('저장 실패: 잠시 후 다시 시도해주세요');
    } finally {
      setIsSaving(false);
    }
  }, [editorContent, documentId, sermonInfo, createDocument, updateDocument, documentUtils, folderUtils, currentFolderId]);

  // 자동 저장 루틴 (30초마다, 화면 이탈 시 플러시)
  const doAutoSave = useCallback(async () => {
    if (autoSavingRef.current) return;
    if (!editorContent) return;
    if (!dirtyRef.current && documentId && documentId !== 'new') return; // 변경 없으면 스킵
    if ((!documentId || documentId === 'new') && !currentFolderId) return;

    autoSavingRef.current = true;
    try {
      const emptyDoc: JSONContent = { type: 'doc', content: [] };
      const contentWithMeta = attachSermonInfo(editorContent || emptyDoc, sermonInfo);
      const data = {
        title: sermonInfo.title || '제목 없음',
        content: contentWithMeta,
        isPublic: false,
        ...(currentFolderId ? { folderId: currentFolderId } : {}),
      } satisfies Parameters<typeof updateDocumentSilent.mutateAsync>[0]['data'];
      // 중복 저장 방지: 동일 해시면 스킵
      const hash = fingerprint(data.content);
      const previousHash = lastSavedHashRef.current;
      if (lastSavedHashRef.current === hash) {
        dirtyRef.current = false;
        autoSavingRef.current = false;
        return;
      }

      const start = new Date();
      console.log('[SAVE] autosave start', { id: documentId ?? 'new', at: start.toISOString(), hash });

      if (documentId && documentId !== 'new') {
        await updateDocumentSilent.mutateAsync({ id: documentId, data, expectedHash: previousHash });
      } else {
        // 새 문서일 경우 1회만 생성 후 URL 교체, 이후 모두 update
        const created = await createDocumentSilent.mutateAsync({ ...data });
        if (created?.id) {
          setDocumentId(created.id);
          try {
            router.replace(`/editor/${created.id}`);
          } catch (replaceError) {
            console.warn('router.replace failed', replaceError);
          }
        }
      }
      dirtyRef.current = false;
      lastSavedHashRef.current = hash;
      setLastAutoSavedAt(new Date());
      // 자동저장에서는 무분별한 캐시 무효화 생략
    } catch (e) {
      console.error('자동 저장 실패:', e);
      const code = getErrorCode(e);
      if (code === 'CONFLICT') {
        toast.error('자동 저장이 충돌했습니다. 페이지를 새로고침한 뒤 다시 시도해주세요.');
        if (documentId) {
          documentUtils.getById.invalidate({ id: documentId });
        }
      } else if (code === 'BAD_REQUEST') {
        toast.error('내용이 비어 있어 자동 저장하지 못했습니다. 내용을 확인해주세요.');
      }
    } finally {
      autoSavingRef.current = false;
    }
  }, [editorContent, sermonInfo, currentFolderId, documentId, createDocumentSilent, updateDocumentSilent, router, setDocumentId, documentUtils]);

  // 자동 저장 주기: 5초
  useEffect(() => {
    const t = setInterval(() => { void doAutoSave(); }, 5_000);
    return () => clearInterval(t);
  }, [doAutoSave]);

  // 탭 숨김/페이지 이동 시 마지막 저장 시도
  useEffect(() => {
    const onVis = () => { if (document.visibilityState === 'hidden') void doAutoSave(); };
    const onPageHide = () => { void doAutoSave(); };
    const onBeforeUnload = () => { void doAutoSave(); };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [doAutoSave]);

  return (
    <EditorContext.Provider
      value={{
        sermonInfo,
        setSermonInfo,
        isSaving: isSaving || createDocument.isPending || updateDocument.isPending,
        handleSave,
        documentId,
        setDocumentId,
        editorContent,
        setEditorContent,
        currentFolderId,
        setCurrentFolderId,
        lastAutoSavedAt,
        resetForNewDocument,
        syncServerHash,
        markClean,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
}

export function useEditorContext() {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error('useEditorContext must be used within an EditorProvider');
  }
  return context;
}
