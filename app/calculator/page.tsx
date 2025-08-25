'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

export default function CalculatorPage() {
  const [selectedRecipe, setSelectedRecipe] = useState('');
  const [quantity, setQuantity] = useState('1');

  const { data: recipes } = trpc.recipes.list.useQuery();

  const { data: result, refetch, isFetching, error } = trpc.calculator.calculate.useQuery(
    {
      recipeId: selectedRecipe,
      quantity: parseInt(quantity),
    },
    {
      enabled: false,
    }
  );

  const handleCalculate = async () => {
    if (!selectedRecipe || !quantity) {
      toast.error('레시피와 수량을 입력해주세요');
      return;
    }

    const { data, error } = await refetch();
    if (data) {
      toast.success('계산이 완료되었습니다');
    } else if (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Toaster />
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>💰 원가 계산기</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Select value={selectedRecipe} onValueChange={setSelectedRecipe}>
              <SelectTrigger>
                <SelectValue placeholder="레시피 선택" />
              </SelectTrigger>
              <SelectContent>
                {recipes?.map((recipe) => (
                  <SelectItem key={recipe.id} value={recipe.id}>
                    {recipe.name} ({recipe.yieldCount}개)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="number"
              placeholder="생산 수량"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
            />

            <Button 
              onClick={handleCalculate}
              disabled={isFetching}
            >
              {isFetching ? '계산 중...' : '계산하기'}
            </Button>
          </div>

          {result && (
            <div className="space-y-6">
              {/* 요약 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">
                      ₩{result.totalCost.toLocaleString()}
                    </div>
                    <p className="text-sm text-gray-500">총 원가</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">
                      ₩{result.costPerUnit.toLocaleString()}
                    </div>
                    <p className="text-sm text-gray-500">개당 원가</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">
                      {result.batchCount}배치
                    </div>
                    <p className="text-sm text-gray-500">
                      (레시피 {result.recipe.yieldCount}개 × {result.batchCount}회)
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* 재료별 상세 내역 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">재료별 상세 내역</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>재료명</TableHead>
                        <TableHead className="text-right">단가</TableHead>
                        <TableHead className="text-right">필요 수량</TableHead>
                        <TableHead className="text-right">금액</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.breakdown.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="text-right">
                            ₩{item.unitPrice.toLocaleString()}/{item.unit}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.quantity.toLocaleString()}{item.unit}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ₩{item.cost.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={3} className="font-bold">
                          합계
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          ₩{result.totalCost.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}