import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Shared/Layout/Header";
import Footer from "@/components/Shared/Layout/Footer";

export const metadata: Metadata = {
  title: "APSco",
  description: "website",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <Header/>
        {children}
        <Footer />
      </body>
    </html>
  );
}
