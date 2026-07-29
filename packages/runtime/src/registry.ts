type Renderer = unknown;
const renderers = new Map<string, Renderer>();
export function registerRenderer(kind: string, renderer: Renderer): void { renderers.set(kind, renderer); }
export function getRenderer(kind: string): Renderer | undefined { return renderers.get(kind); }