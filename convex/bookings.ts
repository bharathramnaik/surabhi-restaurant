import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("bookings").collect();
  },
});

export const add = mutation({
  args: {
    tableId: v.string(), guestName: v.string(), phone: v.string(),
    date: v.string(), time: v.string(), partySize: v.number(),
    notes: v.string(), status: v.union(v.literal("confirmed"), v.literal("cancelled"), v.literal("completed")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("bookings", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("bookings"),
    tableId: v.optional(v.string()), guestName: v.optional(v.string()), phone: v.optional(v.string()),
    date: v.optional(v.string()), time: v.optional(v.string()), partySize: v.optional(v.number()),
    notes: v.optional(v.string()), status: v.optional(v.union(v.literal("confirmed"), v.literal("cancelled"), v.literal("completed"))),
  },
  handler: async (ctx, { id, ...rest }) => {
    await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { id: v.id("bookings") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
