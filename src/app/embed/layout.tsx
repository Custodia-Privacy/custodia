import type { ReactNode } from "react";

export const metadata = {
  robots: "noindex",
};

/**
 * Bare layout for embeddable widgets — no navbar, no footer.
 * Allows framing via permissive headers set in the route pages.
 */
export default function EmbedLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
