import { SignUp } from '@clerk/nextjs'
import { Briefcase } from 'lucide-react'

export default function Page() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6">
      <div className="flex items-center gap-2">
        <Briefcase className="h-7 w-7" />
        <span className="text-xl font-bold">Freelancer Tracker</span>
      </div>
      <SignUp signInUrl="/sign-in" fallbackRedirectUrl="/" />
    </div>
  )
}
