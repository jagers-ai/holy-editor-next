'use client';

import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Heading1,
  List,
  Quote,
  Undo,
  Redo,
  Camera,
  Save,
  Highlighter
} from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useEditorContext } from '@/contexts/EditorContext';
import { applyPlatformClasses } from '@/utils/isIOS';
import { useVisualViewportOffset } from '@/hooks/useVisualViewportOffset';
import toast from 'react-hot-toast';
import { compressToUnder } from '@/lib/images/compress';
import { uploadImageToStorage } from '@/lib/storage/uploadImage';

interface ToolbarProps {
  editor: Editor;
}

export function Toolbar({ editor }: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { handleSave, isSaving } = useEditorContext();
  const [showColorPalette, setShowColorPalette] = useState(false);
  const highlightBtnRef = useRef<HTMLButtonElement>(null);
  const [palettePos, setPalettePos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });

  // 플랫폼별 클래스 적용(필요 시)
  useEffect(() => {
    applyPlatformClasses();
  }, []);

  // visualViewport offset을 CSS 변수로 반영
  useVisualViewportOffset(true);

  // 색상 옵션
  const highlightColors = [
    { name: '빨강', value: '#ff6b6b' },
    { name: '주황', value: '#ff9f43' },
    { name: '노랑', value: '#ffd93d' },
    { name: '초록', value: '#6bcf7f' },
    { name: '파랑', value: '#74b9ff' },
    { name: '남색', value: '#5f5fff' },
    { name: '보라', value: '#a29bfe' }
  ];
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const id = toast.loading('이미지 업로드 준비 중...');
    try {
      // 1) 1MB 미만이 될 때까지 자동 압축
      let working: Blob = file;
      if (file.size > 1_000_000) {
        const res = await compressToUnder(file, { targetBytes: 1_000_000, initialMaxDim: 1280, initialQuality: 0.72 });
        if (res?.blob) working = res.blob;
      }
      toast.loading('이미지 업로드 중...', { id });
      // 2) Storage 업로드 → URL 삽입
      const { publicUrl } = await uploadImageToStorage(working, { ext: working.type.includes('webp') ? 'webp' : 'jpg' });
      editor.chain().focus().setImage({ src: publicUrl }).run();
      toast.success('이미지를 추가했습니다', { id });
    } catch (err: any) {
      console.error('이미지 업로드 실패', err);
      const msg = err?.message || '이미지 업로드에 실패했습니다';
      toast.error(`업로드 실패: ${msg}`, { id });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 팔레트 위치 계산: 버튼 기준으로 화면 좌표 산출
  const updatePalettePos = () => {
    const btn = highlightBtnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const gap = 8; // 버튼 아래 간격
    const left = rect.left;
    const top = rect.bottom + gap;
    setPalettePos({ left, top });
  };

  // 팔레트 열릴 때와 윈도우 스크롤/리사이즈 시 위치 갱신 + 바깥 클릭 닫기
  useEffect(() => {
    if (!showColorPalette) return;
    updatePalettePos();

    const onScroll = () => updatePalettePos();
    const onResize = () => updatePalettePos();
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        highlightBtnRef.current &&
        (highlightBtnRef.current === target || highlightBtnRef.current.contains(target))
      ) return; // 버튼 자체 클릭은 무시

      const paletteEl = document.getElementById('he-highlight-palette');
      if (paletteEl && (paletteEl === target || paletteEl.contains(target))) return;
      setShowColorPalette(false);
    };

    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    document.addEventListener('mousedown', onMouseDown, true);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('mousedown', onMouseDown, true);
    };
  }, [showColorPalette]);

  const toolbarContent = (
    <div
      className="border-b bg-background"
      role="toolbar"
      aria-label="Editor toolbar"
    >
      <div className="mx-auto w-full max-w-2xl">
        <div className="flex items-center gap-0.5 p-2 overflow-x-auto min-h-[var(--toolbar-h)]">
        <Button
          variant="ghost"
          size="sm"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="h-4 w-4" />
        </Button>
        
        <div className="w-px h-6 bg-border mx-0.5" />
        
        <Button
          variant="ghost"
          size="sm"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
        >
          <Camera className="h-4 w-4" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleImageUpload}
        />
        <Button
          variant={editor.isActive('bold') ? 'default' : 'ghost'}
          size="sm"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </Button>
        
        {/* 형광펜 버튼과 색상 선택 */}
        <div className="relative">
          <Button
            variant={editor.isActive('highlight') ? 'default' : 'ghost'}
            size="sm"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowColorPalette(!showColorPalette)}
            ref={highlightBtnRef}
          >
            <Highlighter className="h-4 w-4" />
          </Button>
          {showColorPalette && typeof document !== 'undefined' && createPortal(
            <div
              id="he-highlight-palette"
              className="fixed mt-2 p-2 border rounded-lg shadow-lg z-[10000] bg-popover text-popover-foreground"
              style={{ left: palettePos.left, top: palettePos.top }}
            >
              <div className="grid grid-cols-4 gap-1">
                {highlightColors.map((color) => (
                  <button
                    key={color.value}
                    className="w-8 h-8 rounded hover:scale-110 transition-transform border border-gray-300"
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      editor.chain().focus().setHighlight({ color: color.value }).run();
                      setShowColorPalette(false);
                    }}
                  />
                ))}
                <button
                  className="w-8 h-8 rounded hover:scale-110 transition-transform border border-gray-300 bg-white flex items-center justify-center"
                  title="형광펜 제거"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    editor.chain().focus().unsetHighlight().run();
                    setShowColorPalette(false);
                  }}
                >
                  ✕
                </button>
              </div>
            </div>,
            document.body
          )}
        </div>
        
        <div className="w-px h-6 bg-border mx-0.5" />
        
        <Button
          variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'ghost'}
          size="sm"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
          size="sm"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive('blockquote') ? 'default' : 'ghost'}
          size="sm"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-5 w-5" />
        </Button>
        
        <div className="ml-auto">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            aria-label="저장"
          >
            {isSaving ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Save className="h-4 w-4" />
            )}
          </button>
        </div>
        </div>
      </div>
    </div>
  );

  // 상단 고정(모바일/데스크톱 공통): visualViewport 기준으로 위치 보정
  if (!editor) return null; // Hook 선언 이후에 배치하여 규칙 준수
  return (
    <div
      className="z-50"
      style={{
        position: 'fixed',
        top: `calc(var(--vv-top, 0px) + env(safe-area-inset-top))`,
        left: 0,
        right: 0,
      }}
    >
      {toolbarContent}
    </div>
  );
}
