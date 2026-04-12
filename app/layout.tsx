import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Archive Atlas",
  description:
    "An intelligent archival search and discovery platform for historical collections.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
