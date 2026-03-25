import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flow Builder — Visual AI Campaign Tool",
  description: "Build AI-powered visual workflows with ease",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
