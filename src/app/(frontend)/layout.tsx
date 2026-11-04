import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { serverUrl } from "@/lib/server-url";
import "@/styles.css";

export const metadata: Metadata = {
  metadataBase: new URL(serverUrl()),
  title: { default: "ppp", template: "%s · ppp" },
  description: "Slides and cards, just for fun.",
  // Just for me and whoever gets a link – no search engine.
  robots: { index: false, follow: false },
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }] },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#efeff5",
};

const RootLayout = ({ children }: { children: ReactNode }) => (
  <html lang="en">
    <head>
      <link
        as="font"
        crossOrigin=""
        href="/fonts/Switzer-Variable.woff2"
        rel="preload"
        type="font/woff2"
      />
    </head>
    <body>{children}</body>
  </html>
);

export default RootLayout;
