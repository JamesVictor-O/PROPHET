"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useState } from "react";

interface SearchFiltersProps {
  onSearchChange: (value: string) => void;
  onCategoryChange: (category: string) => void;
}

const categories = ["All", "Music", "Movies", "Reality TV", "Awards"];

export function SearchFilters({
  onSearchChange,
  onCategoryChange,
}: SearchFiltersProps) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchValue, setSearchValue] = useState("");

  const handleCategoryClick = (category: string) => {
    setActiveCategory(category);
    onCategoryChange(category);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    onSearchChange(value);
  };

  return (
    <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:gap-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Search markets..."
          value={searchValue}
          onChange={handleSearchChange}
          className="w-full bg-[#1E293B] border-[#334155] rounded-lg pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm focus:border-[#2563EB]"
        />
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {categories.map((category) => (
          <Button
            key={category}
            onClick={() => handleCategoryClick(category)}
            variant={activeCategory === category ? "default" : "outline"}
            size="sm"
            className={`whitespace-nowrap shrink-0 text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4 ${
              activeCategory === category
                ? "bg-[#2563EB] text-white"
                : "bg-[#1E293B] border-[#334155] text-gray-400 hover:bg-[#334155]"
            }`}
          >
            {category}
          </Button>
        ))}
      </div>
    </div>
  );
}
