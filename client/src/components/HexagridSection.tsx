import { useState } from "react";
import { ChevronDown, ChevronRight, Info, Link2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
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
      <div className="grid gap-4 md:grid-cols-2" data-testid="hexagrid-section">
        {vendorsData.map((pillarData) => {
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
                    const pKey = popoverKey(pillarData.pillar, sp.name);
                    const spEntries = entriesForSubPillar(pillarData.pillar, sp.name);
                    const selectedNames = spEntries.map((e) => e.vendorName);

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

                        {spEntries.map((entry) => (
                          <div
                            key={entry.id}
                            className="py-1 px-1.5 rounded-lg hover:bg-muted/40 transition-colors space-y-1"
                            data-testid={`vendor-row-${entry.id}`}
                          >
                            <div className="flex items-center gap-1.5">
                              <div className="min-w-0 flex-1 flex items-center gap-1">
                                {entry.isCustom ? (
                                  <Input
                                    className="h-7 text-xs font-medium"
                                    value={entry.vendorName}
                                    onChange={(e) =>
                                      updateEntry(entry.id, { vendorName: e.target.value })
                                    }
                                    placeholder="Custom vendor name"
                                    data-testid={`input-custom-name-${entry.id}`}
                                  />
                                ) : (
                                  <span className="text-xs font-medium truncate">
                                    {entry.vendorName}
                                  </span>
                                )}
                                {entry.url && (
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
                            <div className="flex items-center gap-1.5 pl-1">
                              <Input
                                className="w-[130px] shrink-0 h-7 text-xs"
                                type="text"
                                inputMode="numeric"
                                placeholder="Cost/Annual"
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
                              className="mt-1 h-6 text-[11px] gap-1 px-2"
                              data-testid={`button-add-vendor-${pillarData.pillar}-${sp.name}`}
                            >
                              <Plus className="h-3 w-3" />
                              Select vendor...
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[280px] p-0" align="start">
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
                                            added
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
