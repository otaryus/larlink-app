export type FieldErrors = Record<string, string>

export class ValidationError extends Error {
  readonly fields: FieldErrors

  constructor(fields: FieldErrors) {
    super('Dados inválidos')
    this.name = 'ValidationError'
    this.fields = fields
  }
}

export class BusinessRuleError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BusinessRuleError'
  }
}

export function throwIfErrors(errors: FieldErrors): void {
  if (Object.keys(errors).length > 0) throw new ValidationError(errors)
}
