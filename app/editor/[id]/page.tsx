'use client';

import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// SSR 방지를 위한 dynamic import
const HolyEditor = dynamic(
  () => import('@/components/editor/HolyEditor'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">에디터 로딩 중...</div>
      </div>
    )
  }
);

export default function EditorPage() {
  const params = useParams();
  const documentId = params.id as string;

  return (
    <div className="min-h-[100dvh] bg-background">
      <HolyEditor documentId={documentId === 'new' ? undefined : documentId} />
    </div>
  );
}
