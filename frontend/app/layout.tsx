import "./globals.css";
import MatrixRain from "./components/MatrixRain";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Matrix Terminal Chat",
  description: "Chat with the LLM in a Matrix-style terminal UI"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="screen">
          <MatrixRain />
          <div className="crt" />
          <div className="content">{children}</div>
        </div>
      </body>
    </html>
  );
}

