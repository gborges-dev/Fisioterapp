import type { PaletteMode } from '@mui/material'
import {
  alpha,
  createTheme,
  darken,
  lighten,
} from '@mui/material/styles'
import type { Theme } from '@mui/material/styles'

/** Cor base do sistema — paleta clara/escura deriva desta. */
export const BRAND_PRIMARY = '#c5905f'

function primaryScale(mode: PaletteMode) {
  const main = mode === 'dark' ? lighten(BRAND_PRIMARY, 0.12) : BRAND_PRIMARY
  return {
    main,
    light: lighten(main, 0.22),
    dark: darken(main, 0.18),
    contrastText: mode === 'dark' ? '#1a1510' : '#ffffff',
  }
}

function secondaryScale(mode: PaletteMode) {
  const base = darken(BRAND_PRIMARY, 0.28)
  const main = mode === 'dark' ? lighten(base, 0.35) : base
  return {
    main,
    light: lighten(main, 0.2),
    dark: darken(main, 0.15),
    contrastText: '#ffffff',
  }
}

export function createAppTheme(mode: PaletteMode) {
  const primary = primaryScale(mode)
  const secondary = secondaryScale(mode)

  return createTheme({
    palette: {
      mode,
      primary,
      secondary,
      background:
        mode === 'light'
          ? { default: '#f6f3ef', paper: '#ffffff' }
          : { default: '#141210', paper: '#1e1b18' },
      text:
        mode === 'light'
          ? { primary: '#1c1915', secondary: '#5c534a' }
          : { primary: '#f2ebe3', secondary: '#b8aea3' },
      divider: alpha(primary.main, mode === 'light' ? 0.14 : 0.22),
      success: { main: mode === 'light' ? '#059669' : '#34d399' },
      error: { main: mode === 'light' ? '#dc2626' : '#f87171' },
      warning: { main: mode === 'light' ? '#d97706' : '#fbbf24' },
      info: { main: mode === 'light' ? '#0284c7' : '#38bdf8' },
      action: {
        hover: alpha(primary.main, mode === 'light' ? 0.08 : 0.12),
        selected: alpha(primary.main, mode === 'light' ? 0.12 : 0.18),
        focus: alpha(primary.main, mode === 'light' ? 0.14 : 0.2),
      },
    },
    typography: {
      fontFamily:
        '"Roboto", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
      h1: { fontWeight: 500, letterSpacing: '-0.02em' },
      h2: { fontWeight: 500, letterSpacing: '-0.01em' },
      h3: { fontWeight: 500 },
      h4: { fontWeight: 500 },
      h5: { fontWeight: 500 },
      h6: { fontWeight: 600 },
      button: { fontWeight: 500, letterSpacing: '0.02em' },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: ({ theme }: { theme: Theme }) => ({
            scrollbarColor: `${alpha(theme.palette.primary.main, 0.45)} transparent`,
          }),
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 10,
            paddingInline: 18,
            fontWeight: 500,
          },
          containedPrimary: ({ theme }) => ({
            boxShadow: `0 1px 2px ${alpha(theme.palette.primary.dark, 0.25)}`,
            '&:hover': {
              boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.4)}`,
            },
          }),
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundImage: 'none',
            border: `1px solid ${alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.1 : 0.2)}`,
          }),
          elevation1: ({ theme }) => ({
            boxShadow:
              theme.palette.mode === 'light'
                ? `0px 1px 2px rgba(28, 25, 21, 0.06), 0px 2px 8px ${alpha(theme.palette.primary.main, 0.08)}`
                : `0px 1px 3px rgba(0,0,0,0.4), 0px 2px 8px ${alpha(theme.palette.primary.main, 0.12)}`,
          }),
        },
      },
      MuiCard: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 10,
            border: `1px solid ${alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.12 : 0.22)}`,
            boxShadow: 'none',
            backgroundImage: 'none',
          }),
        },
      },
      MuiAppBar: {
        defaultProps: {
          elevation: 0,
          color: 'default',
        },
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor: alpha(theme.palette.background.paper, 0.92),
            backdropFilter: 'blur(14px)',
            borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.14)}`,
            color: theme.palette.text.primary,
          }),
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: ({ theme }) => ({
            backgroundColor: alpha(theme.palette.primary.main, 0.04),
            borderRight: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
            backgroundImage: 'none',
          }),
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 8,
            marginInline: 8,
            marginBlock: 2,
            '&.active': {
              backgroundColor: alpha(theme.palette.primary.main, 0.14),
              color:
                theme.palette.mode === 'light'
                  ? theme.palette.primary.dark
                  : theme.palette.primary.light,
              fontWeight: 600,
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.2),
              },
            },
          }),
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 500,
            borderRadius: 6,
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          variant: 'outlined',
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 8,
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: alpha(theme.palette.primary.main, 0.5),
            },
          }),
        },
      },
      MuiStepper: {
        styleOverrides: {
          root: ({ theme }) => ({
            padding: theme.spacing(2),
            borderRadius: 10,
            backgroundColor: alpha(theme.palette.primary.main, 0.06),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          }),
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
      MuiTableContainer: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 6,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.14)}`,
          }),
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: ({ theme }) => ({
            '& .MuiTableCell-head': {
              fontWeight: 600,
              backgroundColor: alpha(theme.palette.primary.main, 0.06),
            },
          }),
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: ({ theme }) => ({
            transition: theme.transitions.create('background-color', {
              duration: theme.transitions.duration.shortest,
            }),
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
          }),
        },
      },
    },
  })
}

/** Tema claro fixo — útil em testes e storybooks. */
export const appTheme = createAppTheme('light')
