import type { ModuleWorkflowCatalog } from "@supercampus/contracts";
import catalog from "./flows.json";

/**
 * `flows.json` is the shared catalog the Flutter staff app and web clients both
 * read, so it stays the single source of truth. This module re-exports it with
 * the platform's types applied rather than restating the steps in TypeScript.
 */
export const applicationDeskWorkflowCatalog = {
  ...catalog,
  moduleKey: "application-desk",
  deliveryTargets: catalog.deliveryTargets as ModuleWorkflowCatalog["deliveryTargets"],
  workflows: catalog.workflows as ModuleWorkflowCatalog["workflows"],
} satisfies ModuleWorkflowCatalog;
