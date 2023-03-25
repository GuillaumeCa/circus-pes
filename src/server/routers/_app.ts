import { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { router } from "../trpc";
import { itemRouter } from "./item";
import { patchVersionRouter } from "./patch-version";
import { responseRouter } from "./response";
import { userRouter } from "./user";

export const appRouter = router({
  item: itemRouter,
  patchVersion: patchVersionRouter,
  user: userRouter,
  response: responseRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

export type RouterOutput = inferRouterOutputs<AppRouter>;
export type RouterInput = inferRouterInputs<AppRouter>;
