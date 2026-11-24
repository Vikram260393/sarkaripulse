import { describe, expect, it } from "vitest";
import { calculateCalendarAge } from "@/components/tools/AgeCalculator";

describe("calculateCalendarAge (Blueprint Ch. 02 utility calculator)", () => {
  it("calculates exact calendar years, months, and days", () => {
    expect(calculateCalendarAge("2001-06-15", "2027-01-01")).toEqual({
      years: 25,
      months: 6,
      days: 17,
    });
  });

  it("returns 0 years, 0 months, 0 days when DOB equals cut-off date", () => {
    expect(calculateCalendarAge("2000-05-10", "2000-05-10")).toEqual({
      years: 0,
      months: 0,
      days: 0,
    });
  });

  it("returns null when DOB is after cut-off date or malformed", () => {
    expect(calculateCalendarAge("2028-01-01", "2027-01-01")).toBeNull();
    expect(calculateCalendarAge("invalid", "2027-01-01")).toBeNull();
  });
});
