import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { Decimal } from 'decimal.js';

export const calculatorRouter = router({
  // 원가 계산 - 핵심 기능!
  calculate: publicProcedure
    .input(z.object({
      recipeId: z.string(),
      quantity: z.number().int().positive("생산 수량은 1개 이상이어야 합니다"),
    }))
    .query(async ({ ctx, input }) => {
      // 레시피와 재료 정보 가져오기
      const recipe = await ctx.prisma.recipe.findUnique({
        where: { id: input.recipeId },
        include: {
          ingredients: {
            include: {
              ingredient: true,
            },
          },
        },
      });
      
      if (!recipe) {
        throw new Error('레시피를 찾을 수 없습니다');
      }
      
      // 필요한 배치 수 계산 (예: 100개 필요, 레시피는 10개씩 -> 10배치)
      const batchCount = Math.ceil(input.quantity / recipe.yieldCount);
      
      // 총 원가 계산
      let totalCost = new Decimal(0);
      const breakdown = recipe.ingredients.map((ri) => {
        // 재료별 필요 수량 계산
        const requiredQuantity = new Decimal(ri.quantity).mul(batchCount);
        
        // 재료별 비용 계산
        const itemCost = requiredQuantity.mul(ri.ingredient.pricePerUnit);
        totalCost = totalCost.add(itemCost);
        
        return {
          id: ri.ingredient.id,
          name: ri.ingredient.name,
          unit: ri.ingredient.unit,
          unitPrice: (ri.ingredient.pricePerUnit as any)?.toNumber?.() 
            ?? Number(ri.ingredient.pricePerUnit),
          quantity: requiredQuantity.toNumber(), // ⚡ number로 변환
          cost: itemCost.toNumber(), // ⚡ number로 변환
        };
      });
      
      // 개당 원가 계산
      const costPerUnit = totalCost.div(input.quantity);
      
      return {
        recipe: {
          id: recipe.id,
          name: recipe.name,
          yieldCount: recipe.yieldCount,
        },
        requestedQuantity: input.quantity,
        batchCount,
        totalCost: totalCost.toNumber(), // ⚡ number로 변환
        costPerUnit: costPerUnit.toNumber(), // ⚡ number로 변환
        breakdown,
      };
    }),

  // 다중 레시피 계산 (선택 기능)
  calculateMultiple: publicProcedure
    .input(z.array(z.object({
      recipeId: z.string(),
      quantity: z.number().int().positive(),
    })))
    .query(async ({ ctx, input }) => {
      const results = await Promise.all(
        input.map(async (item) => {
          const recipe = await ctx.prisma.recipe.findUnique({
            where: { id: item.recipeId },
            include: {
              ingredients: {
                include: {
                  ingredient: true,
                },
              },
            },
          });
          
          if (!recipe) {
            return null;
          }
          
          const batchCount = Math.ceil(item.quantity / recipe.yieldCount);
          let totalCost = new Decimal(0);
          
          recipe.ingredients.forEach((ri) => {
            const requiredQuantity = new Decimal(ri.quantity).mul(batchCount);
            const itemCost = requiredQuantity.mul(ri.ingredient.pricePerUnit);
            totalCost = totalCost.add(itemCost);
          });
          
          return {
            recipeId: recipe.id,
            recipeName: recipe.name,
            quantity: item.quantity,
            totalCost: totalCost.toNumber(),
            costPerUnit: totalCost.div(item.quantity).toNumber(),
          };
        })
      );
      
      const validResults = results.filter((r) => r !== null);
      const grandTotal = validResults.reduce((sum, r) => sum + r!.totalCost, 0);
      
      return {
        items: validResults,
        grandTotal,
      };
    }),
});