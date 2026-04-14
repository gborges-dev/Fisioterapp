import AttachFileIcon from '@mui/icons-material/AttachFile'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import DownloadIcon from '@mui/icons-material/Download'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Link,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { useRef, useState } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'

import { PageBreadcrumbs } from '../../../components/PageBreadcrumbs'
import { SupabaseConfigAlert } from '../../../components/SupabaseConfigAlert'
import { usePatient } from '../../patients/hooks/usePatients'
import { toastError, toastSuccess } from '../../../components/toast'
import {
  getPublicUrl,
  useDeleteDocument,
  usePatientDocuments,
  useUploadDocument,
} from '../hooks/useDocuments'
import { downloadDocumentFile } from '../services/documentsApi'
import type { DocumentRow } from '../services/documentsApi'

export function DocumentsPage() {
  const { id: patientId } = useParams<{ id: string }>()
  const { data: patient } = usePatient(patientId)
  const inputRef = useRef<HTMLInputElement>(null)
  const [docToDelete, setDocToDelete] = useState<DocumentRow | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const { data, isLoading, isError, error } = usePatientDocuments(patientId)
  const upload = useUploadDocument(patientId ?? '')
  const remove = useDeleteDocument(patientId ?? '')

  const onPickFile = () => inputRef.current?.click()

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !patientId) return
    try {
      await upload.mutateAsync(file)
    } catch {
      /* mutation error */
    }
  }

  const handleDownload = async (doc: DocumentRow) => {
    setDownloadingId(doc.id)
    try {
      const url = getPublicUrl(doc.storage_path)
      await downloadDocumentFile(url, doc.file_name)
      toastSuccess('Ficheiro transferido.')
    } catch (e) {
      toastError(e instanceof Error ? e : new Error(String(e)))
    } finally {
      setDownloadingId(null)
    }
  }

  const confirmDelete = async () => {
    if (!docToDelete) return
    try {
      await remove.mutateAsync({
        documentId: docToDelete.id,
        storagePath: docToDelete.storage_path,
      })
      setDocToDelete(null)
    } catch {
      /* toast no hook */
    }
  }

  if (!patientId) {
    return <Alert severity="error">Paciente inválido.</Alert>
  }

  return (
    <Box>
      <PageBreadcrumbs
        items={[
          { label: 'Painel', to: '/' },
          { label: 'Pacientes', to: '/patients' },
          ...(patient && patientId
            ? [
                { label: patient.full_name, to: `/patients/${patientId}` },
                { label: 'Documentos' },
              ]
            : [{ label: 'Documentos' }]),
        ]}
      />
      <Typography variant="h4" component="h2" gutterBottom>
        Documentos
      </Typography>
      <Button component={RouterLink} to={`/patients/${patientId}`} sx={{ mb: 2 }}>
        Voltar ao paciente
      </Button>
      <SupabaseConfigAlert />
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <input
          ref={inputRef}
          type="file"
          hidden
          onChange={onFileChange}
        />
        <Button
          variant="contained"
          startIcon={<AttachFileIcon />}
          onClick={onPickFile}
          disabled={upload.isPending}
        >
          Anexar ficheiro
        </Button>
        {upload.isPending ? <CircularProgress size={24} /> : null}
      </Stack>
      {upload.error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {(upload.error as Error).message}
        </Alert>
      ) : null}
      {isLoading ? <CircularProgress /> : null}
      {isError ? (
        <Alert severity="error">{(error as Error).message}</Alert>
      ) : null}
      {data && data.length === 0 ? (
        <Typography color="text.secondary">Nenhum documento.</Typography>
      ) : null}
      {data && data.length > 0 ? (
        <List>
          {data.map((doc) => (
            <ListItem
              key={doc.id}
              sx={{
                py: 1,
                pr: { xs: 10, sm: 12 },
                borderBottom: 1,
                borderColor: 'divider',
              }}
            >
              <ListItemText
                primary={
                  <Link
                    href={getPublicUrl(doc.storage_path)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {doc.file_name}
                  </Link>
                }
                secondary={new Date(doc.created_at).toLocaleString()}
              />
              <ListItemSecondaryAction>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Tooltip title="Transferir">
                    <span>
                      <IconButton
                        edge="end"
                        aria-label={`Transferir ${doc.file_name}`}
                        onClick={() => void handleDownload(doc)}
                        disabled={downloadingId === doc.id || remove.isPending}
                      >
                        {downloadingId === doc.id ? (
                          <CircularProgress size={22} />
                        ) : (
                          <DownloadIcon />
                        )}
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Eliminar">
                    <span>
                      <IconButton
                        edge="end"
                        aria-label={`Eliminar ${doc.file_name}`}
                        color="error"
                        onClick={() => setDocToDelete(doc)}
                        disabled={remove.isPending || downloadingId === doc.id}
                      >
                        <DeleteOutlineIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      ) : null}

      <Dialog
        open={Boolean(docToDelete)}
        onClose={() => setDocToDelete(null)}
        aria-labelledby="delete-doc-title"
      >
        <DialogTitle id="delete-doc-title">Eliminar anexo</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem a certeza que pretende eliminar &quot;{docToDelete?.file_name}
            &quot;? Esta ação não pode ser anulada.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDocToDelete(null)}>Cancelar</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => void confirmDelete()}
            disabled={remove.isPending}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
