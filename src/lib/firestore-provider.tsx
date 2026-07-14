import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { db } from "./firebase.ts";
import {
  collection, doc, setDoc, deleteDoc, onSnapshot, writeBatch,
} from "firebase/firestore";
import { DataContext } from "./data-context.tsx";
import type {
  DataContextType, MenuCategory, MenuItem, RestaurantTable,
  Booking, Order, Employee, SalaryRecord, InventoryItem,
} from "./data-context.tsx";
import { toast } from "sonner";

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const SEED_MENU_CATEGORIES: MenuCategory[] = [
  { id: "cat1", name: "Starters", nameKn: "ಸ್ಟಾರ್ಟರ್ಸ್", sortOrder: 1 },
  { id: "cat2", name: "Main Course", nameKn: "ಮುಖ್ಯ ಭೋಜನ", sortOrder: 2 },
  { id: "cat3", name: "Non-Veg", nameKn: "ನಾನ್-ವೆಜ್", sortOrder: 3 },
  { id: "cat4", name: "Veg Curries", nameKn: "ತರಕಾರಿ ಕರಿ", sortOrder: 4 },
  { id: "cat5", name: "Breads", nameKn: "ರೊಟ್ಟಿಗಳು", sortOrder: 5 },
  { id: "cat6", name: "Rice & Biryani", nameKn: "ಅನ್ನ ಮತ್ತು ಬಿರ್ಯಾನಿ", sortOrder: 6 },
  { id: "cat7", name: "Beverages", nameKn: "ಪಾನೀಯಗಳು", sortOrder: 7 },
  { id: "cat8", name: "Other Items", nameKn: "ಇತರೆ ವಸ್ತುಗಳು", sortOrder: 8 },
  { id: "cat9", name: "Desserts", nameKn: "ಸಿಹಿ ತಿನಿಸುಗಳು", sortOrder: 9 },
  { id: "cat10", name: "South Indian", nameKn: "ದಕ್ಷಿಣ ಭಾರತೀಯ", sortOrder: 10 },
];

const SEED_MENU_ITEMS: MenuItem[] = [
  { id: "m1", name: "Veg Manchurian", nameKn: "ವೆಜ್ ಮಂಚೂರಿಯನ್", description: "Crispy veg balls in manchurian sauce", descriptionKn: "ಮಂಚೂರಿಯನ್ ಸಾಸ್‌ನಲ್ಲಿ ಕರಿದ ತರಕಾರಿ ಚೆಂಡುಗಳು", price: 120, categoryId: "cat1", available: true, isVeg: true },
  { id: "m2", name: "Chicken 65", nameKn: "ಚಿಕನ್ 65", description: "Spicy deep fried chicken", descriptionKn: "ಮಸಾಲಾ ಕರಿದ ಕೋಳಿ", price: 180, categoryId: "cat1", available: true, isVeg: false, subCategory: "Chicken Starters" },
  { id: "m3", name: "Chicken Manchuri", nameKn: "ಚಿಕನ್ ಮಂಚೂರಿಯನ್", description: "Spicy chicken manchurian", descriptionKn: "ಮಸಾಲಾ ಚಿಕನ್ ಮಂಚೂರಿಯನ್", price: 180, categoryId: "cat1", available: true, isVeg: false, subCategory: "Chicken Starters" },
  { id: "m4", name: "Chicken Chilli", nameKn: "ಚಿಕನ್ ಚಿಲ್ಲಿ", description: "Chilli chicken dry", descriptionKn: "ಚಿಲ್ಲಿ ಚಿಕನ್ ಡ್ರೈ", price: 180, categoryId: "cat1", available: true, isVeg: false, subCategory: "Chicken Starters" },
  { id: "m5", name: "Chicken 99 (Lolipop)", nameKn: "ಚಿಕನ್ 99 (ಲಾಲಿಪಾಪ್)", description: "Chicken lollipop style", descriptionKn: "ಚಿಕನ್ ಲಾಲಿಪಾಪ್ ಶೈಲಿ", price: 240, categoryId: "cat1", available: true, isVeg: false, subCategory: "Chicken Starters" },
  { id: "m6", name: "Paneer Butter Masala", nameKn: "ಪನೀರ್ ಬಟರ್ ಮಸಾಲಾ", description: "Rich creamy paneer curry", descriptionKn: "ಕ್ರೀಮಿ ಪನೀರ್ ಕರಿ", price: 160, categoryId: "cat2", available: true, isVeg: true },
  { id: "m7", name: "Chicken Curry", nameKn: "ಚಿಕನ್ ಕರಿ", description: "Traditional chicken curry", descriptionKn: "ಸಾಂಪ್ರದಾಯಿಕ ಕೋಳಿ ಕರಿ", price: 200, categoryId: "cat2", available: true, isVeg: false },
  { id: "m8", name: "Fish Tawa Fry (Seasonal)", nameKn: "ಫಿಶ್ ತವಾ ಫ್ರೈ (ಸೀಸನಲ್)", description: "Fresh fish tawa fry", descriptionKn: "ತಾಜಾ ಮೀನು ತವಾ ಫ್ರೈ", price: 140, categoryId: "cat2", available: true, isVeg: false },
  { id: "m9", name: "Chicken Masala (Full)", nameKn: "ಚಿಕನ್ ಮಸಾಲಾ (ಪೂರ್ತಿ)", description: "Full chicken masala curry", descriptionKn: "ಪೂರ್ತಿ ಕೋಳಿ ಮಸಾಲಾ ಕರಿ", price: 150, categoryId: "cat3", available: true, isVeg: false, subCategory: "Chicken items" },
  { id: "m10", name: "Chicken Masala (Half)", nameKn: "ಚಿಕನ್ ಮಸಾಲಾ (ಅರ್ಧ)", description: "Half chicken masala curry", descriptionKn: "ಅರ್ಧ ಕೋಳಿ ಮಸಾಲಾ ಕರಿ", price: 90, categoryId: "cat3", available: true, isVeg: false, subCategory: "Chicken items" },
  { id: "m11", name: "Chicken Dry", nameKn: "ಚಿಕನ್ ಡ್ರೈ", description: "Dry chicken masala", descriptionKn: "ಡ್ರೈ ಚಿಕನ್ ಮಸಾಲಾ", price: 150, categoryId: "cat3", available: true, isVeg: false, subCategory: "Chicken items" },
  { id: "m12", name: "Chicken Pepper Dry", nameKn: "ಚಿಕನ್ ಪೆಪ್ಪರ್ ಡ್ರೈ", description: "Pepper chicken dry", descriptionKn: "ಪೆಪ್ಪರ್ ಚಿಕನ್ ಡ್ರೈ", price: 160, categoryId: "cat3", available: true, isVeg: false, subCategory: "Chicken items" },
  { id: "m13", name: "Chicken Fry", nameKn: "ಚಿಕನ್ ಫ್ರೈ", description: "Crispy chicken fry", descriptionKn: "ಕರಕರೆ ಚಿಕನ್ ಫ್ರೈ", price: 150, categoryId: "cat3", available: true, isVeg: false, subCategory: "Chicken items" },
  { id: "m14", name: "Chicken Hyd (Half)", nameKn: "ಚಿಕನ್ ಹೈದರಾಬಾದಿ (ಅರ್ಧ)", description: "Half Hyderabadi chicken", descriptionKn: "ಅರ್ಧ ಹೈದರಾಬಾದಿ ಕೋಳಿ", price: 360, categoryId: "cat3", available: true, isVeg: false, subCategory: "Chicken items" },
  { id: "m15", name: "Chicken Hyd (Full)", nameKn: "ಚಿಕನ್ ಹೈದರಾಬಾದಿ (ಪೂರ್ತಿ)", description: "Full Hyderabadi chicken", descriptionKn: "ಪೂರ್ತಿ ಹೈದರಾಬಾದಿ ಕೋಳಿ", price: 720, categoryId: "cat3", available: true, isVeg: false, subCategory: "Chicken items" },
  { id: "m16", name: "Mutton Masala (Full)", nameKn: "ಮಟನ್ ಮಸಾಲಾ (ಪೂರ್ತಿ)", description: "Full mutton masala curry", descriptionKn: "ಪೂರ್ತಿ ಮಟನ್ ಮಸಾಲಾ ಕರಿ", price: 250, categoryId: "cat3", available: true, isVeg: false, subCategory: "Mutton items" },
  { id: "m17", name: "Mutton Masala (Half)", nameKn: "ಮಟನ್ ಮಸಾಲಾ (ಅರ್ಧ)", description: "Half mutton masala curry", descriptionKn: "ಅರ್ಧ ಮಟನ್ ಮಸಾಲಾ ಕರಿ", price: 180, categoryId: "cat3", available: true, isVeg: false, subCategory: "Mutton items" },
  { id: "m18", name: "Mutton Dry", nameKn: "ಮಟನ್ ಡ್ರೈ", description: "Dry mutton masala", descriptionKn: "ಡ್ರೈ ಮಟನ್ ಮಸಾಲಾ", price: 250, categoryId: "cat3", available: true, isVeg: false, subCategory: "Mutton items" },
  { id: "m19", name: "Mutton Fry", nameKn: "ಮಟನ್ ಫ್ರೈ", description: "Crispy mutton fry", descriptionKn: "ಕರಕರೆ ಮಟನ್ ಫ್ರೈ", price: 250, categoryId: "cat3", available: true, isVeg: false, subCategory: "Mutton items" },
  { id: "m20", name: "Boti Masala", nameKn: "ಬೋಟಿ ಮಸಾಲಾ", description: "Boti pieces in masala", descriptionKn: "ಮಸಾಲಾದಲ್ಲಿ ಬೋಟಿ ತುಂಡುಗಳು", price: 150, categoryId: "cat3", available: true, isVeg: false, subCategory: "Mutton items" },
  { id: "m21", name: "Boti Dry", nameKn: "ಬೋಟಿ ಡ್ರೈ", description: "Dry boti preparation", descriptionKn: "ಡ್ರೈ ಬೋಟಿ ತಯಾರಿ", price: 150, categoryId: "cat3", available: true, isVeg: false, subCategory: "Mutton items" },
  { id: "m22", name: "Boti Fry", nameKn: "ಬೋಟಿ ಫ್ರೈ", description: "Crispy fried boti", descriptionKn: "ಕರಕರೆ ಬೋಟಿ ಫ್ರೈ", price: 150, categoryId: "cat3", available: true, isVeg: false, subCategory: "Mutton items" },
  { id: "m23", name: "Mutton Hyd (Half)", nameKn: "ಮಟನ್ ಹೈದರಾಬಾದಿ (ಅರ್ಧ)", description: "Half Hyderabadi mutton", descriptionKn: "ಅರ್ಧ ಹೈದರಾಬಾದಿ ಮಟನ್", price: 560, categoryId: "cat3", available: true, isVeg: false, subCategory: "Mutton items" },
  { id: "m24", name: "Mutton Hyd (Full)", nameKn: "ಮಟನ್ ಹೈದರಾಬಾದಿ (ಪೂರ್ತಿ)", description: "Full Hyderabadi mutton", descriptionKn: "ಪೂರ್ತಿ ಹೈದರಾಬಾದಿ ಮಟನ್", price: 1080, categoryId: "cat3", available: true, isVeg: false, subCategory: "Mutton items" },
  { id: "m25", name: "Tomato Curry", nameKn: "ಟೊಮೇಟೊ ಕರಿ", description: "Tangy tomato curry", descriptionKn: "ಹುಳಿ ಟೊಮೇಟೊ ಕರಿ", price: 90, categoryId: "cat4", available: true, isVeg: true },
  { id: "m26", name: "Egg Curry", nameKn: "ಎಗ್ ಕರಿ", description: "Egg curry in gravy", descriptionKn: "ಗ್ರೇವಿಯಲ್ಲಿ ಮೊಟ್ಟೆ ಕರಿ", price: 90, categoryId: "cat4", available: true, isVeg: false },
  { id: "m27", name: "Egg Burji", nameKn: "ಎಗ್ ಬುರ್ಜಿ", description: "Scrambled egg masala", descriptionKn: "ಮಸಾಲಾ ಮೊಟ್ಟೆ ಬುರ್ಜಿ", price: 70, categoryId: "cat4", available: true, isVeg: false },
  { id: "m28", name: "Egg Chips", nameKn: "ಎಗ್ ಚಿಪ್ಸ್", description: "Egg omelette style", descriptionKn: "ಮೊಟ್ಟೆ ಚಿಪ್ಸ್", price: 70, categoryId: "cat4", available: true, isVeg: false },
  { id: "m29", name: "Dal Fry", nameKn: "ದಾಲ್ ಫ್ರೈ", description: "Fried lentil curry", descriptionKn: "ಕರಿದ ಬೇಳೆ ಕರಿ", price: 90, categoryId: "cat4", available: true, isVeg: true },
  { id: "m30", name: "Dal Tadka", nameKn: "ದಾಲ್ ತಡ್ಕಾ", description: "Tempered lentil curry", descriptionKn: "ಒಗ್ಗರಣೆ ಬೇಳೆ ಕರಿ", price: 90, categoryId: "cat4", available: true, isVeg: true },
  { id: "m31", name: "Dal Kolhapuri", nameKn: "ದಾಲ್ ಕೊಲ್ಹಾಪುರಿ", description: "Spicy kolhapuri dal", descriptionKn: "ಮಸಾಲಾ ಕೊಲ್ಹಾಪುರಿ ದಾಲ್", price: 90, categoryId: "cat4", available: true, isVeg: true },
  { id: "m32", name: "Butter Naan", nameKn: "ಬಟರ್ ನಾನ್", description: "Soft leavened bread with butter", descriptionKn: "ಬೆಣ್ಣೆಯೊಂದಿಗೆ ಮೃದು ರೊಟ್ಟಿ", price: 40, categoryId: "cat5", available: true, isVeg: true },
  { id: "m55", name: "Rotti", nameKn: "ರೊಟ್ಟಿ", description: "Plain rotti", descriptionKn: "ಸಾದಾ ರೊಟ್ಟಿ", price: 10, categoryId: "cat5", available: true, isVeg: true },
  { id: "m56", name: "Chapati", nameKn: "ಚಪಾತಿ", description: "Soft chapati", descriptionKn: "ಮೃದು ಚಪಾತಿ", price: 10, categoryId: "cat5", available: true, isVeg: true },
  { id: "m57", name: "Parata", nameKn: "ಪರಾಟಾ", description: "Layered paratha", descriptionKn: "ಪದರ ಪರಾಟಾ", price: 20, categoryId: "cat5", available: true, isVeg: true },
  { id: "m33", name: "Veg Biryani", nameKn: "ವೆಜ್ ಬಿರ್ಯಾನಿ", description: "Fragrant rice with vegetables", descriptionKn: "ತರಕಾರಿಗಳೊಂದಿಗೆ ಸುಗಂಧ ಅನ್ನ", price: 140, categoryId: "cat6", available: true, isVeg: true },
  { id: "m34", name: "Chicken Biryani", nameKn: "ಚಿಕನ್ ಬಿರ್ಯಾನಿ", description: "Fragrant rice with chicken", descriptionKn: "ಕೋಳಿಯೊಂದಿಗೆ ಸುಗಂಧ ಅನ್ನ", price: 200, categoryId: "cat6", available: true, isVeg: false },
  { id: "m35", name: "White Rice (Full)", nameKn: "ಬಿಳಿ ಅನ್ನ (ಪೂರ್ತಿ)", description: "Steamed white rice", descriptionKn: "ಬೇಯಿಸಿದ ಬಿಳಿ ಅನ್ನ", price: 40, categoryId: "cat6", available: true, isVeg: true },
  { id: "m36", name: "White Rice (Half)", nameKn: "ಬಿಳಿ ಅನ್ನ (ಅರ್ಧ)", description: "Half steamed rice", descriptionKn: "ಅರ್ಧ ಬೇಯಿಸಿದ ಅನ್ನ", price: 20, categoryId: "cat6", available: true, isVeg: true },
  { id: "m37", name: "Jeera Rice", nameKn: "ಜೀರಾ ರೈಸ್", description: "Cumin flavored rice", descriptionKn: "ಜೀರಿಗೆ ಸುವಾಸಿತ ಅನ್ನ", price: 80, categoryId: "cat6", available: true, isVeg: true },
  { id: "m38", name: "Curd Rice", nameKn: "ಮೊಸರು ಅನ್ನ", description: "Rice with yogurt", descriptionKn: "ಮೊಸರಿನೊಂದಿಗೆ ಅನ್ನ", price: 80, categoryId: "cat6", available: true, isVeg: true },
  { id: "m39", name: "Egg Rice", nameKn: "ಎಗ್ ರೈಸ್", description: "Rice with scrambled egg", descriptionKn: "ಮೊಟ್ಟೆಯೊಂದಿಗೆ ಅನ್ನ", price: 80, categoryId: "cat6", available: true, isVeg: false },
  { id: "m40", name: "Ghee Rice", nameKn: "ತುಪ್ಪ ಅನ್ನ", description: "Rice tempered with ghee", descriptionKn: "ತುಪ್ಪದೊಂದಿಗೆ ಅನ್ನ", price: 80, categoryId: "cat6", available: true, isVeg: true },
  { id: "m41", name: "Masala Rice", nameKn: "ಮಸಾಲಾ ರೈಸ್", description: "Spiced masala rice", descriptionKn: "ಮಸಾಲಾ ಸುವಾಸಿತ ಅನ್ನ", price: 90, categoryId: "cat6", available: true, isVeg: true },
  { id: "m42", name: "Rice Item (Half)", nameKn: "ರೈಸ್ ಐಟಂ (ಅರ್ಧ)", description: "Half portion rice item", descriptionKn: "ಅರ್ಧ ಭಾಗ ಅನ್ನ ಐಟಂ", price: 50, categoryId: "cat6", available: true, isVeg: true },
  { id: "m43", name: "Fresh Lime Soda", nameKn: "ಫ್ರೆಶ್ ಲೈಮ್ ಸೋಡಾ", description: "Refreshing lime soda", descriptionKn: "ರಿಫ್ರೆಶಿಂಗ್ ಲಿಂಬೆ ಸೋಡಾ", price: 50, categoryId: "cat7", available: true, isVeg: true },
  { id: "m44", name: "7Up", nameKn: "7 ಅಪ್", description: "7Up soft drink", descriptionKn: "7 ಅಪ್ ಪಾನೀಯ", price: 25, categoryId: "cat7", available: true, isVeg: true },
  { id: "m45", name: "Pepsi", nameKn: "ಪೆಪ್ಸಿ", description: "Pepsi cola", descriptionKn: "ಪೆಪ್ಸಿ ಕೋಲಾ", price: 25, categoryId: "cat7", available: true, isVeg: true },
  { id: "m46", name: "Bindu Jeera", nameKn: "ಬಿಂದು ಜೀರಾ", description: "Bindu jeera drink", descriptionKn: "ಬಿಂದು ಜೀರಾ ಪಾನೀಯ", price: 20, categoryId: "cat7", available: true, isVeg: true },
  { id: "m47", name: "Water (2L)", nameKn: "ನೀರು (2L)", description: "2 liter water bottle", descriptionKn: "2 ಲೀಟರ್ ನೀರಿನ ಬಾಟಲ್", price: 30, categoryId: "cat7", available: true, isVeg: true },
  { id: "m48", name: "Aquafina (2L)", nameKn: "ಅಕ್ವಾಫಿನಾ (2L)", description: "Aquafina 2 liter", descriptionKn: "ಅಕ್ವಾಫಿನಾ 2 ಲೀಟರ್", price: 40, categoryId: "cat7", available: true, isVeg: true },
  { id: "m49", name: "Water (1L)", nameKn: "ನೀರು (1L)", description: "1 liter water bottle", descriptionKn: "1 ಲೀಟರ್ ನೀರಿನ ಬಾಟಲ್", price: 20, categoryId: "cat7", available: true, isVeg: true },
  { id: "m50", name: "Water (1/2L)", nameKn: "ನೀರು (1/2L)", description: "Half liter water", descriptionKn: "ಅರ್ಧ ಲೀಟರ್ ನೀರು", price: 10, categoryId: "cat7", available: true, isVeg: true },
  { id: "m51", name: "Curd", nameKn: "ಮೊಸರು", description: "Fresh yogurt", descriptionKn: "ತಾಜಾ ಮೊಸರು", price: 15, categoryId: "cat8", available: true, isVeg: true },
  { id: "m52", name: "Gulab Jamun", nameKn: "ಗುಲಾಬ್ ಜಾಮೂನ್", description: "Sweet milk dumplings in sugar syrup", descriptionKn: "ಸಕ್ಕರೆ ಪಾಕದಲ್ಲಿ ಹಾಲಿನ ಹಣ್ಣುಗಳು", price: 60, categoryId: "cat9", available: true, isVeg: true },
  { id: "m53", name: "Masala Dosa", nameKn: "ಮಸಾಲಾ ದೋಸೆ", description: "Crispy dosa with potato filling", descriptionKn: "ಆಲೂ ತುಂಬಿದ ಕರಕರೆ ದೋಸೆ", price: 80, categoryId: "cat10", available: true, isVeg: true },
  { id: "m54", name: "Idli Sambar", nameKn: "ಇಡ್ಲಿ ಸಾಂಬಾರ್", description: "Steamed rice cakes with lentil soup", descriptionKn: "ಬೇಳೆ ಸೂಪ್‌ನೊಂದಿಗೆ ಬೇಯಿಸಿದ ಇಡ್ಲಿ", price: 60, categoryId: "cat10", available: true, isVeg: true },
];

const SEED_TABLES: RestaurantTable[] = [
  { id: "t1", number: 1, capacity: 2, status: "available", floor: "Ground Floor" },
  { id: "t2", number: 2, capacity: 4, status: "available", floor: "Ground Floor" },
  { id: "t3", number: 3, capacity: 4, status: "available", floor: "Ground Floor" },
  { id: "t4", number: 4, capacity: 6, status: "available", floor: "Ground Floor" },
  { id: "t5", number: 5, capacity: 6, status: "available", floor: "Ground Floor" },
  { id: "t6", number: 6, capacity: 8, status: "available", floor: "First Floor" },
  { id: "t7", number: 7, capacity: 8, status: "available", floor: "First Floor" },
  { id: "t8", number: 8, capacity: 2, status: "available", floor: "First Floor" },
];

const SEED_EMPLOYEES: Employee[] = [
  { id: "e1", name: "Ravi Kumar", phone: "9876543210", email: "ravi@surabhi.com", role: "Manager", shift: "Morning (6am-2pm)", joinDate: "2022-01-15", salary: 25000, active: true, notes: "" },
  { id: "e2", name: "Priya Sharma", phone: "9876543211", email: "priya@surabhi.com", role: "Waiter", shift: "Morning (6am-2pm)", joinDate: "2023-03-10", salary: 12000, active: true, notes: "" },
  { id: "e3", name: "Suresh Naik", phone: "9876543212", email: "", role: "Chef", shift: "Morning (6am-2pm)", joinDate: "2022-06-20", salary: 20000, active: true, notes: "" },
];

const SEED_INVENTORY: InventoryItem[] = [
  { id: "i1", name: "Tomatoes", category: "Vegetables", quantity: 10, unit: "kg", minStock: 3, lastUpdated: new Date().toISOString(), notes: "" },
  { id: "i2", name: "Onions", category: "Vegetables", quantity: 15, unit: "kg", minStock: 5, lastUpdated: new Date().toISOString(), notes: "" },
  { id: "i3", name: "Chicken", category: "Meat", quantity: 8, unit: "kg", minStock: 2, lastUpdated: new Date().toISOString(), notes: "" },
  { id: "i4", name: "Rice (Basmati)", category: "Grains", quantity: 25, unit: "kg", minStock: 5, lastUpdated: new Date().toISOString(), notes: "" },
  { id: "i5", name: "Cooking Oil", category: "Oils & Condiments", quantity: 5, unit: "L", minStock: 2, lastUpdated: new Date().toISOString(), notes: "" },
  { id: "i6", name: "Paneer", category: "Dairy", quantity: 3, unit: "kg", minStock: 1, lastUpdated: new Date().toISOString(), notes: "" },
];

const DEFAULT_SETTINGS: Record<string, string> = { gstin: "29AABCS1429B1ZB", restaurantPhone: "9876543210", restaurantAddress: "Main Road, Bangalore, Karnataka", adminPin: "1234" };

function useCol<T extends { id: string }>(name: string, seed: T[]): T[] {
  const [data, setData] = useState<T[]>([]);
  const seeded = useRef(false);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, name),
      (snap) => {
        if (snap.empty && !seeded.current) {
          seeded.current = true;
          const batch = writeBatch(db);
          seed.forEach((item) => {
            const ref = doc(db, name, item.id);
            batch.set(ref, item as Record<string, unknown>);
          });
          batch.commit().catch((e) => console.error(`Seed ${name} failed:`, e));
          return;
        }
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as T[];
        setData(items);
      },
      (error) => {
        console.error(`Firestore snapshot error (${name}):`, error);
        toast.error(`Firestore sync error: ${error.message}`);
      },
    );
    return unsub;
  }, [name]);

  return data;
}

export function FirestoreProvider({ children }: { children: React.ReactNode }) {
  const menuCategories = useCol<MenuCategory>("menuCategories", SEED_MENU_CATEGORIES);
  const menuItems = useCol<MenuItem>("menuItems", SEED_MENU_ITEMS);
  const tables = useCol<RestaurantTable>("tables", SEED_TABLES);
  const bookings = useCol<Booking>("bookings", []);
  const orders = useCol<Order>("orders", []);
  const employees = useCol<Employee>("employees", SEED_EMPLOYEES);
  const salaryRecords = useCol<SalaryRecord>("salaryRecords", []);
  const inventory = useCol<InventoryItem>("inventory", SEED_INVENTORY);
  const [settings, setSettings] = useState<Record<string, string>>(DEFAULT_SETTINGS);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "settings", "config"),
      (snap) => {
        if (snap.exists()) setSettings(snap.data() as Record<string, string>);
        else { setDoc(doc(db, "settings", "config"), DEFAULT_SETTINGS).catch((e) => console.error("Seed settings failed:", e)); }
      },
      (error) => {
        console.error("Firestore settings snapshot error:", error);
        toast.error(`Firestore settings error: ${error.message}`);
      },
    );
    return unsub;
  }, []);

  const orderCounter = Math.max(0, ...orders.map((o) => o.orderNumber)) + 1;

  const write = useCallback(async (col: string, id: string, data: Record<string, unknown>) => {
    try { await setDoc(doc(db, col, id), data, { merge: true }); } catch (e) {
      console.error(`Firestore write error (${col}/${id}):`, e);
      toast.error(`Failed to save: ${(e as Error).message}`);
    }
  }, []);

  const remove = useCallback(async (col: string, id: string) => {
    try { await deleteDoc(doc(db, col, id)); } catch (e) {
      console.error(`Firestore delete error (${col}/${id}):`, e);
      toast.error(`Failed to delete: ${(e as Error).message}`);
    }
  }, []);

  const ctx: DataContextType = {
    menuCategories, menuItems, tables, bookings, orders, orderCounter,
    employees, salaryRecords, inventory, settings, isLoading: false,
    addCategory: (c: Omit<MenuCategory, "id">) => { const id = uid(); write("menuCategories", id, c as Record<string, unknown>); },
    updateCategory: (id: string, c: Partial<MenuCategory>) => write("menuCategories", id, c as Record<string, unknown>),
    deleteCategory: (id: string) => remove("menuCategories", id),
    addMenuItem: (m: Omit<MenuItem, "id">) => { const id = uid(); write("menuItems", id, m as Record<string, unknown>); },
    updateMenuItem: (id: string, m: Partial<MenuItem>) => write("menuItems", id, m as Record<string, unknown>),
    deleteMenuItem: (id: string) => remove("menuItems", id),
    addTable: (t: Omit<RestaurantTable, "id">) => { const id = uid(); write("tables", id, t as Record<string, unknown>); },
    updateTable: (id: string, t: Partial<RestaurantTable>) => write("tables", id, t as Record<string, unknown>),
    deleteTable: (id: string) => remove("tables", id),
    addBooking: (b: Omit<Booking, "id" | "createdAt">) => { const id = uid(); write("bookings", id, { ...b, createdAt: new Date().toISOString() } as Record<string, unknown>); },
    updateBooking: (id: string, b: Partial<Booking>) => write("bookings", id, b as Record<string, unknown>),
    deleteBooking: (id: string) => remove("bookings", id),
    addOrder: (o: Omit<Order, "id" | "orderNumber" | "createdAt">) => {
      const id = uid();
      write("orders", id, { ...o, id, orderNumber: orderCounter, createdAt: new Date().toISOString() } as Record<string, unknown>);
    },
    updateOrder: (id: string, o: Partial<Order>) => write("orders", id, o as Record<string, unknown>),
    deleteOrder: (id: string) => remove("orders", id),
    addEmployee: (e: Omit<Employee, "id">) => { const id = uid(); write("employees", id, e as Record<string, unknown>); },
    updateEmployee: (id: string, e: Partial<Employee>) => write("employees", id, e as Record<string, unknown>),
    deleteEmployee: (id: string) => remove("employees", id),
    addSalaryRecord: (r: Omit<SalaryRecord, "id">) => { const id = uid(); write("salaryRecords", id, r as Record<string, unknown>); },
    updateSalaryRecord: (id: string, r: Partial<SalaryRecord>) => write("salaryRecords", id, r as Record<string, unknown>),
    addInventoryItem: (i: Omit<InventoryItem, "id">) => { const id = uid(); write("inventory", id, i as Record<string, unknown>); },
    updateInventoryItem: (id: string, i: Partial<InventoryItem>) => write("inventory", id, i as Record<string, unknown>),
    deleteInventoryItem: (id: string) => remove("inventory", id),
    setSetting: (key: string, value: string) => write("settings", "config", { [key]: value }),
    updateSetting: (key: string, value: string) => write("settings", "config", { [key]: value }),
  };

  return <DataContext.Provider value={ctx}>{children}</DataContext.Provider>;
}
