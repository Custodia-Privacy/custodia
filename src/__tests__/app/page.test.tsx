import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

// Mock next/image since it's not available in test env
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

describe("Home Page", () => {
  it("renders without crashing", () => {
    render(<Home />);
    expect(document.querySelector("main")).toBeInTheDocument();
  });

  it("renders the heading with getting started text", () => {
    render(<Home />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent(/get started/i);
  });

  it("renders the Next.js logo", () => {
    render(<Home />);
    const logo = screen.getByAltText("Next.js logo");
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute("src", "/next.svg");
  });

  it('renders the "Deploy Now" link', () => {
    render(<Home />);
    const deployLink = screen.getByText("Deploy Now");
    expect(deployLink).toBeInTheDocument();
    expect(deployLink.closest("a")).toHaveAttribute("target", "_blank");
    expect(deployLink.closest("a")).toHaveAttribute("rel", "noopener noreferrer");
  });

  it('renders the "Documentation" link', () => {
    render(<Home />);
    const docsLink = screen.getByText("Documentation");
    expect(docsLink).toBeInTheDocument();
    expect(docsLink.closest("a")).toHaveAttribute("target", "_blank");
  });

  it("renders Templates and Learning links", () => {
    render(<Home />);
    expect(screen.getByText("Templates")).toBeInTheDocument();
    expect(screen.getByText("Learning")).toBeInTheDocument();
  });

  it("has proper dark mode classes", () => {
    render(<Home />);
    const container = document.querySelector(".dark\\:bg-black");
    expect(container).toBeInTheDocument();
  });

  it("renders responsive layout classes", () => {
    render(<Home />);
    const main = document.querySelector("main");
    expect(main?.className).toContain("sm:items-start");
    expect(main?.className).toContain("max-w-3xl");
  });
});
