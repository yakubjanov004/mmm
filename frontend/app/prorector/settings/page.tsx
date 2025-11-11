import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ProrectorSettings() {
  return (
    <div className="p-6 space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage department and notification preferences</p>
      </div>

      {/* Department Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Department Information</CardTitle>
          <CardDescription>Update your department details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Prorector Name</Label>
            <Input id="name" placeholder="Your name" defaultValue="Dr. Sarah Johnson" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="Your email" defaultValue="sarah@university.edu" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input id="department" placeholder="Department name" defaultValue="Engineering Faculty" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Contact Phone</Label>
            <Input id="phone" placeholder="Department phone" defaultValue="+1 (555) 123-4567" />
          </div>
          <Button>Save Changes</Button>
        </CardContent>
      </Card>

      {/* Approval Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Approval Workflow</CardTitle>
          <CardDescription>Configure department approval settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="approval-time">Auto-approve after (days)</Label>
            <Input id="approval-time" type="number" placeholder="Days" defaultValue="7" />
          </div>
          <div className="flex items-center justify-between">
            <span>Require Admin Review</span>
            <input type="checkbox" className="w-4 h-4" />
          </div>
          <div className="flex items-center justify-between">
            <span>Notify on New Submissions</span>
            <input type="checkbox" defaultChecked className="w-4 h-4" />
          </div>
          <Button>Save Workflow Settings</Button>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Control how you receive alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Email Notifications</span>
            <input type="checkbox" defaultChecked className="w-4 h-4" />
          </div>
          <div className="flex items-center justify-between">
            <span>File Submission Alerts</span>
            <input type="checkbox" defaultChecked className="w-4 h-4" />
          </div>
          <div className="flex items-center justify-between">
            <span>Approval Requests</span>
            <input type="checkbox" defaultChecked className="w-4 h-4" />
          </div>
          <div className="flex items-center justify-between">
            <span>Weekly Department Report</span>
            <input type="checkbox" className="w-4 h-4" />
          </div>
          <Button>Save Preferences</Button>
        </CardContent>
      </Card>

      {/* Storage Management */}
      <Card>
        <CardHeader>
          <CardTitle>Department Storage</CardTitle>
          <CardDescription>Monitor storage allocation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span>Storage Used</span>
              <span className="font-semibold">245.8 GB / 500 GB</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: "49.16%" }}></div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Contact IT if you need additional storage capacity</p>
        </CardContent>
      </Card>
    </div>
  )
}
