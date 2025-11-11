import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Clock } from "lucide-react"

interface Approval {
  id: number
  type: string
  title: string
  submittedBy: string
  date: string
  status: string
}

export function ApprovalList({ approvals }: { approvals: Approval[] }) {
  return (
    <div className="space-y-2">
      {approvals.map((approval) => (
        <div
          key={approval.id}
          className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-center gap-4">
            <Clock className="w-5 h-5 text-yellow-500" />
            <div className="flex-1">
              <p className="font-medium">{approval.title}</p>
              <p className="text-sm text-muted-foreground">
                From {approval.submittedBy} • {approval.date}
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              {approval.type}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <XCircle className="w-4 h-4 mr-1" />
              Reject
            </Button>
            <Button size="sm">
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Approve
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
