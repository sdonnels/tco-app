import { motion } from "framer-motion";
import {
  AlertTriangle,
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

export default function TcoHome({
  onStartBaseline,
  onStartTour,
  drafts,
  onResumeDraft,
  onDeleteDraft,
}: TcoHomeProps) {
  return (
    <div className="grid gap-6" data-testid="home-root">
      <div className="grid gap-6 lg:grid-cols-2" data-testid="home-assessment-options">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <Card className="glass hairline rounded-2xl p-6 h-full flex flex-col">
            <Badge variant="secondary" className="w-fit rounded-full text-[10px]" data-testid="badge-free">
              Free Assessment
            </Badge>
            <h2 className="mt-3 text-xl font-serif tracking-tight" data-testid="text-baseline-title">
              Baseline Assessment
            </h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed flex-1" data-testid="text-baseline-desc">
              Establish a transparent, defensible TCO baseline for your current EUC environment.
              10–15 minutes. No solutions, no ROI — just the numbers.
            </p>

            <div className="mt-4 space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                Vendor-neutral, solution-agnostic
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-blue-500" />
                Every number traceable & defensible
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-amber-500" />
                All data stays in your browser
              </div>
            </div>

            <Button
              className="mt-5 w-full gap-2"
              onClick={onStartBaseline}
              data-testid="button-start-baseline"
            >
              Start Free Assessment <ArrowRight className="h-4 w-4" />
            </Button>
          </Card>
        </motion.div>

      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        >
          <Card className="glass hairline rounded-2xl p-6 h-full flex flex-col opacity-60 pointer-events-none select-none" data-testid="card-tour">
            <div className="flex items-start justify-between">
              <Badge variant="outline" className="rounded-full text-[10px]" data-testid="badge-guided">
                Guided Walkthrough
              </Badge>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </div>
            <h2 className="mt-3 text-xl font-serif tracking-tight" data-testid="text-tour-title">
              Interactive Tour
            </h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed flex-1" data-testid="text-tour-desc">
              Take a step-by-step guided tour of every section before entering data.
              Learn what each input means and how calculations flow.
            </p>

            <div className="mt-4 space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                Step-through walkthrough
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-yellow-500" />
                Highlights each section in context
              </div>
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-3.5 w-3.5 text-cyan-500" />
                No data required
              </div>
            </div>

            <Button disabled variant="outline" className="mt-5 w-full gap-2" data-testid="button-start-tour">
              Coming Soon <ArrowRight className="h-4 w-4" />
            </Button>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
        >
          <Card className="glass hairline rounded-2xl p-6 h-full flex flex-col opacity-60 pointer-events-none select-none" data-testid="card-pro-assessment">
            <div className="flex items-start justify-between">
              <Badge variant="outline" className="rounded-full text-[10px] border-amber-400 text-amber-600 dark:text-amber-400" data-testid="badge-pro">
                PRO Assessment
              </Badge>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </div>
            <h2 className="mt-4 font-serif text-2xl tracking-tight" data-testid="text-pro-title">
              PRO TCO Assessment
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground" data-testid="text-pro-desc">
              Comprehensive assessment with ROI, future-state modeling, and collaboration features.
            </p>

            <div className="mt-5 space-y-2">
              <div className="text-xs font-medium tracking-wide text-muted-foreground">Key Features</div>
              <div className="grid gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <span>Advanced ROI & TCO modeling</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="h-4 w-4 text-accent" />
                  <span>Future-state scenario planning</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-accent" />
                  <span>Multi-user collaboration</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Lock className="h-4 w-4 text-accent" />
                  <span>Secure cloud storage</span>
                </div>
              </div>
            </div>

            <Separator className="my-5" />

            <div className="space-y-3">
              <div className="text-xs font-medium tracking-wide text-muted-foreground">Guardrails</div>
              <div className="grid gap-2">
                <div className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Requires paid subscription</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <ClipboardCheck className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Google Cloud focus</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Lock className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Data retained for collaboration</span>
                </div>
              </div>
            </div>

            <Button disabled className="mt-6 w-full gap-2" size="lg" data-testid="button-start-pro">
              Coming Soon <ArrowRight className="h-4 w-4" />
            </Button>
          </Card>
        </motion.div>
      </div>

      {drafts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
        >
          <Card className="glass hairline rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3" data-testid="text-recent-activity-title">
              Recent Activity
            </h3>
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm" data-testid="table-recent-activity">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="text-left font-medium py-2 px-2">Client / Project</th>
                    <th className="text-left font-medium py-2 px-2 hidden sm:table-cell">Pack</th>
                    <th className="text-left font-medium py-2 px-2 hidden sm:table-cell">Last Modified</th>
                    <th className="text-left font-medium py-2 px-2">Status</th>
                    <th className="text-right font-medium py-2 px-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {drafts.map((draft) => (
                    <tr key={draft.id} className="border-b last:border-0" data-testid={`row-draft-${draft.id}`}>
                      <td className="py-2 px-2">
                        <div className="font-medium truncate max-w-[160px]">{draft.clientName || "Untitled"}</div>
                        {draft.projectName && (
                          <div className="text-xs text-muted-foreground truncate max-w-[160px]">{draft.projectName}</div>
                        )}
                      </td>
                      <td className="py-2 px-2 hidden sm:table-cell">
                        <Badge variant="secondary" className="text-[10px]">Baseline</Badge>
                      </td>
                      <td className="py-2 px-2 text-xs text-muted-foreground hidden sm:table-cell">
                        {formatDate(draft.lastModified)}
                      </td>
                      <td className="py-2 px-2">
                        {draft.status === "intake received" ? (
                          <Badge variant="outline" className="text-[10px] border-blue-400 text-blue-600 dark:text-blue-400">
                            intake received
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">
                            {draft.status || "draft"}
                          </Badge>
                        )}
                      </td>
                      <td className="py-2 px-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => onResumeDraft(draft.id)}
                            data-testid={`button-resume-${draft.id}`}
                          >
                            Resume
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-destructive hover:text-destructive"
                            onClick={() => onDeleteDraft(draft.id)}
                            data-testid={`button-delete-${draft.id}`}
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
          </Card>
        </motion.div>
      )}
    </div>
  );
}
