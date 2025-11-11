"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileIcon, Search, MoreVertical, Download, Share2 } from "lucide-react"
import { useState } from "react"

export default function TeacherFiles() {
  const [searchQuery, setSearchQuery] = useState("")
  const [subjectFilter, setSubjectFilter] = useState("")
  const [yearFilter, setYearFilter] = useState("")

  const files = [
    {
      id: 1,
      name: "Lecture_Notes_Week1.pdf",
      size: "2.4 MB",
      modified: "2 hours ago",
      type: "pdf",
      title: "Lecture Notes - Week 1",
      subject: "Mathematics",
      academicYear: "2024",
    },
    {
      id: 2,
      name: "Assignment_Template.docx",
      size: "1.2 MB",
      modified: "1 day ago",
      type: "document",
      title: "Assignment Template",
      subject: "Physics",
      academicYear: "2024",
    },
    {
      id: 3,
      name: "Class_Recording.mp4",
      size: "512 MB",
      modified: "3 days ago",
      type: "video",
      title: "Class Recording",
      subject: "Computer Science",
      academicYear: "2024",
    },
    {
      id: 4,
      name: "Syllabus_2024.pdf",
      size: "856 KB",
      modified: "1 week ago",
      type: "pdf",
      title: "Syllabus 2024",
      subject: "Mathematics",
      academicYear: "2024",
    },
  ]

  const filteredFiles = files.filter((file) => {
    const searchMatch =
      file.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.name.toLowerCase().includes(searchQuery.toLowerCase())
    const subjectMatch = !subjectFilter || file.subject.toLowerCase().includes(subjectFilter.toLowerCase())
    const yearMatch = !yearFilter || file.academicYear === yearFilter
    return searchMatch && subjectMatch && yearMatch
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Files</h1>
          <p className="text-muted-foreground">Manage all your uploaded academic materials</p>
        </div>
        <Button>Upload New File</Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
          </div>
        </CardContent>
      </Card>

      {/* Files Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFiles.map((file) => (
          <Card key={file.id} className="hover:shadow-lg transition-shadow flex flex-col">
            <CardContent className="pt-6 flex-1 flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <FileIcon className="w-8 h-8 text-primary" />
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
              <h3 className="font-semibold mb-1 truncate">{file.title}</h3>
              <p className="text-sm text-muted-foreground mb-1 truncate">{file.name}</p>

              <div className="text-xs text-muted-foreground space-y-1 mb-4">
                <p>
                  <strong>Subject:</strong> {file.subject}
                </p>
                <p>
                  <strong>Year:</strong> {file.academicYear}
                </p>
                <p>
                  <strong>Size:</strong> {file.size}
                </p>
                <p>Modified {file.modified}</p>
              </div>

              <div className="flex gap-2 mt-auto">
                <Button variant="ghost" size="sm" className="flex-1">
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
                <Button variant="ghost" size="sm" className="flex-1">
                  <Share2 className="w-4 h-4 mr-1" />
                  Share
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
