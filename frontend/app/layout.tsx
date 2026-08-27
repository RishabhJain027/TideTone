import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TideTone — AI Voice Synthesis & Zero-Shot Cloning Studio",
  description: "High-Fidelity Zero-Shot Voice Cloning & Neural Text-to-Speech Studio with Muted Flat Beach Design",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-beach-canvas text-beach-charred antialiased selection:bg-beach-sage selection:text-beach-canvas">
        {children}
      </body>
    </html>
  );
}
