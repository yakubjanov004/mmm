"use client"

import { FileIcon, Download, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface File {
  id: number
  name: string
  size: string
  uploadedAt: string
  type: string
  title: string
  subject: string
  academicYear: string
  status?: "pending" | "approved" | "rejected"
}

export function FileList({ files }: { files: File[] }) {
  return (
    <div className="space-y-2">
      {files.map((file) => (
        <div
          key={file.id}
          className="flex flex-col gap-2 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1">
              <FileIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">{file.title}</p>
                <p className="text-xs text-muted-foreground">{file.name}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
            <div>
              <span className="font-medium">Subject:</span> {file.subject}
            </div>
            <div>
              <span className="font-medium">Year:</span> {file.academicYear}
            </div>
            <div>
              <span className="font-medium">Size:</span> {file.size}
            </div>
            <div>
              <span className="font-medium">Uploaded:</span> {file.uploadedAt}
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <Button variant="ghost" size="icon" title="Download">
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" title="Delete">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
