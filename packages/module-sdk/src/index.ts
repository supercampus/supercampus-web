import type { ModuleKey, ModuleWorkflowCatalog, NavigationItem, RuntimeContext } from "@supercampus/contracts";

export interface FrontendModule {
  key: ModuleKey;
  version: string;
  workflowCatalog?: ModuleWorkflowCatalog;
  navigation: NavigationItem[];
  canActivate(context: RuntimeContext): boolean;
}

export function defineModule(module: FrontendModule): FrontendModule {
  return module;
}
