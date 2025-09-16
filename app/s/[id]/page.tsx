import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/server/db';
import ReadOnlyRenderer from '@/components/reader/ReadOnlyRenderer';

type RouteParams = { id: string | number };

const resolveParams = async (params: Promise<RouteParams>): Promise<{ id: string }> => {
  const raw = await params;
  return { id: String(raw.id) };
};

type SermonInfo = {
  title?: string;
  pastor?: string;
  verse?: string;
  serviceType?: string;
};

const getSermonInfo = (content: unknown): SermonInfo => {
  if (!content || typeof content !== 'object') return {};
  const root = content as { sermonInfo?: unknown };
  if (!root.sermonInfo || typeof root.sermonInfo !== 'object') return {};
  const info = root.sermonInfo as Record<string, unknown>;
  return {
    title: typeof info.title === 'string' ? info.title : undefined,
    pastor: typeof info.pastor === 'string' ? info.pastor : undefined,
    verse: typeof info.verse === 'string' ? info.verse : undefined,
    serviceType: typeof info.serviceType === 'string' ? info.serviceType : undefined,
  };
};

export async function generateMetadata(props: { params: Promise<RouteParams> }): Promise<Metadata> {
  const { id } = await resolveParams(props.params);
  const doc = await prisma.document.findUnique({
    where: { id: String(id) },
    select: { title: true, content: true },
  });
  const sermonInfo = getSermonInfo(doc?.content);
  const sermonTitle = typeof sermonInfo.title === 'string' ? sermonInfo.title.trim() : '';
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

export default async function SharePage(props: { params: Promise<RouteParams> }) {
  const { id } = await resolveParams(props.params);
  const doc = await prisma.document.findUnique({
    where: { id: String(id) },
    select: { id: true, title: true, content: true, updatedAt: true, createdAt: true },
  });

  if (!doc) return notFound();

  const sermonInfo = getSermonInfo(doc.content);
  const displayTitle = (typeof sermonInfo.title === 'string' && sermonInfo.title.trim().length > 0)
    ? sermonInfo.title
    : (typeof doc.title === 'string' && doc.title.trim().length > 0 ? doc.title : '설교 필기');
  const verse = sermonInfo.verse ?? '';
  const pastor = sermonInfo.pastor ?? '';

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
