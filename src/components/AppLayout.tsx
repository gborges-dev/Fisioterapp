import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import HealingOutlinedIcon from '@mui/icons-material/HealingOutlined'
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined'
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline'
import {
  AppBar,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useMemo } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

import { useColorMode } from '../theme/useColorMode'

const drawerWidth = 260

const navItems = [
  { to: '/', label: 'Painel' },
  { to: '/patients', label: 'Pacientes' },
  { to: '/forms', label: 'Formulários' },
  { to: '/reports', label: 'Relatórios' },
] as const

const bottomNavConfig = [
  { to: '/', label: 'Painel', icon: <DashboardOutlinedIcon /> },
  { to: '/patients', label: 'Pacientes', icon: <PeopleOutlineIcon /> },
  { to: '/forms', label: 'Formulários', icon: <ArticleOutlinedIcon /> },
  { to: '/reports', label: 'Relatórios', icon: <AssessmentOutlinedIcon /> },
] as const

function bottomNavValue(pathname: string): string {
  if (pathname === '/' || pathname === '') return '/'
  if (pathname.startsWith('/patients')) return '/patients'
  if (pathname.startsWith('/forms')) return '/forms'
  if (pathname.startsWith('/reports')) return '/reports'
  return pathname
}

export function AppLayout() {
  const theme = useTheme()
  const { mode, toggleColorMode } = useColorMode()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const location = useLocation()
  const mobileNavValue = useMemo(
    () => bottomNavValue(location.pathname),
    [location.pathname],
  )

  const drawer = (
    <Box sx={{ overflow: 'auto' }}>
      <Toolbar sx={{ gap: 1.5, py: 2 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            display: 'grid',
            placeItems: 'center',
            bgcolor: (t) => alpha(t.palette.primary.main, 0.14),
            color: 'primary.main',
          }}
        >
          <HealingOutlinedIcon fontSize="small" aria-hidden />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" color="text.secondary" noWrap>
            Área clínica
          </Typography>
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
            Fisioterapp
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            end={item.to === '/'}
            sx={{
              '&.active': { bgcolor: 'action.selected' },
            }}
          >
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  )

  const mainBottomPad = isMobile
    ? `calc(${theme.spacing(3)} + 56px + env(safe-area-inset-bottom, 0px))`
    : undefined

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}
        component="header"
      >
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
            <HealingOutlinedIcon sx={{ color: 'primary.main', opacity: 0.9 }} aria-hidden />
            <Typography variant="h6" component="h1" sx={{ fontWeight: 600 }}>
              Fisioterapp
            </Typography>
          </Box>
          <Tooltip
            title={mode === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'}
          >
            <IconButton
              color="inherit"
              onClick={toggleColorMode}
              aria-label={
                mode === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'
              }
              edge="end"
            >
              {mode === 'light' ? <DarkModeOutlinedIcon /> : <LightModeOutlinedIcon />}
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {!isMobile ? (
        <Drawer
          variant="permanent"
          open
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
            },
          }}
        >
          {drawer}
        </Drawer>
      ) : null}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          pb: mainBottomPad ?? { xs: 2, sm: 3 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: { xs: 7, sm: 8 },
          background: (t) =>
            `linear-gradient(180deg, ${t.palette.background.default} 0%, ${t.palette.background.paper} 48%)`,
          minHeight: '100vh',
        }}
      >
        <Outlet />
      </Box>

      {isMobile ? (
        <Paper
          component="nav"
          elevation={8}
          square
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: (t) => t.zIndex.appBar,
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            pb: 'env(safe-area-inset-bottom, 0px)',
          }}
          aria-label="Navegação principal"
        >
          <BottomNavigation value={mobileNavValue} showLabels>
            {bottomNavConfig.map((item) => (
              <BottomNavigationAction
                key={item.to}
                label={item.label}
                icon={item.icon}
                value={item.to}
                component={NavLink}
                to={item.to}
                end={item.to === '/'}
              />
            ))}
          </BottomNavigation>
        </Paper>
      ) : null}
    </Box>
  )
}
