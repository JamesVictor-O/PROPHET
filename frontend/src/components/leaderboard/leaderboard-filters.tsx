"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LeaderboardFiltersProps {
  timeFilter: "all" | "month" | "week";
  categoryFilter: string;
  onTimeFilterChange: (filter: "all" | "month" | "week") => void;
  onCategoryFilterChange: (filter: string) => void;
}

export function LeaderboardFilters({
  timeFilter,
  categoryFilter,
  onTimeFilterChange,
  onCategoryFilterChange,
}: LeaderboardFiltersProps) {
  const timeFilters = [
    { id: "all" as const, label: "All Time" },
    { id: "month" as const, label: "This Month" },
    { id: "week" as const, label: "This Week" },
  ];

  const categories = ["All", "Music", "Movies", "Reality TV", "Awards"];

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      {/* Time Filter */}
      <div className="flex flex-wrap sm:flex-nowrap gap-2 overflow-x-auto sm:overflow-visible pb-1 sm:pb-0 scrollbar-hide -mx-1 px-1">
        {timeFilters.map((filter) => (
          <Button
            key={filter.id}
            onClick={() => onTimeFilterChange(filter.id)}
            variant={timeFilter === filter.id ? "default" : "outline"}
            size="sm"
            className={cn(
              "whitespace-nowrap text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4 shrink-0",
              timeFilter === filter.id
                ? "bg-[#2563EB] text-white"
                : "bg-[#1E293B] border-dark-700 text-gray-400 hover:bg-dark-700"
            )}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap sm:flex-nowrap gap-2 overflow-x-auto sm:overflow-visible pb-1 sm:pb-0 scrollbar-hide -mx-1 px-1">
        {categories.map((category) => (
          <Button
            key={category}
            onClick={() => onCategoryFilterChange(category.toLowerCase())}
            variant={
              categoryFilter === category.toLowerCase() ? "default" : "outline"
            }
            size="sm"
            className={cn(
              "whitespace-nowrap text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4 shrink-0",
              categoryFilter === category.toLowerCase()
                ? "bg-[#2563EB] text-white"
                : "bg-[#1E293B] border-dark-700 text-gray-400 hover:bg-dark-700"
            )}
          >
            {category}
          </Button>
        ))}
      </div>
    </div>
  );
}
