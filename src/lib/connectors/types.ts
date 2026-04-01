/**
 * Shared types for all integration connectors.
 *
 * Each connector normalizes provider-specific data into these
 * canonical shapes for DSAR fulfillment and preference sync.
 */

export interface NormalizedContact {
  externalId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  company: string | null;
  metadata: Record<string, unknown>;
}

export interface ConnectorSyncResult {
  provider: string;
  recordsFetched: number;
  recordsUpserted: number;
  errors: string[];
  durationMs: number;
}

export interface ConnectorSearchResult {
  provider: string;
  contacts: NormalizedContact[];
}

/**
 * Every connector must implement this interface.
 */
export interface Connector {
  readonly provider: string;

  /**
   * Fetch contacts from the provider and return normalized records.
   * Used for bulk sync.
   */
  fetchContacts(connectionId: string, since?: Date): Promise<NormalizedContact[]>;

  /**
   * Search for a specific person by email (for DSAR fulfillment).
   */
  searchByEmail(connectionId: string, email: string): Promise<NormalizedContact[]>;

  /**
   * Delete or anonymize a contact's data in the provider (DSAR deletion).
   */
  deleteContact(connectionId: string, externalId: string): Promise<boolean>;
}
