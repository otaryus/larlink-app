import { throwIfErrors, type FieldErrors } from "../../../shared/domain/errors";
import {
  isValidEmail,
  isValidFullName,
  isValidPhone,
  normalizePhone,
} from "../../../shared/domain/validators";

export interface Client {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly address: string;
  readonly createdAt: string;
}

export type ClientData = Pick<Client, "name" | "email" | "phone" | "address">;

export function validateClientData(data: ClientData): FieldErrors {
  const errors: FieldErrors = {};
  if (!isValidFullName(data.name))
    errors.name = "Indique o nome completo (nome e apelido).";
  if (!isValidEmail(data.email)) errors.email = "Email inválido.";
  if (!isValidPhone(data.phone))
    errors.phone = "Telemóvel moçambicano inválido (ex.: 84 123 4567).";
  if (data.address.trim().length < 5)
    errors.address = "Indique o endereço (mín. 5 caracteres).";
  return errors;
}

export function createClient(data: ClientData, id: string, now: Date): Client {
  throwIfErrors(validateClientData(data));
  return {
    id,
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    phone: normalizePhone(data.phone),
    address: data.address.trim(),
    createdAt: now.toISOString(),
  };
}
