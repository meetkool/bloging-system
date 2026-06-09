import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nardcart Blog",
  description: "Developer notes, tutorials, and build logs from Nardcart.",
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
