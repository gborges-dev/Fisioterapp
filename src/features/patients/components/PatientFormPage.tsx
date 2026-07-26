import { AlertTriangle, Loader2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { PageHeader } from '@/components/AppShell'
import { ApiConfigAlert } from '@/components/ApiConfigAlert'
import { useToast } from '@/components/toast'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useSavePatient } from '../hooks/usePatientFicha'
import { usePatient } from '../hooks/usePatients'
import type { PatientRow } from '../services/patientsApi'
import { calculateAge } from '../utils/age'
import { isOptionalBirthDateValid } from '../utils/patientStepValidation'

const SEX_NONE = '__none__'

export function PatientFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const { data: existing, isLoading, isError, error } = usePatient(
    isEdit ? id : undefined,
  )

  if (isEdit && isLoading) {
    return (
      <div
        className="flex justify-center py-12"
        aria-label="A carregar paciente"
      >
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }
  if (isEdit && isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{(error as Error).message}</AlertDescription>
      </Alert>
    )
  }
  if (isEdit && !existing) {
    return (
      <Alert variant="warning">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>Paciente não encontrado.</AlertDescription>
      </Alert>
    )
  }

  return (
    <PatientFormFields
      key={id ?? 'new'}
      patientId={id}
      isEdit={isEdit}
      initialPatient={isEdit ? existing! : null}
    />
  )
}

function PatientFormFields({
  patientId,
  isEdit,
  initialPatient,
}: {
  patientId?: string
  isEdit: boolean
  initialPatient: PatientRow | null
}) {
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const save = useSavePatient()
  const [formError, setFormError] = useState<string | null>(null)

  const [fullName, setFullName] = useState(() => initialPatient?.full_name ?? '')
  const [birthDate, setBirthDate] = useState(
    () => initialPatient?.birth_date?.slice(0, 10) ?? '',
  )
  const [sex, setSex] = useState(() => initialPatient?.sex ?? '')
  const [phone, setPhone] = useState(() => initialPatient?.phone ?? '')
  const [email, setEmail] = useState(() => initialPatient?.email ?? '')
  const [address, setAddress] = useState(() => initialPatient?.address ?? '')
  const [cpf, setCpf] = useState(() => initialPatient?.cpf ?? '')
  const [consultationReason, setConsultationReason] = useState(
    () => initialPatient?.consultation_reason ?? '',
  )
  const [notes, setNotes] = useState(() => initialPatient?.notes ?? '')

  const ageLabel = useMemo(() => calculateAge(birthDate), [birthDate])

  const buildPatientPayload = () => ({
    full_name: fullName.trim(),
    birth_date: birthDate.trim() || null,
    sex: sex || null,
    phone: phone.trim() || null,
    email: email.trim() || null,
    address: address.trim() || null,
    cpf: cpf.trim() || null,
    consultation_reason: consultationReason.trim() || null,
    notes: notes.trim() || null,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) return
    if (!isOptionalBirthDateValid(birthDate)) {
      setFormError('Data de nascimento inválida.')
      return
    }
    setFormError(null)
    try {
      if (isEdit && patientId) {
        await save.mutateAsync({
          mode: 'update',
          patientId,
          patient: buildPatientPayload(),
        })
        showSuccess('Paciente guardado com sucesso.')
        void navigate(`/patients/${patientId}`)
      } else {
        const created = await save.mutateAsync({
          mode: 'create',
          patient: buildPatientPayload(),
        })
        showSuccess('Paciente guardado com sucesso.')
        void navigate(`/patients/${created.patientId}`)
      }
    } catch (err) {
      showError(err instanceof Error ? err : new Error(String(err)))
    }
  }

  const err = save.error

  const crumbPatient =
    isEdit && patientId
      ? [
          {
            label: fullName.trim() || 'Paciente',
            to: `/patients/${patientId}`,
          },
          { label: 'Editar paciente' },
        ]
      : [{ label: 'Novo paciente' }]

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: 'Painel', to: '/' },
          { label: 'Pacientes', to: '/patients' },
          ...crumbPatient,
        ]}
        title={isEdit ? 'Editar paciente' : 'Novo paciente'}
      />

      <ApiConfigAlert />

      {err ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{(err as Error).message}</AlertDescription>
        </Alert>
      ) : null}
      {formError ? (
        <Alert variant="warning" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between gap-2">
            <span>{formError}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => setFormError(null)}
              aria-label="Fechar aviso"
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <form
        onSubmit={(e) => void handleSubmit(e)}
        noValidate
        className="max-w-[720px]"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="fullName">Nome completo</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="birthDate">Data de nascimento</Label>
            <Input
              id="birthDate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="age">Idade</Label>
            <Input
              id="age"
              value={ageLabel != null ? String(ageLabel) : '—'}
              readOnly
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sex">Sexo</Label>
            <Select
              value={sex || SEX_NONE}
              onValueChange={(v) => setSex(v === SEX_NONE ? '' : v)}
            >
              <SelectTrigger id="sex">
                <SelectValue placeholder="Sexo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SEX_NONE}>Não indicado</SelectItem>
                <SelectItem value="F">Feminino</SelectItem>
                <SelectItem value="M">Masculino</SelectItem>
                <SelectItem value="O">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Endereço</Label>
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="consultationReason">Motivo da consulta</Label>
            <Textarea
              id="consultationReason"
              value={consultationReason}
              onChange={(e) => setConsultationReason(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" asChild>
            <Link
              to={isEdit && patientId ? `/patients/${patientId}` : '/patients'}
            >
              Cancelar
            </Link>
          </Button>
          <Button type="submit" disabled={save.isPending || !fullName.trim()}>
            Guardar paciente
          </Button>
        </div>
      </form>
    </div>
  )
}
