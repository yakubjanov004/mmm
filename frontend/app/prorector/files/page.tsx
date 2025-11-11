"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileIcon, Search, Download } from "lucide-react"
import { useState } from "react"

export default function ProrectorFiles() {
  const [searchQuery, setSearchQuery] = useState("")
  const [subjectFilter, setSubjectFilter] = useState("")
  const [yearFilter, setYearFilter] = useState("")
  const [projectFilter, setProjectFilter] = useState("")

  const departmentFiles = [
    {
      id: 1,
      name: "Lecture_Notes_Week1.pdf",
      title: "Lecture Notes - Week 1",
      teacher: "Dr. John Smith",
      subject: "Mathematics",
      academicYear: "2024",
      scientificProject: "Advanced Algorithms",
      size: "2.4 MB",
      uploadedAt: "2 hours ago",
    },
    {
      id: 2,
      name: "Assignment_Template.docx",
      title: "Assignment Template",
      teacher: "Prof. Sarah Johnson",
      subject: "Physics",
      academicYear: "2024",
      scientificProject: "Quantum Computing",
      size: "1.2 MB",
      uploadedAt: "1 day ago",
    },
    {
      id: 3,
      name: "Exam_Papers.pdf",
      title: "Exam Papers - Final",
      teacher: "Dr. Michael Brown",
      subject: "Computer Science",
      academicYear: "2024",
      scientificProject: "AI Research Initiative",
      size: "3.8 MB",
      uploadedAt: "3 days ago",
    },
  ]

  const filteredFiles = departmentFiles.filter((file) => {
    const searchMatch =
      file.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.teacher.toLowerCase().includes(searchQuery.toLowerCase())
    const subjectMatch = !subjectFilter || file.subject.toLowerCase().includes(subjectFilter.toLowerCase())
    const yearMatch = !yearFilter || file.academicYear === yearFilter
    const projectMatch = !projectFilter || file.scientificProject.toLowerCase().includes(projectFilter.toLowerCase())
    return searchMatch && subjectMatch && yearMatch && projectMatch
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Department Files</h1>
        <p className="text-muted-foreground">View and download all files uploaded by department teachers</p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by title or teacher name..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium">Subject</label>
              <Input
                placeholder="Filter by subject..."
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Academic Year</label>
              <Input
                placeholder="Filter by year..."
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Scientific Project</label>
              <Input
                placeholder="Filter by project..."
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Files List */}
      <div className="space-y-3">
        {filteredFiles.map((file) => (
          <Card key={file.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <FileIcon className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{file.title}</h3>
                    <p className="text-sm text-muted-foreground truncate">{file.name}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-xs text-muted-foreground">
                      <div>
                        <strong>Teacher:</strong> {file.teacher}
                      </div>
                      <div>
                        <strong>Subject:</strong> {file.subject}
                      </div>
                      <div>
                        <strong>Year:</strong> {file.academicYear}
                      </div>
                      <div>
                        <strong>Size:</strong> {file.size}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      <strong>Project:</strong> {file.scientificProject}
                    </p>
                    <p className="text-xs text-muted-foreground">Uploaded {file.uploadedAt}</p>
                  </div>
                </div>
                <Button size="icon" variant="outline">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
