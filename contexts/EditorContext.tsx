'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { SermonInfo } from '@/components/editor/SermonInfoSection';
import { api } from '@/utils/api';
import toast from 'react-hot-toast';

interface EditorContextType {
  sermonInfo: SermonInfo;
  setSermonInfo: (info: SermonInfo) => void;
  isSaving: boolean;
  handleSave: () => void;
  documentId?: string;
  setDocumentId: (id: string | undefined) => void;
  editorContent: any;
  setEditorContent: (content: any) => void;
  currentFolderId?: string;
  setCurrentFolderId: (id: string | undefined) => void;
  lastAutoSavedAt?: Date;
  /** 새 문서 진입 시 상태를 초기화합니다. (dirty/hash/내용/설교정보/문서ID/폴더ID) */
  resetForNewDocument: (folderId?: string) => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export function EditorProvider({ children }: { children: ReactNode }) {
  const [sermonInfo, setSermonInfo] = useState<SermonInfo>({
    title: '',
    pastor: '',
    verse: '',
    serviceType: '주일설교'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [documentId, setDocumentId] = useState<string | undefined>(undefined);
  const [editorContent, _setEditorContent] = useState<any>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(undefined);
  const [lastAutoSavedAt, setLastAutoSavedAt] = useState<Date | undefined>(undefined);
  const dirtyRef = useRef(false);
  const autoSavingRef = useRef(false);
  const lastSavedHashRef = useRef<string | undefined>(undefined);
  const router = useRouter();
  const utils = api.useUtils();
  // 리셋 중 더티 플래그를 건드리지 않기 위한 가드
  const resettingRef = useRef(false);
  
  // setEditorContent 래퍼: 더티 플래그 표시
  const setEditorContent = useCallback((content: any) => {
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
      setSermonInfo({ title: '', pastor: '', verse: '', serviceType: '주일설교' });
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
  
  // tRPC mutations
  const createDocument = api.document.create.useMutation({
    onSuccess: (data) => {
      console.log('문서 생성 성공:', data.id);
      toast.success('문서를 저장했습니다');
      // 리스트 무효화만 수행, 이동은 handleSave에서 처리
      utils.document.list.invalidate();
    },
    onError: (error) => {
      console.error('문서 생성 실패:', error);
      const code = (error as any)?.data?.code;
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
      utils.document.list.invalidate();
    },
    onError: (error) => {
      console.error('문서 업데이트 실패:', error);
      const code = (error as any)?.data?.code;
      if (code === 'UNAUTHORIZED') {
        toast.error('로그인이 필요합니다');
        router.push('/login?returnTo=' + encodeURIComponent(`/editor/${documentId ?? 'new'}`));
      } else {
        toast.error('저장 중 오류가 발생했습니다');
      }
    },
  });

  // 자동저장용 silent 뮤테이션 (토스트/네비 없음)
  const createDocumentSilent = api.document.create.useMutation();
  const updateDocumentSilent = api.document.update.useMutation();

  const handleSave = useCallback(async () => {
    setIsSaving(true);

    try {
      // content JSON 안에 sermonInfo를 병합 저장하여
      // 목록/상세에서 바로 읽을 수 있게 함
      const emptyDoc = { type: 'doc', content: [] as any[] };
      const contentWithMeta = {
        ...(editorContent || emptyDoc),
        sermonInfo: {
          title: sermonInfo.title,
          pastor: sermonInfo.pastor,
          verse: sermonInfo.verse,
          serviceType: sermonInfo.serviceType,
        },
      };

      const documentData: any = {
        title: sermonInfo.title || '제목 없음',
        content: contentWithMeta,
        isPublic: false,
      };

      // fingerprint for verification/logging
      const fingerprint = (obj: unknown) => {
        try {
          const s = JSON.stringify(obj);
          // djb2
          let h = 5381;
          for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
          return (h >>> 0).toString(36);
        } catch { return Math.random().toString(36).slice(2,8); }
      };
      const expectedHash = fingerprint(documentData.content);

      const saveStart = new Date();
      console.log('[SAVE] manual start', { id: documentId ?? 'new', at: saveStart.toISOString(), hash: expectedHash });

      let targetId = documentId;
      if (documentId && documentId !== 'new') {
        await updateDocument.mutateAsync({ 
          id: documentId, 
          data: {
            ...documentData,
            // 편집 중 폴더가 바뀌는 시나리오 고려(선택적)
            ...(currentFolderId ? { folderId: currentFolderId } : {}),
          }
        });
      } else {
        const created = await createDocument.mutateAsync({
          ...documentData,
          folderId: currentFolderId,
        });
        targetId = created?.id ?? targetId;
      }

      // 서버 반영 검증 1회
      try {
        if (targetId) {
          const fresh = await utils.document.getById.fetch({ id: targetId });
          const serverHash = fingerprint((fresh as any)?.content);
          if (serverHash !== expectedHash) {
            console.warn('[SAVE] verify mismatch, retry once', { targetId, expectedHash, serverHash });
            // 1회 재시도
            await updateDocument.mutateAsync({ id: targetId, data: documentData });
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
          utils.document.list.invalidate(),
          utils.folder?.list?.invalidate?.(),
          currentFolderId ? utils.folder?.getDocuments?.invalidate({ folderId: currentFolderId }) : Promise.resolve(),
        ]);
      } catch {}
      // 저장 후 이동: 폴더 우선
      if (currentFolderId) {
        router.push(`/folders/${currentFolderId}`);
      } else {
        router.push('/folders');
      }
      router.refresh();
    } catch (error) {
      console.error('저장 실패:', error);
      toast.error('저장 실패: 잠시 후 다시 시도해주세요');
    } finally {
      setIsSaving(false);
    }
  }, [editorContent, documentId, sermonInfo, createDocument, updateDocument, utils, router, currentFolderId]);

  // 자동 저장 루틴 (30초마다, 화면 이탈 시 플러시)
  const doAutoSave = useCallback(async () => {
    if (autoSavingRef.current) return;
    if (!editorContent) return;
    if (!dirtyRef.current && documentId && documentId !== 'new') return; // 변경 없으면 스킵

    autoSavingRef.current = true;
    try {
      const emptyDoc = { type: 'doc', content: [] as any[] };
      const contentWithMeta = {
        ...(editorContent || emptyDoc),
        sermonInfo: {
          title: sermonInfo.title,
          pastor: sermonInfo.pastor,
          verse: sermonInfo.verse,
          serviceType: sermonInfo.serviceType,
        },
      };
      const data: any = {
        title: sermonInfo.title || '제목 없음',
        content: contentWithMeta,
        isPublic: false,
        ...(currentFolderId ? { folderId: currentFolderId } : {}),
      };
      // 중복 저장 방지: 동일 해시면 스킵
      const fingerprint = (obj: unknown) => {
        try {
          const s = JSON.stringify(obj);
          let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
          return (h >>> 0).toString(36);
        } catch { return Math.random().toString(36).slice(2,8); }
      };
      const hash = fingerprint(data.content);
      if (lastSavedHashRef.current === hash) {
        dirtyRef.current = false;
        autoSavingRef.current = false;
        return;
      }

      const start = new Date();
      console.log('[SAVE] autosave start', { id: documentId ?? 'new', at: start.toISOString(), hash });

      if (documentId && documentId !== 'new') {
        await updateDocumentSilent.mutateAsync({ id: documentId, data });
      } else {
        // 새 문서일 경우 1회만 생성 후 URL 교체, 이후 모두 update
        const created = await createDocumentSilent.mutateAsync({ ...data });
        if (created?.id) {
          setDocumentId(created.id);
          try { router.replace(`/editor/${created.id}`); } catch {}
        }
      }
      dirtyRef.current = false;
      lastSavedHashRef.current = hash;
      setLastAutoSavedAt(new Date());
      // 자동저장에서는 무분별한 캐시 무효화 생략
    } catch (e) {
      console.error('자동 저장 실패:', e);
    } finally {
      autoSavingRef.current = false;
    }
  }, [editorContent, sermonInfo, currentFolderId, documentId, createDocumentSilent, updateDocumentSilent, router, setDocumentId]);

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
