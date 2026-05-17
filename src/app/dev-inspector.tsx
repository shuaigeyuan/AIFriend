'use client';

import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';

export function DevInspector() {
  const [Inspector, setInspector] = useState<ComponentType | null>(null);

  useEffect(() => {
    import('react-dev-inspector')
      .then((mod) => setInspector(() => mod.Inspector))
      .catch(() => {});
  }, []);

  if (!Inspector) return null;
  return <Inspector />;
}
