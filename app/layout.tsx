import type { Metadata } from "next";
import {
  Roboto,
  Roboto_Condensed,
  Roboto_Slab,
  Roboto_Mono,
  Monoton,
} from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/app/lib/auth/AuthContext";
import StoreGate from "@/app/ui/StoreGate";
import StoreStatusRedirectClient from "@/app/ui/StoreStatusRedirectClient";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const robotoCondensed = Roboto_Condensed({
  variable: "--font-roboto-condensed",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const robotoSlab = Roboto_Slab({
  variable: "--font-roboto-slab",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const monoton = Monoton({
  variable: "--font-monoton",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});


export const metadata: Metadata = {
  title: "Kombi Coffee",
  description: "Kombi Coffee - Order Management System",
  icons: {
    icon: "/transparent-logo-v1.svg",
    shortcut: "/transparent-logo-v1.svg",
    apple: "/transparent-logo-v1.svg",
  },
};
export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning 
      className={[
        roboto.variable,
        robotoCondensed.variable,
        robotoSlab.variable,
        robotoMono.variable,
        monoton.variable,
        "h-full antialiased",
      ].join(" ")}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <StoreStatusRedirectClient />
          <StoreGate>{children}</StoreGate>
        </AuthProvider>
        <footer className="mt-auto shrink-0 bg-dark-brown border-t border-dark-brown/20 py-4 px-4 text-center">
          <p className="text-white text-sm font-roboto-condensed">
            Copyright &copy; 2026 Kombi Coffee. All Rights Reserved.
          </p>
        </footer>
      </body>
    </html>
  );
}