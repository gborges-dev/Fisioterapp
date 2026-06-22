import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Chip,
  IconButton,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'

import { RichTextContent } from '../../../components/RichTextContent'
import { previewPlainText } from '../../../lib/richText'
import type { EvolutionRow } from '../services/evolutionApi'

export function formatEvolutionDate(iso: string) {
  try {
    return new Date(iso + 'T12:00:00').toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

export function EvolutionEntriesAccordion({
  entries,
  formTitleById,
  isLoading,
  isError,
  error,
  expandedId,
  editingId,
  onExpandedChange,
  onEdit,
  onDelete,
  deleteDisabled,
}: {
  entries: EvolutionRow[] | undefined
  formTitleById: Map<string, string>
  isLoading: boolean
  isError: boolean
  error: Error | null
  expandedId: string | false
  editingId: string | null
  onExpandedChange: (id: string | false) => void
  onEdit: (row: EvolutionRow) => void
  onDelete: (row: EvolutionRow) => void
  deleteDisabled?: boolean
}) {
  if (isLoading) {
    return (
      <Stack spacing={1}>
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
        ))}
      </Stack>
    )
  }

  if (isError) {
    return <Alert severity="error">{error?.message ?? 'Erro ao carregar registos.'}</Alert>
  }

  if (!entries?.length) {
    return (
      <Typography color="text.secondary" variant="body2">
        Sem registos ainda.
      </Typography>
    )
  }

  return (
    <Stack spacing={1}>
      {entries.map((row) => {
        const fichaTitle =
          formTitleById.get(row.patient_evaluation_form_id) ?? 'Ficha'
        const isEditing = editingId === row.id
        const preview = previewPlainText(row.content)

        return (
          <Accordion
            key={row.id}
            disableGutters
            elevation={0}
            expanded={expandedId === row.id}
            onChange={(_e, isExpanded) =>
              onExpandedChange(isExpanded ? row.id : false)
            }
            sx={(theme) => ({
              border: `1px solid ${alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.22 : 0.35)}`,
              borderRadius: `${theme.shape.borderRadius}px !important`,
              '&:before': { display: 'none' },
              ...(isEditing
                ? {
                    borderColor: 'primary.main',
                    boxShadow: `0 0 0 1px ${theme.palette.primary.main}`,
                  }
                : {}),
            })}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`evolution-panel-${row.id}`}
              id={`evolution-header-${row.id}`}
              sx={{
                px: 2,
                py: 1.5,
                alignItems: 'flex-start',
                minHeight: 'unset',
                '&.Mui-expanded': {
                  minHeight: 'unset',
                },
                '& .MuiAccordionSummary-content': {
                  display: 'block',
                  my: 0,
                  overflow: 'visible',
                  minWidth: 0,
                },
                '& .MuiAccordionSummary-expandIconWrapper': {
                  alignSelf: 'center',
                },
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 0.5,
                  width: '100%',
                  minWidth: 0,
                }}
              >
                <Box sx={{ minWidth: 0, flex: 1, pr: 1 }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  flexWrap="wrap"
                  sx={{ mb: preview ? 0.5 : 0 }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {formatEvolutionDate(row.entry_date)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    · {fichaTitle}
                  </Typography>
                  {isEditing ? (
                    <Chip label="A editar" size="small" color="primary" />
                  ) : null}
                </Stack>
                {preview ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    noWrap
                    sx={{ display: expandedId === row.id ? 'none' : 'block' }}
                  >
                    {preview}
                  </Typography>
                ) : null}
              </Box>
              <Stack
                direction="row"
                spacing={0.25}
                onClick={(e) => e.stopPropagation()}
                sx={{ alignSelf: 'center', flexShrink: 0 }}
              >
                <Tooltip title="Editar registo">
                  <IconButton
                    size="small"
                    color="primary"
                    aria-label={`Editar registo de ${formatEvolutionDate(row.entry_date)}`}
                    onClick={() => onEdit(row)}
                  >
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Eliminar registo">
                  <IconButton
                    size="small"
                    color="error"
                    aria-label={`Eliminar registo de ${formatEvolutionDate(row.entry_date)}`}
                    onClick={() => onDelete(row)}
                    disabled={deleteDisabled}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 2, pt: 0, pb: 2 }}>
              <RichTextContent content={row.content} variant="body2" />
            </AccordionDetails>
          </Accordion>
        )
      })}
    </Stack>
  )
}
