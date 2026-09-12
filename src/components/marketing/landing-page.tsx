import Link from "next/link";
import {
  AdminInboxIllustration,
  FlowSyncIllustration,
  HeroPlatformIllustration,
} from "@/components/marketing/landing-illustrations";
import {
  Globe,
  Inbox,
  MessageSquare,
  Shield,
  Smartphone,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Smartphone,
    title: "Mobile & web SDK",
    description:
      "Register once, sync questions, and submit answers from iOS, Android, or your website with a small REST API.",
  },
  {
    icon: MessageSquare,
    title: "Remote surveys",
    description:
      "Publish rating, choice, and yes/no questions from the dashboard—no app store release required to change copy.",
  },
  {
    icon: Inbox,
    title: "Two-way inbox",
    description:
      "Every answer can open a conversation. Reply from the admin UI; messages sync back to the user’s device or browser.",
  },
  {
    icon: Shield,
    title: "Per-app access",
    description:
      "Invite teammates as app admins or viewers. Superadmins manage the platform; everyone else sees only their apps.",
  },
  {
    icon: Globe,
    title: "Website embeds",
    description:
      "Use the same API for feedback widgets and forms on the web, with CORS-friendly client routes.",
  },
  {
    icon: Zap,
    title: "Built for developers",
    description:
      "OpenAPI docs, integration guide, and a step-by-step Integration page with curl examples for your team.",
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold text-gray-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm text-white">
              FH
            </span>
            Feedback Hub
          </Link>
          <nav
            className="flex items-center gap-6 text-sm text-gray-600 sm:gap-8"
            aria-label="Primary"
          >
            <a href="#features" className="hidden hover:text-gray-900 sm:inline">
              Features
            </a>
            <a href="#how-it-works" className="hidden hover:text-gray-900 md:inline">
              How it works
            </a>
            <a href="#for-developers" className="hidden hover:text-gray-900 lg:inline">
              Developers
            </a>
            <Link href="/login" className="font-medium text-gray-900 hover:text-blue-700">
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-gray-100 bg-gradient-to-b from-blue-50/80 to-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24">
            <div>
              <p className="mb-4 text-sm font-medium uppercase tracking-wide text-blue-700">
                In-app feedback &amp; surveys
              </p>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                Ship feedback forms in your app and website—without building a backend
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-gray-600">
                Feedback Hub helps platform owners and developers collect answers, run
                micro-surveys, and respond in a shared inbox. You manage questions from a
                dashboard; users stay inside your product.
              </p>
              <p className="mt-6 text-sm text-gray-500">
                REST API for iOS, Android, and web. Admin dashboard and two-way inbox included.{" "}
                <a href="#how-it-works" className="font-medium text-blue-600 hover:text-blue-700">
                  See how it works
                </a>
              </p>
            </div>
            <div className="relative">
              <HeroPlatformIllustration className="h-auto w-full rounded-2xl border border-gray-200 shadow-lg" />
            </div>
          </div>
        </section>

        <section id="features" className="py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                Everything you need to listen to users
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                From one-off satisfaction ratings to ongoing feedback threads—one platform for
                product, support, and engineering teams.
              </p>
            </div>
            <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <li key={feature.title} className="rounded-xl border border-gray-200 p-6">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <Icon className="h-5 w-5" aria-hidden />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">
                      {feature.description}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section id="how-it-works" className="border-y border-gray-100 bg-gray-50 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                  How integration works
                </h2>
                <p className="mt-4 text-lg text-gray-600">
                  A simple client flow: register an installation, sync active questions, submit
                  answers, and poll for admin replies. Your team handles the rest in the
                  dashboard.
                </p>
                <ol className="mt-8 space-y-4 text-sm text-gray-700">
                  <li className="flex gap-3">
                    <span className="font-semibold text-blue-600">1.</span>
                    Create an app and copy the client key from the admin UI.
                  </li>
                  <li className="flex gap-3">
                    <span className="font-semibold text-blue-600">2.</span>
                    Call register from the app or site to obtain an installation token.
                  </li>
                  <li className="flex gap-3">
                    <span className="font-semibold text-blue-600">3.</span>
                    Sync and render questions; post answers when the user responds.
                  </li>
                  <li className="flex gap-3">
                    <span className="font-semibold text-blue-600">4.</span>
                    Use the inbox to reply—messages appear on the next sync.
                  </li>
                </ol>
              </div>
              <FlowSyncIllustration className="h-auto w-full rounded-2xl border border-gray-200 bg-white shadow-md" />
            </div>
          </div>
        </section>

        <section id="for-developers" className="py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <AdminInboxIllustration className="order-2 h-auto w-full rounded-2xl border border-gray-200 shadow-md lg:order-1" />
              <div className="order-1 lg:order-2">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                  A dashboard your whole team can use
                </h2>
                <p className="mt-4 text-lg text-gray-600">
                  Manage multiple apps, schedule questions, export answers, and assign
                  collaborators per app. Sign in to access the Integration page with live API
                  examples for your environment.
                </p>
                <ul className="mt-6 space-y-2 text-sm text-gray-600">
                  <li>• OpenAPI spec and mobile integration guide in the repo</li>
                  <li>• Typed answer validation (ratings, choices, text, yes/no)</li>
                  <li>• Health endpoints for production monitoring</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-gray-100 bg-blue-600 py-16 text-white">
          <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
            <h2 className="text-2xl font-bold sm:text-3xl">
              Ready to add feedback to your product?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-blue-100">
              Log in to create your first app, publish a question, and connect your mobile or
              web client in minutes.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center px-4 sm:px-6">
          <p>© {new Date().getFullYear()} Feedback Hub. In-app feedback for developers.</p>
        </div>
      </footer>
    </div>
  );
}
