"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

const data = [
  { week: "Week 1", users: 42, files: 128, uploads: 234 },
  { week: "Week 2", users: 45, files: 145, uploads: 267 },
  { week: "Week 3", users: 48, files: 162, uploads: 301 },
  { week: "Week 4", users: 52, files: 178, uploads: 328 },
]

export function SystemStats() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Activity</CardTitle>
        <CardDescription>System usage over the last 4 weeks</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="users" fill="var(--color-primary)" />
            <Bar dataKey="files" fill="var(--color-chart-2)" />
            <Bar dataKey="uploads" fill="var(--color-chart-3)" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
