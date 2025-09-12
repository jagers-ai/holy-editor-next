'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { FileText, Trash2, Plus, Share2, FolderOpen, ArrowLeft, MoveRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/utils/api';

export default function FolderDocumentsPage() {
  const router = useRouter();
  const params = useParams();
  const folderId = params.folderId as string;
  
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [showFolderSelect, setShowFolderSelect] = useState(false);
  const [showMoveConfirm, setShowMoveConfirm] = useState(false);
  const [targetFolderId, setTargetFolderId] = useState<string>('');
  const [targetFolderName, setTargetFolderName] = useState<string>('');

  // tRPC queries
  const { data: folder } = api.folder.getById.useQuery({ id: folderId });
  const { data: folders } = api.folder.list.useQuery();
  const { data: documentsData, refetch } = api.folder.getDocuments.useQuery({ folderId });
  const documents = documentsData?.documents || [];

  const deleteDocument = api.document.delete.useMutation({
    onSuccess: () => {
      refetch();
      toast.success('문서가 삭제되었습니다');
      setSelectedDocs([]);
    },
    onError: (error) => {
      toast.error('문서 삭제에 실패했습니다');
    },
  });

  const moveDocuments = api.folder.moveDocuments.useMutation({
    onSuccess: (data) => {
      refetch();
      toast.success(`${data.movedCount}개 문서를 ${data.targetFolder} 폴더로 이동했습니다`);
      setSelectedDocs([]);
      setShowMoveConfirm(false);
    },
    onError: (error) => {
      toast.error('문서 이동에 실패했습니다');
    },
  });

  const handleDeleteDocument = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
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

  const toggleSelection = (docId: string) => {
    setSelectedDocs(prev =>
      prev.includes(docId)
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const handleMoveClick = () => {
    if (selectedDocs.length === 0) {
      toast.error('이동할 문서를 선택해주세요');
      return;
    }
    setShowFolderSelect(true);
  };

  const handleFolderSelect = (selectedFolderId: string, folderName: string) => {
    if (selectedFolderId === folderId) {
      toast.error('같은 폴더로는 이동할 수 없습니다');
      return;
    }
    setTargetFolderId(selectedFolderId);
    setTargetFolderName(folderName);
    setShowFolderSelect(false);
    setShowMoveConfirm(true);
  };

  const handleMoveConfirm = async () => {
    await moveDocuments.mutateAsync({
      documentIds: selectedDocs,
      targetFolderId,
    });
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

  const isSelectionMode = selectedDocs.length > 0;

  return (
    <div className="max-w-full mx-auto px-3 py-4 pb-24">
      {/* 헤더 */}
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={() => router.push('/folders')}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span>{folder?.icon}</span>
            <span>{folder?.name}</span>
          </h1>
          <p className="text-sm text-gray-500">{documents.length}개 문서</p>
        </div>
      </div>

      {/* 선택 모드 표시 */}
      {isSelectionMode && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
          <span className="text-sm font-medium">
            {selectedDocs.length}개 선택됨
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelectedDocs([])}
          >
            선택 해제
          </Button>
        </div>
      )}

      {/* 문서 목록 */}
      {documents.length === 0 ? (
        <Card className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg mb-4">이 폴더에 문서가 없습니다</p>
          <p className="text-sm text-gray-500">우측 하단 + 버튼으로 새 문서를 작성하세요</p>
        </Card>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {documents.map((doc) => {
            const contentObj = typeof doc.content === 'object' && doc.content !== null ? doc.content as any : {};
            const sermonInfo = contentObj.sermonInfo;
            const title = sermonInfo?.title || doc.title || '제목 없음';
            const previewText = getPreviewText(doc.content);
            const isSelected = selectedDocs.includes(doc.id);
            
            return (
              <div key={doc.id} className="relative">
                {/* 체크박스 */}
                <div className="absolute top-2 left-2 z-20">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleSelection(doc.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white"
                  />
                </div>
                
                <Card
                  className={`cursor-pointer active:scale-95 transition-transform flex flex-col h-[140px] relative overflow-hidden shadow-sm hover:shadow-md ${
                    isSelected ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => {
                    if (isSelectionMode) {
                      toggleSelection(doc.id);
                    } else {
                      router.push(`/editor/${doc.id}`);
                    }
                  }}
                >
                  {/* 액션 버튼 */}
                  {!isSelectionMode && (
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
                  )}
                  
                  {/* 폴더 비주얼 영역 */}
                  <div className="flex-1 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-2 relative flex flex-col items-center justify-center">
                    <FolderOpen className="h-8 w-8 text-blue-400 dark:text-blue-300" />
                    
                    {/* 미리보기 텍스트 */}
                    {previewText && (
                      <p className="text-[10px] text-gray-600 dark:text-gray-400 text-center mt-1 px-1 line-clamp-2">
                        {previewText.substring(0, 20)}{previewText.length > 20 ? '...' : ''}
                      </p>
                    )}
                  </div>
                  
                  {/* 메타데이터 영역 */}
                  <div className="bg-white dark:bg-gray-800 p-2 border-t dark:border-gray-700">
                    <h3 className="text-xs font-semibold truncate mb-1 dark:text-gray-100">
                      {title}
                    </h3>
                    
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
              </div>
            );
          })}
        </div>
      )}

      {/* FAB - 새 문서 (현재 폴더로) */}
      <button
        onClick={() => router.push(`/editor/new?folderId=${folderId}`)}
        className="fixed bottom-5 right-5 w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg active:scale-90 transition-all flex items-center justify-center z-50"
        aria-label="새 문서 작성"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* 하단 액션 바 */}
      {isSelectionMode && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex justify-between items-center z-40">
          <span className="text-sm font-medium">
            {selectedDocs.length}개 선택
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleMoveClick}
            >
              <MoveRight className="h-4 w-4 mr-1" />
              이동
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (confirm(`${selectedDocs.length}개 문서를 삭제하시겠습니까?`)) {
                  for (const docId of selectedDocs) {
                    await deleteDocument.mutateAsync({ id: docId });
                  }
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              삭제
            </Button>
          </div>
        </div>
      )}

      {/* 폴더 선택 모달 */}
      <Dialog open={showFolderSelect} onOpenChange={setShowFolderSelect}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>저장 폴더 선택</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {folders?.filter(f => f.id !== folderId).map((folder) => (
              <button
                key={folder.id}
                onClick={() => handleFolderSelect(folder.id, folder.name)}
                className="w-full p-3 text-left hover:bg-gray-100 rounded-lg flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{folder.icon}</span>
                  <span>{folder.name}</span>
                </div>
                <span className="text-sm text-gray-500">{folder.documentCount}개</span>
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFolderSelect(false)}>
              취소
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 이동 확인 다이얼로그 */}
      <AlertDialog open={showMoveConfirm} onOpenChange={setShowMoveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              노트 {selectedDocs.length}개를 {targetFolderName} 폴더로 옮길까요?
            </AlertDialogTitle>
            <AlertDialogDescription>
              선택한 문서들이 {targetFolderName} 폴더로 이동됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleMoveConfirm}>
              이동
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
