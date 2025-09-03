'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Save } from "lucide-react";
import { useEditorContext } from "@/contexts/EditorContext";

function SaveButton() {
  const { handleSave, isSaving } = useEditorContext();
  
  return (
    <button
      onClick={handleSave}
      disabled={isSaving}
      className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm min-w-[44px] min-h-[44px] justify-center"
    >
      {isSaving ? (
        <span className="text-xs">저장 중...</span>
      ) : (
        <>
          <Save className="h-4 w-4" />
          <span>저장</span>
        </>
      )}
    </button>
  );
}

export function Navigation() {
  const pathname = usePathname();
  const isEditorPage = pathname?.startsWith('/editor/');

  return (
    <nav className="border-b fixed top-0 left-0 right-0 bg-background z-50">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          HolyEditor
        </Link>
        
        {isEditorPage && <SaveButton />}
      </div>
    </nav>
  );
}