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
  const [baker, setBaker] = useState('');
  const [moldSize, setMoldSize] = useState('');
  const [ovenTemp, setOvenTemp] = useState('');
  const [ovenTime, setOvenTime] = useState('');
  const [fermentationInfo, setFermentationInfo] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  // 섹션 중심 구조로 변경
  interface Section {
    sectionName: string;
    ingredients: Array<{ ingredientId: string; quantity: string }>;
  }
  
  const [sections, setSections] = useState<Section[]>([
    { sectionName: '', ingredients: [] }
  ]);

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
      setBaker('');
      setMoldSize('');
      setOvenTemp('');
      setOvenTime('');
      setFermentationInfo('');
      setSellingPrice('');
      setSections([{ sectionName: '', ingredients: [] }]);
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
      setBaker('');
      setMoldSize('');
      setOvenTemp('');
      setOvenTime('');
      setFermentationInfo('');
      setSellingPrice('');
      setSections([{ sectionName: '', ingredients: [] }]);
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

  // 섹션 관리 함수들
  const handleAddSection = () => {
    setSections([...sections, { sectionName: '', ingredients: [] }]);
  };

  const handleRemoveSection = (sectionIndex: number) => {
    setSections(sections.filter((_, index) => index !== sectionIndex));
  };

  const handleSectionNameChange = (sectionIndex: number, name: string) => {
    const updated = [...sections];
    updated[sectionIndex].sectionName = name;
    setSections(updated);
  };

  const handleAddIngredientToSection = (sectionIndex: number) => {
    const updated = [...sections];
    updated[sectionIndex].ingredients.push({ ingredientId: '', quantity: '' });
    setSections(updated);
  };

  const handleRemoveIngredientFromSection = (sectionIndex: number, ingredientIndex: number) => {
    const updated = [...sections];
    updated[sectionIndex].ingredients = updated[sectionIndex].ingredients.filter((_, i) => i !== ingredientIndex);
    setSections(updated);
  };

  const handleIngredientChange = (sectionIndex: number, ingredientIndex: number, field: 'ingredientId' | 'quantity', value: string) => {
    const updated = [...sections];
    updated[sectionIndex].ingredients[ingredientIndex][field] = value;
    setSections(updated);
  };

  const handleEdit = (recipe: any) => {
    setEditingRecipe(recipe);
    setRecipeName(recipe.name);
    setYieldCount(recipe.yieldCount.toString());
    setBaker(recipe.baker || '');
    setMoldSize(recipe.moldSize || '');
    setOvenTemp(recipe.ovenTemp ? recipe.ovenTemp.toString() : '');
    setOvenTime(recipe.ovenTime ? recipe.ovenTime.toString() : '');
    setFermentationInfo(recipe.fermentationInfo || '');
    setSellingPrice(recipe.sellingPrice ? recipe.sellingPrice.toString() : '');
    // 기존 데이터를 섹션 구조로 변환
    const sectionsMap: { [key: string]: Array<{ ingredientId: string; quantity: string }> } = {};
    recipe.ingredients.forEach((ri: any) => {
      const sectionName = ri.sectionName || '기본 재료';
      if (!sectionsMap[sectionName]) {
        sectionsMap[sectionName] = [];
      }
      sectionsMap[sectionName].push({
        ingredientId: ri.ingredient.id,
        quantity: ri.quantity.toString(),
      });
    });
    
    const convertedSections = Object.entries(sectionsMap).map(([sectionName, ingredients]) => ({
      sectionName,
      ingredients,
    }));
    
    setSections(convertedSections.length > 0 ? convertedSections : [{ sectionName: '', ingredients: [] }]);
    setIsEditing(true);
    setIsCreating(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 섹션 구조를 flat 구조로 변환
    const validIngredients: Array<{ ingredientId: string; quantity: number; sectionName?: string }> = [];
    sections.forEach(section => {
      section.ingredients.forEach(ing => {
        if (ing.ingredientId && ing.quantity) {
          validIngredients.push({
            ingredientId: ing.ingredientId,
            quantity: parseFloat(ing.quantity),
            sectionName: section.sectionName || undefined,
          });
        }
      });
    });

    if (validIngredients.length === 0) {
      toast.error('최소 1개 이상의 재료가 필요합니다');
      return;
    }

    const recipeData = {
      name: recipeName,
      yieldCount: parseInt(yieldCount),
      baker: baker || undefined,
      moldSize: moldSize || undefined,
      ovenTemp: ovenTemp ? parseInt(ovenTemp) : undefined,
      ovenTime: ovenTime ? parseInt(ovenTime) : undefined,
      fermentationInfo: fermentationInfo || undefined,
      sellingPrice: sellingPrice ? parseFloat(sellingPrice) : undefined,
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
    setBaker('');
    setMoldSize('');
    setOvenTemp('');
    setOvenTime('');
    setFermentationInfo('');
    setSellingPrice('');
    setSections([{ sectionName: '', ingredients: [] }]);
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
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <label className="w-32 text-sm font-medium text-gray-700">제빵사</label>
                    <Input
                      placeholder="제빵사명을 입력하세요"
                      value={baker}
                      onChange={(e) => setBaker(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <label className="w-32 text-sm font-medium text-gray-700">레시피명</label>
                    <Input
                      placeholder="레시피명을 입력하세요"
                      value={recipeName}
                      onChange={(e) => setRecipeName(e.target.value)}
                      required
                      className="flex-1"
                    />
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <label className="w-32 text-sm font-medium text-gray-700">생산량</label>
                    <Input
                      type="number"
                      placeholder="생산량 (개)"
                      value={yieldCount}
                      onChange={(e) => setYieldCount(e.target.value)}
                      min="1"
                      required
                      className="flex-1"
                    />
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <label className="w-32 text-sm font-medium text-gray-700">틀사이즈</label>
                    <Input
                      placeholder="예: 22cm 원형틀, 12x8cm 직사각틀"
                      value={moldSize}
                      onChange={(e) => setMoldSize(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <label className="w-32 text-sm font-medium text-gray-700">오븐 온도</label>
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        type="number"
                        placeholder="180"
                        value={ovenTemp}
                        onChange={(e) => setOvenTemp(e.target.value)}
                        min="50"
                        max="300"
                        className="flex-1"
                      />
                      <span className="text-sm text-gray-600">°C</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <label className="w-32 text-sm font-medium text-gray-700">오븐 시간</label>
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        type="number"
                        placeholder="15"
                        value={ovenTime}
                        onChange={(e) => setOvenTime(e.target.value)}
                        min="1"
                        className="flex-1"
                      />
                      <span className="text-sm text-gray-600">분</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <label className="w-32 text-sm font-medium text-gray-700">발효/벤치/휴지</label>
                    <Input
                      placeholder="예: 1차 발효 60분, 벤치 30분, 2차 발효 40분"
                      value={fermentationInfo}
                      onChange={(e) => setFermentationInfo(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <label className="w-32 text-sm font-medium text-gray-700">판매가격</label>
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-sm text-gray-600">₩</span>
                      <Input
                        type="number"
                        placeholder="예: 10000"
                        value={sellingPrice}
                        onChange={(e) => setSellingPrice(e.target.value)}
                        min="0"
                        step="100"
                        className="flex-1"
                      />
                      <span className="text-sm text-gray-600">원</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">재료 섹션</label>
                  </div>

                  {sections.map((section, sectionIndex) => (
                    <Card key={`section-${sectionIndex}`} className="p-4">
                      <div className="flex justify-between items-center mb-3">
                        <Input
                          placeholder="섹션명 (예: 반죽, 소스, 토핑)"
                          value={section.sectionName}
                          onChange={(e) => handleSectionNameChange(sectionIndex, e.target.value)}
                          className="w-64 font-semibold"
                        />
                        {sections.length > 1 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRemoveSection(sectionIndex)}
                          >
                            섹션 삭제
                          </Button>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        {section.ingredients.map((item, ingredientIndex) => (
                          <div key={`ingredient-${sectionIndex}-${ingredientIndex}`} className="flex gap-2">
                            <Select
                              value={item.ingredientId}
                              onValueChange={(value) => handleIngredientChange(sectionIndex, ingredientIndex, 'ingredientId', value)}
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
                              onChange={(e) => handleIngredientChange(sectionIndex, ingredientIndex, 'quantity', e.target.value)}
                              className="w-32"
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRemoveIngredientFromSection(sectionIndex, ingredientIndex)}
                            >
                              삭제
                            </Button>
                          </div>
                        ))}
                        
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddIngredientToSection(sectionIndex)}
                          className="w-full"
                        >
                          + 이 섹션에 재료 추가
                        </Button>
                      </div>
                    </Card>
                  ))}
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddSection}
                    className="w-full"
                  >
                    + 새 섹션 추가
                  </Button>
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
                <div className="space-y-2 mb-4">
                  {recipe.baker && (
                    <p className="text-sm text-gray-600">제빵사: {recipe.baker}</p>
                  )}
                  <p className="text-sm text-gray-600">생산량: {recipe.yieldCount}개</p>
                  {recipe.moldSize && (
                    <p className="text-sm text-gray-600">틀사이즈: {recipe.moldSize}</p>
                  )}
                  {(recipe.ovenTemp || recipe.ovenTime) && (
                    <p className="text-sm text-gray-600">
                      오븐: {recipe.ovenTemp && `${recipe.ovenTemp}°C`}{recipe.ovenTemp && recipe.ovenTime && ', '}{recipe.ovenTime && `${recipe.ovenTime}분`}
                    </p>
                  )}
                  {recipe.fermentationInfo && (
                    <p className="text-sm text-gray-600">발효: {recipe.fermentationInfo}</p>
                  )}
                </div>
                {/* 섹션별 재료 그룹화 표시 */}
                <div className="space-y-3 mb-4">
                  {(() => {
                    // 섹션별로 재료 그룹화
                    const sections = recipe.ingredients.reduce((acc: any, ri: any) => {
                      const section = ri.sectionName || '기본 재료';
                      if (!acc[section]) acc[section] = [];
                      acc[section].push(ri);
                      return acc;
                    }, {});
                    
                    return Object.entries(sections).map(([sectionName, items]: [string, any]) => (
                      <div key={sectionName} className="border rounded p-3 bg-gray-50">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-sm font-semibold">
                            📦 {sectionName}
                          </h4>
                          {(recipe as any).costInfo?.sectionCosts && (
                            <span className="text-sm text-green-600 font-bold">
                              ₩{Math.round((recipe as any).costInfo.sectionCosts[sectionName] || 0).toLocaleString()}
                            </span>
                          )}
                        </div>
                        {(items as any[]).map((ri) => {
                          // costInfo.breakdown에서 해당 재료의 원가 찾기 (재료명과 수량 모두 비교)
                          const ingredientCost = (recipe as any).costInfo?.breakdown?.find(
                            (item: any) => 
                              item.name === ri.ingredient.name && 
                              parseFloat(item.quantity) === parseFloat(ri.quantity)
                          )?.cost || 0;
                          
                          return (
                            <div key={ri.id || `${recipe.id}-${ri.ingredient.id}`} className="flex justify-between items-center text-sm text-gray-600 py-1">
                              <span>• {ri.ingredient.name}: {ri.quantity}{ri.ingredient.unit}</span>
                              {ingredientCost > 0 && (
                                <span className="text-green-600 font-medium">₩{Math.round(ingredientCost).toLocaleString()}</span>
                              )}
                            </div>
                          );
                        })}
                        
                        {/* 섹션별 총 무게 및 개당 무게 표시 */}
                        {(() => {
                          const totalWeight = (items as any[]).reduce((sum, ri) => {
                            return sum + parseFloat(ri.quantity || 0);
                          }, 0);
                          const weightPerUnit = totalWeight / (recipe.yieldCount || 1);
                          
                          return (
                            <div className="mt-3 pt-2 border-t border-gray-200 text-xs text-gray-600">
                              <div className="flex justify-between">
                                <span>총 무게:</span>
                                <span className="font-medium">{totalWeight.toFixed(1)}g</span>
                              </div>
                              <div className="flex justify-between mt-1">
                                <span>개당 무게:</span>
                                <span className="font-medium">{weightPerUnit.toFixed(1)}g ({recipe.yieldCount}개 생산)</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    ));
                  })()}
                </div>
                
                {/* 판매가격 및 마진율 섹션 */}
                {(recipe as any).sellingPrice && (
                  <div className="border-t pt-3 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">판매가격</span>
                      <span className="text-xl font-bold text-blue-600">
                        ₩{Math.round((recipe as any).sellingPrice).toLocaleString()}
                        <span className="text-xs text-gray-500 ml-1">개당</span>
                      </span>
                    </div>
                    {(recipe as any).costInfo && (recipe as any).costInfo.margin !== null && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">마진율</span>
                        <span className={`text-lg font-bold ${
                          (recipe as any).costInfo.margin >= 30 ? 'text-green-600' : 
                          (recipe as any).costInfo.margin >= 20 ? 'text-orange-500' : 
                          'text-red-500'
                        }`}>
                          {Math.round((recipe as any).costInfo.margin)}%
                        </span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* 원가 정보 섹션 */}
                {(recipe as any).costInfo && (
                  <div className="border-t pt-3 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">원가 정보</span>
                      <span className="text-lg font-bold text-green-600">
                        ₩{Math.round((recipe as any).costInfo.costPerUnit).toLocaleString()}
                        <span className="text-xs text-gray-500 ml-1">개당</span>
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mb-2">
                      총 재료비: ₩{Math.round((recipe as any).costInfo.totalCost).toLocaleString()}
                      <span className="text-gray-400"> ({recipe.yieldCount}개 기준)</span>
                    </div>
                  </div>
                )}
                
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