import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LandingPage } from "@/components/marketing/landing-page";
import { getSession } from "@/server/auth/session";

const siteUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: "In-app feedback & surveys for mobile and web",
  description:
    "Feedback Hub helps developers and platform owners integrate feedback forms and micro-surveys into mobile apps and websites. Sync questions, collect answers, and reply from one admin inbox.",
  keywords: [
    "in-app feedback",
    "mobile survey SDK",
    "website feedback form",
    "customer feedback API",
    "in-app surveys",
    "product feedback platform",
  ],
  openGraph: {
    title: "Feedback Hub — In-app feedback for mobile and web",
    description:
      "Integrate feedback forms and surveys into your apps. REST API, admin dashboard, and two-way inbox.",
    url: siteUrl,
    siteName: "Feedback Hub",
    type: "website",
    images: [{ url: "/landing/hero-platform.svg", width: 800, height: 520, alt: "Feedback Hub platform overview" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Feedback Hub — In-app feedback for mobile and web",
    description: "Ship feedback and surveys in your app or website with a developer-friendly API.",
  },
  alternates: { canonical: siteUrl },
};

function jsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Feedback Hub",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "Platform for in-app feedback, remote surveys, and admin inbox replies for mobile and web applications.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    url: siteUrl,
  };
}

export default async function HomePage() {
  const session = await getSession();
  if (session?.user && !session.user.mustChangePassword) {
    redirect("/dashboard");
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()) }}
      />
      <LandingPage />
    </>
  );
}
