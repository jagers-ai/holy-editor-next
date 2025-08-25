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
    category: '',
    subcategory: '',
    brand: '',
    quantity: '',
  });

  const utils = trpc.useUtils();
  const { data: ingredients, isLoading } = trpc.ingredients.list.useQuery();

  const createMutation = trpc.ingredients.create.useMutation({
    onSuccess: () => {
      toast.success('재료가 추가되었습니다');
      utils.ingredients.list.invalidate();
      setIsAdding(false);
      setFormData({ name: '', unit: '', pricePerUnit: '', category: '', subcategory: '', brand: '', quantity: '' });
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
      setFormData({ name: '', unit: '', pricePerUnit: '', category: '', subcategory: '', brand: '', quantity: '' });
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
    const data = {
      name: formData.name,
      unit: formData.unit,
      pricePerUnit: parseFloat(formData.pricePerUnit),
      category: formData.category || undefined,
      subcategory: formData.subcategory || undefined,
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
      category: ingredient.category || '',
      subcategory: ingredient.subcategory || '',
      brand: ingredient.brand || '',
      quantity: ingredient.quantity ? ingredient.quantity.toString() : '',
    });
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      deleteMutation.mutate(id);
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
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
                <Input
                  placeholder="대분류"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
                <Input
                  placeholder="소분류"
                  value={formData.subcategory}
                  onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                />
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
                  placeholder="수량"
                  type="number"
                  step="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                />
                <Input
                  placeholder="단위"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  required
                />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="단가"
                  value={formData.pricePerUnit}
                  onChange={(e) => setFormData({ ...formData, pricePerUnit: e.target.value })}
                  required
                />
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
                      setFormData({ name: '', unit: '', pricePerUnit: '', category: '', subcategory: '', brand: '', quantity: '' });
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
                <TableHead>대분류</TableHead>
                <TableHead>소분류</TableHead>
                <TableHead>재료</TableHead>
                <TableHead>브랜드</TableHead>
                <TableHead>수량</TableHead>
                <TableHead>단위</TableHead>
                <TableHead className="text-right">단가(원)</TableHead>
                <TableHead className="text-center">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ingredients?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-500">
                    등록된 재료가 없습니다
                  </TableCell>
                </TableRow>
              ) : (
                ingredients?.map((ingredient) => (
                  <TableRow key={ingredient.id}>
                    <TableCell>{ingredient.category || '-'}</TableCell>
                    <TableCell>{ingredient.subcategory || '-'}</TableCell>
                    <TableCell className="font-medium">{ingredient.name}</TableCell>
                    <TableCell>{ingredient.brand || '-'}</TableCell>
                    <TableCell>{ingredient.quantity || '-'}</TableCell>
                    <TableCell>{ingredient.unit}</TableCell>
                    <TableCell className="text-right">
                      {ingredient.pricePerUnit.toLocaleString()}원
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