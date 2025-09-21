import { permanentRedirect } from 'next/navigation';

export default function LegacyFoldersPage() {
  permanentRedirect('/documents');
}
