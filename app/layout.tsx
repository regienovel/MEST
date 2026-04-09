import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MEST AI Studio",
  description: "AI Experimentation Platform for MEST EITs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
