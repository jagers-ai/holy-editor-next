import { notFound } from 'next/navigation';
import type { Metadata, ResolvingMetadata } from 'next';
import { prisma } from '@/server/db';
import ReadOnlyRenderer from '@/components/reader/ReadOnlyRenderer';

type Params = { params: { id: string } };

export async function generateMetadata(
  { params }: Params,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const id = params.id;
  const doc = await prisma.document.findUnique({
    where: { id },
    select: { title: true, content: true },
  });
  const sermonTitle = (doc?.content as any)?.sermonInfo?.title as string | undefined;
  const title = `홀리해빗 : ${sermonTitle || doc?.title || '설교 필기'}`;
  return {
    title,
    robots: { index: false, follow: false },
    openGraph: { title, type: 'article', siteName: '홀리해빗' },
    twitter: { title },
  };
}

export default async function SharePage({ params }: Params) {
  const id = params.id;
  const doc = await prisma.document.findUnique({
    where: { id },
    select: { id: true, title: true, content: true, updatedAt: true, createdAt: true },
  });

  if (!doc) return notFound();

  const sermonInfo = (doc.content as any)?.sermonInfo || {};
  const displayTitle = sermonInfo.title || doc.title || '설교 필기';
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

