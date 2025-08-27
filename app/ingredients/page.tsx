'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

export default function IngredientsPage() {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    unit: '',
    pricePerUnit: '',
    brand: '',
    quantity: '',
  });
  
  // 구매가격 state (단가 자동 계산용)
  const [purchasePrice, setPurchasePrice] = useState('');

  const utils = trpc.useUtils();
  const { data: ingredients, isLoading } = trpc.ingredients.list.useQuery();

  const createMutation = trpc.ingredients.create.useMutation({
    onSuccess: () => {
      toast.success('재료가 추가되었습니다');
      utils.ingredients.list.invalidate();
      setIsAdding(false);
      setFormData({ name: '', unit: '', pricePerUnit: '', brand: '', quantity: '' });
      setPurchasePrice('');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.ingredients.update.useMutation({
    onSuccess: () => {
      toast.success('재료가 수정되었습니다');
      utils.ingredients.list.invalidate();
      setEditingId(null);
      setFormData({ name: '', unit: '', pricePerUnit: '', brand: '', quantity: '' });
      setPurchasePrice('');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.ingredients.delete.useMutation({
    onSuccess: () => {
      toast.success('재료가 삭제되었습니다');
      utils.ingredients.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 단가 계산 (구매가격 ÷ 무게)
    const calculatedPricePerUnit = purchasePrice && formData.quantity 
      ? parseFloat(purchasePrice) / parseFloat(formData.quantity)
      : parseFloat(formData.pricePerUnit);
    
    const data = {
      name: formData.name,
      unit: formData.unit,
      pricePerUnit: calculatedPricePerUnit,
      brand: formData.brand || undefined,
      quantity: formData.quantity ? parseFloat(formData.quantity) : undefined,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (ingredient: any) => {
    setEditingId(ingredient.id);
    setFormData({
      name: ingredient.name,
      unit: ingredient.unit,
      pricePerUnit: ingredient.pricePerUnit.toString(),
      brand: ingredient.brand || '',
      quantity: ingredient.quantity ? ingredient.quantity.toString() : '',
    });
    // 구매가격 역산 (단가 × 무게)
    if (ingredient.quantity && ingredient.pricePerUnit) {
      setPurchasePrice((ingredient.quantity * ingredient.pricePerUnit).toString());
    } else {
      setPurchasePrice('');
    }
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      deleteMutation.mutate(id);
    }
  };
  
  // 구매가격 변경 시 단가 자동 계산
  const handlePurchasePriceChange = (value: string) => {
    setPurchasePrice(value);
    if (value && formData.quantity) {
      const calculatedPrice = parseFloat(value) / parseFloat(formData.quantity);
      setFormData({ ...formData, pricePerUnit: calculatedPrice.toFixed(2) });
    }
  };
  
  // 무게 변경 시 단가 자동 계산
  const handleQuantityChange = (value: string) => {
    setFormData({ ...formData, quantity: value });
    if (purchasePrice && value) {
      const calculatedPrice = parseFloat(purchasePrice) / parseFloat(value);
      setFormData({ ...formData, quantity: value, pricePerUnit: calculatedPrice.toFixed(2) });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Toaster />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>📦 재료 관리</span>
            {!isAdding && (
              <Button onClick={() => setIsAdding(true)}>
                재료 추가
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isAdding && (
            <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                <Input
                  placeholder="재료명"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <Input
                  placeholder="브랜드"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                />
                <Input
                  placeholder="단위"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  required
                />
                <Input
                  placeholder="무게"
                  type="number"
                  step="1"
                  value={formData.quantity}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                />
                <Input
                  placeholder="구매가격"
                  type="number"
                  step="1"
                  value={purchasePrice}
                  onChange={(e) => handlePurchasePriceChange(e.target.value)}
                />
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 mb-1">
                    단가 (자동계산)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="자동 계산됨"
                    value={formData.pricePerUnit}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">
                    {editingId ? '수정' : '추가'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAdding(false);
                      setEditingId(null);
                      setFormData({ name: '', unit: '', pricePerUnit: '', brand: '', quantity: '' });
      setPurchasePrice('');
                    }}
                  >
                    취소
                  </Button>
                </div>
              </div>
            </form>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>재료</TableHead>
                <TableHead>브랜드</TableHead>
                <TableHead>무게</TableHead>
                <TableHead>단위</TableHead>
                <TableHead className="text-right">단가(원)</TableHead>
                <TableHead className="text-center">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ingredients?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500">
                    등록된 재료가 없습니다
                  </TableCell>
                </TableRow>
              ) : (
                ingredients?.map((ingredient) => (
                  <TableRow key={ingredient.id}>
                    <TableCell className="font-medium">{ingredient.name}</TableCell>
                    <TableCell>{ingredient.brand || '-'}</TableCell>
                    <TableCell>{ingredient.quantity || '-'}</TableCell>
                    <TableCell>{ingredient.unit}</TableCell>
                    <TableCell className="text-right">
                      <div>
                        <div className="font-medium">
                          ₩{ingredient.pricePerUnit.toLocaleString()}/{ingredient.unit}
                        </div>
                        {ingredient.quantity && (
                          <div className="text-xs text-gray-500">
                            구매가: ₩{(ingredient.pricePerUnit * Number(ingredient.quantity)).toLocaleString()} ({ingredient.quantity}{ingredient.unit})
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(ingredient)}
                        >
                          수정
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(ingredient.id)}
                        >
                          삭제
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}