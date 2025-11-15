"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, Info } from "lucide-react";
import { useState } from "react";

interface CreateMarketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateMarket: (market: MarketData) => void;
}

export interface MarketData {
  question: string;
  category: string;
  description: string;
  endDate: string;
  resolutionCriteria: string;
  initialStake?: number;
}

const categories = [
  { value: "music", label: "Music", color: "bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20" },
  { value: "movies", label: "Movies", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  { value: "reality-tv", label: "Reality TV", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  { value: "awards", label: "Awards", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  { value: "sports", label: "Sports", color: "bg-green-500/10 text-green-400 border-green-500/20" },
  { value: "other", label: "Other", color: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
];

export function CreateMarketModal({
  open,
  onOpenChange,
  onCreateMarket,
}: CreateMarketModalProps) {
  const [formData, setFormData] = useState<MarketData>({
    question: "",
    category: "",
    description: "",
    endDate: "",
    resolutionCriteria: "",
    initialStake: 0,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof MarketData, string>>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof MarketData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value }));
    if (errors.category) {
      setErrors((prev) => ({ ...prev, category: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof MarketData, string>> = {};

    if (!formData.question.trim()) {
      newErrors.question = "Question is required";
    }
    if (!formData.category) {
      newErrors.category = "Category is required";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }
    if (!formData.endDate) {
      newErrors.endDate = "End date is required";
    } else {
      const endDate = new Date(formData.endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (endDate <= today) {
        newErrors.endDate = "End date must be in the future";
      }
    }
    if (!formData.resolutionCriteria.trim()) {
      newErrors.resolutionCriteria = "Resolution criteria is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onCreateMarket(formData);
      // Reset form
      setFormData({
        question: "",
        category: "",
        description: "",
        endDate: "",
        resolutionCriteria: "",
        initialStake: 0,
      });
      setErrors({});
      onOpenChange(false);
    }
  };

  const selectedCategory = categories.find((cat) => cat.value === formData.category);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1E293B] border-[#334155] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Create New Market</DialogTitle>
          <DialogDescription className="text-gray-400">
            Create a prediction market for others to participate in
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Question */}
          <div className="space-y-2">
            <Label htmlFor="question" className="text-sm font-medium">
              Market Question *
            </Label>
            <Input
              id="question"
              name="question"
              value={formData.question}
              onChange={handleChange}
              placeholder="e.g., Will Burna Boy drop an album in Q4 2024?"
              className="bg-[#0F172A] border-[#334155] text-white"
            />
            {errors.question && (
              <p className="text-xs text-red-400">{errors.question}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium">
              Category *
            </Label>
            <Select value={formData.category} onValueChange={handleCategoryChange}>
              <SelectTrigger className="bg-[#0F172A] border-[#334155] text-white">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="bg-[#1E293B] border-[#334155]">
                {categories.map((category) => (
                  <SelectItem
                    key={category.value}
                    value={category.value}
                    className="text-white focus:bg-[#0F172A]"
                  >
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-xs text-red-400">{errors.category}</p>
            )}
            {selectedCategory && (
              <Badge className={selectedCategory.color}>
                {selectedCategory.label}
              </Badge>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description *
            </Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Provide context about this prediction market..."
              rows={4}
              className="bg-[#0F172A] border-[#334155] text-white"
            />
            {errors.description && (
              <p className="text-xs text-red-400">{errors.description}</p>
            )}
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <Label htmlFor="endDate" className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              End Date *
            </Label>
            <Input
              id="endDate"
              name="endDate"
              type="datetime-local"
              value={formData.endDate}
              onChange={handleChange}
              className="bg-[#0F172A] border-[#334155] text-white"
            />
            {errors.endDate && (
              <p className="text-xs text-red-400">{errors.endDate}</p>
            )}
          </div>

          {/* Resolution Criteria */}
          <div className="space-y-2">
            <Label htmlFor="resolutionCriteria" className="text-sm font-medium flex items-center gap-2">
              <Info className="w-4 h-4" />
              Resolution Criteria *
            </Label>
            <Textarea
              id="resolutionCriteria"
              name="resolutionCriteria"
              value={formData.resolutionCriteria}
              onChange={handleChange}
              placeholder="e.g., Official announcement on social media counts as confirmation"
              rows={3}
              className="bg-[#0F172A] border-[#334155] text-white"
            />
            {errors.resolutionCriteria && (
              <p className="text-xs text-red-400">{errors.resolutionCriteria}</p>
            )}
            <p className="text-xs text-gray-400">
              Clearly define how this market will be resolved
            </p>
          </div>

          {/* Optional Initial Stake */}
          <div className="space-y-2">
            <Label htmlFor="initialStake" className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Initial Stake (Optional)
            </Label>
            <Input
              id="initialStake"
              name="initialStake"
              type="number"
              min="0"
              step="0.25"
              value={formData.initialStake || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  initialStake: parseFloat(e.target.value) || 0,
                }))
              }
              placeholder="0.00"
              className="bg-[#0F172A] border-[#334155] text-white"
            />
            <p className="text-xs text-gray-400">
              Optional: Add your own stake to start the market
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 bg-[#0F172A] border-[#334155] hover:bg-[#334155]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#2563EB] hover:bg-blue-700 text-white"
            >
              Create Market
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

