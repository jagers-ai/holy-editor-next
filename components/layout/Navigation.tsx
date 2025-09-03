'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen } from "lucide-react";

export function Navigation() {
  const pathname = usePathname();
  const isEditorPage = pathname?.startsWith('/editor/');
  
  // 에디터 페이지에서는 네비게이션 숨김
  if (isEditorPage) {
    return null;
  }

  return (
    <nav className="border-b bg-background z-50">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          HolyEditor
        </Link>
      </div>
    </nav>
  );
}