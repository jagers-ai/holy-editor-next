'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ListFilter, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { toastPort } from '@/lib/toast';

import { api } from '@/utils/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useFolderTabs } from '@/hooks/useFolderTabs';
import { FolderTabsManagerDialog } from '@/components/documents/FolderTabsManagerDialog';
import { DocumentListItem } from '@/components/documents/DocumentListItem';
import { useDocumentService } from '@/lib/api/services/useDocumentService';
import type { DocumentListEntry } from 'core';

const DOCUMENT_PAGE_LIMIT = 50;

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

export default function DocumentsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [managerOpen, setManagerOpen] = useState(false);

  const folderQuery = api.folder.list.useQuery(undefined, {
    staleTime: 60_000,
  });

  const tabsState = useFolderTabs();
  const { tabs, visibleTabs, selectedTab, setSelectedTab, replaceFromFolders, persistTabs } = tabsState;

  const folderIdParam = searchParams.get('folderId');

  useEffect(() => {
    if (folderQuery.data) {
      replaceFromFolders(folderQuery.data);
    }
  }, [folderQuery.data, replaceFromFolders]);

  const selectedFolderId = selectedTab === 'all' ? undefined : selectedTab;

  const documentsQuery = api.document.list.useQuery(
    selectedFolderId ? { folderId: selectedFolderId, limit: DOCUMENT_PAGE_LIMIT } : { limit: DOCUMENT_PAGE_LIMIT },
    {
      staleTime: 30_000,
      placeholderData: (prev) => prev,
      retry: (count, err: unknown) => {
        const code = (err as { data?: { code?: string } })?.data?.code;
        if (code === 'UNAUTHORIZED') return false;
        return count < 1;
      },
    }
  );

  const documentService = useDocumentService();

  const documents: DocumentListEntry[] = documentsQuery.data?.documents ?? [];
  const isLoadingDocuments = documentsQuery.isLoading;
  const isErrorDocuments = documentsQuery.isError;

  const updateUrlForTab = useCallback((tabId: string) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    const currentParam = nextParams.get('folderId');

    if (tabId === 'all') {
      if (!currentParam) return;
      nextParams.delete('folderId');
    } else {
      if (currentParam === tabId) return;
      nextParams.set('folderId', tabId);
    }

    const queryString = nextParams.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const handleTabSelect = (tabId: string) => {
    if (tabId !== selectedTab) {
      setSelectedTab(tabId);
    }
    updateUrlForTab(tabId);
  };

  useEffect(() => {
    if (!folderQuery.isSuccess) return;

    // 쿼리 파라미터가 없으면 'all' 탭으로 고정하고 종료
    if (!folderIdParam) {
      if (selectedTab !== 'all') setSelectedTab('all');
      return;
    }

    // 서버에서 받은 실제 폴더 목록 기준으로 존재 여부 판별
    const exists = (folderQuery.data ?? []).some((f) => f.id === folderIdParam);
    if (exists) {
      if (selectedTab !== folderIdParam) setSelectedTab(folderIdParam);
      return;
    }

    // 유효하지 않은 ID인 것이 확정된 경우에만 URL 정리
    if (selectedTab !== 'all') setSelectedTab('all');
    updateUrlForTab('all');
  }, [folderIdParam, folderQuery.isSuccess, folderQuery.data, selectedTab, setSelectedTab, updateUrlForTab]);

  const handleDelete = async (id: string) => {
    if (!confirm('정말로 이 문서를 삭제하시겠습니까?')) return;
    try {
      await documentService.delete(id);
      documentsQuery.refetch();
      toastPort.success('문서가 삭제되었습니다');
    } catch (error) {
      console.error('문서 삭제 실패:', error);
      toastPort.error('문서 삭제에 실패했습니다');
    }
  };

  const handleShare = async (id: string) => {
    const url = `${window.location.origin}/s/${id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: '설교 필기', url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('공유 링크를 복사했어요');
      }
    } catch {
      await navigator.clipboard.writeText(url);
      toast.success('공유 링크를 복사했어요');
    }
  };

  const documentSkeletonItems = useMemo(() => Array.from({ length: 6 }), []);

  return (
    <div className="max-w-5xl mx-auto px-3 py-4 pb-24 space-y-5">
      <header className="space-y-3">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">내 문서</h1>
          <span className="text-sm text-muted-foreground">{documents.length}개</span>
        </div>
        <div className="flex items-center gap-2">
          <ScrollArea className="whitespace-nowrap">
            <div className="flex items-center gap-2 pr-8">
              {folderQuery.isLoading && tabs.length === 0 ? (
                <Skeleton className="h-8 w-20 rounded-full" />
              ) : (
                visibleTabs.map((tab) => (
                  <Button
                    key={tab.id}
                    size="sm"
                    variant={selectedTab === tab.id ? 'default' : 'outline'}
                    className="rounded-full px-4"
                    onClick={() => handleTabSelect(tab.id)}
                  >
                    {tab.icon ? `${tab.icon} ${tab.name}` : tab.name}
                  </Button>
                ))
              )}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => setManagerOpen(true)}
            aria-label="폴더 탭 편집"
          >
            <ListFilter className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {isLoadingDocuments ? (
        <div className="space-y-3">
          {documentSkeletonItems.map((_, idx) => (
            <Card key={idx} className="p-4">
              <Skeleton className="h-4 w-1/3" />
              <div className="mt-3 space-y-2">
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-3 w-3/5" />
              </div>
              <Skeleton className="mt-3 h-3 w-1/4" />
            </Card>
          ))}
        </div>
      ) : isErrorDocuments ? (
        <Card className="text-center py-12">
          <CardContent className="space-y-3">
            <p className="text-destructive">
              {getErrorCode(documentsQuery.error) === 'UNAUTHORIZED'
                ? '로그인이 필요합니다.'
                : '문서 목록을 불러오지 못했습니다.'}
            </p>
            <Button variant="outline" onClick={() => documentsQuery.refetch()}>
              다시 시도
            </Button>
          </CardContent>
        </Card>
      ) : documents.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent className="space-y-4">
            <p className="text-lg font-semibold">표시할 설교 메모가 없습니다</p>
            <p className="text-sm text-muted-foreground">+ 버튼을 눌러 새 메모를 작성해보세요</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <DocumentListItem
              key={doc.id}
              document={doc}
              onOpen={() => router.push(`/editor/${doc.id}`)}
              onShare={() => handleShare(doc.id)}
              onDelete={() => handleDelete(doc.id)}
            />
          ))}
        </div>
      )}

      <button
        onClick={() => router.push('/editor/new')}
        className="fixed bottom-5 right-5 w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg active:scale-95 transition-all flex items-center justify-center z-50"
        aria-label="새 설교 메모 작성"
      >
        <Plus className="h-6 w-6" />
      </button>

      <FolderTabsManagerDialog
        open={managerOpen}
        onOpenChange={setManagerOpen}
        tabs={tabs}
        onApply={(nextTabs) => {
          persistTabs(nextTabs);
        }}
      />
    </div>
  );
}
