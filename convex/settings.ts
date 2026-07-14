import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const setting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();
    return setting?.value ?? null;
  },
});

export const set = mutation({
  args: { key: v.string(), value: v.string() },
  handler: async (ctx, { key, value }) => {
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { value });
    } else {
      await ctx.db.insert("settings", { key, value });
    }
  },
});

export const getMultiple = query({
  args: { keys: v.array(v.string()) },
  handler: async (ctx, { keys }): Promise<Record<string, string>> => {
    const result: Record<string, string> = {};
    for (const key of keys) {
      const setting = await ctx.db
        .query("settings")
        .withIndex("by_key", (q) => q.eq("key", key))
        .first();
      if (setting) result[key] = setting.value;
    }
    return result;
  },
});
