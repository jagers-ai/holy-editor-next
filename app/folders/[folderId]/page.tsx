import { permanentRedirect } from 'next/navigation';

type LegacyFolderPageProps = {
  params: Promise<{ folderId: string }>;
};

export default async function LegacyFolderPage({ params }: LegacyFolderPageProps) {
  const { folderId } = await params;
  const query = new URLSearchParams({ folderId });
  permanentRedirect(`/documents?${query.toString()}`);
}
