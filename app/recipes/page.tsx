'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { Textarea } from '@/components/ui/textarea';

export default function RecipesPage() {
  const [editingRecipe, setEditingRecipe] = useState<any>(null);
  // 기존 개별 state들 제거 - editingRecipe만 사용
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
      setEditingRecipe(null);
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
      setEditingRecipe(null);
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

  const handleCreateNewCard = () => {
    // 임시 ID로 빈 레시피 객체 생성
    const newRecipe = {
      id: `new-${Date.now()}`, // 임시 ID
      name: '',
      yieldCount: '', // 빈 문자열로 변경 (플레이스홀더만 표시)
      baker: '',
      moldSize: '',
      ovenTemp: null,
      ovenTime: null,
      fermentationInfo: '',
      sellingPrice: null,
      memo: '',
      ingredients: []
    };
    
    // 편집 모드로 설정
    setEditingRecipe(newRecipe);
    setSections([{ sectionName: '', ingredients: [] }]);
  };

  const handleEdit = (recipe: any) => {
    setEditingRecipe(recipe);
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
  };

  const handleSaveCard = (recipeId: string) => {
    if (!editingRecipe) return;
    
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
      name: editingRecipe.name,
      yieldCount: parseInt(editingRecipe.yieldCount) || 1, // 빈 값일 때 기본값 1
      baker: editingRecipe.baker || undefined,
      moldSize: editingRecipe.moldSize || undefined,
      ovenTemp: editingRecipe.ovenTemp || undefined,
      ovenTime: editingRecipe.ovenTime || undefined,
      fermentationInfo: editingRecipe.fermentationInfo || undefined,
      sellingPrice: editingRecipe.sellingPrice || undefined,
      memo: editingRecipe.memo && editingRecipe.memo.trim() ? editingRecipe.memo.trim() : undefined,
      ingredients: validIngredients,
    };

    if (recipeId.startsWith('new-')) {
      // 새 레시피 생성
      createMutation.mutate(recipeData);
    } else {
      // 기존 레시피 업데이트
      updateMutation.mutate({
        id: recipeId,
        ...recipeData,
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingRecipe(null);
    setSections([{ sectionName: '', ingredients: [] }]);
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

    if (editingRecipe && !editingRecipe.id.startsWith('new-')) {
      updateMutation.mutate({
        id: editingRecipe.id,
        ...recipeData,
      });
    } else {
      createMutation.mutate(recipeData);
    }
  };

  const handleCancel = () => {
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
      
      <Card className="mb-8 shadow-md bg-gradient-to-r from-orange-50 to-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="text-2xl font-bold">📝 레시피 관리</span>
            <Button 
              onClick={handleCreateNewCard}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              <span className="text-lg">➕</span> 새 레시피
            </Button>
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 새 레시피 카드 (생성 중) */}
        {editingRecipe?.id?.startsWith('new-') && (
          <Card className="border-2 border-blue-400 bg-blue-50/50 shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle>
                <Input
                  value={editingRecipe?.name || ''}
                  onChange={(e) => setEditingRecipe({...editingRecipe, name: e.target.value})}
                  placeholder="레시피명 입력"
                  className="text-lg font-bold"
                  autoFocus
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* 기본 정보 */}
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="제빵사"
                    value={editingRecipe?.baker || ''}
                    onChange={(e) => setEditingRecipe({...editingRecipe, baker: e.target.value})}
                  />
                  <Input
                    type="number"
                    placeholder="생산량"
                    value={editingRecipe?.yieldCount || ''}
                    onChange={(e) => setEditingRecipe({...editingRecipe, yieldCount: e.target.value})}
                    required
                  />
                  <Input
                    placeholder="틀사이즈"
                    value={editingRecipe?.moldSize || ''}
                    onChange={(e) => setEditingRecipe({...editingRecipe, moldSize: e.target.value})}
                  />
                  <Input
                    type="number"
                    placeholder="오븐 온도(°C)"
                    value={editingRecipe?.ovenTemp || ''}
                    onChange={(e) => setEditingRecipe({...editingRecipe, ovenTemp: e.target.value ? parseInt(e.target.value) : null})}
                  />
                  <Input
                    type="number"
                    placeholder="오븐 시간(분)"
                    value={editingRecipe?.ovenTime || ''}
                    onChange={(e) => setEditingRecipe({...editingRecipe, ovenTime: e.target.value ? parseInt(e.target.value) : null})}
                  />
                  <Input
                    type="number"
                    step="1000"
                    placeholder="판매가격(₩)"
                    value={editingRecipe?.sellingPrice || ''}
                    onChange={(e) => setEditingRecipe({...editingRecipe, sellingPrice: e.target.value ? parseFloat(e.target.value) : null})}
                  />
                </div>
                
                {/* 섹션별 재료 */}
                {sections.map((section, sectionIndex) => (
                  <Card key={`section-${sectionIndex}`} className="p-3">
                    <div className="flex justify-between items-center mb-2">
                      <Input
                        placeholder="섹션명 (예: 반죽, 소스, 토핑)"
                        value={section.sectionName}
                        onChange={(e) => handleSectionNameChange(sectionIndex, e.target.value)}
                        className="w-48 font-semibold"
                      />
                      {sections.length > 1 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveSection(sectionIndex)}
                        >
                          ❌
                        </Button>
                      )}
                    </div>
                    
                    {section.ingredients.map((item, ingredientIndex) => (
                      <div key={`ing-${ingredientIndex}`} className="flex gap-1 mb-1">
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
                          step="0.1"
                          placeholder="수량"
                          value={item.quantity}
                          onChange={(e) => handleIngredientChange(sectionIndex, ingredientIndex, 'quantity', e.target.value)}
                          className="w-24"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveIngredientFromSection(sectionIndex, ingredientIndex)}
                        >
                          ❌
                        </Button>
                      </div>
                    ))}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddIngredientToSection(sectionIndex)}
                      className="w-full mt-2"
                    >
                      + 재료 추가
                    </Button>
                  </Card>
                ))}
                
                <Button
                  variant="outline"
                  onClick={handleAddSection}
                  className="w-full"
                >
                  + 섹션 추가
                </Button>
                
                {/* 메모 입력 필드 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">📝 메모</label>
                  <Textarea
                    placeholder="레시피에 대한 메모를 입력하세요 (최대 300자)"
                    value={editingRecipe?.memo || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.length <= 300) {
                        setEditingRecipe({...editingRecipe, memo: value});
                      }
                    }}
                    className="min-h-[100px]"
                  />
                  <div className="text-xs text-gray-500 text-right">
                    {editingRecipe?.memo?.length || 0} / 300
                  </div>
                </div>
                
                {/* 저장/취소 버튼 */}
                <div className="flex gap-2 pt-3 border-t">
                  <Button 
                    onClick={() => handleSaveCard(editingRecipe.id)} 
                    className="flex-1"
                  >
                    💾 저장
                  </Button>
                  <Button 
                    onClick={handleCancelEdit} 
                    variant="outline" 
                    className="flex-1"
                  >
                    ❌ 취소
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 기존 레시피 카드들 */}
        {recipes?.length === 0 && !editingRecipe?.id?.startsWith('new-') ? (
          <Card className="col-span-full">
            <CardContent className="py-8 text-center text-gray-500">
              등록된 레시피가 없습니다
            </CardContent>
          </Card>
        ) : (
          recipes?.map((recipe) => (
            <Card 
              key={recipe.id}
              className={`transition-all duration-300 ${
                editingRecipe?.id === recipe.id 
                  ? 'border-2 border-orange-400 bg-orange-50/50 shadow-xl scale-[1.02]' 
                  : 'hover:shadow-md hover:scale-[1.01]'
              }`}
            >
              <CardHeader>
                <CardTitle className="text-lg flex justify-between items-center">
                  <span>{recipe.name}</span>
                  {editingRecipe?.id !== recipe.id && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(recipe)}
                      className="hover:bg-orange-100 transition-colors"
                    >
                      ✏️ 편집
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {editingRecipe?.id === recipe.id ? (
                  // ===== 편집 모드 =====
                  <div className="space-y-4">
                    <Input
                      placeholder="레시피 이름"
                      value={editingRecipe.name}
                      onChange={(e) => setEditingRecipe({...editingRecipe, name: e.target.value})}
                      className="font-semibold text-lg"
                    />
                    
                    {/* 기본 정보 그리드 */}
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="제빵사"
                        value={editingRecipe.baker || ''}
                        onChange={(e) => setEditingRecipe({...editingRecipe, baker: e.target.value})}
                      />
                      <Input
                        type="number"
                        placeholder="생산량"
                        value={editingRecipe.yieldCount}
                        onChange={(e) => setEditingRecipe({...editingRecipe, yieldCount: parseInt(e.target.value) || 1})}
                      />
                      <Input
                        placeholder="틀사이즈"
                        value={editingRecipe.moldSize || ''}
                        onChange={(e) => setEditingRecipe({...editingRecipe, moldSize: e.target.value})}
                      />
                      <Input
                        type="number"
                        placeholder="오븐온도(°C)"
                        value={editingRecipe.ovenTemp || ''}
                        onChange={(e) => setEditingRecipe({...editingRecipe, ovenTemp: e.target.value ? parseInt(e.target.value) : null})}
                      />
                      <Input
                        type="number"
                        placeholder="오븐시간(분)"
                        value={editingRecipe.ovenTime || ''}
                        onChange={(e) => setEditingRecipe({...editingRecipe, ovenTime: e.target.value ? parseInt(e.target.value) : null})}
                      />
                      <Input
                        type="number"
                        step="1000"
                        placeholder="판매가격(₩)"
                        value={editingRecipe.sellingPrice || ''}
                        onChange={(e) => setEditingRecipe({...editingRecipe, sellingPrice: e.target.value ? parseFloat(e.target.value) : null})}
                      />
                    </div>
                    
                    {/* 섹션별 재료 관리 */}
                    {sections.map((section, sectionIndex) => (
                      <Card key={sectionIndex} className="p-3 bg-gray-50">
                        <div className="flex justify-between items-center mb-2">
                          <Input
                            placeholder="섹션 이름 (예: 반죽, 필링, 토핑)"
                            value={section.name}
                            onChange={(e) => handleSectionNameChange(sectionIndex, e.target.value)}
                            className="font-medium flex-1 mr-2"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveSection(sectionIndex)}
                          >
                            ❌
                          </Button>
                        </div>
                        
                        {section.ingredients.map((item, ingredientIndex) => (
                          <div key={ingredientIndex} className="flex gap-2 mb-2">
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
                              step="0.1"
                              placeholder="수량"
                              value={item.quantity}
                              onChange={(e) => handleIngredientChange(sectionIndex, ingredientIndex, 'quantity', e.target.value)}
                              className="w-24"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveIngredientFromSection(sectionIndex, ingredientIndex)}
                            >
                              ❌
                            </Button>
                          </div>
                        ))}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddIngredientToSection(sectionIndex)}
                          className="w-full mt-2"
                        >
                          + 재료 추가
                        </Button>
                      </Card>
                    ))}
                    
                    <Button
                      variant="outline"
                      onClick={handleAddSection}
                      className="w-full"
                    >
                      + 섹션 추가
                    </Button>
                    
                    {/* 메모 입력 필드 */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">📝 메모</label>
                      <Textarea
                        placeholder="레시피에 대한 메모를 입력하세요 (최대 300자)"
                        value={editingRecipe?.memo || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value.length <= 300) {
                            setEditingRecipe({...editingRecipe, memo: value});
                          }
                        }}
                        className="min-h-[100px]"
                      />
                      <div className="text-xs text-gray-500 text-right">
                        {editingRecipe?.memo?.length || 0} / 300
                      </div>
                    </div>
                    
                    {/* 저장/취소 버튼 */}
                    <div className="flex gap-2 pt-3 border-t">
                      <Button 
                        onClick={() => handleSaveCard(recipe.id)} 
                        className="flex-1"
                      >
                        💾 저장
                      </Button>
                      <Button 
                        onClick={handleCancelEdit} 
                        variant="outline" 
                        className="flex-1"
                      >
                        ❌ 취소
                      </Button>
                    </div>
                  </div>
                ) : (
                  // ===== 읽기 모드 (현재 코드 유지) =====
                  <>
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
                    
                    {/* 메모 표시 영역 */}
                    {(recipe as any).memo && (
                      <div className="border-t pt-3 mb-4">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <span className="text-sm">📝</span>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-700 mb-1">메모</p>
                              <p className="text-sm text-gray-600 whitespace-pre-wrap">{(recipe as any).memo}</p>
                            </div>
                          </div>
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
                  </>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}