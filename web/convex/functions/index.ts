import type { DataModel } from "../_generated/dataModel";

import { customCtx, customMutation, customQuery } from "convex-helpers/server/customFunctions";
import { query as rawQuery, mutation as rawMutation } from "../_generated/server";

import type { GenericMutationCtx,GenericQueryCtx } from "convex/server";
import { ConvexError, v } from "convex/values";
import { convexEnv } from "../env";


// Custom query that requires auth and injects ctx.user
export const query = customQuery(
  rawQuery,
  customCtx(async (ctx: GenericQueryCtx<DataModel>) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new ConvexError("Unauthorized");
    }
    return { user, userId: user.subject }; // merged into ctx
  }),
);

// Custom mutation that requires auth and injects ctx.user
export const mutation = customMutation(
  rawMutation,
  customCtx(async (ctx: GenericMutationCtx<DataModel>) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new ConvexError("Unauthorized");
    }
    return { user, userId: user.subject }; // merged into ctx
  }),
);

const enforceInternalSecret = {
  args: { secret: v.string() },
  input: (_ctx: GenericMutationCtx<DataModel> | GenericQueryCtx<DataModel>, { secret }: { secret: string }) => {
    const env = convexEnv();
    if (secret !== env.INTERNAL_CONVEX_SECRET) {
      throw new ConvexError("Invalid secret");
    }
    return { ctx: {}, args: {} };
  },
};

export const backendMutation = customMutation(
  rawMutation,
  enforceInternalSecret
);

export const backendQuery = customQuery(
  rawQuery,
  enforceInternalSecret
);