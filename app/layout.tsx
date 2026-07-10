import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Matt Hullstrung | Space Portfolio",
  description: "A cinematic, interactive space portfolio for Matt Hullstrung."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
