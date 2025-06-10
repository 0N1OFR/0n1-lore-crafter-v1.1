import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { WalletProvider } from "@/components/wallet/wallet-provider"
import { Header } from "@/components/header"
import { ThemeProvider } from "@/components/theme-provider"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "0N1 Lore Crafter",
  description: "Create detailed lore for your 0N1 Force NFT character",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark">
          <WalletProvider>
            <Header />
            {children}
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
