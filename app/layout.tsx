import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "StockPulse - Smart Stock Analysis",
  description: "Track undervalued and overvalued stocks across S&P 500, NASDAQ, and Dow Jones",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
