'use client';

import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';

export function DevInspector() {
  const [Inspector, setInspector] = useState<ComponentType | null>(null);

  useEffect(() => {
    // 只在开发环境中加载 react-dev-inspector
    if (process.env.NODE_ENV === 'development') {
      import('react-dev-inspector')
        .then((mod) => setInspector(() => mod.Inspector))
        .catch(() => {});
    }
  }, []);

  if (!Inspector) return null;
  return <Inspector />;
}