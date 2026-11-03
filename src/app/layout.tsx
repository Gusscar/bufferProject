import type { Metadata } from "next";
import { Josefin_Sans, Fredoka } from "next/font/google";
import "./globals.css";

const josefinSans = Josefin_Sans({
  variable: "--font-josefin-sans",
  subsets: ["latin"],
});

const fredoka = Fredoka({
  variable: "--font-fredoka",
  weight: ["500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Niños de la Luz Venezuela",
    template: "%s · Niños de la Luz",
  },
  description:
    "Panel de comunicaciones de Niños de la Luz Venezuela: agenda publicaciones, genera imágenes con IA y monitorea KPIs de redes sociales.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${josefinSans.variable} ${fredoka.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}