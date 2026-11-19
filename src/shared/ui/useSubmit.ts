import { useState } from 'react'
import { BusinessRuleError, ValidationError, type FieldErrors } from '../domain/errors'

export function useSubmit<C, R>(action: (command: C) => Promise<R>, onSuccess?: (result: R) => void) {
  const [errors, setErrors] = useState<FieldErrors>({})
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function submit(command: C): Promise<boolean> {
    setSubmitting(true)
    setErrors({})
    setGeneralError(null)
    try {
      const result = await action(command)
      onSuccess?.(result)
      return true
    } catch (error) {
      if (error instanceof ValidationError) setErrors(error.fields)
      else if (error instanceof BusinessRuleError) setGeneralError(error.message)
      else if (error instanceof Error) setGeneralError(error.message)
      else setGeneralError('Ocorreu um erro inesperado. Tente novamente.')
      return false
    } finally {
      setSubmitting(false)
    }
  }

  return { errors, generalError, submitting, submit }
}
