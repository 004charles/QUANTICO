export type TenantScopedRecord = { organizationId: number };

export class TenantScopeError extends Error {
  constructor() {
    super("O recurso solicitado não pertence à organização atual.");
    this.name = "TenantScopeError";
  }
}

/**
 * Enforces the tenant boundary for any record returned by a repository.
 * Route handlers must obtain organizationId from server-side membership resolution.
 */
export function enforceTenantScope<T extends TenantScopedRecord>(record: T | undefined, organizationId: number): T | undefined {
  if (!record) return undefined;
  if (record.organizationId !== organizationId) throw new TenantScopeError();
  return record;
}
