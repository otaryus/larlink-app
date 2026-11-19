import { describe, expect, it } from "vitest";
import { BusinessRuleError } from "../../../shared/domain/errors";
import {
  AGENCY_COMMISSION_RATE,
  MINIMUM_WAGE_MZN,
} from "../../../shared/domain/policies";
import { fieldErrorsOf, housekeeperData, NOW } from "../../../test/fixtures";
import {
  approveProfile,
  createHousekeeper,
} from "../../housekeepers/domain/Housekeeper";
import {
  approveHireRequest,
  createHireRequest,
} from "../../placement/domain/HireRequest";
import {
  billableMonths,
  commissionOf,
  createContract,
  monthlyTotalOf,
  terminateContract,
  validateContractData,
} from "./Contract";

const hk = approveProfile(
  createHousekeeper(housekeeperData({ expectedSalary: 7000 }), "h1", NOW),
);
const pendingRequest = createHireRequest(
  {
    clientId: "c1",
    housekeeperId: "h1",
    requiredSkills: ["CLEANING"],
    requiredDays: ["MON"],
    startDate: "2026-11-15",
    notes: "",
  },
  hk,
  "r1",
  NOW,
);
const approvedRequest = approveHireRequest(pendingRequest);
const contract = () =>
  createContract(
    { hireRequestId: "r1", monthlySalary: 7500, durationMonths: 3 },
    approvedRequest,
    hk,
    "k1",
    NOW,
  );

describe("Contract", () => {
  it("is created ACTIVE from an approved request, with dates derived from it", () => {
    expect(contract()).toMatchObject({
      status: "ACTIVE",
      clientId: "c1",
      housekeeperId: "h1",
      startDate: "2026-11-15",
      endDate: "2027-02-15",
      commissionRate: AGENCY_COMMISSION_RATE,
    });
  });

  it("requires an approved hire request", () => {
    expect(() =>
      createContract(
        { hireRequestId: "r1", monthlySalary: 7500, durationMonths: 3 },
        pendingRequest,
        hk,
        "k1",
        NOW,
      ),
    ).toThrow(BusinessRuleError);
  });

  it("salary must respect minimum wage and the housekeeper expected salary", () => {
    expect(
      validateContractData(
        {
          hireRequestId: "r1",
          monthlySalary: MINIMUM_WAGE_MZN - 1,
          durationMonths: 3,
        },
        hk,
      ).monthlySalary,
    ).toMatch(/mínimo/);
    expect(
      validateContractData(
        { hireRequestId: "r1", monthlySalary: 6500, durationMonths: 3 },
        hk,
      ).monthlySalary,
    ).toMatch(/pretendido/);
    expect(
      validateContractData(
        { hireRequestId: "r1", monthlySalary: 7000, durationMonths: 3 },
        hk,
      ),
    ).toEqual({});
  });

  it("duration must be an integer between 1 and 24 months", () => {
    for (const durationMonths of [0, 25, 1.5])
      expect(
        fieldErrorsOf(() =>
          createContract(
            { hireRequestId: "r1", monthlySalary: 7500, durationMonths },
            approvedRequest,
            hk,
            "k1",
            NOW,
          ),
        ),
      ).toHaveProperty("durationMonths");
  });

  it("computes the agency commission and monthly total", () => {
    expect(commissionOf(contract())).toBe(750);
    expect(monthlyTotalOf(contract())).toBe(8250);
  });

  it("lists one billable month per month of duration", () => {
    expect(billableMonths(contract())).toEqual([
      "2026-11",
      "2026-12",
      "2027-01",
    ]);
  });

  it("can only be terminated while active", () => {
    const ended = terminateContract(contract(), NOW);
    expect(ended.status).toBe("TERMINATED");
    expect(() => terminateContract(ended, NOW)).toThrow(BusinessRuleError);
  });
});
