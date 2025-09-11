import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/server/db';
import ReadOnlyRenderer from '@/components/reader/ReadOnlyRenderer';

// Next.js 15: 일부 환경에서 params가 Promise로 전달됨 → 안전하게 any + await 처리
export async function generateMetadata(props: any): Promise<Metadata> {
  const { id } = await props.params;
  const doc = await prisma.document.findUnique({
    where: { id: String(id) },
    select: { title: true, content: true },
  });
  const contentObj: any = (doc?.content && typeof doc.content === 'object') ? doc.content : {};
  const sermonTitle = typeof contentObj?.sermonInfo?.title === 'string' ? contentObj.sermonInfo.title.trim() : '';
  const baseTitle = typeof doc?.title === 'string' ? doc.title.trim() : '';
  const effective = sermonTitle || baseTitle || '설교 필기';
  const title = `홀리해빗 : ${effective}`;
  return {
    title,
    robots: { index: false, follow: false },
    openGraph: { title, type: 'article', siteName: '홀리해빗' },
    twitter: { title },
  };
}

export default async function SharePage(props: any) {
  const { id } = await props.params;
  const doc = await prisma.document.findUnique({
    where: { id: String(id) },
    select: { id: true, title: true, content: true, updatedAt: true, createdAt: true },
  });

  if (!doc) return notFound();

  const contentObj: any = (doc.content && typeof doc.content === 'object') ? doc.content : {};
  const sermonInfo = contentObj.sermonInfo || {};
  const displayTitle = (typeof sermonInfo.title === 'string' && sermonInfo.title.trim().length > 0)
    ? sermonInfo.title
    : (typeof doc.title === 'string' && doc.title.trim().length > 0 ? doc.title : '설교 필기');
  const verse = sermonInfo.verse || '';
  const pastor = sermonInfo.pastor || '';

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b px-4 py-3">
        <h1 className="text-xl font-bold truncate">{displayTitle}</h1>
        {(pastor || verse) && (
          <p className="text-sm text-muted-foreground truncate">{[pastor, verse].filter(Boolean).join(' · ')}</p>
        )}
      </header>

      <main>
        <ReadOnlyRenderer content={doc.content} />
      </main>
    </div>
  );
}
