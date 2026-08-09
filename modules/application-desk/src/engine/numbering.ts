/**
 * Student number generation (§17).
 *
 * The format is configuration, not code. The *sequence* is the part that must
 * be safe: two operators activating students at the same moment must never
 * receive the same number. That guarantee cannot be provided in the browser —
 * it belongs to a transactional allocator on the API side. `SequenceAllocator`
 * is that boundary; `formatStudentNumber` is the pure part we can own here.
 */

export interface StudentNumberFormat {
  /** Ordered tokens, e.g. ["prefix", "year", "department", "sequence"]. */
  pattern: Array<"prefix" | "year" | "department" | "program" | "sequence">;
  prefix?: string;
  separator?: string;
  /** Zero-padding width for the sequence component. */
  sequenceWidth: number;
}

export interface StudentNumberInput {
  year: string;
  departmentCode?: string;
  programCode?: string;
  sequence: number;
}

export const DEFAULT_NUMBER_FORMAT: StudentNumberFormat = {
  pattern: ["year", "department", "sequence"],
  separator: "",
  sequenceWidth: 3,
};

/** `2026CSE001` with the default format; `SC/26/CS/001` with a separator. */
export function formatStudentNumber(
  input: StudentNumberInput,
  format: StudentNumberFormat = DEFAULT_NUMBER_FORMAT,
): string {
  const parts = format.pattern
    .map((token) => {
      switch (token) {
        case "prefix":
          return format.prefix ?? "";
        case "year":
          return input.year;
        case "department":
          return input.departmentCode ?? "";
        case "program":
          return input.programCode ?? "";
        case "sequence":
          return String(input.sequence).padStart(format.sequenceWidth, "0");
      }
    })
    .filter((part) => part !== "");
  return parts.join(format.separator ?? "");
}

/**
 * Allocates the next sequence value for a tenant/scope. Implementations must
 * be transactional — the in-memory one below is for tests and the demo desk
 * only, and says so rather than pretending to be safe.
 */
export interface SequenceAllocator {
  next(scope: string): Promise<number>;
}

/** Single-process allocator. Not safe across replicas — tests and demo only. */
export function inMemoryAllocator(seed: Record<string, number> = {}): SequenceAllocator {
  const counters = new Map<string, number>(Object.entries(seed));
  return {
    async next(scope: string) {
      const value = (counters.get(scope) ?? 0) + 1;
      counters.set(scope, value);
      return value;
    },
  };
}

/** Sequences restart per tenant, year and department. */
export function sequenceScope(tenantId: string, year: string, departmentCode = "GEN"): string {
  return `${tenantId}:${year}:${departmentCode}`;
}
