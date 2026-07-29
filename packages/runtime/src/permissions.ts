import type { RuntimeContext } from "@supercampus/contracts";

export function hasPermission(context: RuntimeContext, permission: string): boolean {
  return context.permissions.includes("*") || context.permissions.includes(permission);
}

export function hasEveryPermission(context: RuntimeContext, permissions: string[] = []): boolean {
  return permissions.every((permission) => hasPermission(context, permission));
}