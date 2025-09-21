'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { FileText, Trash2, Plus, Share2, ArrowLeft, MoveRight, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/utils/api';
import { extractPlainTextFromTiptap, formatDateTimeKST } from 'core';
import type { DocumentListEntry, FolderSummary } from 'core';
import { useDocumentService } from '@/lib/api/services/useDocumentService';
import { useFolderService } from '@/lib/api/services/useFolderService';
import DocumentGridSkeleton from '@/components/skeleton/DocumentGridSkeleton';
import FolderHeaderSkeleton from '@/components/skeleton/FolderHeaderSkeleton';

export default function FolderDocumentsPage() {
  const router = useRouter();
  const params = useParams();
  const folderId = params.folderId as string;
  
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [showFolderSelect, setShowFolderSelect] = useState(false);
  const [showMoveConfirm, setShowMoveConfirm] = useState(false);
  const [targetFolderId, setTargetFolderId] = useState<string>('');
  const [targetFolderName, setTargetFolderName] = useState<string>('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('📁');
  const [editColor, setEditColor] = useState<string>('');

  // tRPC queries
  const { data: folder, isLoading: isFolderLoading } = api.folder.getById.useQuery(
    { id: folderId },
    { staleTime: 30_000, refetchOnMount: false, refetchOnWindowFocus: false }
  );
  const { data: folders } = api.folder.list.useQuery(undefined, { staleTime: 60_000 });
  const { data: documentsData, isLoading: isDocsLoading, isFetching, refetch } = api.folder.getDocuments.useQuery(
    { folderId },
    {
      staleTime: 30_000,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      placeholderData: (prev) => prev,
    }
  );
  const documents: DocumentListEntry[] = documentsData?.documents ?? [];
  const folderList: FolderSummary[] = (folders ?? []) as FolderSummary[];

  const documentService = useDocumentService();
  const folderService = useFolderService();

  // 폴더 수정/삭제 관련 뮤테이션
  const updateFolder = api.folder.update.useMutation({
    onSuccess: () => {
      toast.success('폴더가 수정되었습니다');
      setShowEditModal(false);
      refetch();
      router.refresh();
    },
    onError: (e) => {
      const msg = (e as { message?: string })?.message || '수정에 실패했습니다';
      toast.error(msg);
    },
  });

  const handleDeleteDocument = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!confirm('정말로 이 문서를 삭제하시겠습니까?')) return;
    try {
      await documentService.delete(id);
      refetch();
      toast.success('문서가 삭제되었습니다');
      setSelectedDocs([]);
    } catch (error) {
      console.error('문서 삭제 실패:', error);
      toast.error('문서 삭제에 실패했습니다');
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
    try {
      const result = await folderService.moveDocuments({
        documentIds: selectedDocs,
        targetFolderId,
      });
      refetch();
      toast.success(`${result.movedCount}개 문서를 ${result.targetFolder} 폴더로 이동했습니다`);
      setSelectedDocs([]);
      setShowMoveConfirm(false);
    } catch (error) {
      console.error('문서 이동 실패:', error);
      toast.error('문서 이동에 실패했습니다');
    }
  };

  // 편집 모달 열기 시 기본값 세팅
  const openEdit = () => {
    setEditName(folder?.name || '');
    const icon = typeof folder?.icon === 'string' && folder.icon.trim().length > 0 ? folder.icon : '📁';
    setEditIcon(icon);
    setEditColor(folder?.color || '');
    setShowEditModal(true);
  };

  // 날짜 포맷은 lib/domain/date 사용

  const isLoading = isDocsLoading || isFetching;

  const isSelectionMode = selectedDocs.length > 0;

  return (
    <div className="max-w-full mx-auto px-3 py-4 pb-24">
      {/* 헤더 */}
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={() => router.push('/documents')}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          {isFolderLoading ? (
            <FolderHeaderSkeleton />
          ) : (
            <>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <span>{folder?.icon}</span>
                <span>{folder?.name}</span>
              </h1>
              <p className="text-sm text-gray-500">{documents.length}개 문서</p>
            </>
          )}
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={openEdit} aria-label="폴더 수정">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowDeleteModal(true)} aria-label="폴더 삭제">
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
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
      {isLoading ? (
        <DocumentGridSkeleton count={6} />
      ) : documents.length === 0 ? (
        <Card className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg mb-4">이 폴더에 문서가 없습니다</p>
          <p className="text-sm text-gray-500">우측 하단 + 버튼으로 새 문서를 작성하세요</p>
        </Card>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {documents.map((doc) => {
            type DocContent = { sermonInfo?: { title?: string; pastor?: string; verse?: string; serviceType?: string } };
            const contentObj: DocContent = (typeof doc.content === 'object' && doc.content !== null)
              ? (doc.content as DocContent)
              : ({} as DocContent);
            const sermonInfo = contentObj.sermonInfo;
            const title = sermonInfo?.title || doc.title || '제목 없음';
            const previewText = extractPlainTextFromTiptap(doc.content, { limit: 300 });
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
                  className={`cursor-pointer active:scale-95 transition-transform flex flex-col relative overflow-hidden shadow-sm hover:shadow-md p-2 pt-8 ${
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
                    <div className="absolute top-2 right-2 z-10 flex gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleShare(doc.id, e); }}
                        className="h-6 w-6 flex items-center justify-center bg-white/90 rounded-full shadow-sm border"
                        aria-label="공유"
                      >
                        <Share2 className="h-3 w-3 text-gray-600" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteDocument(doc.id, e); }}
                        className="h-6 w-6 flex items-center justify-center bg-white/90 rounded-full shadow-sm border"
                        aria-label="삭제"
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </button>
                    </div>
                  )}

                  {/* 상단 미리보기 박스 */}
                  <div className="rounded-md bg-blue-50 border border-blue-200 px-2.5 py-2 h-28 overflow-hidden mb-2 mt-1">
                    {previewText ? (
                      <p className="text-sm text-gray-700 leading-5 break-words whitespace-pre-line line-clamp-7">
                        {previewText}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400">내용 없음</p>
                    )}
                  </div>

                  {/* 메타 5줄 */}
                  <div className="space-y-0.5">
                    {/* 1) 제목 */}
                    <div className="text-sm font-semibold truncate">{title}</div>
                    {/* 2) 설교자 or 설교종류 */}
                    <div className="text-[11px] text-gray-600 truncate">{sermonInfo?.pastor || sermonInfo?.serviceType || ''}</div>
                    {/* 3) 설교종류 */}
                    <div className="text-[11px] text-gray-600 truncate">{sermonInfo?.serviceType || ''}</div>
                    {/* 4) 본문 구절 */}
                    <div className="text-[11px] text-gray-600 truncate">{sermonInfo?.verse || ''}</div>
                    {/* 5) 최초 생성일시 */}
                    <div className="text-[11px] text-gray-500 truncate">{formatDateTimeKST(doc.createdAt)}</div>
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
            {folderList.filter((f) => f.id !== folderId).map((folder) => (
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

      {/* 폴더 편집 모달 */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>폴더 편집</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-folder-name">이름</Label>
              <Input id="edit-folder-name" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="폴더 이름" />
            </div>
            <div>
              <Label>아이콘</Label>
              <div className="grid grid-cols-8 gap-2 mt-2">
                {['📁','📝','📖','🙏','💡','⭐','❤️','📌'].map((ic) => (
                  <button
                    key={ic}
                    onClick={() => setEditIcon(ic)}
                    className={`p-2 text-xl rounded hover:bg-gray-100 ${editIcon === ic ? 'bg-blue-100 ring-2 ring-blue-500' : ''}`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>색상</Label>
              <div className="flex gap-2 mt-2">
                {['#FDE68A','#FCA5A5','#93C5FD','#6EE7B7','#E5E7EB'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setEditColor(c)}
                    className={`h-8 w-8 rounded-full border ${editColor === c ? 'ring-2 ring-blue-500' : ''}`}
                    style={{ backgroundColor: c }}
                    aria-label={`색상 ${c}`}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>취소</Button>
            <Button
              onClick={async () => {
                if (!editName.trim()) { toast.error('폴더명을 입력하세요'); return; }
                await updateFolder.mutateAsync({ id: folderId, name: editName.trim(), icon: editIcon, color: editColor });
              }}
              disabled={updateFolder.isPending}
            >
              {updateFolder.isPending ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 폴더 삭제 모달 */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>폴더 삭제</DialogTitle>
          </DialogHeader>
          {documents.length === 0 ? (
            <div className="space-y-3">
              <p>이 폴더에는 문서가 없습니다. 삭제하시겠습니까?</p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDeleteModal(false)}>취소</Button>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    try {
                      await folderService.delete(folderId);
                      toast.success('폴더를 삭제했습니다');
                      setShowDeleteModal(false);
                      router.push('/documents');
                    } catch (error) {
                      console.error('폴더 삭제 실패:', error);
                      toast.error('폴더 삭제에 실패했습니다');
                    }
                  }}
                >
                  삭제
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p>문서 {documents.length}개가 있습니다. 삭제 전에 어디로 옮길지 선택하세요.</p>
              <div className="flex flex-col gap-2">
                <Button
                  variant="secondary"
                  onClick={async () => {
                    try {
                      const unc = await folderService.normalizeUncategorized();
                      const docIds = documents.map((d) => d.id);
                      await folderService.moveDocuments({ documentIds: docIds, targetFolderId: unc.folderId });
                      await folderService.delete(folderId);
                      setShowDeleteModal(false);
                      toast.success('미분류로 이동 후 폴더를 삭제했습니다');
                      router.push('/documents');
                    } catch (error) {
                      console.error('폴더 삭제 실패:', error);
                      toast.error('폴더 삭제에 실패했습니다');
                    }
                  }}
                >
                  미분류로 모두 이동 후 삭제
                </Button>
                <div className="border rounded-md">
                  <div className="p-2 text-sm text-gray-600">다른 폴더로 이동</div>
                  <div className="max-h-48 overflow-auto">
                    {folderList.filter((f) => f.id !== folderId).map((f) => (
                      <button
                        key={f.id}
                        onClick={async () => {
                          try {
                            const docIds = documents.map((d) => d.id);
                            await folderService.moveDocuments({ documentIds: docIds, targetFolderId: f.id });
                            await folderService.delete(folderId);
                            setShowDeleteModal(false);
                            toast.success(`${f.name}로 이동 후 폴더를 삭제했습니다`);
                            router.push('/documents');
                          } catch (error) {
                            console.error('폴더 삭제 실패:', error);
                            toast.error('폴더 삭제에 실패했습니다');
                          }
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2"><span className="text-xl">{f.icon}</span>{f.name}</span>
                        <span className="text-sm text-gray-500">{f.documentCount}개</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
