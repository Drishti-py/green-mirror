import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StreakBadge } from "@/components/dashboard/StreakBadge";

describe("StreakBadge", () => {
  it("renders the current streak value", () => {
    render(<StreakBadge current={5} longest={7} total={21} />);
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText(/Best 7/)).toBeInTheDocument();
    expect(screen.getByText(/Total 21/)).toBeInTheDocument();
  });

  it("uses singular 'day' for streak of 1", () => {
    render(<StreakBadge current={1} longest={1} total={1} />);
    expect(screen.getByText("day")).toBeInTheDocument();
  });

  it("uses plural 'days' for streaks other than 1", () => {
    render(<StreakBadge current={0} longest={0} total={0} />);
    expect(screen.getByText("days")).toBeInTheDocument();
  });
});
