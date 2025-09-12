'use client';

import Link from 'next/link';
import * as React from 'react';

type FolderCardProps = {
  name: string;
  count: number;
  icon?: string;
  href?: string;
  onClick?: () => void;
  className?: string;
  accentClass?: string; // tailwind bg-* 클래스 (예: 'bg-yellow-400')
};

export function FolderCard({ name, count, icon = '📁', href, onClick, className = '', accentClass = 'bg-yellow-400' }: FolderCardProps) {
  const content = (
    <div
      role="button"
      aria-label={`폴더 ${name}, ${count}개`}
      onClick={onClick}
      className={[
        'relative rounded-2xl bg-white shadow-md h-[120px] hover:shadow-lg',
        'active:scale-95 transition transform-gpu overflow-visible select-none touch-manipulation',
        'focus:outline-none',
        className,
      ].join(' ')}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {/* 좌상단 수량 */}
      <div className="absolute top-2 left-3 text-sm text-gray-600">{count}</div>

      {/* 상단 탭 - 회색 베이스 */}
      <div className="absolute top-0 right-3 w-16 h-6 rounded-b-2xl bg-gray-300" />
      {/* 상단 탭 - 컬러 포인트 */}
      <div className={`absolute top-0 right-16 w-12 h-6 rounded-b-2xl ${accentClass}`} />

      {/* 아이콘 슬롯 */}
      <div className="absolute top-7 left-4 text-2xl leading-none">{icon}</div>

      {/* 제목 */}
      <div className="absolute left-4 right-4 bottom-4 text-lg font-extrabold text-black truncate">
        {name}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block" prefetch={false}>
        {content}
      </Link>
    );
  }
  return content;
}

export default FolderCard;

