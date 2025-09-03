'use client';

import { useEffect, useRef } from 'react';

export interface SermonInfo {
  title: string;
  pastor: string;
  verse: string;
  serviceType: '주일설교' | '새벽기도' | '금요기도' | '수요기도' | '수련회' | '기타';
}

interface SermonInfoSectionProps {
  info: SermonInfo;
  onChange: (info: SermonInfo) => void;
}

export function SermonInfoSection({ info, onChange }: SermonInfoSectionProps) {
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
        {/* 설교 제목 */}
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
        
        {/* 담당 목사님 & 설교 시간 */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="담당 목사님"
            value={info.pastor}
            onChange={(e) => onChange({ ...info, pastor: e.target.value })}
            className="flex-1 text-sm px-3 py-2 border rounded-md bg-background"
          />
          
          <select
            value={info.serviceType}
            onChange={(e) => onChange({ ...info, serviceType: e.target.value as SermonInfo['serviceType'] })}
            className="text-sm px-3 py-2 border rounded-md bg-background"
          >
            <option value="주일설교">주일설교</option>
            <option value="새벽기도">새벽기도</option>
            <option value="금요기도">금요기도</option>
            <option value="수요기도">수요기도</option>
            <option value="수련회">수련회</option>
            <option value="기타">기타</option>
          </select>
        </div>
        
        {/* 설교 구절 */}
        <input
          type="text"
          placeholder="설교 구절 (예: 마태복음 5:1-12)"
          value={info.verse}
          onChange={(e) => onChange({ ...info, verse: e.target.value })}
          className="w-full text-sm px-3 py-2 border rounded-md bg-background"
        />
      </div>
    </div>
  );
}