'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Editor } from '@tiptap/react';
import { Bold, Highlighter, Heading1, Quote } from 'lucide-react';
import { isAndroid } from '@/utils/isAndroid';
import { isIOS } from '@/utils/isIOS';

type Pos = { x: number; y: number };

interface SelectionMiniBarProps {
  editor: Editor;
  enabled?: boolean; // feature flag
}

/**
 * 모바일 전용: 텍스트 선택 시 커서 근처에 뜨는 보조 미니바
 * 액션: Bold, Highlight(기본색), Heading1, Blockquote
 */
export const SelectionMiniBar: React.FC<SelectionMiniBarProps> = ({ editor, enabled = true }) => {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<Pos>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);

  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return (window.innerWidth < 768) && (isAndroid() || isIOS());
  }, []);

  const getVisibleViewport = () => {
    if (typeof window === 'undefined') return { width: 0, height: 0, offsetTop: 0, offsetLeft: 0 };
    const vv = window.visualViewport;
    if (vv) {
      return { width: vv.width, height: vv.height, offsetTop: vv.offsetTop, offsetLeft: vv.offsetLeft };
    }
    return { width: window.innerWidth, height: window.innerHeight, offsetTop: 0, offsetLeft: 0 };
  };

  const computePosition = useCallback(() => {
    if (!editor) return { show: false } as const;
    const state = editor.state;
    if (!state || state.selection.empty) return { show: false } as const;

    // 현재 선택 범위의 뷰포트 좌표
    const sel = document.getSelection?.();
    if (!sel || sel.rangeCount === 0) return { show: false } as const;
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) return { show: false } as const;

    // 에디터 영역 내부 선택인지 확인(외부 선택 시 노출 방지)
    const editorDom = editor.view.dom as HTMLElement;
    const editorRect = editorDom.getBoundingClientRect();
    const intersectsEditor = !(rect.right < editorRect.left || rect.left > editorRect.right || rect.bottom < editorRect.top || rect.top > editorRect.bottom);
    if (!intersectsEditor) return { show: false } as const;

    const vv = getVisibleViewport();
    const gap = 10; // 선택 영역과 미니바 간격(안드로이드 시스템 메뉴와 간섭 최소화)
    const barW = 200; // 대략적 폭(중앙 정렬을 위한 값)
    const barH = 44;  // 높이 추정치

    // 기본 정책: 항상 선택 영역 "하단"에 표시
    let x = rect.left + rect.width / 2 - barW / 2 + vv.offsetLeft;
    let yCandidate = rect.bottom + gap + vv.offsetTop;

    // 좌/우 화면 밖으로 나가면 클램프
    const minX = 8 + vv.offsetLeft;
    const maxX = vv.offsetLeft + vv.width - barW - 8;
    x = Math.max(minX, Math.min(maxX, x));

    // 키보드/하단 가림 회피: 가시 영역 하단 경계 내로 스냅
    const maxY = vv.offsetTop + vv.height - barH - 8;
    let y = Math.min(yCandidate, maxY);

    // 세로 공간이 절대적으로 부족하면(= 미니바를 놓을 하단 공간이 없음) 숨김
    const minY = vv.offsetTop + 8;
    const hasVerticalRoom = (maxY - (rect.bottom + gap)) >= 0 || (maxY - minY) >= barH * 0.6;
    if (!hasVerticalRoom) {
      return { show: false } as const;
    }

    return { show: true, x, y } as const;
  }, [editor]);

  const update = useCallback(() => {
    const res = computePosition();
    if (!res.show) {
      setVisible(false);
      return;
    }
    setPos({ x: res.x!, y: res.y! });
    setVisible(true);
  }, [computePosition]);

  // TipTap selection 업데이트 이벤트 구독
  useEffect(() => {
    if (!editor) return;
    const onSelUpdate = () => update();
    const onTrans = () => update();
    const onBlur = () => setVisible(false);
    editor.on('selectionUpdate', onSelUpdate);
    editor.on('transaction', onTrans);
    editor.on('blur', onBlur);

    // 브라우저 전역 selectionchange도 함께 감지(모바일 네이티브 핸들)
    document.addEventListener('selectionchange', onSelUpdate);
    window.addEventListener('scroll', onSelUpdate, true);
    window.addEventListener('resize', onSelUpdate);
    window.visualViewport?.addEventListener('resize', onSelUpdate);
    window.visualViewport?.addEventListener('scroll', onSelUpdate);

    // 초기 1회 계산
    setTimeout(update, 0);

    return () => {
      editor.off('selectionUpdate', onSelUpdate);
      editor.off('transaction', onTrans);
      editor.off('blur', onBlur);
      document.removeEventListener('selectionchange', onSelUpdate);
      window.removeEventListener('scroll', onSelUpdate, true);
      window.removeEventListener('resize', onSelUpdate);
      window.visualViewport?.removeEventListener('resize', onSelUpdate);
      window.visualViewport?.removeEventListener('scroll', onSelUpdate);
    };
  }, [editor, update]);

  const handleBold = useCallback(() => {
    editor.chain().focus().toggleBold().run();
    update();
  }, [editor, update]);

  const DEFAULT_HIGHLIGHT = '#ffd93d';
  const handleHighlight = useCallback(() => {
    if (editor.isActive('highlight')) {
      editor.chain().focus().unsetHighlight().run();
    } else {
      editor.chain().focus().setHighlight({ color: DEFAULT_HIGHLIGHT }).run();
    }
    update();
  }, [editor, update]);

  const handleH1 = useCallback(() => {
    editor.chain().focus().toggleHeading({ level: 1 }).run();
    update();
  }, [editor, update]);

  const handleQuote = useCallback(() => {
    editor.chain().focus().toggleBlockquote().run();
    update();
  }, [editor, update]);

  if (!enabled || !isMobile) return null;
  if (!visible) return null;

  // body 포털로 렌더링(고정 위치)
  const node = (
    <div
      ref={containerRef}
      role="dialog"
      aria-label="선택 미니바"
      className="pointer-events-auto fixed z-[9999]"
      style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
    >
      <div className="flex items-center gap-1 rounded-xl border bg-popover text-popover-foreground shadow-lg px-2 py-1">
        <button
          aria-label="Bold"
          className={`p-2 rounded-md hover:bg-accent ${editor.isActive('bold') ? 'bg-accent' : ''}`}
          onPointerDown={(e) => e.preventDefault()}
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleBold}
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          aria-label="Highlight"
          className={`p-2 rounded-md hover:bg-accent ${editor.isActive('highlight') ? 'bg-accent' : ''}`}
          onPointerDown={(e) => e.preventDefault()}
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleHighlight}
        >
          <Highlighter className="h-4 w-4" />
        </button>
        <div className="w-px h-5 bg-border" />
        <button
          aria-label="H1"
          className={`p-2 rounded-md hover:bg-accent ${editor.isActive('heading', { level: 1 }) ? 'bg-accent' : ''}`}
          onPointerDown={(e) => e.preventDefault()}
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleH1}
        >
          <Heading1 className="h-4 w-4" />
        </button>
        <button
          aria-label="Blockquote"
          className={`p-2 rounded-md hover:bg-accent ${editor.isActive('blockquote') ? 'bg-accent' : ''}`}
          onPointerDown={(e) => e.preventDefault()}
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleQuote}
        >
          <Quote className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(node, document.body);
};

export default SelectionMiniBar;
