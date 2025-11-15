"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Plus, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  type: "prediction" | "achievement";
  action: "Won" | "Lost" | "Placed" | "Unlocked";
  market?: string;
  achievement?: string;
  amount?: number;
  timestamp: string;
}

interface ProfileActivityProps {
  activities: Activity[];
}

export function ProfileActivity({ activities }: ProfileActivityProps) {
  const getIcon = (activity: Activity) => {
    if (activity.type === "achievement") {
      return <Award className="w-5 h-5 text-yellow-400" />;
    }
    switch (activity.action) {
      case "Won":
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case "Lost":
        return <XCircle className="w-5 h-5 text-red-400" />;
      case "Placed":
        return <Plus className="w-5 h-5 text-blue-400" />;
      default:
        return <Award className="w-5 h-5 text-yellow-400" />;
    }
  };

  return (
    <Card className="bg-[#1E293B] border-[#334155]">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-[#334155]">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="p-6 hover:bg-[#0F172A] transition-colors"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 mt-0.5">{getIcon(activity)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {activity.action}{" "}
                        {activity.type === "prediction" && activity.market && (
                          <span className="text-gray-400">
                            prediction on "{activity.market}"
                          </span>
                        )}
                        {activity.type === "achievement" && activity.achievement && (
                          <span className="text-gray-400">
                            achievement: {activity.achievement}
                          </span>
                        )}
                      </p>
                      {activity.market && (
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {activity.market}
                        </p>
                      )}
                    </div>
                    {activity.amount !== undefined && (
                      <div
                        className={cn(
                          "text-sm font-semibold ml-4",
                          activity.action === "Won"
                            ? "text-green-400"
                            : activity.action === "Lost"
                            ? "text-red-400"
                            : "text-blue-400"
                        )}
                      >
                        {activity.action === "Won" && "+"}
                        {activity.action === "Lost" && "-"}
                        {activity.action === "Placed" && "-"}
                        ${activity.amount.toFixed(2)}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">{activity.timestamp}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

