import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Settings, Mail, Bell, Lock, Database, Globe } from "lucide-react"

export default function AdminSettingsPage() {
  const settings = [
    {
      icon: Globe,
      title: "General Settings",
      description: "Configure platform name, timezone, and general preferences",
      items: ["Platform Name", "Timezone", "Language", "Date Format"],
    },
    {
      icon: Mail,
      title: "Email Configuration",
      description: "Manage email notifications and SMTP settings",
      items: ["SMTP Server", "Notification Email", "Email Templates", "Bounce Handling"],
    },
    {
      icon: Bell,
      title: "Notifications",
      description: "Configure system alerts and notification preferences",
      items: ["Alert Thresholds", "Notification Channels", "Quiet Hours", "Escalation Rules"],
    },
    {
      icon: Database,
      title: "Storage Management",
      description: "Configure storage limits and backup settings",
      items: ["Storage Quota", "Retention Policy", "Backup Schedule", "Archive Settings"],
    },
    {
      icon: Lock,
      title: "Security",
      description: "Manage authentication, API keys, and security policies",
      items: ["Password Policy", "Session Timeout", "2FA Settings", "IP Whitelist"],
    },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">System Settings</h1>
        <p className="text-muted-foreground">Configure platform-wide settings and preferences</p>
      </div>

      {/* Settings Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settings.map((section, idx) => {
          const Icon = section.icon
          return (
            <Card key={idx} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                      <CardDescription>{section.description}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  {section.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="text-sm text-muted-foreground flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                      {item}
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="w-full bg-transparent">
                  Configure
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            System Status
          </CardTitle>
          <CardDescription>Current system health and configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b">
              <span className="font-medium">API Status</span>
              <Badge className="bg-green-100 text-green-800">Operational</Badge>
            </div>
            <div className="flex items-center justify-between py-3 border-b">
              <span className="font-medium">Database Status</span>
              <Badge className="bg-green-100 text-green-800">Healthy</Badge>
            </div>
            <div className="flex items-center justify-between py-3 border-b">
              <span className="font-medium">Cache Status</span>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="font-medium">Backup Status</span>
              <Badge className="bg-blue-100 text-blue-800">Last 2 hours ago</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
