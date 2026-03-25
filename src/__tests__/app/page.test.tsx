import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock tRPC api before importing components that use it
vi.mock("@/lib/trpc", () => ({
  api: {
    scan: {
      quick: {
        useMutation: vi.fn().mockReturnValue({
          mutate: vi.fn(),
          mutateAsync: vi.fn(),
          isPending: false,
          isError: false,
          isSuccess: false,
          data: null,
          error: null,
          reset: vi.fn(),
        }),
      },
    },
    // Add other routers as needed
    useUtils: vi.fn().mockReturnValue({}),
  },
}));

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn().mockReturnValue({ push: vi.fn(), replace: vi.fn() }),
  usePathname: vi.fn().mockReturnValue("/"),
  useSearchParams: vi.fn().mockReturnValue(new URLSearchParams()),
}));

import LandingPage from "@/app/(marketing)/page";

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
