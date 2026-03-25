"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  FileText,
  Layers,
  TrendingUp,
  Activity,
  Clock,
} from "lucide-react";
import apiClient from "@/lib/api/client";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  memberCount: number;
  fileCount: number;
  categories: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiClient.get("/api/v1/master/dashboard");
        setStats(response.data);
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const cards = [
    {
      title: "Total Members",
      value: stats?.memberCount ?? 0,
      description: "Active users in the system",
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "Total Files",
      value: stats?.fileCount ?? 0,
      description: "Documents stored in S3",
      icon: FileText,
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      title: "Categories",
      value: stats?.categories ?? 0,
      description: "Master data categories",
      icon: Layers,
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
  ];

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s an overview of your system.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-4 rounded-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-[60px] mb-1" />
                  <Skeleton className="h-3 w-[140px]" />
                </CardContent>
              </Card>
            ))
          : cards.map((card) => (
              <Card key={card.title} className="border-none shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {card.title}
                  </CardTitle>
                  <div className={`p-2 rounded-md ${card.bg} ${card.color}`}>
                    <card.icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-none shadow-sm">
          <CardHeader>
            <CardTitle>System Activity</CardTitle>
            <CardDescription>
              Recent events across all microservices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {[
                {
                  label: "Member Service",
                  status: "Online",
                  time: "Just now",
                  icon: Activity,
                  color: "text-emerald-500",
                },
                {
                  label: "File Service",
                  status: "Online",
                  time: "2 mins ago",
                  icon: Activity,
                  color: "text-emerald-500",
                },
                {
                  label: "Mail Service",
                  status: "Idle",
                  time: "15 mins ago",
                  icon: Clock,
                  color: "text-amber-500",
                },
              ].map((item, i) => (
                <div key={i} className="flex items-center">
                  <div className={`flex items-center justify-center size-9 rounded-full bg-slate-100 ${item.color}`}>
                    <item.icon className="size-5" />
                  </div>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {item.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Status: {item.status}
                    </p>
                  </div>
                  <div className="ml-auto font-medium text-xs text-muted-foreground">
                    {item.time}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-3 border-none shadow-sm">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Commonly used operations</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
             <Button variant="outline" className="justify-start gap-2 h-11">
                <Users className="size-4" /> Add New Member
             </Button>
             <Button variant="outline" className="justify-start gap-2 h-11">
                <FileText className="size-4" /> Upload Document
             </Button>
             <Button variant="outline" className="justify-start gap-2 h-11">
                <TrendingUp className="size-4" /> View Analytics
             </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
