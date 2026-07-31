import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import MobileFlowTester from '@/components/modules/MobileFlowTester';

export const dynamic = 'force-static';

type ModuleFlowCatalog = {
  moduleKey: string;
  source: string;
  deliveryTargets: string[];
  overview: string;
  navigation: string[];
  workflows: Array<{
    id: string;
    moduleKey: string;
    name: string;
    summary: string;
    steps: Array<{
      id: string;
      order: number;
      title: string;
      description: string;
      type: string;
      crud: Array<'create' | 'read' | 'update' | 'delete'>;
    }>;
  }>;
};

async function loadCatalogs() {
  const modulesRoot = resolve(process.cwd(), '..', '..', 'modules');
  const moduleDirs = await readdir(modulesRoot, { withFileTypes: true });
  const catalogs = await Promise.all(
    moduleDirs
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        try {
          const raw = await readFile(join(modulesRoot, entry.name, 'src', 'flows.json'), 'utf8');
          return JSON.parse(raw) as ModuleFlowCatalog;
        } catch {
          return null;
        }
      }),
  );
  return catalogs.filter((catalog): catalog is ModuleFlowCatalog => Boolean(catalog));
}

export default async function MobileFlowsPage() {
  const catalogs = await loadCatalogs();
  return <MobileFlowTester catalogs={catalogs} />;
}
