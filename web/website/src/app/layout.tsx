import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Shared/Layout/Header";
import Footer from "@/components/Shared/Layout/Footer";
import "lenis/dist/lenis.css";
import SmoothScroll from "@/components/Shared/General/SmoothScroll";

export const metadata: Metadata = {
  title: "APSco",
  description: "website",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <SmoothScroll />
        <Header />
        <div className="px-5">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
