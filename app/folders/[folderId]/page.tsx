import { redirect } from 'next/navigation';

type LegacyFolderPageProps = {
  params: {
    folderId: string;
  };
};

export default function LegacyFolderPage({ params }: LegacyFolderPageProps) {
  const query = new URLSearchParams({ folderId: params.folderId });
  redirect(`/documents?${query.toString()}`);
}
