'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FolderOpen } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';
import { api } from '@/utils/api';
import { prefetchFolder } from '@/lib/api/prefetch';
import { asRouterPort } from '@/adapters/web/router';
import { FolderCard } from '../../components/folders/FolderCard';

export default function FoldersPage() {
  const router = useRouter();
  const utils = api.useUtils();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('📁');

  // tRPC queries
  const { data: folders, isLoading, refetch } = api.folder.list.useQuery();
  const normalizeUncategorized = api.folder.normalizeUncategorized.useMutation({
    onSuccess: (data) => {
      if (data.movedCount > 0) {
        toast.success(`미분류로 ${data.movedCount}개 문서를 이동했습니다`);
        refetch();
      }
    },
  });
  const createFolder = api.folder.create.useMutation({
    onSuccess: () => {
      refetch();
      toast.success('폴더가 생성되었습니다');
      setShowCreateModal(false);
      setNewFolderName('');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const createDefaults = api.folder.createDefaults.useMutation({
    onSuccess: (data) => {
      if (data.created) {
        refetch();
        toast.success(data.message);
      }
    },
  });

  // 최초 접속 시 기본 폴더 생성
  if (folders && folders.length === 0) {
    createDefaults.mutate();
  }

  // 기존 폴더 미지정 문서가 있으면 미분류로 정리 (멱등)
  useEffect(() => {
    normalizeUncategorized.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error('폴더명을 입력해주세요');
      return;
    }

    await createFolder.mutateAsync({
      name: newFolderName,
      icon: selectedIcon,
    });
  };

  const folderIcons = ['📁', '📝', '📖', '🙏', '💡', '⭐', '❤️', '📌'];
  const folderColors = ['bg-gray-100', 'bg-yellow-100', 'bg-red-100', 'bg-blue-100'];

  return (
    <div className="max-w-full mx-auto px-3 py-4 pb-24">
      {/* 헤더 */}
      <div className="mb-4">
        <h1 className="text-xl font-bold">내 폴더</h1>
        <p className="text-sm text-gray-500">
          {folders?.length || 0}개 폴더
        </p>
      </div>

      {isLoading ? (
        <Card className="text-center py-12">
          <p className="text-muted-foreground">폴더를 불러오는 중...</p>
        </Card>
      ) : !folders || folders.length === 0 ? (
        <Card className="text-center py-12">
          <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg mb-4">폴더가 없습니다</p>
          <p className="text-sm text-gray-500">+ 버튼으로 새 폴더를 만드세요</p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 px-4">
          {folders.map((folder, idx) => {
            const accents = ['bg-yellow-400','bg-red-400','bg-blue-400','bg-emerald-400'];
            const accentClass = accents[idx % accents.length];
            const doPrefetch = () => {
              void prefetchFolder(asRouterPort(router), utils, folder.id);
            };
            return (
              <FolderCard
                key={folder.id}
                name={folder.name}
                count={folder.documentCount}
                icon={folder.icon || '📁'}
                href={`/folders/${folder.id}`}
                onPrefetch={doPrefetch}
                accentClass={accentClass}
              />
            );
          })}
        </div>
      )}

      {/* FAB - 폴더 추가 */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-5 right-5 w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg active:scale-90 transition-all flex items-center justify-center z-50"
        aria-label="새 폴더 만들기"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* 폴더 생성 모달 */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 폴더 만들기</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="folder-name">폴더 이름</Label>
              <Input
                id="folder-name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="폴더 이름을 입력하세요"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateFolder();
                  }
                }}
              />
            </div>
            <div>
              <Label>아이콘 선택</Label>
              <div className="grid grid-cols-8 gap-2 mt-2">
                {folderIcons.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setSelectedIcon(icon)}
                    className={`p-2 text-xl rounded hover:bg-gray-100 ${
                      selectedIcon === icon ? 'bg-blue-100 ring-2 ring-blue-500' : ''
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              취소
            </Button>
            <Button onClick={handleCreateFolder} disabled={createFolder.isPending}>
              {createFolder.isPending ? '생성 중...' : '만들기'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
