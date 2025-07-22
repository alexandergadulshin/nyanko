import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { Navbar } from "~/components/layout/navbar";

export const metadata: Metadata = {
  title: "AnimeWeb",
  description: "Discover amazing anime series and connect with fellow fans",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
