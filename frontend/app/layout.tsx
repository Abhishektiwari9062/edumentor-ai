import type { Metadata } from "next";
import { Rajdhani } from "next/font/google";
import "./globals.css";
import AnimatedBackground from "@/components/AnimatedBackground";

const rajdhani = Rajdhani({ weight: ["400", "600"], subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EduMentor AI",
  description: "AI-powered tutoring assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={rajdhani.className}>
        <AnimatedBackground />
        {children}
      </body>
    </html>
  );
}