'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SermonInfo } from '@/components/editor/SermonInfoSection';
import { api } from '@/utils/api';

interface EditorContextType {
  sermonInfo: SermonInfo;
  setSermonInfo: (info: SermonInfo) => void;
  isSaving: boolean;
  handleSave: () => void;
  documentId?: string;
  setDocumentId: (id: string | undefined) => void;
  editorContent: any;
  setEditorContent: (content: any) => void;
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
  const [editorContent, setEditorContent] = useState<any>(null);
  const router = useRouter();
  
  // tRPC mutations
  const createDocument = api.document.create.useMutation({
    onSuccess: (data) => {
      console.log('문서 생성 성공:', data.id);
      // 문서 생성 후 문서 목록으로 이동
      setTimeout(() => {
        router.push('/documents');
      }, 500);
    },
    onError: (error) => {
      console.error('문서 생성 실패:', error);
      // TODO: 에러 토스트 표시
    },
  });
  
  const updateDocument = api.document.update.useMutation({
    onSuccess: (data) => {
      console.log('문서 업데이트 성공:', data.id);
      // 문서 업데이트 후 문서 목록으로 이동
      setTimeout(() => {
        router.push('/documents');
      }, 500);
    },
    onError: (error) => {
      console.error('문서 업데이트 실패:', error);
      // TODO: 에러 토스트 표시
    },
  });

  const handleSave = useCallback(async () => {
    if (!editorContent) return;
    
    setIsSaving(true);
    
    try {
      const documentData = {
        title: sermonInfo.title || '제목 없음',
        content: editorContent,
        sermonInfo: {
          title: sermonInfo.title,
          pastor: sermonInfo.pastor,
          verse: sermonInfo.verse,
          serviceType: sermonInfo.serviceType
        },
        isPublic: false,
      };
      
      if (documentId && documentId !== 'new') {
        // 기존 문서 업데이트
        await updateDocument.mutateAsync({
          id: documentId,
          data: documentData,
        });
      } else {
        // 새 문서 생성
        await createDocument.mutateAsync(documentData);
      }
      
      // TODO: 성공 토스트 표시
      console.log('문서가 저장되었습니다');
      
    } catch (error) {
      console.error('저장 실패:', error);
      // TODO: 에러 토스트 표시
    } finally {
      setIsSaving(false);
    }
  }, [editorContent, documentId, sermonInfo, createDocument, updateDocument, router]);

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
