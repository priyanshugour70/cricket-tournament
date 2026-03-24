import Link from "next/link";
import {
  Trophy,
  Users,
  Gavel,
  Calendar,
  Shield,
  BarChart3,
  ChevronRight,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui";
import { MarketingHeader } from "@/components/layouts/marketing-header";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui";
import { LiveTournaments } from "@/components/live-tournaments";

const features = [
  {
    icon: Trophy,
    title: "Tournament Management",
    description:
      "Create and manage multi-format cricket tournaments with flexible rules, schedules, and point systems.",
  },
  {
    icon: Users,
    title: "Player Registration",
    description:
      "Streamlined player registration with profile management, fitness clearance, and document verification.",
  },
  {
    icon: Gavel,
    title: "Live Auctions",
    description:
      "Real-time auction system with bid tracking, purse management, and team-wise budget controls.",
  },
  {
    icon: Calendar,
    title: "Match Scheduling",
    description:
      "Automated fixture generation across league, qualifiers, and knockout stages with venue management.",
  },
  {
    icon: Shield,
    title: "Team Management",
    description:
      "Full squad management with retention rules, overseas limits, and captain assignments.",
  },
  {
    icon: BarChart3,
    title: "Real-time Dashboard",
    description:
      "Live standings, net run rate calculations, and comprehensive tournament analytics at a glance.",
  },
];

const stats = [
  { value: "2,400+", label: "Tournaments Hosted" },
  { value: "85,000+", label: "Players Registered" },
  { value: "12,000+", label: "Matches Played" },
  { value: "150+", label: "Cities Worldwide" },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />

      <section className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 text-sm text-muted-foreground">
            <Zap className="h-3.5 w-3.5" />
            The complete cricket tournament platform
          </div>
          <h1 className="text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
            Manage Cricket Tournaments{" "}
            <span className="text-muted-foreground">Like a Pro</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            From player registrations and live auctions to match scheduling and
            real-time dashboards — everything you need to run professional
            cricket tournaments, all in one place.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/auth/register">
                Start Free
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/tournaments">Browse Tournaments</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-secondary/50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Everything You Need
            </h2>
            <p className="mt-3 text-muted-foreground">
              Powerful tools for every aspect of tournament management
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="transition-shadow hover:shadow-md"
              >
                <CardHeader>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription className="leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <LiveTournaments />

      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Trusted by Cricket Communities
            </h2>
            <p className="mt-3 text-muted-foreground">
              Powering tournaments across the globe
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-4xl font-bold tracking-tight">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-primary py-20 text-primary-foreground">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Ready to Host Your Tournament?
          </h2>
          <p className="mt-4 text-primary-foreground/70">
            Join thousands of organizers who trust CricketTournament Pro to
            deliver seamless tournament experiences.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Button
              size="lg"
              variant="secondary"
              asChild
            >
              <Link href="/auth/register">Create Free Account</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                <span className="font-semibold">CricketTournament Pro</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                The complete platform for organizing and managing professional
                cricket tournaments of any scale.
              </p>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold">Platform</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/tournaments" className="hover:text-foreground">
                    Tournaments
                  </Link>
                </li>
                <li>
                  <Link href="/auth/register" className="hover:text-foreground">
                    Sign Up
                  </Link>
                </li>
                <li>
                  <Link href="/auth/login" className="hover:text-foreground">
                    Login
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold">Features</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Auction System</li>
                <li>Match Scheduling</li>
                <li>Team Management</li>
              </ul>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>About</li>
                <li>Contact</li>
                <li>Privacy Policy</li>
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-border pt-6 text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} CricketTournament Pro. All rights
            reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
