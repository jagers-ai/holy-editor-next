'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">🍞 BREAD</h1>
        <p className="text-xl text-gray-600 mb-2">베이커리 원가 계산 서비스</p>
        <p className="text-gray-500">재료비부터 생산비까지, 정확한 원가 관리의 시작</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📦 재료 관리
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">재료별 단가 정보를 관리하고 업데이트하세요.</p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/ingredients">재료 관리하기</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📝💰 레시피 & 원가
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">레시피를 만들고 실시간으로 원가를 확인하세요.</p>
            <Button asChild className="w-full">
              <Link href="/recipes">레시피 관리하기</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
