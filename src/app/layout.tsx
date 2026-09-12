import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Feedback Hub",
    template: "%s | Feedback Hub",
  },
  description:
    "In-app feedback, surveys, and admin inbox for mobile apps and websites.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
