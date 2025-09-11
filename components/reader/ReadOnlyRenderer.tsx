'use client';

import React, { useMemo } from 'react';
import { generateHTML } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import { BibleVerseExtension } from '@/components/editor/extensions/BibleVerseExtension';

interface ReadOnlyRendererProps {
  content: any; // Tiptap JSON
}

/**
 * TipTap JSON을 SSR/CSR 가벼운 HTML로 렌더하는 컴포넌트
 * - 에디터 번들을 로드하지 않음
 * - 에디터와 동일한 확장(StarterKit/Highlight/Image/성경노드) 사용
 */
export default function ReadOnlyRenderer({ content }: ReadOnlyRendererProps) {
  const html = useMemo(() => {
    try {
      const safeContent = content && typeof content === 'object' ? content : { type: 'doc', content: [] };
      return generateHTML(safeContent, [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
        }),
        Highlight.configure({ multicolor: true }),
        Image.extend({
          addAttributes() {
            return {
              ...this.parent?.(),
              // SSR에서도 안전한 속성만 허용
              class: { default: 'read-img' },
            } as any;
          },
        }),
        BibleVerseExtension,
      ]);
    } catch (e) {
      console.error('ReadOnlyRenderer: HTML 생성 실패', e);
      return '<p>내용을 표시할 수 없습니다.</p>';
    }
  }, [content]);

  return (
    <div className="prose max-w-none px-4 py-6 read-only-content" dangerouslySetInnerHTML={{ __html: html }} />
  );
}

