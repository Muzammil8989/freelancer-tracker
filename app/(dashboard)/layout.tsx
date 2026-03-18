import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { after } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { Separator } from '@/components/ui/separator'
import { DashboardBreadcrumb } from '@/components/dashboard-breadcrumb'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  if (userId) {
    after(async () => {
      const user = await currentUser()
      if (!user) return
      await supabaseAdmin.from('users').upsert(
        {
          id: user.id,
          email: user.emailAddresses[0]?.emailAddress ?? '',
          name: [user.firstName, user.lastName].filter(Boolean).join(' ') || null,
          avatar_url: user.imageUrl,
        },
        { onConflict: 'id' }
      )
    })
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 items-center gap-2 border-b px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4" />
          <DashboardBreadcrumb />
        </header>
        <main className="flex-1 p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
