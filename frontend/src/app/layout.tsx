import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RealTrack — Property Portfolio Manager",
  description: "Track your rental properties, financials, and analytics",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${geist.className} h-full bg-stone-50 text-stone-900 antialiased`}>
        {children}
      </body>
    </html>
  );
}
