import React, { useRef, useEffect } from 'react';
import { Application, Graphics } from 'pixi.js';
import type { Workflow } from '@auterity/workflow-contracts';

export function Canvas({ workflow }: { workflow: Workflow }) {
  const ref = useRef<HTMLDivElement|null>(null);
  useEffect(() => {
    if (!ref.current) return;
    const app = new Application({ width: 900, height: 600, background: 0xffffff });
    ref.current.appendChild(app.view as HTMLCanvasElement);

    workflow.nodes.forEach(n => {
      const g = new Graphics();
      g.beginFill(0x3498db);
      g.drawRect(0, 0, 120, 48);
      g.endFill();
      g.x = n.position.x;
      g.y = n.position.y;
      app.stage.addChild(g);

      g.interactive = true;
      g.buttonMode = true;
      let dragging = false;
      g.on('pointerdown', () => (dragging = true));
      g.on('pointerup', () => (dragging = false));
      g.on('pointermove', (e: any) => {
        if (!dragging) return;
        const pos = e.data.global;
        g.x = pos.x;
        g.y = pos.y;
      });
    });

    return () => app.destroy(true, true);
  }, [workflow]);
  return <div ref={ref} />;
}
