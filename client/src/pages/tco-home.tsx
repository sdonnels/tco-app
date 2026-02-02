import { motion } from "framer-motion";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Lock,
  Shield,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

function Pill(props: {
  icon: React.ReactNode;
  title: string;
  description: string;
  testId: string;
}) {
  return (
    <div
      className="rounded-2xl border bg-card/60 px-4 py-3"
      data-testid={props.testId}
    >
      <div className="flex items-center gap-2">
        <div className="text-muted-foreground">{props.icon}</div>
        <div className="text-sm font-semibold" data-testid={`${props.testId}-title`}>
          {props.title}
        </div>
      </div>
      <div
        className="mt-1 text-xs leading-relaxed text-muted-foreground"
        data-testid={`${props.testId}-desc`}
      >
        {props.description}
      </div>
    </div>
  );
}

export default function TcoHome(props: {
  onStart: () => void;
  onOpenAssumptions: () => void;
  onOpenTrace: () => void;
}) {
  return (
    <div className="grid gap-6" data-testid="home-root">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <Card className="glass hairline rounded-3xl p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="secondary"
                  className="rounded-full"
                  data-testid="badge-home-neutral"
                >
                  Neutral / Unbiased View
                </Badge>
                <Badge
                  variant="outline"
                  className="rounded-full"
                  data-testid="badge-home-baseline"
                >
                  Baseline only
                </Badge>
                <Badge
                  variant="outline"
                  className="rounded-full"
                  data-testid="badge-home-no-roi"
                >
                  No ROI
                </Badge>
              </div>

              <h2
                className="mt-3 font-serif text-2xl tracking-tight sm:text-3xl"
                data-testid="text-home-title"
              >
                What this tool is (and isn't)
              </h2>
              <p
                className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground"
                data-testid="text-home-subtitle"
              >
                This produces a credible, defensible current-state TCO baseline for
                desktops and applications in an enterprise EUC environment. It's designed
                to support a micro-assessment conversation without turning into a sales
                artifact.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <Button
                onClick={props.onStart}
                className="gap-2"
                data-testid="button-home-start"
              >
                <ChevronRight className="h-4 w-4" /> Start baseline
              </Button>
              <div
                className="text-xs text-muted-foreground"
                data-testid="text-home-start-hint"
              >
                Takes ~10–13 minutes if data is handy.
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Pill
              icon={<Shield className="h-4 w-4" />}
              title="Vendor-neutral"
              description="No vendor comparisons. No optimization language. No hidden agenda."
              testId="pill-vendor-neutral"
            />
            <Pill
              icon={<Lock className="h-4 w-4" />}
              title="Traceable"
              description="Every number is explainable, with a visible basis (input or assumption)."
              testId="pill-traceable"
            />
            <Pill
              icon={<CheckCircle2 className="h-4 w-4" />}
              title="Assumption-backed"
              description="Unknowns are allowed. Assumptions are explicit and overrideable."
              testId="pill-assumption-backed"
            />
          </div>
        </Card>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3" data-testid="home-grid">
        <Card className="glass hairline rounded-3xl p-6 lg:col-span-2">
          <div className="flex items-start gap-3" data-testid="home-mandate">
            <div className="grid h-10 w-10 place-items-center rounded-xl border bg-card shadow-sm">
              <ClipboardCheck className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <div
                className="text-xs font-medium tracking-wide text-muted-foreground"
                data-testid="text-home-mandate-eyebrow"
              >
                Mandate
              </div>
              <h3
                className="mt-0.5 font-serif text-xl tracking-tight"
                data-testid="text-home-mandate-title"
              >
                Baseline first. Earn trust before math.
              </h3>
              <p
                className="mt-2 text-sm leading-relaxed text-muted-foreground"
                data-testid="text-home-mandate-body"
              >
                The purpose is to establish a single source of truth for what the
                environment actually costs today — with transparency over precision
                theater. No “what-if” scenarios, no future-state modeling, and no
                savings narrative until the baseline is solid, explainable, and trusted.
              </p>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="grid gap-4 sm:grid-cols-2" data-testid="home-is-isnt">
            <div
              className="rounded-2xl border bg-card/60 p-4"
              data-testid="card-what-this-is"
            >
              <div className="text-sm font-semibold" data-testid="text-what-is-title">
                What this is
              </div>
              <ul
                className="mt-3 space-y-2 text-sm text-muted-foreground"
                data-testid="list-what-is"
              >
                {[
                  "A current-state cost baseline",
                  "A structured conversation framework",
                  "A repeatable assessment instrument",
                  "A foundation for later future-state work (outside this tool)",
                ].map((t, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2"
                    data-testid={`listitem-what-is-${idx}`}
                  >
                    <span className="mt-0.5 text-primary">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div
              className="rounded-2xl border bg-card/60 p-4"
              data-testid="card-what-this-is-not"
            >
              <div
                className="text-sm font-semibold"
                data-testid="text-what-is-not-title"
              >
                What this is not
              </div>
              <ul
                className="mt-3 space-y-2 text-sm text-muted-foreground"
                data-testid="list-what-is-not"
              >
                {[
                  "A future-state design tool",
                  "An ROI or savings calculator",
                  "A vendor comparison matrix",
                  "A precision financial model down to the penny",
                ].map((t, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2"
                    data-testid={`listitem-what-is-not-${idx}`}
                  >
                    <span className="mt-0.5 text-muted-foreground">
                      <ChevronRight className="h-4 w-4" />
                    </span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>

        <Card className="glass hairline rounded-3xl p-6" data-testid="card-exec-howto">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl border bg-card shadow-sm">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <div
                className="text-xs font-medium tracking-wide text-muted-foreground"
                data-testid="text-exec-eyebrow"
              >
                Executive how-to
              </div>
              <h3
                className="mt-0.5 font-serif text-xl tracking-tight"
                data-testid="text-exec-title"
              >
                How to use this micro-assessment
              </h3>
              <p
                className="mt-2 text-sm leading-relaxed text-muted-foreground"
                data-testid="text-exec-body"
              >
                Fill known inputs first, then review assumptions used. Use the trace
                view to defend numbers in conversation. Export the baseline artifact
                when ready.
              </p>
            </div>
          </div>

          <Separator className="my-5" />

          <ol className="space-y-3" data-testid="list-steps">
            {[
              {
                t: "Enter what you know",
                d: "Device counts, support staffing, and any known annual spend.",
                action: (
                  <Button
                    variant="secondary"
                    className="h-8 rounded-xl px-3 text-xs"
                    onClick={props.onStart}
                    data-testid="button-step-inputs"
                  >
                    Open Inputs
                  </Button>
                ),
              },
              {
                t: "Review assumptions",
                d: "Validate or override only what's needed.",
                action: (
                  <Button
                    variant="secondary"
                    className="h-8 rounded-xl px-3 text-xs"
                    onClick={props.onOpenAssumptions}
                    data-testid="button-step-assumptions"
                  >
                    Open Assumptions
                  </Button>
                ),
              },
              {
                t: "Validate trace",
                d: "Confirm which lines are input vs assumed and why.",
                action: (
                  <Button
                    variant="secondary"
                    className="h-8 rounded-xl px-3 text-xs"
                    onClick={props.onOpenTrace}
                    data-testid="button-step-trace"
                  >
                    Open Trace
                  </Button>
                ),
              },
              {
                t: "Deliver baseline artifact",
                d: "Use Summary for client-safe view; export JSON for defensibility.",
                action: (
                  <div
                    className="text-xs text-muted-foreground"
                    data-testid="text-step-export"
                  >
                    Export lives in the header
                  </div>
                ),
              },
            ].map((s, idx) => (
              <li
                key={idx}
                className="rounded-2xl border bg-card/60 p-4"
                data-testid={`step-${idx}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div
                      className="text-sm font-semibold"
                      data-testid={`text-step-title-${idx}`}
                    >
                      {idx + 1}. {s.t}
                    </div>
                    <div
                      className="mt-1 text-xs leading-relaxed text-muted-foreground"
                      data-testid={`text-step-desc-${idx}`}
                    >
                      {s.d}
                    </div>
                  </div>
                  <div className="shrink-0">{s.action}</div>
                </div>
              </li>
            ))}
          </ol>

          <div
            className="mt-5 rounded-2xl border bg-card/70 p-4"
            data-testid="panel-end-result"
          >
            <div className="text-sm font-semibold" data-testid="text-end-result-title">
              End result
            </div>
            <div
              className="mt-1 text-sm leading-relaxed text-muted-foreground"
              data-testid="text-end-result-body"
            >
              A single, current-state baseline you can stand behind live — with a
              client-safe summary and a traceable export that shows assumptions and
              input coverage.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
