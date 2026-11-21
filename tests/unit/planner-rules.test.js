import { describe, expect, it } from "vitest";
import { calculateDayCosts } from "../../planner-rules.mjs";

describe("daily trip cost estimates", () => {
  it("accounts for lodging, meals, local transport, activities and transfer fare", () => {
    expect(
      calculateDayCosts({
        dailyBudget: 2200,
        fare: 350,
        overnight: true,
        permitCost: 0,
      }),
    ).toEqual({
      stay: 880,
      meals: 594,
      transport: 658,
      activities: 418,
      permitCost: 0,
      total: 2550,
    });
  });

  it("does not charge a stay on a return travel day and reallocates that allowance", () => {
    expect(
      calculateDayCosts({
        dailyBudget: 1800,
        fare: 650,
        overnight: false,
        permitCost: 0,
      }),
    ).toEqual({
      stay: 0,
      meals: 486,
      transport: 902,
      activities: 1062,
      permitCost: 0,
      total: 2450,
    });
  });

  it("counts a permit estimate once as a separate cost without allowing negative activities", () => {
    expect(
      calculateDayCosts({
        dailyBudget: 800,
        fare: 900,
        overnight: true,
        permitCost: 250,
      }),
    ).toEqual({
      stay: 320,
      meals: 216,
      transport: 1012,
      activities: 0,
      permitCost: 250,
      total: 1798,
    });
  });
});
