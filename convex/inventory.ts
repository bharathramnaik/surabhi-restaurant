import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("inventory").collect();
  },
});

export const add = mutation({
  args: {
    name: v.string(), category: v.string(), quantity: v.number(),
    unit: v.string(), minStock: v.number(), lastUpdated: v.string(), notes: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("inventory", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("inventory"),
    name: v.optional(v.string()), category: v.optional(v.string()),
    quantity: v.optional(v.number()), unit: v.optional(v.string()),
    minStock: v.optional(v.number()), lastUpdated: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...rest }) => {
    await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { id: v.id("inventory") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
