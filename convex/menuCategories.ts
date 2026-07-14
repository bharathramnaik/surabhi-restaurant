import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("menuCategories").collect();
  },
});

export const add = mutation({
  args: { name: v.string(), nameKn: v.string(), sortOrder: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("menuCategories", args);
  },
});

export const update = mutation({
  args: { id: v.id("menuCategories"), name: v.string(), nameKn: v.string() },
  handler: async (ctx, { id, ...rest }) => {
    await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { id: v.id("menuCategories") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
