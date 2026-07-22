import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import I18nProvider from "../components/language/I18nProvider";
import TopAppBar from "../components/layout/TopAppBar";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter", 
});

export const metadata: Metadata = {
  title: "Emergency Copilot AI",
  description: "Help in Seconds, Not Minutes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `
              function googleTranslateElementInit() {
                new google.translate.TranslateElement({pageLanguage: 'en', autoDisplay: false}, 'google_translate_element');
              }
            `,
          }}
        />
        <script
          type="text/javascript"
          src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        ></script>
        <style>{`
          .goog-te-banner-frame { display: none !important; }
          body { top: 0px !important; }
          #google_translate_element { display: none !important; }
        `}</style>
      </head>
      <body className={`${inter.variable} antialiased flex flex-col min-h-screen bg-[var(--color-background)] text-[var(--color-on-background)] overflow-x-hidden`}>
        <div id="google_translate_element"></div>
        <I18nProvider>
          <TopAppBar />
          <div className="flex-1 mt-[72px] relative z-10 flex flex-col">
            {children}
          </div>
        </I18nProvider>
      </body>
    </html>
  );
}
