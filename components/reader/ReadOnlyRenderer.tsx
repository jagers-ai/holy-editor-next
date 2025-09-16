'use client';

import React, { useMemo } from 'react';
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import type { JSONContent } from '@tiptap/core';
import { BibleVerseExtension } from '@/components/editor/extensions/BibleVerseExtension';

interface ReadOnlyRendererProps {
  content: unknown; // TipTap JSON (메타 포함 가능)
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const toDocOnly = (raw: unknown): JSONContent => {
  if (!isRecord(raw)) {
    return { type: 'doc', content: [] };
  }
  const type = typeof raw.type === 'string' ? raw.type : undefined;
  const contentArr = Array.isArray(raw.content) ? raw.content : [];
  if (type === 'doc') {
    return { type: 'doc', content: contentArr as JSONContent['content'] };
  }
  if (contentArr.length > 0) {
    return { type: 'doc', content: contentArr as JSONContent['content'] };
  }
  return { type: 'doc', content: [] };
};

const toPlainText = (node: unknown): string => {
  const output: string[] = [];
  const walk = (value: unknown) => {
    if (!isRecord(value)) return;
    const text = typeof value.text === 'string' ? value.text : '';
    if (text) {
      output.push(text);
    }
    const children = Array.isArray(value.content) ? value.content : [];
    children.forEach(walk);
    if (value.type === 'paragraph') {
      output.push('\n\n');
    }
  };
  try {
    walk(node);
    return output.join('').trim();
  } catch {
    return '';
  }
};

/**
 * TipTap JSON을 SSR/CSR 가벼운 HTML로 렌더하는 컴포넌트
 * - 에디터 번들을 로드하지 않음
 * - 에디터와 동일한 확장(StarterKit/Highlight/Image/성경노드) 사용
 */
export default function ReadOnlyRenderer({ content }: ReadOnlyRendererProps) {
  const { html, fallbackText } = useMemo(() => {
    try {
      const safeContent = toDocOnly(content);
      const html = generateHTML(safeContent, [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
        }),
        Highlight.configure({ multicolor: true }),
        Image.extend({
          addAttributes() {
            return {
              ...this.parent?.(),
              // SSR에서도 안전한 속성만 허용
              class: { default: 'read-img' } as const,
            };
          },
        }),
        BibleVerseExtension,
      ]);
      return { html, fallbackText: '' };
    } catch (error: unknown) {
      // 런타임 문제 원인 파악을 위한 경량 로깅
      const keys = isRecord(content) ? Object.keys(content) : [];
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('ReadOnlyRenderer: HTML 생성 실패', {
        error: errorMessage,
        keys,
        type: isRecord(content) && typeof content.type === 'string' ? content.type : undefined,
        hasContentArray: isRecord(content) && Array.isArray(content.content),
      });
      const text = toPlainText(content);
      return { html: '', fallbackText: text };
    }
  }, [content]);

  if (html) {
    return (
      <div
        className="prose max-w-none px-4 py-6 read-only-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  // 폴백: 최소한의 텍스트라도 보여주기
  return (
    <div className="prose max-w-none px-4 py-6 read-only-content text-muted-foreground">
      {fallbackText ? (
        <pre className="whitespace-pre-wrap break-words">{fallbackText}</pre>
      ) : (
        <p>내용을 표시할 수 없습니다.</p>
      )}
    </div>
  );
}
