# Surabhi Hotel & Family Restaurant

A complete restaurant management web app built with React, Convex, and Tailwind CSS.

## Features

- **Dashboard** - Overview of orders, revenue, table status, low-stock alerts
- **Menu Management** - Add/edit/delete menu items with English & Kannada names
- **Tables & Bookings** - Manage restaurant tables and customer bookings
- **Orders** - Create orders, track status, generate bills
- **Inventory** - Track stock levels with low-stock alerts
- **Employees** - Staff management with PIN-protected salary tracking
- **Reports** - Revenue stats, top items, JSON export, settings

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS 4, shadcn UI
- **Backend**: Convex (real-time database + backend functions)
- **i18n**: English + Kannada via react-i18next
- **PWA**: Installable on Android/iOS via Chrome "Add to Home Screen"

## Default Settings

- **Admin PIN**: `1234` (change in Reports > Settings)
- **GSTIN**: `29AABCS1429B1ZB` (update in Reports > Settings)
- **Language**: English (switch to Kannada with the flag icon)

## Live Data Sync

All data is stored in Convex cloud database — 2-5 staff members see real-time updates simultaneously.

## PWA Installation (Android)

1. Open the published app URL in Chrome on Android
2. Tap the menu (⋮) → "Add to Home Screen"
3. Tap "Add" — the app installs with the flying whale icon

## Development

```bash
npm install
npx convex dev    # Start Convex backend
npm run dev       # Start Vite dev server
```
