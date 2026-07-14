import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const orderItemValidator = v.object({
  menuItemId: v.string(),
  name: v.string(),
  price: v.number(),
  quantity: v.number(),
});

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
  }).index("by_token", ["tokenIdentifier"]),

  menuCategories: defineTable({
    name: v.string(),
    nameKn: v.string(),
    sortOrder: v.number(),
  }),

  menuItems: defineTable({
    name: v.string(),
    nameKn: v.string(),
    description: v.string(),
    descriptionKn: v.string(),
    price: v.number(),
    categoryId: v.string(),
    available: v.boolean(),
    isVeg: v.boolean(),
  }).index("by_category", ["categoryId"]),

  restaurantTables: defineTable({
    number: v.number(),
    capacity: v.number(),
    status: v.union(v.literal("available"), v.literal("occupied"), v.literal("reserved")),
    floor: v.string(),
  }).index("by_number", ["number"]),

  bookings: defineTable({
    tableId: v.string(),
    guestName: v.string(),
    phone: v.string(),
    date: v.string(),
    time: v.string(),
    partySize: v.number(),
    notes: v.string(),
    status: v.union(v.literal("confirmed"), v.literal("cancelled"), v.literal("completed")),
  }).index("by_date", ["date"]),

  orders: defineTable({
    orderNumber: v.number(),
    tableId: v.union(v.string(), v.null()),
    tableNumber: v.union(v.number(), v.null()),
    customerName: v.string(),
    customerPhone: v.string(),
    items: v.array(orderItemValidator),
    status: v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("served"),
      v.literal("billed")
    ),
    notes: v.string(),
    subtotal: v.number(),
    tax: v.number(),
    total: v.number(),
  }).index("by_status", ["status"]),

  employees: defineTable({
    name: v.string(),
    phone: v.string(),
    email: v.string(),
    role: v.string(),
    shift: v.string(),
    joinDate: v.string(),
    salary: v.number(),
    active: v.boolean(),
    notes: v.string(),
  }),

  salaryRecords: defineTable({
    employeeId: v.id("employees"),
    month: v.number(),
    year: v.number(),
    amount: v.number(),
    paid: v.boolean(),
    paidDate: v.optional(v.string()),
    notes: v.string(),
  }).index("by_employee", ["employeeId"]).index("by_month_year", ["year", "month"]),

  inventory: defineTable({
    name: v.string(),
    category: v.string(),
    quantity: v.number(),
    unit: v.string(),
    minStock: v.number(),
    lastUpdated: v.string(),
    notes: v.string(),
  }).index("by_category", ["category"]),

  settings: defineTable({
    key: v.string(),
    value: v.string(),
  }).index("by_key", ["key"]),

  orderCounter: defineTable({
    value: v.number(),
  }),
});
