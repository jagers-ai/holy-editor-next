'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Trash2, Plus, User, Clock, BookOpen, Share2, FolderOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/utils/api';

// Document 타입은 API 응답에서 자동으로 추론됨

export default function DocumentsPage() {
  const router = useRouter();
  
  // tRPC queries and mutations
  const { data: dbDocuments, isLoading, isError, error, refetch, status } = api.document.list.useQuery(
    undefined,
    {
      // 인증 오류는 재시도하지 않고 즉시 안내
      retry: (count, err) => {
        const code = (err as any)?.data?.code;
        if (code === 'UNAUTHORIZED') return false;
        return count < 1; // 한 번만 재시도
      },
      staleTime: 30_000,
    }
  );
  const deleteDocument = api.document.delete.useMutation({
    onSuccess: () => {
      refetch();
      toast.success('문서가 삭제되었습니다');
    },
    onError: (error) => {
      console.error('문서 삭제 실패:', error);
      toast.error('문서 삭제에 실패했습니다');
    },
  });

  // 문서 목록
  const documents = dbDocuments?.documents || [];
  
  const handleDeleteDocument = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation(); // 카드 클릭 이벤트 방지
    
    if (confirm('정말로 이 문서를 삭제하시겠습니까?')) {
      await deleteDocument.mutateAsync({ id });
    }
  };

  const handleShare = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
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

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR');
  };

  const getPreviewText = (content: any) => {
    try {
      if (content && content.content) {
        const texts: string[] = [];
        const extractText = (node: any) => {
          if (node.text) texts.push(node.text);
          if (node.content && Array.isArray(node.content)) {
            node.content.forEach(extractText);
          }
        };
        extractText(content);
        const fullText = texts.join(' ').trim();
        return fullText || '';
      }
    } catch (error) {
      console.error('미리보기 추출 실패:', error);
    }
    return '';
  };

  return (
    <div className="max-w-full mx-auto px-3 py-4 pb-24">
      {/* 헤더 간소화 */}
      <div className="mb-4">
        <h1 className="text-xl font-bold">내 문서</h1>
        <p className="text-sm text-gray-500">{documents.length}개</p>
      </div>

      {isLoading ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground">문서를 불러오는 중...</p>
          </CardContent>
        </Card>
      ) : isError ? (
        <Card className="text-center py-12">
          <CardContent className="space-y-3">
            <p className="text-destructive">
              {(error as any)?.data?.code === 'UNAUTHORIZED' ? '로그인이 필요합니다.' : '문서 목록을 불러오지 못했습니다.'}
            </p>
            <Button variant="outline" onClick={() => refetch()}>다시 시도</Button>
          </CardContent>
        </Card>
      ) : documents.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg mb-4">저장된 문서가 없습니다</p>
            <p className="text-sm text-gray-500">우측 하단 + 버튼으로 시작하세요</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {documents.map((doc) => {
            // content 안의 sermonInfo 확인
            const contentObj = typeof doc.content === 'object' && doc.content !== null ? doc.content as any : {};
            const sermonInfo = contentObj.sermonInfo;
            const title = sermonInfo?.title || doc.title || '제목 없음';
            const previewText = getPreviewText(doc.content);
            
            return (
              <Card
                key={doc.id}
                className="cursor-pointer active:scale-95 transition-transform flex flex-col h-[140px] relative overflow-hidden shadow-sm hover:shadow-md"
                onClick={() => router.push(`/editor/${doc.id}`)}
              >
                {/* 액션 버튼 - 우상단 고정 */}
                <div className="absolute top-1 right-1 z-10 flex gap-0.5">
                  <button
                    onClick={(e) => handleShare(doc.id, e)}
                    className="p-1 bg-white/80 rounded-full shadow-sm"
                    aria-label="공유"
                  >
                    <Share2 className="h-3 w-3 text-gray-600" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteDocument(doc.id, e)}
                    className="p-1 bg-white/80 rounded-full shadow-sm"
                    aria-label="삭제"
                  >
                    <Trash2 className="h-3 w-3 text-red-500" />
                  </button>
                </div>
                
                {/* 폴더 비주얼 영역 (상단 60%) */}
                <div className="flex-1 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-2 relative flex flex-col items-center justify-center">
                  <FolderOpen className="h-8 w-8 text-blue-400 dark:text-blue-300" />
                  
                  {/* 미리보기 텍스트 20자 */}
                  {previewText && (
                    <p className="text-[10px] text-gray-600 dark:text-gray-400 text-center mt-1 px-1 line-clamp-2">
                      {previewText.substring(0, 20)}{previewText.length > 20 ? '...' : ''}
                    </p>
                  )}
                </div>
                
                {/* 메타데이터 영역 (하단 40%) */}
                <div className="bg-white dark:bg-gray-800 p-2 border-t dark:border-gray-700">
                  {/* 제목 */}
                  <h3 className="text-xs font-semibold truncate mb-1 dark:text-gray-100">
                    {title}
                  </h3>
                  
                  {/* 메타 정보 - 아이콘 없이 텍스트만 */}
                  <div className="text-[9px] text-gray-500 dark:text-gray-400 space-y-0.5">
                    {sermonInfo?.pastor && (
                      <div className="truncate">{sermonInfo.pastor}</div>
                    )}
                    {sermonInfo?.serviceType && (
                      <div className="truncate">{sermonInfo.serviceType}</div>
                    )}
                    <div>{formatDate(doc.updatedAt)}</div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* 플로팅 액션 버튼 (FAB) - 폴더 선택으로 유도 */}
      <button
        onClick={() => router.push('/folders')}
        className="fixed bottom-5 right-5 w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg active:scale-90 transition-all flex items-center justify-center z-50"
        aria-label="새 문서 작성"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}
