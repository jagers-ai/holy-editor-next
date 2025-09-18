'use client';

import { useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface SermonInfo {
  title: string;
  pastor: string;
  verse: string;
  serviceType: '감사일기' | '주일설교' | '수요예배' | '금요예배' | '새벽예배' | '청년예배' | '큐티' | '기타';
}

interface SermonInfoSectionProps {
  info: SermonInfo;
  onChange: (info: SermonInfo) => void;
  folders?: Array<{ id: string; name: string; icon?: string | null }>;
  selectedFolderId?: string;
  onSelectFolder?: (folderId: string) => void;
  isLoadingFolders?: boolean;
}

export function SermonInfoSection({
  info,
  onChange,
  folders,
  selectedFolderId,
  onSelectFolder,
  isLoadingFolders,
}: SermonInfoSectionProps) {
  const titleRef = useRef<HTMLTextAreaElement>(null);

  // 제목 textarea 높이 자동 조절
  const adjustTitleHeight = () => {
    if (titleRef.current) {
      titleRef.current.style.height = 'auto';
      titleRef.current.style.height = titleRef.current.scrollHeight + 'px';
    }
  };

  useEffect(() => {
    adjustTitleHeight();
  }, [info.title]);

  return (
    <div className="border-b bg-muted/30">
      <div className="px-4 py-4 space-y-3">
        {(onSelectFolder && (isLoadingFolders || (folders && folders.length > 0))) && (
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">폴더 선택</span>
            <Select
              value={selectedFolderId ?? ''}
              onValueChange={onSelectFolder}
              disabled={isLoadingFolders}
            >
              <SelectTrigger className="h-8 w-full max-w-xs truncate text-sm">
                <SelectValue placeholder="폴더를 선택하세요" />
              </SelectTrigger>
              <SelectContent sideOffset={4}>
                {isLoadingFolders ? (
                  <SelectItem value="__loading" disabled>
                    폴더를 불러오는 중...
                  </SelectItem>
                ) : (
                  folders?.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id} className="truncate">
                      {folder.icon ? `${folder.icon} ${folder.name}` : folder.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {!selectedFolderId && !isLoadingFolders && (
              <span className="text-[11px] text-destructive">폴더를 선택하지 않으면 저장할 수 없습니다.</span>
            )}
          </div>
        )}
        
        {/* 제목 입력 */}
        <textarea
          ref={titleRef}
          value={info.title}
          onChange={(e) => {
            onChange({ ...info, title: e.target.value });
            adjustTitleHeight();
          }}
          className="w-full text-2xl font-bold border-none outline-none bg-transparent resize-none overflow-hidden"
          placeholder="설교 제목을 입력하세요"
          rows={1}
        />
        
        {/* 설교자 & 예배 유형 */}
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            type="text"
            placeholder="설교자"
            value={info.pastor}
            onChange={(e) => onChange({ ...info, pastor: e.target.value })}
            className="w-full text-base px-3 py-2 border rounded-md bg-background"
          />
          
          <div className="relative w-full">
            <select
              value={info.serviceType}
              onChange={(e) => onChange({ ...info, serviceType: e.target.value as SermonInfo['serviceType'] })}
              className="w-full text-base appearance-none px-3 pr-10 py-2 border rounded-md bg-background"
            >
              <option value="감사일기">감사일기</option>
              <option value="주일설교">주일설교</option>
              <option value="수요예배">수요예배</option>
              <option value="금요예배">금요예배</option>
              <option value="새벽예배">새벽예배</option>
              <option value="청년예배">청년예배</option>
              <option value="큐티">큐티</option>
              <option value="기타">기타</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
        
        {/* 본문 구절 */}
        <input
          type="text"
          placeholder="본문 구절 (예: 창 5:1-12)"
          value={info.verse}
          onChange={(e) => onChange({ ...info, verse: e.target.value })}
          className="w-full text-base px-3 py-2 border rounded-md bg-background"
        />
      </div>
    </div>
  );
}
