/**
 * Custodia API Client
 *
 * Handles authenticated communication with the Custodia backend via its tRPC
 * HTTP API. All MCP tools delegate to this client for data access and mutations.
 *
 * tRPC v11 HTTP convention:
 *   - Queries:    GET  /api/trpc/<router>.<procedure>?input=<encoded JSON>
 *   - Mutations:  POST /api/trpc/<router>.<procedure>  body: { json: <input> }
 *
 * Responses are wrapped by superjson, so we unwrap via result.data.json.
 */

export interface CustodiaClientConfig {
  apiUrl: string;
  apiKey: string;
}

export class CustodiaApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "CustodiaApiError";
  }
}

export class CustodiaClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(config: CustodiaClientConfig) {
    this.baseUrl = config.apiUrl.replace(/\/+$/, "");
    this.apiKey = config.apiKey;
  }

  private headers(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  /**
   * Call a tRPC query (GET request).
   * Path format: "router.procedure", e.g. "site.list"
   */
  async query<T = unknown>(path: string, input?: unknown): Promise<T> {
    let url = `${this.baseUrl}/api/trpc/${path}`;
    if (input !== undefined) {
      const encoded = encodeURIComponent(JSON.stringify({ json: input }));
      url += `?input=${encoded}`;
    }

    const res = await fetch(url, {
      method: "GET",
      headers: this.headers(),
    });

    return this.handleResponse<T>(res, path);
  }

  /**
   * Call a tRPC mutation (POST request).
   * Path format: "router.procedure", e.g. "scan.trigger"
   */
  async mutate<T = unknown>(path: string, input?: unknown): Promise<T> {
    const url = `${this.baseUrl}/api/trpc/${path}`;

    const res = await fetch(url, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ json: input ?? {} }),
    });

    return this.handleResponse<T>(res, path);
  }

  private async handleResponse<T>(res: Response, path: string): Promise<T> {
    if (!res.ok) {
      let errorBody: any;
      try {
        errorBody = await res.json();
      } catch {
        throw new CustodiaApiError(
          `Custodia API error on ${path}: HTTP ${res.status} ${res.statusText}`,
          res.status,
        );
      }

      const trpcError = errorBody?.error;
      const message =
        trpcError?.json?.message ??
        trpcError?.message ??
        `HTTP ${res.status} on ${path}`;
      const code = trpcError?.json?.data?.code ?? trpcError?.data?.code;

      throw new CustodiaApiError(message, res.status, code, trpcError);
    }

    const body = (await res.json()) as Record<string, any>;

    // tRPC wraps results: { result: { data: { json: <actual data> } } }
    const data = body?.result?.data?.json ?? body?.result?.data ?? body;
    return data as T;
  }
}
