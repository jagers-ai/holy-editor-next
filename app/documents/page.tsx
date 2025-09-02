'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Trash2, Plus, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface Document {
  id: string;
  title: string;
  content: any;
  createdAt: string;
  updatedAt: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const router = useRouter();

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = () => {
    try {
      const docs = JSON.parse(localStorage.getItem('holy-documents') || '[]');
      // 최신 문서가 위로 오도록 정렬
      const sortedDocs = docs.sort((a: Document, b: Document) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      setDocuments(sortedDocs);
    } catch (error) {
      console.error('문서 로드 실패:', error);
      toast.error('문서를 불러올 수 없습니다');
    }
  };

  const deleteDocument = (id: string, event: React.MouseEvent) => {
    event.stopPropagation(); // 카드 클릭 이벤트 방지
    
    if (confirm('정말로 이 문서를 삭제하시겠습니까?')) {
      try {
        const docs = JSON.parse(localStorage.getItem('holy-documents') || '[]');
        const filtered = docs.filter((doc: Document) => doc.id !== id);
        localStorage.setItem('holy-documents', JSON.stringify(filtered));
        loadDocuments();
        toast.success('문서가 삭제되었습니다');
      } catch (error) {
        console.error('문서 삭제 실패:', error);
        toast.error('문서 삭제에 실패했습니다');
      }
    }
  };

  const formatDate = (dateString: string) => {
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
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push('/')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              홈으로
            </Button>
            <Button
              onClick={() => router.push('/editor/new')}
            >
              <Plus className="h-4 w-4 mr-2" />
              새 문서
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground">
          저장된 문서 {documents.length}개
        </p>
      </div>

      {documents.length === 0 ? (
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
          {documents.map((doc) => (
            <Card
              key={doc.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push(`/editor/${doc.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg line-clamp-1">
                    {doc.title}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => deleteDocument(doc.id, e)}
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
          ))}
        </div>
      )}
    </div>
  );
}