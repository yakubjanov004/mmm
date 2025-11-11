"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

const lineData = [
  { month: "Jan", views: 400, downloads: 240, shares: 240 },
  { month: "Feb", views: 500, downloads: 300, shares: 221 },
  { month: "Mar", views: 800, downloads: 600, shares: 229 },
  { month: "Apr", views: 900, downloads: 780, shares: 200 },
  { month: "May", views: 1100, downloads: 890, shares: 229 },
  { month: "Jun", views: 1300, downloads: 1090, shares: 200 },
]

const pieData = [
  { name: "PDF", value: 45 },
  { name: "Document", value: 30 },
  { name: "Video", value: 15 },
  { name: "Other", value: 10 },
]

const COLORS = ["var(--color-primary)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)"]

export default function TeacherAnalytics() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Detailed insights into your files and interactions</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">5,430</p>
            <p className="text-xs text-muted-foreground">+12.5% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Downloads</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">3,910</p>
            <p className="text-xs text-muted-foreground">+8.2% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Shares</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">1,220</p>
            <p className="text-xs text-muted-foreground">+15.3% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">72%</p>
            <p className="text-xs text-muted-foreground">+5.1% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Trend</CardTitle>
            <CardDescription>File interactions over 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="views" stroke="var(--color-primary)" strokeWidth={2} />
                <Line type="monotone" dataKey="downloads" stroke="var(--color-chart-2)" strokeWidth={2} />
                <Line type="monotone" dataKey="shares" stroke="var(--color-chart-3)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>File Type Distribution</CardTitle>
            <CardDescription>Breakdown of uploaded files</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Files</CardTitle>
          <CardDescription>Your most viewed and downloaded files</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: "Lecture_Notes_Week1.pdf", views: 842, downloads: 654, shares: 123 },
              { name: "Assignment_Template.docx", views: 756, downloads: 512, shares: 98 },
              { name: "Study_Guide.pdf", views: 634, downloads: 401, shares: 87 },
            ].map((file, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">{file.views} views</p>
                </div>
                <div className="flex gap-6 text-sm">
                  <div className="text-center">
                    <p className="font-semibold">{file.downloads}</p>
                    <p className="text-muted-foreground">Downloads</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">{file.shares}</p>
                    <p className="text-muted-foreground">Shares</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
