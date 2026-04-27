import type { AssetNode } from "./types";

/** Static CRM object tree for Contact-centric providers (v1 scope). */
export function crmContactLeadTree(provider: string): AssetNode {
  const field = (name: string): AssetNode => ({
    kind: "field",
    provider,
    name,
    externalRef: name,
  });

  const table = (name: string, objectType: string): AssetNode => ({
    kind: "table",
    provider,
    name,
    externalRef: objectType,
    children: [
      field("Id"),
      field("Email"),
      field("FirstName"),
      field("LastName"),
      field("Phone"),
      field("Company"),
      field("Description"),
    ],
  });

  return {
    kind: "source",
    provider,
    name: provider,
    externalRef: `${provider}:root`,
    children: [
      {
        kind: "data_system",
        provider,
        name: "CRM",
        externalRef: `${provider}:crm`,
        children: [table("Contact", "Contact"), table("Lead", "Lead")],
      },
    ],
  };
}
