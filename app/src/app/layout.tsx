import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import { MenuProvider } from "@/context/MenuContext";
import { CartProvider } from "@/contexts/CartContext";
import { Toaster } from "sonner";
import { ConfirmModal, PromptModal } from "@/components/Modals";
import { SWRegister } from "@/components/SWRegister";
import { UpgradeProvider } from "@/components/UpgradeModal";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-headline",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MENUZA AI | Turn Your Menu Into a Revenue Engine",
  description:
    "Create, optimize, and track your restaurant menu with your own AI Digital Waiter. Upload your menu, let the AI recommend items to customers, and take real-time orders.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: { url: "/icon-192.png", sizes: "192x192" },
  },
  keywords: [
    "restaurant menu",
    "digital menu",
    "QR code menu",
    "WhatsApp ordering",
    "menu management",
    "restaurant analytics",
  ],
  openGraph: {
    title: "MENUZA AI | Smart Digital Menus",
    description: "View our menu and order directly via WhatsApp.",
    type: "website",
    url: "https://menuzaai.com",
    images: [
      {
        url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&h=630&fit=crop",
        width: 1200,
        height: 630,
        alt: "MENUZA AI Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MENUZA AI | Smart Digital Menus",
    description: "The future of restaurant menus is here.",
    images: ["https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&h=630&fit=crop"],
  },
};

export const viewport = {
  themeColor: "#FF6B00",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${inter.variable}`}>
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" />
      </head>
      <body className="bg-surface text-on-surface antialiased">
        <MenuProvider>
          <UpgradeProvider>
          <CartProvider>
            {children}
            <ConfirmModal />
            <PromptModal />
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  background: "var(--color-surface-container-lowest)",
                  color: "var(--color-on-surface)",
                  border: "1px solid color-mix(in srgb, var(--color-outline-variant) 30%, transparent)",
                  borderRadius: "1rem",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                },
              }}
            />
            <SWRegister />
          </CartProvider>
          </UpgradeProvider>
        </MenuProvider>
      </body>
    </html>
  );
}
