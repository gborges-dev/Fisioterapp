import {
  Activity,
  Building2,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Moon,
  Receipt,
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

const clinicalNavItems = [
  { to: '/', label: 'Painel', icon: LayoutDashboard },
  { to: '/patients', label: 'Pacientes', icon: Users },
  { to: '/evaluation-forms', label: 'Fichas de avaliação', icon: ClipboardList },
  { to: '/forms', label: 'Formulários', icon: FileText },
  { to: '/finance', label: 'Financeiro', icon: Receipt },
  { to: '/reports', label: 'Relatórios', icon: Activity },
] as const

const bottomNavConfig = [
  { to: '/', label: 'Painel', icon: LayoutDashboard },
  { to: '/patients', label: 'Pacientes', icon: Users },
  { to: '/evaluation-forms', label: 'Fichas', icon: ClipboardList },
  { to: '/forms', label: 'Formulários', icon: FileText },
  { to: '/finance', label: 'Financeiro', icon: Receipt },
  { to: '/reports', label: 'Relatórios', icon: Activity },
] as const

function bottomNavValue(pathname: string): string {
  if (pathname === '/' || pathname === '') return '/'
  if (pathname.startsWith('/patients')) return '/patients'
  if (pathname.startsWith('/evaluation-forms')) return '/evaluation-forms'
  if (pathname.startsWith('/forms')) return '/forms'
  if (pathname.startsWith('/finance')) return '/finance'
  if (pathname.startsWith('/reports')) return '/reports'
  return pathname
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
    <div className={cn('glass rounded-2xl p-5', className)} {...props}>
      {children}
    </div>
  )
}

export function PageHeader({
  breadcrumbs,
  title,
  subtitle,
  actions,
}: {
  breadcrumbs?: BreadcrumbItem[]
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <header className="mb-6 space-y-4">
      {breadcrumbs && breadcrumbs.length > 0 ? (
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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="text-sm text-muted-foreground md:text-base">{subtitle}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
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
      <h2 className="display text-xl font-semibold text-foreground">{title}</h2>
      {description ? (
        <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </GlassPanel>
  )
}

function NavItem({
  to,
  label,
  icon: Icon,
  end,
}: {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  end?: boolean
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'lift flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-foreground hover:bg-white/40 dark:hover:bg-white/5',
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      <span className="truncate">{label}</span>
    </NavLink>
  )
}

export function AppShell() {
  const { mode, toggleColorMode } = useColorMode()
  const { user, logout, isSuperAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const mobileNavValue = useMemo(
    () => bottomNavValue(location.pathname),
    [location.pathname],
  )

  const navItems = useMemo(
    () =>
      isSuperAdmin
        ? [...clinicalNavItems, { to: '/admin/bases', label: 'Bases', icon: Building2 }]
        : [...clinicalNavItems],
    [isSuperAdmin],
  )

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex min-h-svh">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col p-4 md:flex">
          <div className="glass-strong lift rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-chart-2 text-primary-foreground shadow-sm"
                aria-hidden
              >
                <Activity className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Área clínica</p>
                <p className="display truncate text-lg font-semibold leading-tight">
                  Fisioterapp
                </p>
              </div>
            </div>
          </div>

          <nav
            className="glass mt-4 flex flex-1 flex-col gap-1 rounded-2xl p-2"
            aria-label="Navegação principal"
          >
            {navItems.map((item) => (
              <NavItem
                key={item.to}
                to={item.to}
                label={item.label}
                icon={item.icon}
                end={item.to === '/'}
              />
            ))}
          </nav>

          <div className="glass-strong mt-4 space-y-2 rounded-2xl p-3">
            {user?.name ? (
              <p className="truncate px-1 text-xs text-muted-foreground">{user.name}</p>
            ) : null}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 lift"
                onClick={toggleColorMode}
                aria-label={mode === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'}
              >
                {mode === 'light' ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
                <span className="sr-only md:not-sr-only">
                  {mode === 'light' ? 'Escuro' : 'Claro'}
                </span>
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="lift shrink-0"
                    onClick={handleLogout}
                    aria-label="Sair"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Sair</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile topbar */}
          <header className="glass-strong sticky top-0 z-40 flex items-center justify-between gap-3 px-4 py-3 md:hidden">
            <div className="flex min-w-0 items-center gap-2">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-chart-2 text-primary-foreground"
                aria-hidden
              >
                <Activity className="h-4 w-4" />
              </div>
              <span className="display truncate text-base font-semibold">Fisioterapp</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleColorMode}
                aria-label={mode === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'}
              >
                {mode === 'light' ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Sair">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <main className="flex-1 px-4 py-4 sm:px-6 sm:py-6 md:pb-6">
            {isSuperAdmin ? (
              <div className="mb-4 md:hidden">
                <Button variant="outline" size="sm" asChild className="lift">
                  <NavLink to="/admin/bases">Bases</NavLink>
                </Button>
              </div>
            ) : null}
            <div key={location.pathname} className="page-enter">
              <Outlet />
            </div>
          </main>
        </div>

        {/* Mobile bottom nav */}
        <nav
          className="glass-strong fixed bottom-4 left-4 right-4 z-40 rounded-2xl px-2 py-1.5 md:hidden"
          style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom))' }}
          aria-label="Navegação principal"
        >
          <div className="flex items-center justify-around gap-0.5">
            {bottomNavConfig.map((item) => {
              const Icon = item.icon
              const isActive = mobileNavValue === item.to
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={cn(
                    'lift flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-medium transition-colors',
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="truncate max-[359px]:hidden">{item.label}</span>
                </NavLink>
              )
            })}
          </div>
        </nav>

        {/* Spacer for mobile bottom nav */}
        <div
          className="pointer-events-none fixed bottom-0 left-0 right-0 h-20 md:hidden"
          aria-hidden
        />
      </div>
    </TooltipProvider>
  )
}