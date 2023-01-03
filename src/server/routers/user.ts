import { adminProcedure, router } from "../trpc";
import { RouterOutput } from "./_app";

export type UserRouterOutput = RouterOutput["user"];

export const userRouter = router({
  getUsers: adminProcedure.query(async () => {
    return await prisma!.user.findMany();
  }),
});
