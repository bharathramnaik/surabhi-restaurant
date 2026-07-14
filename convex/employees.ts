import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("employees").collect();
  },
});

export const add = mutation({
  args: {
    name: v.string(), phone: v.string(), email: v.string(),
    role: v.string(), shift: v.string(), joinDate: v.string(),
    salary: v.number(), active: v.boolean(), notes: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("employees", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("employees"),
    name: v.optional(v.string()), phone: v.optional(v.string()), email: v.optional(v.string()),
    role: v.optional(v.string()), shift: v.optional(v.string()), joinDate: v.optional(v.string()),
    salary: v.optional(v.number()), active: v.optional(v.boolean()), notes: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...rest }) => {
    await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { id: v.id("employees") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
