import { useState, type FormEvent } from 'react'
import { CheckboxGroup, ErrorAlert, SelectField, TextField } from '../../../shared/ui/fields'
import { toNumber } from '../../../shared/ui/toNumber'
import { useSubmit } from '../../../shared/ui/useSubmit'
import type { RegisterHousekeeperCommand } from '../application/registerHousekeeper'
import { CITIES, SKILLS, WEEKDAYS, type City, type Skill, type Weekday } from '../domain/Housekeeper'

interface FormState {
  name: string
  birthDate: string
  phone: string
  city: string
  neighborhood: string
  skills: Skill[]
  availability: Weekday[]
  expectedSalary: string
  yearsOfExperience: string
}

const EMPTY: FormState = {
  name: '',
  birthDate: '',
  phone: '',
  city: '',
  neighborhood: '',
  skills: [],
  availability: [],
  expectedSalary: '',
  yearsOfExperience: '',
}

function toCommand(form: FormState): RegisterHousekeeperCommand {
  return { ...form, city: form.city as City, expectedSalary: toNumber(form.expectedSalary), yearsOfExperience: toNumber(form.yearsOfExperience) }
}

interface Props {
  onSubmit: (command: RegisterHousekeeperCommand) => Promise<unknown>
  onSuccess?: () => void
}

export function HousekeeperForm({ onSubmit, onSuccess }: Props) {
  const [form, setForm] = useState(EMPTY)
  const { errors, generalError, submitting, submit } = useSubmit(onSubmit, onSuccess)

  const set = <K extends keyof FormState>(field: K) => (value: FormState[K]) => setForm({ ...form, [field]: value })

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (await submit(toCommand(form))) setForm(EMPTY)
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Registo de empregada" noValidate>
      <ErrorAlert message={generalError} />
      <div className="form-grid">
        <TextField id="hk-name" label="Nome completo" value={form.name} onChange={set('name')} error={errors.name} />
        <TextField id="hk-birth" label="Data de nascimento" type="date" value={form.birthDate} onChange={set('birthDate')} error={errors.birthDate} />
        <TextField id="hk-phone" label="Telemóvel" value={form.phone} onChange={set('phone')} error={errors.phone} placeholder="86 123 4567" />
        <SelectField id="hk-city" label="Cidade" value={form.city} onChange={set('city')} options={CITIES.map((c) => ({ value: c, label: c }))} error={errors.city} />
        <TextField id="hk-neighborhood" label="Bairro" value={form.neighborhood} onChange={set('neighborhood')} error={errors.neighborhood} />
        <TextField id="hk-salary" label="Salário pretendido (MZN)" type="currency" value={form.expectedSalary} onChange={set('expectedSalary')} error={errors.expectedSalary} />
        <TextField id="hk-experience" label="Anos de experiência" type="number" value={form.yearsOfExperience} onChange={set('yearsOfExperience')} error={errors.yearsOfExperience} />
      </div>
      <CheckboxGroup id="hk-skills" label="Competências" options={SKILLS} selected={form.skills} onChange={set('skills')} error={errors.skills} />
      <CheckboxGroup id="hk-availability" label="Dias disponíveis" options={WEEKDAYS} selected={form.availability} onChange={set('availability')} error={errors.availability} />
      <button type="submit" className="btn btn-primary" disabled={submitting}>
        Submeter perfil
      </button>
    </form>
  )
}
