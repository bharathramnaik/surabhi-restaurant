import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("menuItems").collect();
  },
});

export const add = mutation({
  args: {
    name: v.string(), nameKn: v.string(), description: v.string(), descriptionKn: v.string(),
    price: v.number(), categoryId: v.string(), available: v.boolean(), isVeg: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("menuItems", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("menuItems"),
    name: v.optional(v.string()), nameKn: v.optional(v.string()),
    description: v.optional(v.string()), descriptionKn: v.optional(v.string()),
    price: v.optional(v.number()), categoryId: v.optional(v.string()),
    available: v.optional(v.boolean()), isVeg: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, ...rest }) => {
    await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { id: v.id("menuItems") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
