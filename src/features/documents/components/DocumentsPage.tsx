import AttachFileIcon from '@mui/icons-material/AttachFile'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Link,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import { useRef } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'

import { SupabaseConfigAlert } from '../../../components/SupabaseConfigAlert'
import { getPublicUrl, usePatientDocuments, useUploadDocument } from '../hooks/useDocuments'

export function DocumentsPage() {
  const { id: patientId } = useParams<{ id: string }>()
  const inputRef = useRef<HTMLInputElement>(null)
  const { data, isLoading, isError, error } = usePatientDocuments(patientId)
  const upload = useUploadDocument(patientId ?? '')

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

  if (!patientId) {
    return <Alert severity="error">Paciente inválido.</Alert>
  }

  return (
    <Box>
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
            <ListItem key={doc.id} disablePadding sx={{ py: 1 }}>
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
            </ListItem>
          ))}
        </List>
      ) : null}
    </Box>
  )
}
