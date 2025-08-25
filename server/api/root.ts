import { router } from './trpc';
import { ingredientsRouter } from './routers/ingredients';
import { recipesRouter } from './routers/recipes';
import { calculatorRouter } from './routers/calculator';

export const appRouter = router({
  ingredients: ingredientsRouter,
  recipes: recipesRouter,
  calculator: calculatorRouter,
});

export type AppRouter = typeof appRouter;