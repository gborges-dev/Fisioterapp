import AttachFileIcon from '@mui/icons-material/AttachFile'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import DownloadIcon from '@mui/icons-material/Download'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  IconButton,
  Link,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { useRef, useState } from 'react'

import { ConfirmDeleteDialog } from '../../../components/ConfirmDeleteDialog'
import { ListCard } from '../../../components/ListCard'
import { ListPageSkeleton } from '../../../components/ListPageSkeleton'
import { SupabaseConfigAlert } from '../../../components/SupabaseConfigAlert'
import { toastError, toastSuccess } from '../../../components/toast'
import {
  useDeleteDocument,
  usePatientDocuments,
  useUploadDocument,
} from '../hooks/useDocuments'
import { downloadDocumentFile } from '../services/documentsApi'
import type { DocumentRow } from '../services/documentsApi'

function documentUrl(doc: DocumentRow) {
  return doc.public_url ?? ''
}

export function DocumentsPanel({ patientId }: { patientId: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [docToDelete, setDocToDelete] = useState<DocumentRow | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const { data, isLoading, isError, error } = usePatientDocuments(patientId)
  const upload = useUploadDocument(patientId)
  const remove = useDeleteDocument(patientId)

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
      const url = documentUrl(doc)
      if (!url) throw new Error('URL do documento em falta.')
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
      })
      setDocToDelete(null)
    } catch {
      /* toast no hook */
    }
  }

  return (
    <Box>
      <Typography variant="h6" component="h3" gutterBottom>
        Documentos
      </Typography>
      <SupabaseConfigAlert />
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <input ref={inputRef} type="file" hidden onChange={onFileChange} />
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
      {isLoading ? <ListPageSkeleton count={4} /> : null}
      {isError ? (
        <Alert severity="error">{(error as Error).message}</Alert>
      ) : null}
      {data && data.length === 0 ? (
        <Typography color="text.secondary">Nenhum documento.</Typography>
      ) : null}
      {data && data.length > 0 ? (
        <Grid container spacing={2}>
          {data.map((doc) => (
            <Grid key={doc.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <ListCard
                actions={
                  <>
                    <Tooltip title="Transferir">
                      <span>
                        <IconButton
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
                          aria-label={`Eliminar ${doc.file_name}`}
                          color="error"
                          onClick={() => setDocToDelete(doc)}
                          disabled={remove.isPending || downloadingId === doc.id}
                        >
                          <DeleteOutlineIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </>
                }
              >
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 600, wordBreak: 'break-word' }}
                >
                  <Link
                    href={documentUrl(doc) || undefined}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {doc.file_name}
                  </Link>
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {new Date(doc.created_at).toLocaleString('pt-PT')}
                </Typography>
              </ListCard>
            </Grid>
          ))}
        </Grid>
      ) : null}

      <ConfirmDeleteDialog
        open={Boolean(docToDelete)}
        title="Eliminar anexo"
        message={
          <>
            Tem a certeza que pretende eliminar &quot;{docToDelete?.file_name}
            &quot;? Esta ação não pode ser anulada.
          </>
        }
        loading={remove.isPending}
        onCancel={() => setDocToDelete(null)}
        onConfirm={() => void confirmDelete()}
      />
    </Box>
  )
}
