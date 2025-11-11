import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AnalyticsChart } from "@/components/prorector/analytics-chart"
import { TrendingUp, Users } from "lucide-react"

export default function ProrectorDashboard() {
  const pendingApprovals = [
    {
      id: 1,
      type: "Document",
      title: "Final Exam Papers - Computer Science",
      submittedBy: "Dr. John Smith",
      date: "2 hours ago",
      status: "pending",
    },
    {
      id: 2,
      type: "Course Material",
      title: "Lecture Slides - Advanced Math",
      submittedBy: "Prof. Sarah Johnson",
      date: "5 hours ago",
      status: "pending",
    },
    {
      id: 3,
      type: "Assignment",
      title: "Midterm Questions - Physics",
      submittedBy: "Dr. Michael Brown",
      date: "1 day ago",
      status: "pending",
    },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Prorector Dashboard</h1>
        <p className="text-muted-foreground">View and manage all academic files from your department</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Monthly Uploads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">248</p>
            <p className="text-xs text-muted-foreground">this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Active Teachers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">34</p>
            <p className="text-xs text-muted-foreground">uploading files</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Submission Trends</CardTitle>
          <CardDescription>Academic submissions over the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <AnalyticsChart />
        </CardContent>
      </Card>

      {/* Pending Approvals */}
    </div>
  )
}
