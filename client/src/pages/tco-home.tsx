import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Lock,
  Shield,
  Sparkles,
  Zap,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { DraftMeta } from "@/lib/drafts";

interface TcoHomeProps {
  onStartBaseline: () => void;
  onStartTour?: () => void;
  drafts: DraftMeta[];
  onResumeDraft: (id: string) => void;
  onDeleteDraft: (id: string) => void;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

export default function TcoHome({ onStartBaseline, onStartTour, drafts, onResumeDraft, onDeleteDraft }: TcoHomeProps) {
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

              <div className="mt-6 flex flex-col gap-2">
                <Button
                  onClick={onStartBaseline}
                  className="w-full gap-2"
                  size="lg"
                  data-testid="button-start-baseline"
                >
                  Start Baseline Assessment
                  <ArrowRight className="h-4 w-4" />
                </Button>
                {onStartTour && (
                  <Button
                    variant="outline"
                    onClick={onStartTour}
                    className="w-full gap-2"
                    size="sm"
                    data-testid="button-take-tour"
                  >
                    Take a Quick Tour
                  </Button>
                )}
              </div>
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

      {drafts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
          data-testid="recent-activity-section"
        >
          <h2 className="mb-3 text-lg font-semibold tracking-tight" data-testid="text-recent-activity-title">
            Recent Activity
          </h2>
          <div className="rounded-2xl border bg-card/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="table-recent-activity">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Client / Project
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Pack
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Last Modified
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {drafts.map((draft) => (
                    <tr
                      key={draft.id}
                      className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                      data-testid={`draft-row-${draft.id}`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium" data-testid={`draft-client-${draft.id}`}>
                          {draft.clientName || "Untitled"}
                        </div>
                        {draft.projectName && (
                          <div className="text-xs text-muted-foreground" data-testid={`draft-project-${draft.id}`}>
                            {draft.projectName}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {draft.pack}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(draft.lastModified)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
                          data-testid={`draft-status-${draft.id}`}
                        >
                          draft
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs px-3"
                            onClick={() => onResumeDraft(draft.id)}
                            data-testid={`button-resume-${draft.id}`}
                          >
                            Resume
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => onDeleteDraft(draft.id)}
                            data-testid={`button-delete-draft-${draft.id}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
