// components/HomePage/DynamicHomePage.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@heroui/react";
import {
  ArrowRight,
  Film,
  Users,
  CalendarHeart,
  UtensilsCrossed,
} from "lucide-react";

import InfiniteMovieScroll from "./InfiniteMovieScroll";
import PublicGroupsShowcase from "./PublicGroupsShowcase";
import DiscoveryPage from "../Discovery/DiscoveryPage";

import { useAuth } from "@/contexts/AuthContext";

const steps = [
  {
    icon: <Users className="h-6 w-6" />,
    title: "Gather your people",
    body: "Spin up a group and invite the friends who never miss a Monday.",
  },
  {
    icon: <Film className="h-6 w-6" />,
    title: "Pick, vote, watch",
    body: "Everyone takes a turn choosing three films. The group votes one in.",
  },
  {
    icon: <CalendarHeart className="h-6 w-6" />,
    title: "Cook, sip, remember",
    body: "Log the dinner and drinks, then look back on every Monday you've shared.",
  },
];

export default function DynamicHomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <DiscoveryPage />;
  }

  const scrollToGroups = () =>
    document
      .getElementById("public-groups")
      ?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="w-full">
      {/* ── Hero: poster wall behind a cinematic scrim ── */}
      <section className="relative flex min-h-[88vh] w-full items-center overflow-hidden">
        {/* Ambient scrolling poster wall */}
        <div className="absolute inset-0">
          <InfiniteMovieScroll />
        </div>
        {/* Scrims for legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40" />

        {/* Content */}
        <div className="container relative z-10 mx-auto px-6 py-20">
          <div className="max-w-2xl">
            <span className="mb-5 inline-block rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-sm font-semibold uppercase tracking-wide text-primary">
              A weekly tradition worth keeping
            </span>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-foreground md:text-6xl">
              Make Mondays the highlight of your week
            </h1>
            <p className="mt-6 max-w-xl text-lg text-default-600 md:text-xl">
              Movie Monday turns the worst night of the week into the one you
              look forward to: a film everyone votes on, a dinner you cook
              together, a drink to toast it, and a running history of every
              night you&apos;ve shared.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button
                as="a"
                href="/login"
                color="primary"
                size="lg"
                endContent={<ArrowRight className="h-4 w-4" />}
              >
                Start your group
              </Button>
              <Button
                variant="bordered"
                size="lg"
                onPress={scrollToGroups}
                startContent={<UtensilsCrossed className="h-4 w-4" />}
              >
                Peek at public groups
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Public groups showcase (try before you buy) ── */}
      <PublicGroupsShowcase />

      {/* ── How it works ── */}
      <section className="w-full border-t border-default-100 bg-content1 py-20">
        <div className="container mx-auto px-6">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            How Movie Monday works
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {steps.map((step, i) => (
              <div key={i} className="flex flex-col gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="text-default-600">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Closing CTA ── */}
      <section className="w-full bg-background py-24">
        <div className="container mx-auto px-6 text-center">
          <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            This Monday could be the start of something
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-default-600">
            Set up your group in a couple of minutes and never scramble for
            &quot;what should we watch&quot; again.
          </p>
          <Button
            as="a"
            href="/login"
            color="primary"
            size="lg"
            className="mt-8"
            endContent={<ArrowRight className="h-4 w-4" />}
          >
            Create your group
          </Button>
        </div>
      </section>
    </div>
  );
}
