'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
// Toast functionality removed - to be replaced with shadcn/ui
import { SermonInfo } from '@/components/editor/SermonInfoSection';

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

  const handleSave = useCallback(() => {
    if (!editorContent) return;
    
    setIsSaving(true);
    
    try {
      const docs = JSON.parse(localStorage.getItem('holy-documents') || '[]');
      const docId = documentId === 'new' || !documentId ? Date.now().toString() : documentId;
      
      const newDoc = {
        id: docId,
        sermonInfo: {
          title: sermonInfo.title || '제목 없음',
          pastor: sermonInfo.pastor,
          verse: sermonInfo.verse,
          serviceType: sermonInfo.serviceType
        },
        content: editorContent,
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
      // TODO: Add toast notification
      // toast.success('문서가 저장되었습니다');
      
      // 저장 후 저장소 페이지로 이동
      setTimeout(() => {
        router.push('/documents');
      }, 500);
      
    } catch (error) {
      console.error('저장 실패:', error);
      setIsSaving(false);
      // TODO: Add toast notification
      // toast.error('저장 중 오류가 발생했습니다');
    }
  }, [editorContent, documentId, sermonInfo, router]);

  return (
    <EditorContext.Provider
      value={{
        sermonInfo,
        setSermonInfo,
        isSaving,
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