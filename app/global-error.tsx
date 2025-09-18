'use client';

import { useEffect } from 'react';
import NextError from 'next/error';
import * as Sentry from '@sentry/nextjs';

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ko">
      <body className="flex min-h-dvh flex-col items-center justify-center bg-background text-foreground">
        <NextError statusCode={500} title="문제를 처리하는 중 오류가 발생했습니다." />
      </body>
    </html>
  );
}
