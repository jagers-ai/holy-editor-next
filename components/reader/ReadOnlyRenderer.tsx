'use client';

import React, { useMemo } from 'react';
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import { BibleVerseExtension } from '@/components/editor/extensions/BibleVerseExtension';

interface ReadOnlyRendererProps {
  content: any; // Tiptap JSON (메타 포함 가능)
}

/**
 * TipTap JSON을 SSR/CSR 가벼운 HTML로 렌더하는 컴포넌트
 * - 에디터 번들을 로드하지 않음
 * - 에디터와 동일한 확장(StarterKit/Highlight/Image/성경노드) 사용
 */
export default function ReadOnlyRenderer({ content }: ReadOnlyRendererProps) {
  const { html, fallbackText } = useMemo(() => {
    // TipTap doc 전용으로 정제 (sermonInfo 등 메타 제거)
    const toDocOnly = (raw: any) => {
      if (raw && typeof raw === 'object') {
        const type = (raw as any).type;
        const contentArr = Array.isArray((raw as any).content) ? (raw as any).content : [];
        if (type === 'doc') return { type: 'doc', content: contentArr };
        // type이 없더라도 content만 있으면 doc로 감싸기
        if (contentArr.length) return { type: 'doc', content: contentArr };
      }
      return { type: 'doc', content: [] };
    };

    const toPlainText = (node: any): string => {
      try {
        let out = '';
        const walk = (n: any) => {
          if (!n || typeof n !== 'object') return;
          if (typeof n.text === 'string') out += n.text;
          if (Array.isArray(n.content)) n.content.forEach(walk);
          if (n.type === 'paragraph') out += '\n\n';
        };
        walk(node);
        return out.trim();
      } catch {
        return '';
      }
    };

    try {
      const safeContent = toDocOnly(content);
      const html = generateHTML(safeContent as any, [
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
      return { html, fallbackText: '' };
    } catch (e: any) {
      // 런타임 문제 원인 파악을 위한 경량 로깅
      const keys = content && typeof content === 'object' ? Object.keys(content) : [];
      // eslint-disable-next-line no-console
      console.error('ReadOnlyRenderer: HTML 생성 실패', {
        error: e?.message || String(e),
        keys,
        type: (content as any)?.type,
        hasContentArray: Array.isArray((content as any)?.content),
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
