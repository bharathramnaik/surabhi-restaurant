import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("salaryRecords").collect();
  },
});

export const getByEmployee = query({
  args: { employeeId: v.id("employees") },
  handler: async (ctx, { employeeId }) => {
    return await ctx.db
      .query("salaryRecords")
      .withIndex("by_employee", (q) => q.eq("employeeId", employeeId))
      .collect();
  },
});

export const add = mutation({
  args: {
    employeeId: v.id("employees"),
    month: v.number(),
    year: v.number(),
    amount: v.number(),
    paid: v.boolean(),
    paidDate: v.optional(v.string()),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("salaryRecords", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("salaryRecords"),
    paid: v.optional(v.boolean()),
    paidDate: v.optional(v.string()),
    amount: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...rest }) => {
    await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { id: v.id("salaryRecords") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
