import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SolanaWalletProvider } from "@/providers/solana";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: `Solana Connect Four`,
  description: `Play Connect Four on Solana!`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SolanaWalletProvider>{children}</SolanaWalletProvider>
      </body>
    </html>
  );
}
