import { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { router } from "../trpc";
import { itemRouter } from "./item";
import { patchVersionRouter } from "./patch-version";
import { storageRouter } from "./storage";
import { userRouter } from "./user";

export const appRouter = router({
  item: itemRouter,
  patchVersion: patchVersionRouter,
  user: userRouter,
  storage: storageRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

export type RouterOutput = inferRouterOutputs<AppRouter>;
export type RouterInput = inferRouterInputs<AppRouter>;
