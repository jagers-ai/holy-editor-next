import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BookOpen, Plus, FolderOpen, LogIn, UserPlus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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
          {user ? (
            <>
              <Button asChild className="w-full h-12 text-lg">
                <Link href="/folders">
                  <Plus className="h-5 w-5 mr-2" />
                  새 문서 작성
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="w-full h-12 text-lg">
                <Link href="/folders">
                  <FolderOpen className="h-5 w-5 mr-2" />
                  내 폴더
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild className="w-full h-12 text-lg">
                <Link href="/signup">
                  <UserPlus className="h-5 w-5 mr-2" />
                  회원가입
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="w-full h-12 text-lg">
                <Link href="/login">
                  <LogIn className="h-5 w-5 mr-2" />
                  로그인
                </Link>
              </Button>

              <div className="text-center text-sm text-muted-foreground mt-4">
                로그인하여 문서를 안전하게 저장하고 관리하세요
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
