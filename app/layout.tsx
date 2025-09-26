
import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { PersistentHeader } from "../components/persistent-header";

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Water Conservation Installation Report",
  description: "Generate water conservation installation reports",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <style>
          {`
            @page {
              size: letter;
              margin: 0.5in;
            }
          `}
        </style>
      </head>
      <body className={inter.className}>
        <PersistentHeader />
        <div style={{ paddingTop: '70px' }}>{children}</div>
      </body>
    </html>
  )
}
