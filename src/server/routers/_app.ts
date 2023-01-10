import { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { router } from "../trpc";
import { itemRouter } from "./item";
import { patchVersionRouter } from "./patch-version";
import { userRouter } from "./user";

export { reportWebVitals } from "next-axiom";

export const appRouter = router({
  item: itemRouter,
  patchVersion: patchVersionRouter,
  user: userRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

export type RouterOutput = inferRouterOutputs<AppRouter>;
export type RouterInput = inferRouterInputs<AppRouter>;
