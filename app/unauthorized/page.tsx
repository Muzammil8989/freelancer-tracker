import { SignOutButton } from '@clerk/nextjs'
import { ShieldX } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-sm px-4">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldX className="h-8 w-8 text-destructive" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Access Denied</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Your account is not authorized to access this application.
          </p>
        </div>
        <SignOutButton redirectUrl="/sign-in">
          <Button variant="outline" className="w-full">Sign out</Button>
        </SignOutButton>
      </div>
    </div>
  )
}
