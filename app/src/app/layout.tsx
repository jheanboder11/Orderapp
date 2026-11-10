import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Orderapp · Domicilios en orden",
  description: "Organiza los domicilios: pedidos, entregas con foto y cierres.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f5f5f9",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-CO" className={jakarta.variable}>
      <body className="font-sans antialiased">
        <div className="mx-auto max-w-[560px] px-[max(14px,env(safe-area-inset-left))] pb-[120px]">
          {children}
        </div>
      </body>
    </html>
  );
}
