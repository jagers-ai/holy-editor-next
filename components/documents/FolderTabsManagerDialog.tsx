'use client';

import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import type { FolderTab } from '@/hooks/useFolderTabs';

interface FolderTabsManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tabs: FolderTab[];
  onApply: (nextTabs: FolderTab[]) => void;
}

export function FolderTabsManagerDialog({
  open,
  onOpenChange,
  tabs,
  onApply,
}: FolderTabsManagerDialogProps) {
  const [visibleDraft, setVisibleDraft] = useState<FolderTab[]>([]);
  const [hiddenDraft, setHiddenDraft] = useState<FolderTab[]>([]);

  useEffect(() => {
    if (!open) return;
    setVisibleDraft(tabs.filter((tab) => tab.visible));
    setHiddenDraft(tabs.filter((tab) => !tab.visible));
  }, [open, tabs]);

  const moveVisible = (from: number, to: number) => {
    setVisibleDraft((prev) => {
      if (to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const hideTab = (index: number) => {
    setVisibleDraft((prev) => {
      const target = prev[index];
      if (!target || target.id === 'all') return prev;
      const nextVisible = prev.filter((_, i) => i !== index);
      setHiddenDraft((hidden) => [...hidden, { ...target, visible: false }]);
      return nextVisible;
    });
  };

  const showHidden = (index: number) => {
    setHiddenDraft((prev) => {
      const target = prev[index];
      if (!target) return prev;
      const nextHidden = prev.filter((_, i) => i !== index);
      setVisibleDraft((visible) => [...visible, { ...target, visible: true }]);
      return nextHidden;
    });
  };

  const handleApply = () => {
    const merged = [
      ...visibleDraft.map((tab) => ({ ...tab, visible: true })),
      ...hiddenDraft.map((tab) => ({ ...tab, visible: false })),
    ];
    onApply(merged);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>폴더 탭 편집</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <section>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">상단바에 표시</h3>
              <span className="text-xs text-muted-foreground">순서 조정 가능</span>
            </div>
            <div className="mt-3 space-y-2">
              {visibleDraft.map((tab, index) => (
                <div key={tab.id} className="flex items-center justify-between rounded-md border p-2">
                  <div className="flex items-center gap-2">
                    <Checkbox checked disabled aria-hidden />
                    <span className="text-sm font-medium">{tab.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="위로 이동"
                      disabled={index === 0}
                      onClick={() => moveVisible(index, index - 1)}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="아래로 이동"
                      disabled={index === visibleDraft.length - 1}
                      onClick={() => moveVisible(index, index + 1)}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    {tab.id !== 'all' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="숨기기"
                        onClick={() => hideTab(index)}
                      >
                        <EyeOff className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <Separator />

          <section>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">숨긴 폴더</h3>
              <span className="text-xs text-muted-foreground">필요 시 다시 추가</span>
            </div>
            <div className="mt-3 space-y-2">
              {hiddenDraft.length === 0 ? (
                <p className="text-xs text-muted-foreground">숨긴 폴더가 없습니다.</p>
              ) : (
                hiddenDraft.map((tab, index) => (
                  <div key={tab.id} className="flex items-center justify-between rounded-md border p-2">
                    <div className="text-sm font-medium">{tab.name}</div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="다시 표시"
                      onClick={() => showHidden(index)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleApply}>적용</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
