import type { Metadata } from "next";
import { Press_Start_2P } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const pressStart2P = Press_Start_2P({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-pathforge",
  weight: "400",
});

const title = "PathForge — Graph-search laboratory";
const description =
  "Visualize, inspect, and compare BFS, DFS, Dijkstra, and A* on weighted grids.";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const forwardedProtocol = requestHeaders.get("x-forwarded-proto")?.split(",")[0];
  const protocol = forwardedProtocol ?? (host.startsWith("localhost") ? "http" : "https");
  const imageUrl = `${protocol}://${host}/og.png`;

  return {
    title,
    description,
    openGraph: {
      type: "website",
      title,
      description,
      images: [{ url: imageUrl, width: 1659, height: 948, alt: "PathForge graph-search grid" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={pressStart2P.variable}>{children}</body>
    </html>
  );
}
