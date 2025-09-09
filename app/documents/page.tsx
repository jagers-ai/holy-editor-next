'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Trash2, Plus, User, Clock, BookOpen } from 'lucide-react';
import { api } from '@/utils/api';

interface Document {
  id: string;
  title?: string;
  sermonInfo?: {
    title?: string;
    pastor?: string;
    verse?: string;
    serviceType?: string;
  };
  content: any;
  createdAt: string;
  updatedAt: string;
}

export default function DocumentsPage() {
  const router = useRouter();
  
  // tRPC queries and mutations
  const { data: dbDocuments, isLoading, refetch } = api.document.list.useQuery();
  const deleteDocument = api.document.delete.useMutation({
    onSuccess: () => {
      refetch();
      console.log('문서가 삭제되었습니다');
      // TODO: 토스트 알림
    },
    onError: (error) => {
      console.error('문서 삭제 실패:', error);
      // TODO: 토스트 알림
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

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR') + ' ' + date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getPreviewText = (content: any) => {
    try {
      // Tiptap JSON에서 텍스트 추출
      if (content && content.content) {
        const texts: string[] = [];
        const extractText = (node: any) => {
          if (node.text) {
            texts.push(node.text);
          }
          if (node.content && Array.isArray(node.content)) {
            node.content.forEach(extractText);
          }
        };
        extractText(content);
        const fullText = texts.join(' ');
        return fullText.length > 100 ? fullText.substring(0, 100) + '...' : fullText;
      }
    } catch (error) {
      console.error('미리보기 텍스트 추출 실패:', error);
    }
    return '내용 없음';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">문서 저장소</h1>
          <Button
            onClick={() => router.push('/editor/new')}
          >
            <Plus className="h-4 w-4 mr-2" />
            새 문서
          </Button>
        </div>
        <p className="text-muted-foreground">
          저장된 문서 {documents.length}개
        </p>
      </div>

      {isLoading ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground">문서를 불러오는 중...</p>
          </CardContent>
        </Card>
      ) : documents.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg mb-4">저장된 문서가 없습니다</p>
            <Button asChild>
              <Link href="/editor/new">
                <Plus className="h-4 w-4 mr-2" />
                첫 문서 작성하기
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {documents.map((doc) => {
            const title = ('sermonInfo' in doc && doc.sermonInfo?.title) || doc.title || '제목 없음';
            
            return (
              <Card
                key={doc.id}
                className="cursor-pointer hover:shadow-lg transition-shadow relative"
                onClick={() => router.push(`/editor/${doc.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">
                        {title}
                      </CardTitle>
                      {'sermonInfo' in doc && doc.sermonInfo && (
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex flex-wrap gap-3">
                            {doc.sermonInfo.pastor && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>{doc.sermonInfo.pastor}</span>
                              </div>
                            )}
                            {doc.sermonInfo.serviceType && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{doc.sermonInfo.serviceType}</span>
                              </div>
                            )}
                          </div>
                          {doc.sermonInfo.verse && (
                            <div className="flex items-center gap-1">
                              <BookOpen className="h-3 w-3" />
                              <span className="text-xs">{doc.sermonInfo.verse}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDeleteDocument(doc.id, e)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {getPreviewText(doc.content)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    수정: {formatDate(doc.updatedAt)}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}