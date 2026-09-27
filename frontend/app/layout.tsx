import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChatgptTrading",
  description: "Scenario-based intraday crypto scanner",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
