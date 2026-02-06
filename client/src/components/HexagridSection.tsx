import { useState } from "react";
import { Info, Link2, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import vendorsData from "@/data/vendors.json";

export type HexagridEntry = {
  id: string;
  pillar: string;
  subPillar: string;
  vendorName: string;
  url?: string;
  yearlyCost?: number;
  notes?: string;
  isCustom: boolean;
};

type HexagridSectionProps = {
  entries: HexagridEntry[];
  onChange: (entries: HexagridEntry[]) => void;
};

function fmtMoney(v: number) {
  return v.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function HexagridSection({ entries, onChange }: HexagridSectionProps) {
  const [openPopovers, setOpenPopovers] = useState<Record<string, boolean>>({});
  const [collapsedPillars, setCollapsedPillars] = useState<Record<string, boolean>>({});

  const togglePillar = (pillar: string) => {
    setCollapsedPillars((prev) => ({ ...prev, [pillar]: !prev[pillar] }));
  };

  const popoverKey = (pillar: string, subPillar: string) => `${pillar}::${subPillar}`;

  const setPopoverOpen = (key: string, open: boolean) => {
    setOpenPopovers((prev) => ({ ...prev, [key]: open }));
  };

  const addEntry = (
    pillar: string,
    subPillar: string,
    vendorName: string,
    url?: string,
    isCustom = false,
  ) => {
    const newEntry: HexagridEntry = {
      id: crypto.randomUUID(),
      pillar,
      subPillar,
      vendorName,
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
      <div className="space-y-4" data-testid="hexagrid-section">
        {vendorsData.map((pillarData, pillarIdx) => {
          const collapsed = collapsedPillars[pillarData.pillar] ?? false;
          const subtotal = pillarSubtotal(pillarData.pillar);
          const hasEntriesWithCost = entriesForPillar(pillarData.pillar).some(
            (e) => e.yearlyCost !== undefined && e.yearlyCost > 0,
          );

          return (
            <div key={pillarData.pillar}>
              <div
                className="rounded-2xl border bg-card/60 p-4"
                data-testid={`pillar-section-${pillarData.pillar}`}
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between text-left"
                  onClick={() => togglePillar(pillarData.pillar)}
                  data-testid={`pillar-toggle-${pillarData.pillar}`}
                >
                  <div>
                    <h3 className="text-base font-semibold">{pillarData.pillar}</h3>
                    <p className="text-xs text-muted-foreground">{pillarData.description}</p>
                  </div>
                  <span
                    className={cn(
                      "ml-2 shrink-0 text-muted-foreground transition-transform",
                      collapsed ? "" : "rotate-90",
                    )}
                  >
                    ▶
                  </span>
                </button>

                {!collapsed && (
                  <div className="mt-3 space-y-3">
                    {pillarData.sub_pillars.map((sp) => {
                      const pKey = popoverKey(pillarData.pillar, sp.name);
                      const spEntries = entriesForSubPillar(pillarData.pillar, sp.name);
                      const selectedNames = spEntries.map((e) => e.vendorName);

                      return (
                        <div
                          key={sp.name}
                          className="ml-2 border-l-2 border-muted pl-4 py-2"
                          data-testid={`subpillar-section-${pillarData.pillar}-${sp.name}`}
                        >
                          <div className="flex items-center gap-1.5 mb-2">
                            <span className="text-sm font-medium">{sp.name}</span>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info
                                  className="h-4 w-4 text-muted-foreground cursor-help"
                                  data-testid={`info-icon-${sp.name}`}
                                />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs bg-slate-900 text-white text-xs p-2 rounded-lg shadow-lg border border-slate-700">
                                {sp.description}
                              </TooltipContent>
                            </Tooltip>
                          </div>

                          {spEntries.map((entry) => (
                            <div
                              key={entry.id}
                              className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/40 transition-colors"
                              data-testid={`vendor-row-${entry.id}`}
                            >
                              <div className="min-w-[180px] flex items-center gap-1.5">
                                {entry.isCustom ? (
                                  <Input
                                    className="h-7 text-sm font-medium w-[160px]"
                                    value={entry.vendorName}
                                    onChange={(e) =>
                                      updateEntry(entry.id, { vendorName: e.target.value })
                                    }
                                    placeholder="Custom vendor name"
                                    data-testid={`input-custom-name-${entry.id}`}
                                  />
                                ) : (
                                  <span className="text-sm font-medium truncate">
                                    {entry.vendorName}
                                  </span>
                                )}
                                {entry.url && (
                                  <a
                                    href={entry.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-muted-foreground hover:text-foreground"
                                    data-testid={`link-vendor-${entry.id}`}
                                  >
                                    <Link2 className="h-3.5 w-3.5" />
                                  </a>
                                )}
                              </div>

                              <Input
                                className="w-[130px] h-7 text-sm"
                                type="text"
                                inputMode="numeric"
                                placeholder="(optional)"
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
                                className="flex-1 h-7 text-sm"
                                placeholder="Assumptions/License details..."
                                value={entry.notes ?? ""}
                                onChange={(e) =>
                                  updateEntry(entry.id, {
                                    notes: e.target.value || undefined,
                                  })
                                }
                                data-testid={`input-notes-${entry.id}`}
                              />

                              <Button
                                variant="ghost"
                                size="icon"
                                className="shrink-0 h-7 w-7"
                                onClick={() => removeEntry(entry.id)}
                                data-testid={`button-delete-${entry.id}`}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}

                          <Popover
                            open={openPopovers[pKey] ?? false}
                            onOpenChange={(open) => setPopoverOpen(pKey, open)}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-1 h-7 text-xs gap-1"
                                data-testid={`button-add-vendor-${pillarData.pillar}-${sp.name}`}
                              >
                                <Plus className="h-3.5 w-3.5" />
                                Select vendor...
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[260px] p-0" align="start">
                              <Command>
                                <CommandInput placeholder="Search vendors..." />
                                <CommandList>
                                  <CommandEmpty>No vendor found.</CommandEmpty>
                                  <CommandGroup>
                                    {sp.vendors.map((v) => {
                                      const isSelected = selectedNames.includes(v.name);
                                      return (
                                        <CommandItem
                                          key={v.name}
                                          value={v.name}
                                          onSelect={() => {
                                            addEntry(
                                              pillarData.pillar,
                                              sp.name,
                                              v.name,
                                              v.url,
                                              false,
                                            );
                                            setPopoverOpen(pKey, false);
                                          }}
                                          className={cn(isSelected && "opacity-60")}
                                          data-testid={`vendor-option-${v.name}`}
                                        >
                                          {v.name}
                                          {isSelected && (
                                            <span className="ml-auto text-xs text-muted-foreground">
                                              ✓
                                            </span>
                                          )}
                                        </CommandItem>
                                      );
                                    })}
                                    <CommandItem
                                      value="Other..."
                                      onSelect={() => {
                                        addEntry(
                                          pillarData.pillar,
                                          sp.name,
                                          "",
                                          undefined,
                                          true,
                                        );
                                        setPopoverOpen(pKey, false);
                                      }}
                                      data-testid={`vendor-option-other-${pillarData.pillar}-${sp.name}`}
                                    >
                                      Other...
                                    </CommandItem>
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                      );
                    })}

                    {hasEntriesWithCost && (
                      <div
                        className="flex justify-end pt-2 pr-2 text-sm font-medium"
                        data-testid={`pillar-subtotal-${pillarData.pillar}`}
                      >
                        Pillar subtotal: {fmtMoney(subtotal)}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {pillarIdx < vendorsData.length - 1 && <Separator className="my-4" />}
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
