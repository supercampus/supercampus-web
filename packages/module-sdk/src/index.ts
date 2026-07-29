import type { ModuleKey, NavigationItem, RuntimeContext } from "@supercampus/contracts";

export interface FrontendModule {
  key: ModuleKey;
  version: string;
  navigation: NavigationItem[];
  canActivate(context: RuntimeContext): boolean;
}

export function defineModule(module: FrontendModule): FrontendModule {
  return module;
}