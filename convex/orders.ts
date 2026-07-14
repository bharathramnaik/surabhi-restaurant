import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const orderItemValidator = v.object({
  menuItemId: v.string(),
  name: v.string(),
  price: v.number(),
  quantity: v.number(),
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("orders").collect();
  },
});

export const add = mutation({
  args: {
    tableId: v.union(v.string(), v.null()),
    tableNumber: v.union(v.number(), v.null()),
    customerName: v.string(),
    customerPhone: v.string(),
    items: v.array(orderItemValidator),
    status: v.union(v.literal("pending"), v.literal("in_progress"), v.literal("served"), v.literal("billed")),
    notes: v.string(),
    subtotal: v.number(),
    tax: v.number(),
    total: v.number(),
  },
  handler: async (ctx, args) => {
    const counters = await ctx.db.query("orderCounter").collect();
    let orderNumber = 1;
    if (counters.length > 0) {
      orderNumber = counters[0].value;
      await ctx.db.patch(counters[0]._id, { value: orderNumber + 1 });
    } else {
      await ctx.db.insert("orderCounter", { value: 2 });
    }
    return await ctx.db.insert("orders", { ...args, orderNumber });
  },
});

export const update = mutation({
  args: {
    id: v.id("orders"),
    tableId: v.optional(v.union(v.string(), v.null())),
    tableNumber: v.optional(v.union(v.number(), v.null())),
    customerName: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    items: v.optional(v.array(orderItemValidator)),
    status: v.optional(v.union(v.literal("pending"), v.literal("in_progress"), v.literal("served"), v.literal("billed"))),
    notes: v.optional(v.string()),
    subtotal: v.optional(v.number()),
    tax: v.optional(v.number()),
    total: v.optional(v.number()),
  },
  handler: async (ctx, { id, ...rest }) => {
    await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { id: v.id("orders") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
