import type { Metadata } from "next";
import { Inter, Public_Sans } from "next/font/google";
import "./globals.css";
import Link from 'next/link';

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const publicSans = Public_Sans({ subsets: ["latin"], variable: "--font-public-sans" });

export const metadata: Metadata = {
  title: "HaqDar: Digital Beneficiary Identification",
  description: "Secure Government Sandbox",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${publicSans.variable} font-sans antialiased bg-[#f7fafc] text-[#181c1e]`}>
        <header className="bg-[#000a1e] text-white py-4 px-8 shadow-md">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-4">
              {/* Mock Emblem */}
              <div className="w-10 h-12 bg-[#002147] rounded-sm flex items-center justify-center border border-[#708ab5]">
                <span className="text-xs font-bold tracking-widest px-1">IND</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold font-public-sans tracking-tight">HaqDar Portal</h1>
                <p className="text-xs text-[#aec7f6] uppercase tracking-widest font-semibold">CSC Operator Gateway</p>
              </div>
            </div>
            <nav className="flex gap-6">
              <Link href="/" className="hover:text-[#aec7f6] font-medium text-sm transition-colors">Data Entry</Link>
              <Link href="/bdo" className="hover:text-[#aec7f6] font-medium text-sm transition-colors border-l border-[#2d476f] pl-6">BDO Dashboard</Link>
            </nav>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-8 px-8">
          {children}
        </main>
      </body>
    </html>
  );
}
