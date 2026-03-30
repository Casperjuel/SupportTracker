import { useState, useEffect } from 'react'
import { AppSidebar } from 'renderer/components/app-sidebar'
import { Separator } from 'renderer/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from 'renderer/components/ui/sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from 'renderer/components/ui/breadcrumb'
import { StoreProvider } from 'renderer/context/store'
import { Toaster } from 'renderer/components/ui/sonner'
import { TooltipProvider } from 'renderer/components/ui/tooltip'
import { DashboardView } from './dashboard'
import { RegisterView } from './register'
import { LogView } from './log'
import { InsightsView } from './insights'
import { SettingsView } from './settings'

const { App } = window

const viewLabels: Record<string, string> = {
  dashboard: 'Oversigt',
  registrer: 'Ny henvendelse',
  log: 'Alle henvendelser',
  indsigt: 'Indsigter',
  indstillinger: 'Indstillinger',
}

function AppContent() {
  const [activeView, setActiveView] = useState('dashboard')

  useEffect(() => {
    App.onNavigate((view: string) => {
      setActiveView(view)
    })
  }, [])

  return (
    <SidebarProvider>
      <AppSidebar activeView={activeView} onNavigate={setActiveView} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>{viewLabels[activeView] || activeView}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          {activeView === 'dashboard' && <DashboardView />}
          {activeView === 'registrer' && <RegisterView />}
          {activeView === 'log' && <LogView />}
          {activeView === 'indsigt' && <InsightsView />}
          {activeView === 'indstillinger' && <SettingsView />}
        </div>
      </SidebarInset>
      <Toaster richColors position="bottom-right" />
    </SidebarProvider>
  )
}

export function MainScreen() {
  return (
    <TooltipProvider>
      <StoreProvider>
        <AppContent />
      </StoreProvider>
    </TooltipProvider>
  )
}
