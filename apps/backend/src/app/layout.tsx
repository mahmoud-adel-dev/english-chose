import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "English Coach — خطوة صغيرة، إنجليزي أقوى",
  description: "مساحتك لتعلم الإنجليزية بهدوء. تدريب يومي، تحديد مستوى، محادثات وملاحظات عربية تساعدك تتقدم بطريقتك.",
  icons: { icon: "/illustrations/app-icon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ar" dir="rtl"><body>{children}</body></html>;
}
