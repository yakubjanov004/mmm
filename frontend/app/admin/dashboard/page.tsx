import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserManagement } from "@/components/admin/user-management"
import { SystemStats } from "@/components/admin/system-stats"
import { Users, Database, Activity } from "lucide-react"

export default function AdminDashboard() {
  const users = [
    {
      id: 1,
      name: "Dr. John Smith",
      email: "john@university.edu",
      role: "Teacher",
      status: "active",
      joinDate: "2023-01-15",
    },
    {
      id: 2,
      name: "Prof. Sarah Johnson",
      email: "sarah@university.edu",
      role: "Teacher",
      status: "active",
      joinDate: "2023-02-20",
    },
    {
      id: 3,
      name: "Dr. Michael Brown",
      email: "michael@university.edu",
      role: "Prorector",
      status: "active",
      joinDate: "2022-12-10",
    },
    {
      id: 4,
      name: "Prof. Emily Davis",
      email: "emily@university.edu",
      role: "Teacher",
      status: "inactive",
      joinDate: "2023-05-05",
    },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage users, system settings, and platform health</p>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">156</p>
            <p className="text-xs text-muted-foreground">+12 this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="w-4 h-4" />
              Storage Used
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">2.3 TB</p>
            <p className="text-xs text-muted-foreground">of 5 TB</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Departments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">12</p>
            <p className="text-xs text-muted-foreground">active departments</p>
          </CardContent>
        </Card>
      </div>

      {/* System Stats Chart */}
      <SystemStats />

      {/* User Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Manage and monitor all platform users</CardDescription>
          </div>
          <Button>Add User</Button>
        </CardHeader>
        <CardContent>
          <UserManagement users={users} />
        </CardContent>
      </Card>
    </div>
  )
}
