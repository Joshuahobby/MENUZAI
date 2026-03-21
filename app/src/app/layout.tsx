import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import { MenuProvider } from "@/context/MenuContext";

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
    "Create, optimize, and track your restaurant menu with AI. Upload your menu, customize with smart templates, generate QR codes, and take orders via WhatsApp.",
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
    url: "https://menuzai.com",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${inter.variable}`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface text-on-surface antialiased">
        <MenuProvider>
          {children}
        </MenuProvider>
      </body>
    </html>
  );
}
