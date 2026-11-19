import type { Repository } from '../../../shared/ports/Repository'
import type { Payment } from '../domain/Payment'

export type PaymentRepository = Repository<Payment>
