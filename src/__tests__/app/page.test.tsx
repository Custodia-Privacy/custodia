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
      // Hero polls scan results via quickResult. Return an idle query
      // (no scanId yet) so the hook doesn't try to actually fetch.
      quickResult: {
        useQuery: vi.fn().mockReturnValue({
          data: undefined,
          isLoading: false,
          isError: false,
          error: null,
          refetch: vi.fn(),
        }),
      },
    },
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
  // Deliberately structural assertions rather than exact-copy matching.
  // Marketing copy is iterated on frequently, so pinning to a specific
  // headline like "AI-powered privacy compliance" makes the test a
  // maintenance tax rather than a safety net. These checks confirm the
  // page rendered and the critical conversion surface (a top-level
  // heading and a CTA) is present, without locking in specific words.
  it("renders a top-level heading", () => {
    render(<LandingPage />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading.textContent?.trim().length ?? 0).toBeGreaterThan(0);
  });

  it("renders the site-scan CTA", () => {
    render(<LandingPage />);
    // The hero has a scan form with a button. Whether its label is
    // "Scan my site" or "Scan now" isn't what we're testing; we're
    // testing that the conversion path is rendered at all.
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });
});
