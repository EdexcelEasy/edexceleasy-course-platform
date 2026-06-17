import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Edexcel Recorded Lessons",
  description: "A subject-based recorded lesson platform connected to Google Drive videos."
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
