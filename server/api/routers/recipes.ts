import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { Decimal } from 'decimal.js';

export const recipesRouter = router({
  // 모든 레시피 조회 (재료 포함)
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
    
    // ⚡ Decimal을 number로 변환
    return recipes.map((recipe) => ({
      ...recipe,
      ingredients: recipe.ingredients.map((ri) => ({
        ...ri,
        quantity: (ri.quantity as any)?.toNumber?.() 
          ?? Number(ri.quantity),
        ingredient: {
          ...ri.ingredient,
          pricePerUnit: (ri.ingredient.pricePerUnit as any)?.toNumber?.() 
            ?? Number(ri.ingredient.pricePerUnit),
        },
      })),
    }));
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
      ingredients: z.array(z.object({
        ingredientId: z.string(),
        quantity: z.number().positive("수량은 0보다 커야 합니다"),
      })).min(1, "최소 1개 이상의 재료가 필요합니다"),
    }))
    .mutation(async ({ ctx, input }) => {
      // 중복 재료 자동 필터링 (백엔드 방어 코드)
      const uniqueIngredients = Array.from(
        new Map(input.ingredients.map(i => [i.ingredientId, i])).values()
      );
      
      const recipe = await ctx.prisma.recipe.create({
        data: {
          name: input.name,
          yieldCount: input.yieldCount,
          ingredients: {
            create: uniqueIngredients.map((ing) => ({
              ingredientId: ing.ingredientId,
              quantity: new Decimal(ing.quantity),
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
      ingredients: z.array(z.object({
        ingredientId: z.string(),
        quantity: z.number().positive("수량은 0보다 커야 합니다"),
      })).min(1, "최소 1개 이상의 재료가 필요합니다"),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ingredients, ...data } = input;
      
      // 중복 재료 자동 필터링 (백엔드 방어 코드)
      const uniqueIngredients = Array.from(
        new Map(ingredients.map(i => [i.ingredientId, i])).values()
      );
      
      // 기존 재료 연결 삭제
      await ctx.prisma.recipeIngredient.deleteMany({
        where: { recipeId: id },
      });
      
      // 레시피 업데이트 및 새 재료 연결 생성
      const recipe = await ctx.prisma.recipe.update({
        where: { id },
        data: {
          ...data,
          ingredients: {
            create: uniqueIngredients.map((ing) => ({
              ingredientId: ing.ingredientId,
              quantity: new Decimal(ing.quantity),
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