import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import LandingPage from "@/app/(marketing)/page";

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

describe("Marketing landing page", () => {
  it("renders the primary hero heading", () => {
    render(<LandingPage />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent(/privacy compliance for businesses/i);
  });

  it("mentions AI-powered positioning", () => {
    render(<LandingPage />);
    expect(screen.getByText(/AI-powered privacy compliance/i)).toBeInTheDocument();
  });
});
