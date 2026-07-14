import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const updateCurrentUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;
    const existing = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { name: identity.name, email: identity.email });
    } else {
      await ctx.db.insert("users", {
        tokenIdentifier: identity.tokenIdentifier,
        name: identity.name,
        email: identity.email,
      });
    }
  },
});

export const isSeeded = query({
  args: {},
  handler: async (ctx) => {
    const cats = await ctx.db.query("menuCategories").first();
    return cats !== null;
  },
});

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("menuCategories").first();
    if (existing) return;

    const cats = [
      { name: "Starters", nameKn: "\u0cb8\u0ccd\u0c9f\u0cbe\u0cb0\u0ccd\u0c9f\u0cb0\u0ccd\u0cb8\u0ccd", sortOrder: 1 },
      { name: "Main Course", nameKn: "\u0cae\u0cc1\u0c96\u0ccd\u0caf \u0cad\u0ccb\u0c9c\u0ca8", sortOrder: 2 },
      { name: "Breads", nameKn: "\u0cb0\u0cca\u0c9f\u0ccd\u0c9f\u0cbf\u0c97\u0cb3\u0cc1", sortOrder: 3 },
      { name: "Rice & Biryani", nameKn: "\u0c85\u0ca8\u0ccd\u0ca8 \u0cae\u0ca4\u0ccd\u0ca4\u0cc1 \u0cac\u0cbf\u0cb0\u0ccd\u0caf\u0cbe\u0ca8\u0cbf", sortOrder: 4 },
      { name: "Desserts", nameKn: "\u0cb8\u0cbf\u0cb9\u0cbf \u0ca4\u0cbf\u0ca8\u0cbf\u0cb8\u0cc1\u0c97\u0cb3\u0cc1", sortOrder: 5 },
      { name: "Beverages", nameKn: "\u0caa\u0cbe\u0ca8\u0cc0\u0caf\u0c97\u0cb3\u0cc1", sortOrder: 6 },
      { name: "South Indian", nameKn: "\u0ca6\u0c95\u0ccd\u0cb7\u0cbf\u0ca3 \u0cad\u0cbe\u0cb0\u0ca4\u0cc0\u0caf", sortOrder: 7 },
    ];
    const catIds = await Promise.all(cats.map((c) => ctx.db.insert("menuCategories", c)));

    await Promise.all([
      ctx.db.insert("menuItems", { name: "Veg Manchurian", nameKn: "\u0cb5\u0cc6\u0c9c\u0ccd \u0cae\u0c82\u0c9a\u0cc2\u0cb0\u0cbf\u0caf\u0ca8\u0ccd", description: "Crispy veg balls in manchurian sauce", descriptionKn: "\u0cae\u0c82\u0c9a\u0cc2\u0cb0\u0cbf\u0caf\u0ca8\u0ccd \u0cb8\u0cbe\u0cb8\u0ccd\u200c\u0ca8\u0cb2\u0ccd\u0cb2\u0cbf \u0c95\u0cb0\u0cbf\u0ca6 \u0ca4\u0cb0\u0c95\u0cbe\u0cb0\u0cbf \u0c9a\u0cc6\u0c82\u0ca1\u0cc1\u0c97\u0cb3\u0cc1", price: 120, categoryId: catIds[0], available: true, isVeg: true }),
      ctx.db.insert("menuItems", { name: "Chicken 65", nameKn: "\u0c9a\u0cbf\u0c95\u0ca8\u0ccd 65", description: "Spicy deep fried chicken", descriptionKn: "\u0cae\u0cb8\u0cbe\u0cb2\u0cbe \u0c95\u0cb0\u0cbf\u0ca6 \u0c95\u0ccb\u0cb3\u0cbf", price: 180, categoryId: catIds[0], available: true, isVeg: false }),
      ctx.db.insert("menuItems", { name: "Paneer Butter Masala", nameKn: "\u0caa\u0ca8\u0cc0\u0cb0\u0ccd \u0cac\u0c9f\u0cb0\u0ccd \u0cae\u0cb8\u0cbe\u0cb2\u0cbe", description: "Rich creamy paneer curry", descriptionKn: "\u0c95\u0ccd\u0cb0\u0cc0\u0cae\u0cbf \u0caa\u0ca8\u0cc0\u0cb0\u0ccd \u0c95\u0cb0\u0cbf", price: 160, categoryId: catIds[1], available: true, isVeg: true }),
      ctx.db.insert("menuItems", { name: "Chicken Curry", nameKn: "\u0c9a\u0cbf\u0c95\u0ca8\u0ccd \u0c95\u0cb0\u0cbf", description: "Traditional chicken curry", descriptionKn: "\u0cb8\u0cbe\u0c82\u0caa\u0ccd\u0cb0\u0ca6\u0cbe\u0caf\u0cbf\u0c95 \u0c95\u0ccb\u0cb3\u0cbf \u0c95\u0cb0\u0cbf", price: 200, categoryId: catIds[1], available: true, isVeg: false }),
      ctx.db.insert("menuItems", { name: "Butter Naan", nameKn: "\u0cac\u0c9f\u0cb0\u0ccd \u0ca8\u0cbe\u0ca8\u0ccd", description: "Soft leavened bread with butter", descriptionKn: "\u0cac\u0cc6\u0ca3\u0ccd\u0ca3\u0cc6\u0caf\u0cca\u0c82\u0ca6\u0cbf\u0c97\u0cc6 \u0cae\u0cc3\u0ca6\u0cc1 \u0cb0\u0cca\u0c9f\u0ccd\u0c9f\u0cbf", price: 40, categoryId: catIds[2], available: true, isVeg: true }),
      ctx.db.insert("menuItems", { name: "Veg Biryani", nameKn: "\u0cb5\u0cc6\u0c9c\u0ccd \u0cac\u0cbf\u0cb0\u0ccd\u0caf\u0cbe\u0ca8\u0cbf", description: "Fragrant rice with vegetables", descriptionKn: "\u0ca4\u0cb0\u0c95\u0cbe\u0cb0\u0cbf\u0c97\u0cb3\u0cca\u0c82\u0ca6\u0cbf\u0c97\u0cc6 \u0cb8\u0cc1\u0c97\u0c82\u0ca7 \u0c85\u0ca8\u0ccd\u0ca8", price: 140, categoryId: catIds[3], available: true, isVeg: true }),
      ctx.db.insert("menuItems", { name: "Chicken Biryani", nameKn: "\u0c9a\u0cbf\u0c95\u0ca8\u0ccd \u0cac\u0cbf\u0cb0\u0ccd\u0caf\u0cbe\u0ca8\u0cbf", description: "Fragrant rice with chicken", descriptionKn: "\u0c95\u0ccb\u0cb3\u0cbf\u0caf\u0cca\u0c82\u0ca6\u0cbf\u0c97\u0cc6 \u0cb8\u0cc1\u0c97\u0c82\u0ca7 \u0c85\u0ca8\u0ccd\u0ca8", price: 200, categoryId: catIds[3], available: true, isVeg: false }),
      ctx.db.insert("menuItems", { name: "Gulab Jamun", nameKn: "\u0c97\u0cc1\u0cb2\u0cbe\u0cac\u0ccd \u0c9c\u0cbe\u0cae\u0cc2\u0ca8\u0ccd", description: "Sweet milk dumplings in sugar syrup", descriptionKn: "\u0cb8\u0c95\u0ccd\u0c95\u0cb0\u0cc6 \u0caa\u0cbe\u0c95\u0ca6\u0cb2\u0ccd\u0cb2\u0cbf \u0cb9\u0cbe\u0cb2\u0cbf\u0ca8 \u0cb9\u0ca3\u0ccd\u0ca3\u0cc1\u0c97\u0cb3\u0cc1", price: 60, categoryId: catIds[4], available: true, isVeg: true }),
      ctx.db.insert("menuItems", { name: "Fresh Lime Soda", nameKn: "\u0cab\u0ccd\u0cb0\u0cc6\u0cb6\u0ccd \u0cb2\u0cc8\u0cae\u0ccd \u0cb8\u0ccb\u0ca1\u0cbe", description: "Refreshing lime soda", descriptionKn: "\u0cb0\u0cbf\u0cab\u0ccd\u0cb0\u0cc6\u0cb6\u0cbf\u0c82\u0c97\u0ccd \u0cb2\u0cbf\u0c82\u0cac\u0cc6 \u0cb8\u0ccb\u0ca1\u0cbe", price: 50, categoryId: catIds[5], available: true, isVeg: true }),
      ctx.db.insert("menuItems", { name: "Masala Dosa", nameKn: "\u0cae\u0cb8\u0cbe\u0cb2\u0cbe \u0ca6\u0ccb\u0cb8\u0cc6", description: "Crispy dosa with potato filling", descriptionKn: "\u0c86\u0cb2\u0cc2 \u0ca4\u0cc1\u0c82\u0cac\u0cbf\u0ca6 \u0c95\u0cb0\u0c95\u0cb0\u0cc6 \u0ca6\u0ccb\u0cb8\u0cc6", price: 80, categoryId: catIds[6], available: true, isVeg: true }),
      ctx.db.insert("menuItems", { name: "Idli Sambar", nameKn: "\u0c87\u0ca1\u0ccd\u0cb2\u0cbf \u0cb8\u0cbe\u0c82\u0cac\u0cbe\u0cb0\u0ccd", description: "Steamed rice cakes with lentil soup", descriptionKn: "\u0cac\u0cc7\u0cb3\u0cc6 \u0cb8\u0cc2\u0caa\u0ccd\u200c\u0ca8\u0cca\u0c82\u0ca6\u0cbf\u0c97\u0cc6 \u0cac\u0cc7\u0caf\u0cbf\u0cb8\u0cbf\u0ca6 \u0c87\u0ca1\u0ccd\u0cb2\u0cbf", price: 60, categoryId: catIds[6], available: true, isVeg: true }),
    ]);

    const floors = [
      { number: 1, capacity: 2, floor: "Ground Floor" },
      { number: 2, capacity: 4, floor: "Ground Floor" },
      { number: 3, capacity: 4, floor: "Ground Floor" },
      { number: 4, capacity: 6, floor: "Ground Floor" },
      { number: 5, capacity: 6, floor: "Ground Floor" },
      { number: 6, capacity: 8, floor: "First Floor" },
      { number: 7, capacity: 8, floor: "First Floor" },
      { number: 8, capacity: 2, floor: "First Floor" },
    ];
    await Promise.all(floors.map((t) => ctx.db.insert("restaurantTables", { ...t, status: "available" })));

    await Promise.all([
      ctx.db.insert("employees", { name: "Ravi Kumar", phone: "9876543210", email: "ravi@surabhi.com", role: "Manager", shift: "Morning (6am-2pm)", joinDate: "2022-01-15", salary: 25000, active: true, notes: "" }),
      ctx.db.insert("employees", { name: "Priya Sharma", phone: "9876543211", email: "priya@surabhi.com", role: "Waiter", shift: "Morning (6am-2pm)", joinDate: "2023-03-10", salary: 12000, active: true, notes: "" }),
      ctx.db.insert("employees", { name: "Suresh Naik", phone: "9876543212", email: "", role: "Chef", shift: "Morning (6am-2pm)", joinDate: "2022-06-20", salary: 20000, active: true, notes: "" }),
    ]);

    await Promise.all([
      ctx.db.insert("inventory", { name: "Tomatoes", category: "Vegetables", quantity: 10, unit: "kg", minStock: 3, lastUpdated: new Date().toISOString(), notes: "" }),
      ctx.db.insert("inventory", { name: "Onions", category: "Vegetables", quantity: 15, unit: "kg", minStock: 5, lastUpdated: new Date().toISOString(), notes: "" }),
      ctx.db.insert("inventory", { name: "Chicken", category: "Meat", quantity: 8, unit: "kg", minStock: 2, lastUpdated: new Date().toISOString(), notes: "" }),
      ctx.db.insert("inventory", { name: "Rice (Basmati)", category: "Grains", quantity: 25, unit: "kg", minStock: 5, lastUpdated: new Date().toISOString(), notes: "" }),
      ctx.db.insert("inventory", { name: "Cooking Oil", category: "Oils & Condiments", quantity: 5, unit: "L", minStock: 2, lastUpdated: new Date().toISOString(), notes: "" }),
      ctx.db.insert("inventory", { name: "Paneer", category: "Dairy", quantity: 3, unit: "kg", minStock: 1, lastUpdated: new Date().toISOString(), notes: "" }),
    ]);

    await Promise.all([
      ctx.db.insert("settings", { key: "gstin", value: "29AABCS1429B1ZB" }),
      ctx.db.insert("settings", { key: "restaurantPhone", value: "9876543210" }),
      ctx.db.insert("settings", { key: "restaurantAddress", value: "Main Road, Bangalore, Karnataka" }),
      ctx.db.insert("settings", { key: "adminPin", value: "1234" }),
    ]);
  },
});
