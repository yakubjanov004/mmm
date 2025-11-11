"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShieldX } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export function AccessDenied() {
  const router = useRouter()

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-destructive/10 p-4 rounded-full">
              <ShieldX className="w-12 h-12 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl">403: Kirish huquqi yo'q</CardTitle>
          <CardDescription className="text-base mt-2">
            Sizda bu sahifaga kirish huquqi yo'q.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Bu sahifaga kirish uchun zarur huquqga ega emasligingizni bildiramiz.
            Agar bu xatolik deb o'ylasangiz, tizim administratoriga murojaat qiling.
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => router.back()}>
              Orqaga
            </Button>
            <Button asChild>
              <Link href="/dashboard">Dashboardga qaytish</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

