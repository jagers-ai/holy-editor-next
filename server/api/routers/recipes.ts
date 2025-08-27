import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { Decimal } from 'decimal.js';

export const recipesRouter = router({
  // 모든 레시피 조회 (재료 포함 + 원가 계산)
  list: publicProcedure.query(async ({ ctx }) => {
    const recipes = await ctx.prisma.recipe.findMany({
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
    
    // ⚡ Decimal을 number로 변환하고 원가 계산 추가
    return recipes.map((recipe) => {
      // 1개 생산 기준 원가 계산
      let totalCost = new Decimal(0);
      const breakdown = recipe.ingredients.map((ri) => {
        // 1개 생산을 위한 재료 수량 (이미 레시피에 정의된 수량)
        const requiredQuantity = new Decimal(ri.quantity);
        
        // 재료별 비용 계산
        const itemCost = requiredQuantity.mul(ri.ingredient.pricePerUnit);
        totalCost = totalCost.add(itemCost);
        
        return {
          id: ri.ingredient.id,
          name: ri.ingredient.name,
          unit: ri.ingredient.unit,
          unitPrice: (ri.ingredient.pricePerUnit as any)?.toNumber?.() 
            ?? Number(ri.ingredient.pricePerUnit),
          quantity: requiredQuantity.toNumber(),
          cost: itemCost.toNumber(),
          sectionName: ri.sectionName || null, // 섹션명 추가
        };
      });
      
      // 섹션별 원가 계산
      const sectionCosts: Record<string, number> = {};
      breakdown.forEach((item) => {
        const section = item.sectionName || '기본 재료';
        sectionCosts[section] = (sectionCosts[section] || 0) + item.cost;
      });
      
      return {
        ...recipe,
        ingredients: recipe.ingredients.map((ri) => ({
          ...ri,
          quantity: (ri.quantity as any)?.toNumber?.() 
            ?? Number(ri.quantity),
          sectionName: ri.sectionName || null, // 섹션명 추가
          ingredient: {
            ...ri.ingredient,
            pricePerUnit: (ri.ingredient.pricePerUnit as any)?.toNumber?.() 
              ?? Number(ri.ingredient.pricePerUnit),
          },
        })),
        // 원가 정보 추가
        costInfo: {
          totalCost: totalCost.toNumber(),
          costPerUnit: totalCost.div(recipe.yieldCount).toNumber(), // 개당 원가
          breakdown,
          sectionCosts, // 섹션별 원가 추가
          // 마진율 계산 (판매가격이 있을 때만)
          margin: recipe.sellingPrice ? 
            ((Number(recipe.sellingPrice) - totalCost.div(recipe.yieldCount).toNumber()) / Number(recipe.sellingPrice) * 100) : null,
        },
        sellingPrice: recipe.sellingPrice ? (recipe.sellingPrice as any)?.toNumber?.() ?? Number(recipe.sellingPrice) : null,
      };
    });
  }),

  // ID로 레시피 조회
  getById: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const recipe = await ctx.prisma.recipe.findUnique({
        where: { id: input },
        include: {
          ingredients: {
            include: {
              ingredient: true,
            },
          },
        },
      });
      
      if (!recipe) return null;
      
      return {
        ...recipe,
        ingredients: recipe.ingredients.map((ri) => ({
          ...ri,
          quantity: (ri.quantity as any)?.toNumber?.() 
            ?? Number(ri.quantity),
          sectionName: ri.sectionName || null, // 섹션명 추가
          ingredient: {
            ...ri.ingredient,
            pricePerUnit: (ri.ingredient.pricePerUnit as any)?.toNumber?.() 
              ?? Number(ri.ingredient.pricePerUnit),
          },
        })),
      };
    }),

  // 레시피 생성
  create: publicProcedure
    .input(z.object({
      name: z.string().min(1, "레시피명은 필수입니다"),
      yieldCount: z.number().int().positive("생산량은 1개 이상이어야 합니다"),
      // 베이킹 정보 (optional)
      baker: z.string().optional(),
      moldSize: z.string().optional(),
      ovenTemp: z.number().int().positive().optional(),
      ovenTime: z.number().int().positive().optional(),
      fermentationInfo: z.string().optional(),
      sellingPrice: z.number().positive().optional(),
      ingredients: z.array(z.object({
        ingredientId: z.string(),
        quantity: z.number().positive("수량은 0보다 커야 합니다"),
        sectionName: z.string().optional(), // 섹션명 추가
      })).min(1, "최소 1개 이상의 재료가 필요합니다"),
    }))
    .mutation(async ({ ctx, input }) => {
      const { ingredients, sellingPrice, ...recipeData } = input;
      const recipe = await ctx.prisma.recipe.create({
        data: {
          ...recipeData,
          sellingPrice: sellingPrice ? new Decimal(sellingPrice) : null,
          ingredients: {
            create: ingredients.map((ing) => ({
              ingredientId: ing.ingredientId,
              quantity: new Decimal(ing.quantity),
              sectionName: ing.sectionName || null, // 섹션명 저장
            })),
          },
        },
        include: {
          ingredients: {
            include: {
              ingredient: true,
            },
          },
        },
      });
      
      return {
        ...recipe,
        ingredients: recipe.ingredients.map((ri) => ({
          ...ri,
          quantity: (ri.quantity as any)?.toNumber?.() 
            ?? Number(ri.quantity),
          sectionName: ri.sectionName || null, // 섹션명 추가
          ingredient: {
            ...ri.ingredient,
            pricePerUnit: (ri.ingredient.pricePerUnit as any)?.toNumber?.() 
              ?? Number(ri.ingredient.pricePerUnit),
          },
        })),
      };
    }),

  // 레시피 수정
  update: publicProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1, "레시피명은 필수입니다"),
      yieldCount: z.number().int().positive("생산량은 1개 이상이어야 합니다"),
      // 베이킹 정보 (optional)
      baker: z.string().optional(),
      moldSize: z.string().optional(),
      ovenTemp: z.number().int().positive().optional(),
      ovenTime: z.number().int().positive().optional(),
      fermentationInfo: z.string().optional(),
      sellingPrice: z.number().positive().optional(),
      ingredients: z.array(z.object({
        ingredientId: z.string(),
        quantity: z.number().positive("수량은 0보다 커야 합니다"),
        sectionName: z.string().optional(), // 섹션명 추가
      })).min(1, "최소 1개 이상의 재료가 필요합니다"),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ingredients, sellingPrice, ...data } = input;
      
      // 트랜잭션으로 묶어서 처리
      const recipe = await ctx.prisma.$transaction(async (prisma) => {
        // 1. 기존 재료 연결 삭제
        await prisma.recipeIngredient.deleteMany({
          where: { recipeId: id },
        });
        
        // 2. 레시피 기본 정보만 업데이트
        await prisma.recipe.update({
          where: { id },
          data: {
            ...data,
            sellingPrice: sellingPrice ? new Decimal(sellingPrice) : null,
          },
        });
        
        // 3. 새 재료 연결 생성
        if (ingredients.length > 0) {
          await prisma.recipeIngredient.createMany({
            data: ingredients.map((ing) => ({
              recipeId: id,
              ingredientId: ing.ingredientId,
              quantity: new Decimal(ing.quantity),
              sectionName: ing.sectionName || null, // 섹션명 저장
            })),
          });
        }
        
        // 4. 최종 결과 조회
        return await prisma.recipe.findUnique({
          where: { id },
          include: {
            ingredients: {
              include: {
                ingredient: true,
              },
            },
          },
        });
      });
      
      if (!recipe) {
        throw new Error('레시피 업데이트에 실패했습니다');
      }
      
      return {
        ...recipe,
        ingredients: recipe.ingredients.map((ri) => ({
          ...ri,
          quantity: (ri.quantity as any)?.toNumber?.() 
            ?? Number(ri.quantity),
          sectionName: ri.sectionName || null, // 섹션명 추가
          ingredient: {
            ...ri.ingredient,
            pricePerUnit: (ri.ingredient.pricePerUnit as any)?.toNumber?.() 
              ?? Number(ri.ingredient.pricePerUnit),
          },
        })),
      };
    }),

  // 레시피 삭제
  delete: publicProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.recipe.delete({
        where: { id: input },
      });
      return { success: true };
    }),
});