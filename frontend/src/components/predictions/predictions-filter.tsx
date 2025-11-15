"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PredictionsFilterProps {
  filter: "all" | "active" | "won" | "lost";
  onFilterChange: (filter: "all" | "active" | "won" | "lost") => void;
}

export function PredictionsFilter({
  filter,
  onFilterChange,
}: PredictionsFilterProps) {
  const filters = [
    { id: "all" as const, label: "All" },
    { id: "active" as const, label: "Active" },
    { id: "won" as const, label: "Won" },
    { id: "lost" as const, label: "Lost" },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {filters.map((filterOption) => (
        <Button
          key={filterOption.id}
          onClick={() => onFilterChange(filterOption.id)}
          variant={filter === filterOption.id ? "default" : "outline"}
          className={cn(
            "whitespace-nowrap",
            filter === filterOption.id
              ? "bg-[#2563EB] text-white"
              : "bg-[#1E293B] border-[#334155] text-gray-400 hover:bg-[#334155]"
          )}
        >
          {filterOption.label}
        </Button>
      ))}
    </div>
  );
}
