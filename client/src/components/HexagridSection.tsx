import { useState } from "react";
import { ChevronDown, ChevronRight, Info, Link2, Plus, X, AlertTriangle, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import vendorsData from "@/data/vendors.json";

type VendorPlatformVersion = {
  name: string;
  scoringFlag?: string;
};

type VendorPlatform = {
  name: string;
  scoringFlag?: string;
  versions?: VendorPlatformVersion[];
};

type VendorDef = {
  name: string;
  url: string;
  scoringFlag?: string;
  platforms: VendorPlatform[];
};

type SubPillarDef = {
  name: string;
  description: string;
  hasOtherWithSwot?: boolean;
  vendors: VendorDef[];
};

type PillarDef = {
  pillar: string;
  description: string;
  sub_pillars: SubPillarDef[];
};

export type HexagridEntry = {
  id: string;
  pillar: string;
  subPillar: string;
  vendorName: string;
  platform?: string;
  version?: string;
  scoringFlag?: string;
  url?: string;
  yearlyCost?: number;
  notes?: string;
  isCustom: boolean;
  customProductName?: string;
  swotOverride?: string;
  licenseCount?: number;
  licenseSku?: string;
};

type VdiUserCounts = {
  daas?: number;
  vdi?: number;
};

type HexagridSectionProps = {
  entries: HexagridEntry[];
  onChange: (entries: HexagridEntry[]) => void;
  vdiUserCounts?: VdiUserCounts;
  onVdiUserCountsChange?: (counts: VdiUserCounts) => void;
};

function fmtMoney(v: number) {
  return v.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function ScoringBadge({ flag }: { flag: string }) {
  const colors: Record<string, string> = {
    "Critical Risk": "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800",
    "Aging / Risk": "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    "Legacy": "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200 dark:border-orange-800",
  };
  const icons: Record<string, React.ReactNode> = {
    "Critical Risk": <AlertCircle className="h-3 w-3" />,
    "Aging / Risk": <AlertTriangle className="h-3 w-3" />,
    "Legacy": <Clock className="h-3 w-3" />,
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border",
        colors[flag] || "bg-gray-100 text-gray-700 border-gray-200"
      )}
      data-testid={`scoring-badge-${flag}`}
    >
      {icons[flag]}
      {flag}
    </span>
  );
}

function resolveScoringFlag(
  vendorDef: VendorDef | undefined,
  platformDef: VendorPlatform | undefined,
  versionDef: VendorPlatformVersion | undefined
): string | undefined {
  if (versionDef?.scoringFlag) return versionDef.scoringFlag;
  if (platformDef?.scoringFlag) return platformDef.scoringFlag;
  if (vendorDef?.scoringFlag) return vendorDef.scoringFlag;
  return undefined;
}

const VDI_SUBPILLARS = ["DaaS (Cloud PC / Hosted Desktop)", "VDI (On-Premises)"];

const LICENSE_EXCLUDED_SUBPILLARS = new Set([
  "PC, AI, Mobile Hardware",
  "Endpoint OS",
]);

export function HexagridSection({ entries, onChange, vdiUserCounts, onVdiUserCountsChange }: HexagridSectionProps) {
  const [collapsedPillars, setCollapsedPillars] = useState<Record<string, boolean>>({});
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [pendingVendor, setPendingVendor] = useState<string>("");
  const [pendingPlatform, setPendingPlatform] = useState<string>("");
  const [pendingVersion, setPendingVersion] = useState<string>("");

  const typedData = vendorsData as PillarDef[];

  const togglePillar = (pillar: string) => {
    setCollapsedPillars((prev) => ({ ...prev, [pillar]: !prev[pillar] }));
  };

  const addKey = (pillar: string, subPillar: string) => `${pillar}::${subPillar}`;

  const resetPending = () => {
    setPendingVendor("");
    setPendingPlatform("");
    setPendingVersion("");
  };

  const startAdding = (key: string) => {
    setAddingTo(key);
    resetPending();
  };

  const cancelAdding = () => {
    setAddingTo(null);
    resetPending();
  };

  const addEntry = (
    pillar: string,
    subPillar: string,
    vendorName: string,
    platform: string | undefined,
    version: string | undefined,
    scoringFlag: string | undefined,
    url: string | undefined,
    isCustom = false,
  ) => {
    const displayName = [vendorName, platform, version].filter(Boolean).join(" — ");
    const newEntry: HexagridEntry = {
      id: crypto.randomUUID(),
      pillar,
      subPillar,
      vendorName: isCustom ? "" : displayName,
      platform,
      version,
      scoringFlag,
      url,
      isCustom,
    };
    onChange([...entries, newEntry]);
  };

  const removeEntry = (id: string) => {
    onChange(entries.filter((e) => e.id !== id));
  };

  const updateEntry = (id: string, updates: Partial<HexagridEntry>) => {
    onChange(entries.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  };

  const entriesForSubPillar = (pillar: string, subPillar: string) =>
    entries.filter((e) => e.pillar === pillar && e.subPillar === subPillar);

  const entriesForPillar = (pillar: string) =>
    entries.filter((e) => e.pillar === pillar);

  const pillarSubtotal = (pillar: string) =>
    entriesForPillar(pillar).reduce((sum, e) => sum + (e.yearlyCost ?? 0), 0);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="grid gap-4 md:grid-cols-2" data-testid="hexagrid-section">
        {typedData.map((pillarData) => {
          const collapsed = collapsedPillars[pillarData.pillar] ?? false;
          const subtotal = pillarSubtotal(pillarData.pillar);
          const hasEntriesWithCost = entriesForPillar(pillarData.pillar).some(
            (e) => e.yearlyCost !== undefined && e.yearlyCost > 0,
          );

          return (
            <div
              key={pillarData.pillar}
              className="rounded-2xl border bg-card/60 p-3"
              data-testid={`pillar-section-${pillarData.pillar}`}
            >
              <button
                type="button"
                className="flex w-full items-center justify-between text-left"
                onClick={() => togglePillar(pillarData.pillar)}
                data-testid={`pillar-toggle-${pillarData.pillar}`}
              >
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold">{pillarData.pillar}</h3>
                  <p className="text-[11px] text-muted-foreground leading-tight">{pillarData.description}</p>
                </div>
                <span className="ml-2 shrink-0 text-muted-foreground">
                  {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </span>
              </button>

              {!collapsed && (
                <div className="mt-2 space-y-2">
                  {pillarData.sub_pillars.map((sp) => {
                    const aKey = addKey(pillarData.pillar, sp.name);
                    const spEntries = entriesForSubPillar(pillarData.pillar, sp.name);
                    const isAdding = addingTo === aKey;

                    const vendorDef = sp.vendors.find((v) => v.name === pendingVendor);
                    const hasPlatforms = vendorDef && vendorDef.platforms.length > 0;
                    const platformDef = vendorDef?.platforms.find((p) => p.name === pendingPlatform);
                    const hasVersions = platformDef && platformDef.versions && platformDef.versions.length > 0;

                    return (
                      <div
                        key={sp.name}
                        className="ml-1 border-l-2 border-muted pl-3 py-1.5"
                        data-testid={`subpillar-section-${pillarData.pillar}-${sp.name}`}
                      >
                        <div className="flex items-center gap-1 mb-1.5">
                          <span className="text-xs font-medium">{sp.name}</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info
                                className="h-3.5 w-3.5 text-muted-foreground cursor-help"
                                data-testid={`info-icon-${sp.name}`}
                              />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs bg-slate-900 text-white text-xs p-2 rounded-lg shadow-lg border border-slate-700">
                              {sp.description}
                            </TooltipContent>
                          </Tooltip>
                        </div>

                        {VDI_SUBPILLARS.includes(sp.name) && vdiUserCounts && onVdiUserCountsChange && (
                          <div className="mb-2 flex items-center gap-2">
                            <label className="text-[11px] text-muted-foreground whitespace-nowrap">
                              VDI/DaaS users
                            </label>
                            <Input
                              className="w-[100px] h-7 text-xs"
                              type="text"
                              inputMode="numeric"
                              placeholder="e.g., 200"
                              value={
                                (sp.name.startsWith("DaaS") ? vdiUserCounts.daas : vdiUserCounts.vdi) === undefined
                                  ? ""
                                  : String(sp.name.startsWith("DaaS") ? vdiUserCounts.daas : vdiUserCounts.vdi)
                              }
                              onChange={(e) => {
                                const raw = e.target.value;
                                const key = sp.name.startsWith("DaaS") ? "daas" : "vdi";
                                if (raw.trim() === "") {
                                  onVdiUserCountsChange({ ...vdiUserCounts, [key]: undefined });
                                  return;
                                }
                                const next = Number(raw);
                                if (!Number.isFinite(next) || next < 0) return;
                                onVdiUserCountsChange({ ...vdiUserCounts, [key]: next });
                              }}
                              data-testid={`input-vdi-users-${sp.name.startsWith("DaaS") ? "daas" : "vdi"}`}
                            />
                          </div>
                        )}

                        {spEntries.map((entry) => (
                          <div
                            key={entry.id}
                            className="py-1 px-1.5 rounded-lg hover:bg-muted/40 transition-colors space-y-1"
                            data-testid={`vendor-row-${entry.id}`}
                          >
                            <div className="flex items-center gap-1.5">
                              <div className="min-w-0 flex-1 flex items-center gap-1 flex-wrap">
                                {entry.isCustom ? (
                                  <div className="flex gap-1 flex-1 min-w-0">
                                    <Input
                                      className="h-7 text-xs font-medium flex-1 min-w-[100px]"
                                      value={entry.vendorName}
                                      onChange={(e) =>
                                        updateEntry(entry.id, { vendorName: e.target.value })
                                      }
                                      placeholder="Vendor name"
                                      data-testid={`input-custom-name-${entry.id}`}
                                    />
                                    <Input
                                      className="h-7 text-xs font-medium flex-1 min-w-[100px]"
                                      value={entry.customProductName ?? ""}
                                      onChange={(e) =>
                                        updateEntry(entry.id, { customProductName: e.target.value || undefined })
                                      }
                                      placeholder="Product name"
                                      data-testid={`input-custom-product-${entry.id}`}
                                    />
                                  </div>
                                ) : (
                                  <span className="text-xs font-medium truncate">
                                    {entry.vendorName}
                                  </span>
                                )}
                                {entry.scoringFlag && <ScoringBadge flag={entry.scoringFlag} />}
                                {entry.url && !entry.isCustom && (
                                  <a
                                    href={entry.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-muted-foreground hover:text-foreground shrink-0"
                                    data-testid={`link-vendor-${entry.id}`}
                                  >
                                    <Link2 className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="shrink-0 h-7 w-7"
                                onClick={() => removeEntry(entry.id)}
                                data-testid={`button-delete-${entry.id}`}
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                            {entry.isCustom && sp.hasOtherWithSwot && (
                              <div className="pl-1">
                                <Select
                                  value={entry.swotOverride ?? ""}
                                  onValueChange={(val) =>
                                    updateEntry(entry.id, { swotOverride: val || undefined })
                                  }
                                >
                                  <SelectTrigger className="h-7 text-xs w-[160px]" data-testid={`select-swot-${entry.id}`}>
                                    <SelectValue placeholder="SWOT rating..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Strength">Strength</SelectItem>
                                    <SelectItem value="Weakness">Weakness</SelectItem>
                                    <SelectItem value="Opportunity">Opportunity</SelectItem>
                                    <SelectItem value="Threat">Threat</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 pl-1 pt-0.5">
                              <span className="text-[10px] text-muted-foreground whitespace-nowrap w-[52px] shrink-0">Cost</span>
                              <Input
                                className="w-[90px] shrink-0 h-7 text-xs"
                                type="text"
                                inputMode="numeric"
                                placeholder="Annual $"
                                value={
                                  entry.yearlyCost === undefined ? "" : String(entry.yearlyCost)
                                }
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  if (raw.trim() === "") {
                                    updateEntry(entry.id, { yearlyCost: undefined });
                                    return;
                                  }
                                  const next = Number(raw);
                                  if (!Number.isFinite(next)) return;
                                  updateEntry(entry.id, { yearlyCost: next });
                                }}
                                data-testid={`input-cost-${entry.id}`}
                              />
                              <Input
                                className="flex-1 min-w-0 h-7 text-xs"
                                placeholder="Notes"
                                value={entry.notes ?? ""}
                                onChange={(e) =>
                                  updateEntry(entry.id, {
                                    notes: e.target.value || undefined,
                                  })
                                }
                                data-testid={`input-notes-${entry.id}`}
                              />
                            </div>
                            {!LICENSE_EXCLUDED_SUBPILLARS.has(entry.subPillar) && (
                              <div className="flex items-center gap-1.5 pl-1 pt-0.5">
                                <span className="text-[10px] text-muted-foreground whitespace-nowrap w-[52px] shrink-0">Licensing</span>
                                <Input
                                  className="w-[90px] shrink-0 h-7 text-xs"
                                  type="text"
                                  inputMode="numeric"
                                  placeholder="Count"
                                  value={
                                    entry.licenseCount === undefined ? "" : String(entry.licenseCount)
                                  }
                                  onChange={(e) => {
                                    const raw = e.target.value;
                                    if (raw.trim() === "") {
                                      updateEntry(entry.id, { licenseCount: undefined });
                                      return;
                                    }
                                    const next = Number(raw);
                                    if (!Number.isFinite(next)) return;
                                    updateEntry(entry.id, { licenseCount: next });
                                  }}
                                  data-testid={`input-license-count-${entry.id}`}
                                />
                                <Input
                                  className="flex-1 min-w-0 h-7 text-xs"
                                  placeholder="SKU / Plan name"
                                  value={entry.licenseSku ?? ""}
                                  onChange={(e) =>
                                    updateEntry(entry.id, {
                                      licenseSku: e.target.value || undefined,
                                    })
                                  }
                                  data-testid={`input-license-sku-${entry.id}`}
                                />
                              </div>
                            )}
                          </div>
                        ))}

                        {isAdding ? (
                          <div
                            className="mt-1 p-2 rounded-lg border border-dashed border-primary/30 bg-muted/20 space-y-1.5"
                            data-testid={`add-form-${aKey}`}
                          >
                            <Select
                              value={pendingVendor}
                              onValueChange={(val) => {
                                if (val === "__other__") {
                                  addEntry(pillarData.pillar, sp.name, "", undefined, undefined, undefined, undefined, true);
                                  cancelAdding();
                                  return;
                                }
                                setPendingVendor(val);
                                setPendingPlatform("");
                                setPendingVersion("");
                              }}
                            >
                              <SelectTrigger className="h-7 text-xs" data-testid={`select-vendor-${aKey}`}>
                                <SelectValue placeholder="Select vendor..." />
                              </SelectTrigger>
                              <SelectContent>
                                {sp.vendors.map((v) => (
                                  <SelectItem key={v.name} value={v.name}>
                                    {v.name}
                                  </SelectItem>
                                ))}
                                <SelectItem value="__other__">Other...</SelectItem>
                              </SelectContent>
                            </Select>

                            {pendingVendor && hasPlatforms && (
                              <Select
                                value={pendingPlatform}
                                onValueChange={(val) => {
                                  setPendingPlatform(val);
                                  setPendingVersion("");
                                }}
                              >
                                <SelectTrigger className="h-7 text-xs" data-testid={`select-platform-${aKey}`}>
                                  <SelectValue placeholder="Select platform..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {vendorDef!.platforms.map((p) => (
                                    <SelectItem key={p.name} value={p.name}>
                                      {p.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}

                            {pendingPlatform && hasVersions && (
                              <Select
                                value={pendingVersion}
                                onValueChange={(val) => {
                                  setPendingVersion(val);
                                }}
                              >
                                <SelectTrigger className="h-7 text-xs" data-testid={`select-version-${aKey}`}>
                                  <SelectValue placeholder="Select version..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {platformDef!.versions!.map((v) => (
                                    <SelectItem key={v.name} value={v.name}>
                                      {v.name}
                                      {v.scoringFlag && (
                                        <span className="ml-1 text-[10px] text-red-500">⚠ {v.scoringFlag}</span>
                                      )}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}

                            <div className="flex gap-1.5 pt-0.5">
                              <Button
                                variant="default"
                                size="sm"
                                className="h-6 text-[11px] px-2"
                                disabled={
                                  !pendingVendor ||
                                  (hasPlatforms && !pendingPlatform) ||
                                  (hasVersions && !pendingVersion)
                                }
                                onClick={() => {
                                  const vDef = sp.vendors.find((v) => v.name === pendingVendor);
                                  const pDef = vDef?.platforms.find((p) => p.name === pendingPlatform);
                                  const verDef = pDef?.versions?.find((v) => v.name === pendingVersion);
                                  const flag = resolveScoringFlag(vDef, pDef, verDef);
                                  addEntry(
                                    pillarData.pillar,
                                    sp.name,
                                    pendingVendor,
                                    pendingPlatform || undefined,
                                    pendingVersion || undefined,
                                    flag,
                                    vDef?.url,
                                    false,
                                  );
                                  cancelAdding();
                                }}
                                data-testid={`button-confirm-add-${aKey}`}
                              >
                                Add
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-[11px] px-2"
                                onClick={cancelAdding}
                                data-testid={`button-cancel-add-${aKey}`}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-1 h-6 text-[11px] gap-1 px-2"
                            onClick={() => startAdding(aKey)}
                            data-testid={`button-add-vendor-${pillarData.pillar}-${sp.name}`}
                          >
                            <Plus className="h-3 w-3" />
                            Select vendor...
                          </Button>
                        )}
                      </div>
                    );
                  })}

                  {hasEntriesWithCost && (
                    <div
                      className="flex justify-end pt-1 pr-1 text-xs font-medium"
                      data-testid={`pillar-subtotal-${pillarData.pillar}`}
                    >
                      Pillar subtotal: {fmtMoney(subtotal)}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
