import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shield, Lock, Eye, Edit, Trash2 } from "lucide-react"

export default function PermissionsPage() {
  const roles = [
    {
      id: 1,
      name: "Teacher",
      description: "Basic file upload and management",
      permissions: ["Upload files", "View own files", "Delete own files", "View analytics", "Comment on submissions"],
      userCount: 120,
      color: "bg-blue-100 text-blue-800",
    },
    {
      id: 2,
      name: "Prorector",
      description: "Department oversight and approvals",
      permissions: [
        "View department files",
        "Approve/reject submissions",
        "Manage department users",
        "View reports",
        "Configure workflows",
        "Archive files",
      ],
      userCount: 12,
      color: "bg-purple-100 text-purple-800",
    },
    {
      id: 3,
      name: "Admin",
      description: "Full system access and control",
      permissions: [
        "All permissions",
        "User management",
        "System settings",
        "Permission management",
        "Audit logs",
        "Backup management",
      ],
      userCount: 3,
      color: "bg-red-100 text-red-800",
    },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Permissions Management</h1>
        <p className="text-muted-foreground">Configure roles and access control for the system</p>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 gap-6">
        {roles.map((role) => (
          <Card key={role.id} className="overflow-hidden">
            <CardHeader className="bg-muted/50">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${role.color}`}>
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{role.name}</CardTitle>
                    <CardDescription>{role.description}</CardDescription>
                  </div>
                </div>
                <Badge variant="outline">{role.userCount} users</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Permissions List */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-foreground">Permissions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {role.permissions.map((permission, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 rounded bg-muted/50">
                        <Lock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">{permission}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
                    <Eye className="w-4 h-4" />
                    View Details
                  </Button>
                  <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
                    <Edit className="w-4 h-4" />
                    Edit Role
                  </Button>
                  {role.name !== "Admin" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 text-destructive bg-transparent"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create New Role */}
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Shield className="w-12 h-12 text-muted-foreground/50 mb-3" />
          <CardTitle className="text-lg mb-2">Create Custom Role</CardTitle>
          <p className="text-sm text-muted-foreground mb-4">
            Define custom roles with specific permissions for your organization
          </p>
          <Button>Create New Role</Button>
        </CardContent>
      </Card>
    </div>
  )
}
