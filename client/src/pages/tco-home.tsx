import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Lock,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function TcoHome(props: { onStartBaseline: () => void }) {
  return (
    <div className="grid gap-6" data-testid="home-root">
      <div className="grid gap-6 lg:grid-cols-2" data-testid="home-assessment-options">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: 0.1, ease: "easeOut" }}
        >
          <Card className="glass hairline relative overflow-hidden rounded-3xl p-6">
            <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-primary/5 blur-2xl" />
            
            <div className="relative">
              <div className="flex items-center justify-between">
                <Badge
                  variant="default"
                  className="rounded-full"
                  data-testid="badge-baseline-free"
                >
                  Free Assessment
                </Badge>
                <Zap className="h-5 w-5 text-primary" />
              </div>

              <h2
                className="mt-4 font-serif text-2xl tracking-tight"
                data-testid="text-baseline-title"
              >
                Baseline TCO Assessment
              </h2>
              <p
                className="mt-2 text-sm leading-relaxed text-muted-foreground"
                data-testid="text-baseline-desc"
              >
                A rapid, vendor-neutral current-state baseline. Define what your
                environment costs today with transparent inputs, explicit assumptions, and
                defensible math.
              </p>

              <div className="mt-5 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>10–15 minute assessment</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>No data gathering required</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Instant baseline artifact export</span>
                </div>
              </div>

              <Separator className="my-5" />

              <div className="space-y-3">
                <div className="text-xs font-medium tracking-wide text-muted-foreground">
                  Guardrails
                </div>
                <div className="grid gap-2">
                  <div className="flex items-start gap-2 text-sm">
                    <Shield className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Baseline only — no ROI or future-state modeling
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Lock className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      All math traceable, assumptions explicit
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <ClipboardCheck className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Mirror reality, don't prescribe solutions
                    </span>
                  </div>
                </div>
              </div>

              <Button
                onClick={props.onStartBaseline}
                className="mt-6 w-full gap-2"
                size="lg"
                data-testid="button-start-baseline"
              >
                Start Baseline Assessment
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: 0.2, ease: "easeOut" }}
        >
          <Card className="glass hairline relative overflow-hidden rounded-3xl border-accent/30 p-6">
            <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-accent/5 blur-2xl" />
            
            <div className="relative">
              <div className="flex items-center justify-between">
                <Badge
                  variant="outline"
                  className="rounded-full border-accent/50 text-accent"
                  data-testid="badge-pro"
                >
                  Pro Assessment
                </Badge>
                <Sparkles className="h-5 w-5 text-accent" />
              </div>

              <h2
                className="mt-4 font-serif text-2xl tracking-tight"
                data-testid="text-pro-title"
              >
                Pro TCO Assessment
              </h2>
              <p
                className="mt-2 text-sm leading-relaxed text-muted-foreground"
                data-testid="text-pro-desc"
              >
                A comprehensive 30–60 day data-gathering engagement using Liquidware
                Stratosphere. Goes beyond baseline to identify optimization opportunities
                and waste reduction.
              </p>

              <div className="mt-5 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-accent" />
                  <span>Agent-based data collection</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-accent" />
                  <span>Detailed usage & performance metrics</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-accent" />
                  <span>Optimization & waste analysis</span>
                </div>
              </div>

              <Separator className="my-5" />

              <div className="space-y-3">
                <div className="text-xs font-medium tracking-wide text-muted-foreground">
                  Mandate
                </div>
                <div className="grid gap-2">
                  <div className="flex items-start gap-2 text-sm">
                    <Sparkles className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      "How might we optimize or reduce spend/waste?"
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Built on actual usage data, not assumptions
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <ClipboardCheck className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Includes future-state modeling
                    </span>
                  </div>
                </div>
              </div>

              <Button
                disabled
                variant="outline"
                className="mt-6 w-full gap-2"
                size="lg"
                data-testid="button-start-pro"
              >
                Coming Soon
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>

      <Card className="glass hairline rounded-3xl p-6">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl border bg-card shadow-sm">
            <ClipboardCheck className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium tracking-wide text-muted-foreground">
              Design Philosophy
            </div>
            <h3 className="mt-0.5 font-serif text-xl tracking-tight">
              Each assessment has a specific mandate
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              The <strong>Baseline Assessment</strong> establishes current-state truth
              without bias or optimization language. The <strong>Pro Assessment</strong>{" "}
              then builds on that foundation with real usage data to identify waste and
              optimization opportunities. They serve different purposes and should not be
              conflated.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
