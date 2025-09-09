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
import { useEditorContext } from '@/contexts/EditorContext';
import { isAndroid } from '@/utils/isAndroid';
import { isIOS, applyPlatformClasses } from '@/utils/isIOS';
import { KeyboardStickyView } from './KeyboardStickyView';

interface ToolbarProps {
  editor: Editor;
}

export function Toolbar({ editor }: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { handleSave, isSaving } = useEditorContext();
  const [showColorPalette, setShowColorPalette] = useState(false);

  // 플랫폼별 클래스 적용
  useEffect(() => {
    applyPlatformClasses();
    if (isAndroid()) {
      document.documentElement.classList.add('is-android');
    }
  }, []);
  
  if (!editor) return null;

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
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      editor.chain().focus().setImage({ src: url }).run();
    };
    reader.readAsDataURL(file);
    
    // Reset input for reupload
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 모바일에서는 KeyboardStickyView 사용
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const shouldUseSticky = isMobile && (isAndroid() || isIOS());

  const toolbarContent = (
    <div
      className="border-t bg-background pb-[env(safe-area-inset-bottom)]"
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
          >
            <Highlighter className="h-4 w-4" />
          </Button>
          {showColorPalette && (
            <div className="fixed bottom-20 left-1/2 -translate-x-1/2 mb-2 p-2 bg-white border rounded-lg shadow-lg z-[9999]">
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
            </div>
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

  // 모바일에서는 KeyboardStickyView로 래핑
  if (shouldUseSticky) {
    return (
      <KeyboardStickyView 
        offset={{ closed: 0, opened: 10 }}
        enabled={true}
        className="toolbar-sticky"
      >
        {toolbarContent}
      </KeyboardStickyView>
    );
  }

  // 데스크톱에서는 기본 렌더링
  return (
    <div className="sticky bottom-0 z-50 md:relative">
      {toolbarContent}
    </div>
  );
}
