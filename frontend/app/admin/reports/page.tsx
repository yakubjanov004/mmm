"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Filter } from "lucide-react"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

const userData = [
  { date: "Jan 1", teachers: 45, prorectors: 8, admins: 2, total: 55 },
  { date: "Feb 1", teachers: 52, prorectors: 9, admins: 2, total: 63 },
  { date: "Mar 1", teachers: 61, prorectors: 10, admins: 2, total: 73 },
  { date: "Apr 1", teachers: 74, prorectors: 11, admins: 2, total: 87 },
  { date: "May 1", teachers: 89, prorectors: 12, admins: 3, total: 104 },
  { date: "Jun 1", teachers: 102, prorectors: 13, admins: 3, total: 118 },
]

const storageData = [
  { date: "Week 1", used: 120, available: 380 },
  { date: "Week 2", used: 145, available: 355 },
  { date: "Week 3", used: 178, available: 322 },
  { date: "Week 4", used: 210, available: 290 },
]

export default function AdminReports() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Platform Reports</h1>
          <p className="text-muted-foreground">System-wide analytics and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">156</p>
            <p className="text-xs text-muted-foreground">+12 this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">99.8%</p>
            <p className="text-xs text-muted-foreground">excellent</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">2.3 TB</p>
            <p className="text-xs text-muted-foreground">of 5 TB</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">API Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">1.2M</p>
            <p className="text-xs text-muted-foreground">this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle>User Growth</CardTitle>
          <CardDescription>Platform user growth by role over 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="teachers" stroke="var(--color-primary)" strokeWidth={2} />
              <Line type="monotone" dataKey="prorectors" stroke="var(--color-chart-2)" strokeWidth={2} />
              <Line type="monotone" dataKey="admins" stroke="var(--color-chart-3)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Storage Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Storage Usage Trend</CardTitle>
          <CardDescription>Storage consumption over the last month</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={storageData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="used" fill="var(--color-primary)" stroke="var(--color-primary)" />
              <Area type="monotone" dataKey="available" fill="var(--color-chart-2)" stroke="var(--color-chart-2)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
