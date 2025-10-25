import React, { useState } from 'react';
import { useCanonical } from '../hooks/useCanonical.js';
import { Canvas } from '../components/Canvas.js';

export default function ImportPage() {
  const [id, setId] = useState('');
  const { workflow, load } = useCanonical();
  const [error, setError] = useState<string|undefined>();

  const handleImport = async () => {
    try {
      await load(id);
      setError(undefined);
    } catch (e: any) {
      setError(e?.message || 'Import failed');
    }
  };

  return (
    <div className="p-4">
      <h2>Import Canonical Workflow</h2>
      <div className="mb-2">
        <input value={id} onChange={e => setId(e.target.value)} placeholder="workflow id" />
        <button onClick={handleImport}>Import</button>
      </div>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {workflow && <Canvas workflow={workflow} />}
    </div>
  );
}
