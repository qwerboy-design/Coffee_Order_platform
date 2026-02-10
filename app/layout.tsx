import type { Metadata } from "next";
import { ToastProvider } from "@/components/ui/Toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: "咖啡豆訂單系統",
  description: "全自動化咖啡豆訂購平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
