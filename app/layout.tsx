import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mercatto — Gestão inteligente",
  description: "Painel de gestão conectado à Market API",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
