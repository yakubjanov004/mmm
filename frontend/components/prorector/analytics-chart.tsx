"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

const data = [
  { day: "Mon", submissions: 45 },
  { day: "Tue", submissions: 52 },
  { day: "Wed", submissions: 48 },
  { day: "Thu", submissions: 61 },
  { day: "Fri", submissions: 55 },
  { day: "Sat", submissions: 38 },
  { day: "Sun", submissions: 32 },
]

export function AnalyticsChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="day" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="submissions" stroke="var(--color-primary)" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  )
}
