declare module 'react-cytoscapejs' {
  import type { ComponentType } from 'react';
  import type { Core } from 'cytoscape';
  const CytoscapeComponent: ComponentType<{ elements: unknown[]; stylesheet: unknown; className?: string; layout: unknown; cy?: (core: Core) => void }>;
  export default CytoscapeComponent;
}
