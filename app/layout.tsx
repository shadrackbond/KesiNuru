import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "KesiNuru", template: "%s · KesiNuru" },
  description: "Turn scattered employment records into a clear, reviewable case file.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
