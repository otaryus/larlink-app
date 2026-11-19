import { addMonths, monthOf, nextMonth } from "../../../shared/domain/dates";
import {
  BusinessRuleError,
  throwIfErrors,
  type FieldErrors,
} from "../../../shared/domain/errors";
import {
  AGENCY_COMMISSION_RATE,
  MAX_CONTRACT_MONTHS,
  MINIMUM_WAGE_MZN,
} from "../../../shared/domain/policies";
import { isIntegerBetween } from "../../../shared/domain/validators";
import type { Housekeeper } from "../../housekeepers/domain/Housekeeper";
import type { HireRequest } from "../../placement/domain/HireRequest";

export type ContractStatus = "ACTIVE" | "TERMINATED";

export interface Contract {
  readonly id: string;
  readonly hireRequestId: string;
  readonly clientId: string;
  readonly housekeeperId: string;
  readonly monthlySalary: number;
  readonly durationMonths: number;
  readonly startDate: string;
  readonly endDate: string;
  readonly commissionRate: number;
  readonly status: ContractStatus;
  readonly terminatedAt?: string;
  readonly createdAt: string;
}

export interface ContractData {
  hireRequestId: string;
  monthlySalary: number;
  durationMonths: number;
}

export function validateContractData(
  data: ContractData,
  housekeeper: Housekeeper,
): FieldErrors {
  const errors: FieldErrors = {};
  if (!data.hireRequestId)
    errors.hireRequestId = "Seleccione um pedido aprovado.";
  if (
    !Number.isFinite(data.monthlySalary) ||
    data.monthlySalary < MINIMUM_WAGE_MZN
  )
    errors.monthlySalary = `O salário não pode ser inferior ao mínimo (${MINIMUM_WAGE_MZN} MZN).`;
  else if (data.monthlySalary < housekeeper.expectedSalary)
    errors.monthlySalary = `O salário não pode ser inferior ao pretendido pela empregada (${housekeeper.expectedSalary} MZN).`;
  if (!isIntegerBetween(data.durationMonths, 1, MAX_CONTRACT_MONTHS))
    errors.durationMonths = `A duração deve ser entre 1 e ${MAX_CONTRACT_MONTHS} meses.`;
  return errors;
}

export function createContract(
  data: ContractData,
  request: HireRequest,
  housekeeper: Housekeeper,
  id: string,
  now: Date,
): Contract {
  if (request.status !== "APPROVED")
    throw new BusinessRuleError(
      "Só é possível celebrar contrato a partir de um pedido aprovado.",
    );
  throwIfErrors(validateContractData(data, housekeeper));
  return {
    id,
    hireRequestId: request.id,
    clientId: request.clientId,
    housekeeperId: request.housekeeperId,
    monthlySalary: data.monthlySalary,
    durationMonths: data.durationMonths,
    startDate: request.startDate,
    endDate: addMonths(request.startDate, data.durationMonths),
    commissionRate: AGENCY_COMMISSION_RATE,
    status: "ACTIVE",
    createdAt: now.toISOString(),
  };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export function commissionOf(contract: Contract): number {
  return round(contract.monthlySalary * contract.commissionRate);
}

export function monthlyTotalOf(contract: Contract): number {
  return round(contract.monthlySalary + commissionOf(contract));
}

export function billableMonths(contract: Contract): string[] {
  const months = [monthOf(contract.startDate)];
  while (months.length < contract.durationMonths)
    months.push(nextMonth(months[months.length - 1]));
  return months;
}

export function terminateContract(contract: Contract, now: Date): Contract {
  if (contract.status !== "ACTIVE")
    throw new BusinessRuleError("O contrato já está terminado.");
  return { ...contract, status: "TERMINATED", terminatedAt: now.toISOString() };
}
