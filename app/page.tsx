'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BookOpen, Plus, FolderOpen } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-2">
            <BookOpen className="h-10 w-10" />
            HolyEditor
          </h1>
          <p className="text-lg text-muted-foreground">
            성경 구절을 쉽게 삽입할 수 있는 에디터
          </p>
        </div>

        <div className="space-y-3">
          <Button asChild className="w-full h-12 text-lg">
            <Link href="/editor/new">
              <Plus className="h-5 w-5 mr-2" />
              새 문서 작성
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="w-full h-12 text-lg">
            <Link href="/documents">
              <FolderOpen className="h-5 w-5 mr-2" />
              문서 저장소
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}