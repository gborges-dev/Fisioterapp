import AddIcon from '@mui/icons-material/Add'
import LinkIcon from '@mui/icons-material/Link'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Link as MuiLink,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { SupabaseConfigAlert } from '../../../components/SupabaseConfigAlert'
import { useFormTemplateMutations, useFormTemplates } from '../hooks/useFormTemplates'

export function FormsListPage() {
  const { data, isLoading, isError, error } = useFormTemplates()
  const { createLink } = useFormTemplateMutations()
  const [copied, setCopied] = useState<string | null>(null)

  const handleCreateLink = async (templateId: string) => {
    try {
      const row = await createLink.mutateAsync(templateId)
      const url = `${window.location.origin}/f/${row.public_token}`
      await navigator.clipboard.writeText(url)
      setCopied(row.id)
      setTimeout(() => setCopied(null), 3000)
    } catch {
      /* mutation error */
    }
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          mb: 2,
        }}
      >
        <Typography variant="h4" component="h2">
          Formulários
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          component={Link}
          to="/forms/new"
        >
          Novo formulário
        </Button>
      </Box>
      <SupabaseConfigAlert />
      {copied ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          Link público copiado para a área de transferência.
        </Alert>
      ) : null}
      {createLink.error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {(createLink.error as Error).message}
        </Alert>
      ) : null}
      {isLoading ? <CircularProgress /> : null}
      {isError ? (
        <Alert severity="error">{(error as Error).message}</Alert>
      ) : null}
      {data && data.length === 0 ? (
        <Typography>Nenhum formulário.</Typography>
      ) : null}
      {data && data.length > 0 ? (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Título</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.title}</TableCell>
                  <TableCell align="right">
                    <Stack
                      direction="row"
                      spacing={1}
                      justifyContent="flex-end"
                      flexWrap="wrap"
                    >
                      <MuiLink component={Link} to={`/forms/${row.id}/edit`}>
                        Editar
                      </MuiLink>
                      <Button
                        size="small"
                        startIcon={<LinkIcon />}
                        onClick={() => void handleCreateLink(row.id)}
                        disabled={createLink.isPending}
                      >
                        Link público
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : null}
    </Box>
  )
}
