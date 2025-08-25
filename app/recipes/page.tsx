'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

export default function RecipesPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<any>(null);
  const [recipeName, setRecipeName] = useState('');
  const [yieldCount, setYieldCount] = useState('1');
  const [selectedIngredients, setSelectedIngredients] = useState<
    Array<{ ingredientId: string; quantity: string }>
  >([]);

  const utils = trpc.useUtils();
  const { data: recipes, isLoading: recipesLoading } = trpc.recipes.list.useQuery();
  const { data: ingredients } = trpc.ingredients.list.useQuery();

  const createMutation = trpc.recipes.create.useMutation({
    onSuccess: () => {
      toast.success('레시피가 생성되었습니다');
      utils.recipes.list.invalidate();
      setIsCreating(false);
      setRecipeName('');
      setYieldCount('1');
      setSelectedIngredients([]);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.recipes.update.useMutation({
    onSuccess: () => {
      toast.success('레시피가 수정되었습니다');
      utils.recipes.list.invalidate();
      setIsEditing(false);
      setEditingRecipe(null);
      setRecipeName('');
      setYieldCount('1');
      setSelectedIngredients([]);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.recipes.delete.useMutation({
    onSuccess: () => {
      toast.success('레시피가 삭제되었습니다');
      utils.recipes.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleAddIngredient = () => {
    setSelectedIngredients([...selectedIngredients, { ingredientId: '', quantity: '' }]);
  };

  const handleRemoveIngredient = (index: number) => {
    setSelectedIngredients(selectedIngredients.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (index: number, field: 'ingredientId' | 'quantity', value: string) => {
    const updated = [...selectedIngredients];
    updated[index][field] = value;
    setSelectedIngredients(updated);
  };

  const handleEdit = (recipe: any) => {
    setEditingRecipe(recipe);
    setRecipeName(recipe.name);
    setYieldCount(recipe.yieldCount.toString());
    setSelectedIngredients(
      recipe.ingredients.map((ri: any) => ({
        ingredientId: ri.ingredient.id,
        quantity: ri.quantity.toString(),
      }))
    );
    setIsEditing(true);
    setIsCreating(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validIngredients = selectedIngredients
      .filter(ing => ing.ingredientId && ing.quantity)
      .map(ing => ({
        ingredientId: ing.ingredientId,
        quantity: parseFloat(ing.quantity),
      }));

    if (validIngredients.length === 0) {
      toast.error('최소 1개 이상의 재료가 필요합니다');
      return;
    }

    const recipeData = {
      name: recipeName,
      yieldCount: parseInt(yieldCount),
      ingredients: validIngredients,
    };

    if (isEditing && editingRecipe) {
      updateMutation.mutate({
        id: editingRecipe.id,
        ...recipeData,
      });
    } else {
      createMutation.mutate(recipeData);
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setIsEditing(false);
    setEditingRecipe(null);
    setRecipeName('');
    setYieldCount('1');
    setSelectedIngredients([]);
  };

  const handleDelete = (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      deleteMutation.mutate(id);
    }
  };

  if (recipesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Toaster />
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>📝 레시피 관리</span>
            {!isCreating && !isEditing && (
              <Button onClick={() => setIsCreating(true)}>
                레시피 생성
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(isCreating || isEditing) && (
            <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="레시피명"
                    value={recipeName}
                    onChange={(e) => setRecipeName(e.target.value)}
                    required
                  />
                  <Input
                    type="number"
                    placeholder="생산량 (개)"
                    value={yieldCount}
                    onChange={(e) => setYieldCount(e.target.value)}
                    min="1"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">재료 목록</label>
                    <Button type="button" size="sm" onClick={handleAddIngredient}>
                      재료 추가
                    </Button>
                  </div>

                  {selectedIngredients.map((item, index) => (
                    <div key={`ingredient-${index}-${item.ingredientId || Date.now()}-${Math.random()}`} className="flex gap-2">
                      <Select
                        value={item.ingredientId}
                        onValueChange={(value) => handleIngredientChange(index, 'ingredientId', value)}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="재료 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {ingredients?.map((ing) => (
                            <SelectItem key={ing.id} value={ing.id}>
                              {ing.name} ({ing.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        step="1"
                        placeholder="수량"
                        value={item.quantity}
                        onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                        className="w-32"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemoveIngredient(index)}
                      >
                        삭제
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button type="submit">
                    {isEditing ? '레시피 수정' : '레시피 생성'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                  >
                    취소
                  </Button>
                </div>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recipes?.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-8 text-center text-gray-500">
              등록된 레시피가 없습니다
            </CardContent>
          </Card>
        ) : (
          recipes?.map((recipe) => (
            <Card key={recipe.id}>
              <CardHeader>
                <CardTitle className="text-lg">
                  <span>{recipe.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-2">
                  생산량: {recipe.yieldCount}개
                </p>
                <div className="space-y-1 mb-4">
                  <p className="text-sm font-medium">재료:</p>
                  {recipe.ingredients.map((ri) => (
                    <p key={ri.id} className="text-sm text-gray-600">
                      • {ri.ingredient.name}: {ri.quantity}{ri.ingredient.unit}
                    </p>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(recipe)}
                  >
                    수정
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(recipe.id)}
                  >
                    삭제
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}