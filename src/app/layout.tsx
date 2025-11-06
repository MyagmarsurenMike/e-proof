import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AntdProvider } from "@/components/providers/AntdProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Э-Нотолгоо - Блокчэйн баримт бичиг баталгаажуулалт",
  description: "Блокчэйн дээр суурилсан аюулгүй баримт бичиг баталгаажуулах платформ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mn">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <AntdProvider>
            {children}
          </AntdProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
