"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Ship, Users, FileText, Calendar, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react"
import type { DashboardStats } from "@/lib/types"

interface StatsCardsProps {
  stats: DashboardStats
}

export function StatsCards({ stats }: StatsCardsProps) {
  const statCards = [
    {
      title: "Total Ships",
      value: stats.totalShips,
      description: `${stats.shipsAtSea} at sea, ${stats.shipsInPort} in port`,
      icon: Ship,
      trend: "+2.1%",
      trendUp: true,
      color: "bg-blue-500"
    },
    {
      title: "Active Crew",
      value: stats.activeCrew,
      description: "Currently assigned personnel",
      icon: Users,
      trend: "+5.4%",
      trendUp: true,
      color: "bg-green-500"
    },
    {
      title: "Pending Requisitions",
      value: stats.pendingRequisitions,
      description: "Awaiting approval",
      icon: FileText,
      trend: "-12.3%",
      trendUp: false,
      color: "bg-orange-500"
    },
    {
      title: "Tasks Today",
      value: stats.tasksToday,
      description: "Scheduled for completion",
      icon: Calendar,
      trend: "+8.2%",
      trendUp: true,
      color: "bg-purple-500"
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((card) => (
        <Card key={card.title} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              {card.title}
            </CardTitle>
            <div className={`h-8 w-8 rounded-lg ${card.color} flex items-center justify-center`}>
              <card.icon className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{card.value.toLocaleString()}</div>
            <div className="flex items-center gap-2 text-xs text-slate-600 mt-1">
              <span>{card.description}</span>
              <div className="flex items-center gap-1">
                {card.trendUp ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                )}
                <span className={card.trendUp ? "text-green-600" : "text-red-600"}>
                  {card.trend}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function AlertsWidget() {
  const alerts = [
    {
      id: "1",
      type: "certificate",
      title: "Certificate Expiring Soon",
      description: "Safety certificate for MV Atlantic expires in 15 days",
      severity: "warning" as const,
      timestamp: "2 hours ago"
    },
    {
      id: "2",
      type: "maintenance",
      title: "Overdue Maintenance",
      description: "Engine service overdue on MV Pacific",
      severity: "high" as const,
      timestamp: "5 hours ago"
    },
    {
      id: "3",
      type: "crew",
      title: "Crew Contract Ending",
      description: "Chief Engineer contract ends next week",
      severity: "medium" as const,
      timestamp: "1 day ago"
    }
  ]

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "medium":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Recent Alerts</CardTitle>
          <Badge variant="outline" className="text-red-600 border-red-200">
            {alerts.length} Active
          </Badge>
        </div>
        <CardDescription>
          Critical notifications requiring attention
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3 rounded-lg border transition-colors hover:bg-slate-50 ${getSeverityColor(alert.severity)}`}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{alert.title}</div>
                  <div className="text-xs opacity-90 mt-1">{alert.description}</div>
                  <div className="text-xs opacity-75 mt-2">{alert.timestamp}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
