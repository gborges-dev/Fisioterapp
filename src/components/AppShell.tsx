import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import {
  Activity,
  Building2,
  ClipboardList,
  CircleDollarSign,
  FileText,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  Moon,
  Sun,
  Users,
} from 'lucide-react'
import { useMemo, type ReactNode } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useAuth } from '@/features/auth/AuthContext'
import { useColorMode } from '@/theme/useColorMode'

type NavConfig = {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const clinicalNavItems: NavConfig[] = [
  { to: '/', label: 'Painel', icon: LayoutDashboard },
  { to: '/patients', label: 'Pacientes', icon: Users },
  { to: '/evaluation-forms', label: 'Fichas', icon: ClipboardList },
  { to: '/forms', label: 'Formulários', icon: FileText },
  { to: '/finance', label: 'Financeiro', icon: CircleDollarSign },
  { to: '/reports', label: 'Relatórios', icon: Activity },
]

/** No celular, quatro atalhos ficam na barra e o resto vai para "Mais". */
const MOBILE_PRIMARY = ['/', '/patients', '/evaluation-forms', '/finance']

function sectionOf(pathname: string): string {
  if (pathname === '/' || pathname === '') return '/'
  const match = [...clinicalNavItems, { to: '/admin/bases' }]
    .filter((item) => item.to !== '/')
    .find((item) => pathname.startsWith(item.to))
  return match?.to ?? pathname
}

export type BreadcrumbItem = {
  label: string
  to?: string
}

export function GlassPanel({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div className={cn('glass rounded-2xl p-5 sm:p-6', className)} {...props}>
      {children}
    </div>
  )
}

export function PageHeader({
  breadcrumbs,
  title,
  subtitle,
  actions,
  leading,
}: {
  breadcrumbs?: BreadcrumbItem[]
  title: string
  subtitle?: string
  actions?: ReactNode
  /** Elemento à esquerda do título (por exemplo, o avatar do paciente). */
  leading?: ReactNode
}) {
  // Páginas de primeiro nível (Painel › Página) dispensam o caminho de migalhas.
  const showCrumbs = Boolean(breadcrumbs && breadcrumbs.length >= 3)
  return (
    <header className="mb-6 space-y-4">
      {showCrumbs && breadcrumbs ? (
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((item, i) => {
              const isLast = i === breadcrumbs.length - 1
              return (
                <span key={`${item.label}-${i}`} className="contents">
                  {i > 0 ? <BreadcrumbSeparator /> : null}
                  <BreadcrumbItem>
                    {isLast || !item.to ? (
                      <BreadcrumbPage>{item.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink to={item.to}>{item.label}</BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </span>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-5">
          {leading}
          <div className="space-y-2">
            <h1 className="display text-4xl font-semibold leading-[1.1] text-foreground md:text-[44px]">
              {title}
            </h1>
            {subtitle ? (
              <p className="max-w-xl text-base text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2.5">{actions}</div> : null}
      </div>
    </header>
  )
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <GlassPanel
      className={cn(
        'flex flex-col items-center justify-center py-12 text-center',
        className,
      )}
    >
      <h2 className="display text-2xl font-semibold text-foreground">{title}</h2>
      {description ? (
        <p className="mt-2 max-w-md text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </GlassPanel>
  )
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <NavLink to="/" className="flex items-center gap-3 text-foreground no-underline">
      <span
        className={cn(
          'flex shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground',
          compact ? 'h-9 w-9' : 'h-10 w-10',
        )}
        aria-hidden
      >
        <Activity className={compact ? 'h-5 w-5' : 'h-[22px] w-[22px]'} />
      </span>
      <span className="display text-2xl font-semibold leading-none">Fisioterapp</span>
    </NavLink>
  )
}

function userInitials(name?: string | null): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'FT'
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

export function AppShell() {
  const { mode, toggleColorMode } = useColorMode()
  const { user, logout, isSuperAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const currentSection = useMemo(
    () => sectionOf(location.pathname),
    [location.pathname],
  )

  const navItems = useMemo<NavConfig[]>(
    () =>
      isSuperAdmin
        ? [...clinicalNavItems, { to: '/admin/bases', label: 'Bases', icon: Building2 }]
        : clinicalNavItems,
    [isSuperAdmin],
  )

  const mobilePrimary = navItems.filter((item) => MOBILE_PRIMARY.includes(item.to))
  const mobileMore = navItems.filter((item) => !MOBILE_PRIMARY.includes(item.to))
  const moreActive = mobileMore.some((item) => item.to === currentSection)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const themeLabel = mode === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'
  const ThemeIcon = mode === 'light' ? Moon : Sun

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex min-h-svh flex-col">
        {/* Navegação do computador */}
        <header className="hidden border-b border-border bg-card md:block">
          <div className="mx-auto flex min-h-[76px] max-w-[1240px] flex-wrap items-center gap-x-7 gap-y-2 px-8 py-3">
            <Brand />
            <nav
              className="flex flex-1 flex-wrap items-center gap-1"
              aria-label="Navegação principal"
            >
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'inline-flex min-h-11 items-center rounded-full px-4 text-[15px] font-medium no-underline transition-colors',
                      isActive
                        ? 'bg-accent font-semibold text-accent-foreground'
                        : 'text-foreground/80 hover:bg-muted hover:text-foreground',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="flex items-center gap-3">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground"
                aria-hidden
              >
                {userInitials(user?.name)}
              </span>
              <span className="max-w-40 truncate text-sm text-muted-foreground">
                {user?.name || 'Fisioterapeuta'}
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleColorMode}
                    aria-label={themeLabel}
                  >
                    <ThemeIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{mode === 'light' ? 'Tema escuro' : 'Tema claro'}</TooltipContent>
              </Tooltip>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </header>

        {/* Barra superior do celular */}
        <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-2.5 md:hidden">
          <Brand compact />
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={toggleColorMode} aria-label={themeLabel}>
              <ThemeIcon className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Sair">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 pb-28 pt-6 sm:px-8 md:pb-16 md:pt-10">
          <div key={location.pathname} className="page-enter">
            <Outlet />
          </div>
        </main>

        {/* Barra inferior do celular */}
        <nav
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card px-2 pt-2 md:hidden"
          style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
          aria-label="Navegação principal"
        >
          <div className="flex items-start justify-around gap-1">
            {mobilePrimary.map((item) => {
              const Icon = item.icon
              const isActive = currentSection === item.to
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={cn(
                    'flex min-w-0 flex-1 flex-col items-center gap-0.5 text-[11px] no-underline',
                    isActive
                      ? 'font-bold text-accent-foreground'
                      : 'font-medium text-muted-foreground',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-8 w-14 items-center justify-center rounded-full',
                      isActive && 'bg-accent',
                    )}
                  >
                    <Icon className="h-[22px] w-[22px]" aria-hidden />
                  </span>
                  <span className="truncate">{item.label}</span>
                </NavLink>
              )
            })}

            {mobileMore.length > 0 ? (
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button
                    type="button"
                    className={cn(
                      'flex min-w-0 flex-1 flex-col items-center gap-0.5 bg-transparent text-[11px]',
                      moreActive
                        ? 'font-bold text-accent-foreground'
                        : 'font-medium text-muted-foreground',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-8 w-14 items-center justify-center rounded-full',
                        moreActive && 'bg-accent',
                      )}
                    >
                      <MoreHorizontal className="h-[22px] w-[22px]" aria-hidden />
                    </span>
                    <span>Mais</span>
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    side="top"
                    align="end"
                    sideOffset={8}
                    className="z-50 min-w-48 rounded-2xl border border-border bg-popover p-1.5 shadow-lg"
                  >
                    {mobileMore.map((item) => {
                      const Icon = item.icon
                      return (
                        <DropdownMenu.Item key={item.to} asChild>
                          <NavLink
                            to={item.to}
                            className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-medium text-foreground no-underline outline-none data-[highlighted]:bg-muted"
                          >
                            <Icon className="h-5 w-5 text-muted-foreground" aria-hidden />
                            {item.label}
                          </NavLink>
                        </DropdownMenu.Item>
                      )
                    })}
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            ) : null}
          </div>
        </nav>
      </div>
    </TooltipProvider>
  )
}
