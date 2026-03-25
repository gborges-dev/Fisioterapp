import { alpha, createTheme } from '@mui/material/styles'

/**
 * Tema clínico / fisioterapia: teais e verdes-água (confiança, saúde, calma),
 * superfícies claras e cantos arredondados ao estilo Material Design 3 / apps Google.
 */
export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0d9488',
      light: '#2dd4bf',
      dark: '#0f766e',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#0891b2',
      light: '#22d3ee',
      dark: '#0e7490',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f1f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#475569',
    },
    divider: alpha('#0d9488', 0.12),
    success: {
      main: '#059669',
    },
    error: {
      main: '#dc2626',
    },
    warning: {
      main: '#d97706',
    },
    info: {
      main: '#0284c7',
    },
    action: {
      hover: alpha('#0d9488', 0.06),
      selected: alpha('#0d9488', 0.1),
      focus: alpha('#0d9488', 0.12),
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
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: `${alpha('#0d9488', 0.35)} transparent`,
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 999,
          paddingInline: 20,
          fontWeight: 500,
        },
        containedPrimary: ({ theme }) => ({
          boxShadow: `0 1px 2px ${alpha(theme.palette.primary.dark, 0.2)}`,
          '&:hover': {
            boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.35)}`,
          },
        }),
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundImage: 'none',
          ...(theme.palette.mode === 'light' && {
            border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
          }),
        }),
        elevation1: {
          boxShadow:
            '0px 1px 2px rgba(15, 23, 42, 0.05), 0px 2px 8px rgba(13, 148, 136, 0.06)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 16,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          boxShadow:
            '0px 1px 2px rgba(15, 23, 42, 0.04), 0px 4px 12px rgba(13, 148, 136, 0.06)',
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
          backgroundColor: alpha(theme.palette.background.paper, 0.88),
          backdropFilter: 'blur(14px)',
          borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          color: theme.palette.text.primary,
        }),
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: ({ theme }) => ({
          backgroundColor: alpha(theme.palette.primary.main, 0.03),
          borderRight: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          backgroundImage: 'none',
        }),
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 12,
          marginInline: 8,
          marginBlock: 2,
          '&.active': {
            backgroundColor: alpha(theme.palette.primary.main, 0.12),
            color: theme.palette.primary.dark,
            fontWeight: 600,
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.16),
            },
          },
        }),
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          borderRadius: 8,
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
          borderRadius: 12,
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: alpha(theme.palette.primary.main, 0.45),
          },
        }),
      },
    },
    MuiStepper: {
      styleOverrides: {
        root: ({ theme }) => ({
          padding: theme.spacing(2),
          borderRadius: 16,
          backgroundColor: alpha(theme.palette.primary.main, 0.04),
          border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
        }),
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 12,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        }),
      },
    },
  },
})
