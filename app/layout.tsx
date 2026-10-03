import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DrunkPlay • 酒中自有真理，游戏带来欢乐",
  description: "赛博朋克酒局游戏库",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" >
      <body>{children}</body>
    </html>
  );
}
