import {
  LayoutDashboard,
  Plus,
  List,
  Lightbulb,
  Settings,
  Sun,
  Moon,
  Monitor,
  Keyboard,
} from 'lucide-react'
import { Logo } from './logo'
import { Button } from 'renderer/components/ui/button'
import { useStore } from 'renderer/context/store'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from 'renderer/components/ui/sidebar'

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  activeView: string
  onNavigate: (view: string) => void
}

const mainNav = [
  { id: 'dashboard', label: 'Oversigt', icon: LayoutDashboard },
  { id: 'log', label: 'Alle henvendelser', icon: List },
  { id: 'indsigt', label: 'Indsigter', icon: Lightbulb },
]

export function AppSidebar({ activeView, onNavigate, ...props }: AppSidebarProps) {
  const { data, theme, setTheme, branding } = useStore()

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor

  function cycleTheme() {
    const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'auto' : 'light'
    setTheme(next)
  }

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader className="pt-[50px]">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <button type="button" onClick={() => onNavigate('dashboard')} className="cursor-pointer">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[#385C55] text-white">
                  <Logo />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{branding.orgName}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {branding.subtitle}
                  </span>
                </div>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={activeView === item.id}
                    onClick={() => onNavigate(item.id)}
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                  {item.id === 'log' && data.length > 0 && (
                    <SidebarMenuBadge>{data.length}</SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Prominent "Ny henvendelse" button */}
        <div className="px-3 mt-2">
          <Button
            onClick={() => onNavigate('registrer')}
            className="w-full gap-2 justify-start"
            size="sm"
          >
            <Plus className="size-4" />
            Ny henvendelse
          </Button>
        </div>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={activeView === 'indstillinger'}
              onClick={() => onNavigate('indstillinger')}
              tooltip="Indstillinger"
            >
              <Settings />
              <span>Indstillinger</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarSeparator />
          <SidebarMenuItem>
            <SidebarMenuButton onClick={cycleTheme} tooltip={`Tema: ${theme}`}>
              <ThemeIcon className="size-4" />
              <span className="text-xs capitalize">
                {theme === 'auto' ? 'System' : theme === 'dark' ? 'Mørk' : 'Lys'}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground">
              <Keyboard className="size-3" />
              <span>
                <kbd className="rounded bg-muted px-1 text-[10px]">⌘</kbd>
                {' + '}
                <kbd className="rounded bg-muted px-1 text-[10px]">⇧</kbd>
                {' + '}
                <kbd className="rounded bg-muted px-1 text-[10px]">G</kbd>
                {' vis/skjul'}
              </span>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
