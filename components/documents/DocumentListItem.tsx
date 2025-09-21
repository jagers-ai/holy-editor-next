'use client';

import { Share2, Trash2 } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { extractPlainTextFromTiptap } from 'core';
import type { DocumentListEntry } from 'core';

interface DocumentListItemProps {
  document: DocumentListEntry;
  onOpen: () => void;
  onShare: () => void;
  onDelete: () => void;
}

const formatDate = (value: string | Date) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString('ko-KR');
};

export function DocumentListItem({ document, onOpen, onShare, onDelete }: DocumentListItemProps) {
  type DocContent = {
    sermonInfo?: {
      title?: string;
      pastor?: string;
      serviceType?: string;
      verse?: string;
    };
  };

  const contentObj: DocContent =
    typeof document.content === 'object' && document.content !== null
      ? (document.content as DocContent)
      : {};

  const sermonInfo = contentObj.sermonInfo;
  const displayTitle = sermonInfo?.title || document.title || '제목 없음';
  const previewText = extractPlainTextFromTiptap(document.content, { limit: 240 });

  const metaParts: string[] = [];
  if (sermonInfo?.serviceType) metaParts.push(sermonInfo.serviceType);
  if (sermonInfo?.pastor) metaParts.push(sermonInfo.pastor);
  const formattedDate = formatDate(document.createdAt);
  if (formattedDate) metaParts.push(formattedDate);
  const meta = metaParts.join(' · ');

  return (
    <Card
      className="cursor-pointer p-4 transition-shadow hover:shadow-md"
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen();
        }
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <h3 className="text-base font-semibold leading-tight line-clamp-1">{displayTitle}</h3>
          {previewText && (
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 whitespace-pre-wrap">
              {previewText}
            </p>
          )}
          {meta && <p className="text-xs text-muted-foreground">{meta}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(event) => {
              event.stopPropagation();
              onShare();
            }}
            aria-label="문서 공유"
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
            aria-label="문서 삭제"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
