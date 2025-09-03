'use client';

import { useEffect, useRef } from 'react';

export interface SermonInfo {
  title: string;
  pastor: string;
  verse: string;
  serviceType: '���ϼ���' | '�����⵵' | '�ݿ�⵵' | '����⵵' | '����ȸ' | '��Ÿ';
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
        {/* 제목 입력 */}
        <textarea
          ref={titleRef}
          value={info.title}
          onChange={(e) => {
            onChange({ ...info, title: e.target.value });
            adjustTitleHeight();
          }}
          className="w-full text-2xl font-bold border-none outline-none bg-transparent resize-none overflow-hidden"
          placeholder="���� ������ �Է��ϼ���"
          rows={1}
        />
        
        {/* 설교자 & 예배 유형 */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="��� ����"
            value={info.pastor}
            onChange={(e) => onChange({ ...info, pastor: e.target.value })}
            className="flex-1 text-base px-3 py-2 border rounded-md bg-background"
          />
          
          <select
            value={info.serviceType}
            onChange={(e) => onChange({ ...info, serviceType: e.target.value as SermonInfo['serviceType'] })}
            className="text-base px-3 py-2 border rounded-md bg-background"
          >
            <option value="���ϼ���">���ϼ���</option>
            <option value="�����⵵">�����⵵</option>
            <option value="�ݿ�⵵">�ݿ�⵵</option>
            <option value="����⵵">����⵵</option>
            <option value="����ȸ">����ȸ</option>
            <option value="��Ÿ">��Ÿ</option>
          </select>
        </div>
        
        {/* 본문 구절 */}
        <input
          type="text"
          placeholder="���� ���� (��: ���º��� 5:1-12)"
          value={info.verse}
          onChange={(e) => onChange({ ...info, verse: e.target.value })}
          className="w-full text-base px-3 py-2 border rounded-md bg-background"
        />
      </div>
    </div>
  );
}

