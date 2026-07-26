import { Download, Loader2, Paperclip, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'

import { ApiConfigAlert } from '@/components/ApiConfigAlert'
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'
import { ListCard } from '@/components/ListCard'
import { ListPageSkeleton } from '@/components/ListPageSkeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { toastError, toastSuccess } from '@/components/toast'
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
    <div>
      <h3 className="mb-4 text-lg font-semibold text-foreground">Documentos</h3>
      <ApiConfigAlert />
      <div className="mb-4 flex items-center gap-3">
        <input ref={inputRef} type="file" hidden onChange={onFileChange} />
        <Button onClick={onPickFile} disabled={upload.isPending}>
          <Paperclip className="h-4 w-4" />
          Anexar ficheiro
        </Button>
        {upload.isPending ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : null}
      </div>
      {upload.error ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{(upload.error as Error).message}</AlertDescription>
        </Alert>
      ) : null}
      {isLoading ? <ListPageSkeleton count={4} /> : null}
      {isError ? (
        <Alert variant="destructive">
          <AlertDescription>{(error as Error).message}</AlertDescription>
        </Alert>
      ) : null}
      {data && data.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum documento.</p>
      ) : null}
      {data && data.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {data.map((doc) => (
            <ListCard
              key={doc.id}
              actions={
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label={`Transferir ${doc.file_name}`}
                          onClick={() => void handleDownload(doc)}
                          disabled={downloadingId === doc.id || remove.isPending}
                        >
                          {downloadingId === doc.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>Transferir</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          aria-label={`Eliminar ${doc.file_name}`}
                          onClick={() => setDocToDelete(doc)}
                          disabled={remove.isPending || downloadingId === doc.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>Eliminar</TooltipContent>
                  </Tooltip>
                </>
              }
            >
              <h4 className="break-words text-sm font-semibold text-foreground">
                <a
                  href={documentUrl(doc) || undefined}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  {doc.file_name}
                </a>
              </h4>
              <p className="mt-1 text-sm text-muted-foreground">
                {new Date(doc.created_at).toLocaleString('pt-PT')}
              </p>
            </ListCard>
          ))}
        </div>
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
    </div>
  )
}
