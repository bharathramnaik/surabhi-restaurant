import { DataProvider } from "@/lib/data-context.tsx";
import { QueryClientProvider } from "./query-client.tsx";
import { ThemeProvider } from "./theme.tsx";
import { Toaster } from "../ui/sonner.tsx";
import { TooltipProvider } from "../ui/tooltip.tsx";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n.ts";
import type { ReactNode } from "react";

const HAS_FIREBASE = typeof import.meta !== "undefined" && !!import.meta.env.VITE_FIREBASE_PROJECT_ID;

let RootProvider: (props: { children: ReactNode }) => ReactNode = DataProvider;

if (HAS_FIREBASE) {
  try {
    const { FirestoreProvider } = await import("@/lib/firestore-provider.tsx");
    RootProvider = FirestoreProvider;
  } catch (e) {
    console.warn("Firestore init failed, using localStorage.", e);
  }
} else {
  console.warn("No Firebase config found (VITE_FIREBASE_PROJECT_ID missing). Data is localStorage only.");
}

export function DefaultProviders({ children }: { children: ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <RootProvider>
        <QueryClientProvider>
          <TooltipProvider>
            <ThemeProvider>
              <Toaster />
              {children}
            </ThemeProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </RootProvider>
    </I18nextProvider>
  );
}
