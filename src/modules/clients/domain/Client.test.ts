import { describe, expect, it } from "vitest";
import { clientData, fieldErrorsOf, NOW } from "../../../test/fixtures";
import { createClient, validateClientData } from "./Client";

describe("Client", () => {
  it("creates a client with normalized data", () => {
    const client = createClient(
      clientData({ email: " ANA@Exemplo.co.mz ", phone: "+258 84 123 4567" }),
      "c1",
      NOW,
    );
    expect(client).toMatchObject({
      id: "c1",
      email: "ana@exemplo.co.mz",
      phone: "841234567",
    });
  });

  it("accepts valid data", () => {
    expect(validateClientData(clientData())).toEqual({});
  });

  it("reports every invalid field", () => {
    const errors = fieldErrorsOf(() =>
      createClient(
        { name: "Ana", email: "x", phone: "123", address: "Rua" },
        "c1",
        NOW,
      ),
    );
    expect(Object.keys(errors).sort()).toEqual([
      "address",
      "email",
      "name",
      "phone",
    ]);
  });
});
