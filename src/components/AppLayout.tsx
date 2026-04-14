import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined'
import HealingOutlinedIcon from '@mui/icons-material/HealingOutlined'
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined'
import MenuIcon from '@mui/icons-material/Menu'
import {
  AppBar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'

import { useColorMode } from '../theme/useColorMode'

const drawerWidth = 260

const navItems = [
  { to: '/', label: 'Painel' },
  { to: '/patients', label: 'Pacientes' },
  { to: '/forms', label: 'Formulários' },
  { to: '/reports', label: 'Relatórios' },
] as const

export function AppLayout() {
  const theme = useTheme()
  const { mode, toggleColorMode } = useColorMode()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)

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
            onClick={() => {
              if (isMobile) setMobileOpen(false)
            }}
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

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}
        component="nav"
      >
        <Toolbar>
          {isMobile ? (
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setMobileOpen(true)}
              aria-label="abrir menu"
            >
              <MenuIcon />
            </IconButton>
          ) : null}
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
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? mobileOpen : true}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
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
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: { xs: 7, sm: 8 },
          background: (t) =>
            `linear-gradient(180deg, ${t.palette.background.default} 0%, ${t.palette.background.paper} 48%)`,
          minHeight: '100vh',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  )
}
