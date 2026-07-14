import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("restaurantTables").collect();
  },
});

export const add = mutation({
  args: { number: v.number(), capacity: v.number(), status: v.union(v.literal("available"), v.literal("occupied"), v.literal("reserved")), floor: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("restaurantTables", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("restaurantTables"),
    number: v.optional(v.number()), capacity: v.optional(v.number()),
    status: v.optional(v.union(v.literal("available"), v.literal("occupied"), v.literal("reserved"))),
    floor: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...rest }) => {
    await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { id: v.id("restaurantTables") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
