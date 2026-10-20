import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pebbles — Everyday, elevated",
  description: "Thoughtful everyday essentials, designed to last."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
