// Optimized Version Control System with Efficient Snapshots and Diffing

import { WorkflowSnapshot, VersionHistory } from '../types/fileManagement';

export interface SnapshotMetadata {
  id: string;
  timestamp: number;
  size: number;
  description: string;
  nodeCount: number;
  connectionCount: number;
  hash: string; // For change detection
}

export interface VersionDiff {
  addedNodes: string[];
  removedNodes: string[];
  modifiedNodes: string[];
  addedConnections: string[];
  removedConnections: string[];
  modifiedConnections: string[];
  summary: {
    totalChanges: number;
    complexityChange: number;
    breakingChanges: boolean;
  };
}

export class OptimizedVersionControl {
  private snapshots: Map<string, WorkflowSnapshot> = new Map();
  private metadata: Map<string, SnapshotMetadata> = new Map();
  private currentSnapshotId: string | null = null;
  private maxSnapshots = 100;
  private compressionEnabled = true;

  constructor(maxSnapshots: number = 100, compressionEnabled: boolean = true) {
    this.maxSnapshots = maxSnapshots;
    this.compressionEnabled = compressionEnabled;
  }

  // Create optimized snapshot with compression and deduplication
  createSnapshot(
    nodes: Map<string, any>,
    connections: Map<string, any>,
    canvas: any,
    description: string = ''
  ): string {
    const timestamp = Date.now();
    const snapshotId = `snapshot_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;

    // Create optimized data structures
    const optimizedNodes = this.optimizeNodeData(nodes);
    const optimizedConnections = this.optimizeConnectionData(connections);
    const optimizedCanvas = this.optimizeCanvasData(canvas);

    // Generate hash for change detection
    const dataString = JSON.stringify({
      nodes: Array.from(optimizedNodes.entries()),
      connections: Array.from(optimizedConnections.entries()),
      canvas: optimizedCanvas
    });
    const hash = this.simpleHash(dataString);

    // Check if snapshot is different from current
    if (this.currentSnapshotId) {
      const currentHash = this.metadata.get(this.currentSnapshotId)?.hash;
      if (currentHash === hash) {
        // No changes, return current snapshot ID
        return this.currentSnapshotId;
      }
    }

    const snapshot: WorkflowSnapshot = {
      id: snapshotId,
      timestamp,
      description,
      nodes: optimizedNodes,
      connections: optimizedConnections,
      canvas: optimizedCanvas,
      thumbnail: this.generateThumbnail(canvas),
      size: this.calculateSize(optimizedNodes, optimizedConnections, optimizedCanvas)
    };

    // Store snapshot
    this.snapshots.set(snapshotId, snapshot);

    // Create metadata
    const metadata: SnapshotMetadata = {
      id: snapshotId,
      timestamp,
      size: snapshot.size,
      description,
      nodeCount: optimizedNodes.size,
      connectionCount: optimizedConnections.size,
      hash
    };

    this.metadata.set(snapshotId, metadata);
    this.currentSnapshotId = snapshotId;

    // Cleanup old snapshots if needed
    this.cleanupOldSnapshots();

    return snapshotId;
  }

  // Optimized data structures for memory efficiency
  private optimizeNodeData(nodes: Map<string, any>): Map<string, any> {
    const optimized = new Map();

    for (const [id, node] of nodes) {
      // Only store changed properties, reference unchanged defaults
      const optimizedNode = this.compressNodeData(node);
      optimized.set(id, optimizedNode);
    }

    return optimized;
  }

  private optimizeConnectionData(connections: Map<string, any>): Map<string, any> {
    const optimized = new Map();

    for (const [id, connection] of connections) {
      const optimizedConnection = this.compressConnectionData(connection);
      optimized.set(id, optimizedConnection);
    }

    return optimized;
  }

  private optimizeCanvasData(canvas: any): any {
    // Remove volatile properties, keep only persistent state
    const { viewport, config } = canvas;
    return { viewport, config };
  }

  // Data compression methods
  private compressNodeData(node: any): any {
    const compressed = { ...node };

    // Remove runtime-only properties
    delete compressed._runtime;
    delete compressed._cache;
    delete compressed._temp;

    // Compress position data
    if (compressed.position) {
      compressed.position = {
        x: Math.round(compressed.position.x * 100) / 100,
        y: Math.round(compressed.position.y * 100) / 100
      };
    }

    // Compress properties
    if (compressed.data?.properties) {
      compressed.data.properties = this.compressProperties(compressed.data.properties);
    }

    return compressed;
  }

  private compressConnectionData(connection: any): any {
    const compressed = { ...connection };

    // Remove runtime properties
    delete compressed._temp;
    delete compressed._cache;

    // Compress waypoints if they exist
    if (compressed.waypoints) {
      compressed.waypoints = compressed.waypoints.map((point: any) => ({
        x: Math.round(point.x * 100) / 100,
        y: Math.round(point.y * 100) / 100
      }));
    }

    return compressed;
  }

  private compressProperties(properties: any): any {
    const compressed = { ...properties };

    // Remove default values to save space
    Object.keys(compressed).forEach(key => {
      if (this.isDefaultValue(key, compressed[key])) {
        delete compressed[key];
      }
    });

    return compressed;
  }

  private isDefaultValue(key: string, value: any): boolean {
    const defaults: Record<string, any> = {
      label: '',
      width: 120,
      height: 48,
      color: '#3498db',
      visible: true,
      enabled: true
    };

    return defaults[key] === value;
  }

  // Generate simple hash for change detection
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  // Calculate approximate size of snapshot
  private calculateSize(nodes: Map<string, any>, connections: Map<string, any>, canvas: any): number {
    const nodesSize = JSON.stringify(Array.from(nodes.entries())).length;
    const connectionsSize = JSON.stringify(Array.from(connections.entries())).length;
    const canvasSize = JSON.stringify(canvas).length;

    return Math.round((nodesSize + connectionsSize + canvasSize) / 1024); // KB
  }

  // Generate thumbnail (placeholder implementation)
  private generateThumbnail(canvas: any): string {
    // In a real implementation, this would capture a canvas screenshot
    // For now, return a placeholder
    return `data:image/svg+xml;base64,${btoa('<svg width="200" height="150" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#6b7280">Workflow Preview</text></svg>')}`;
  }

  // Cleanup old snapshots
  private cleanupOldSnapshots(): void {
    const snapshotIds = Array.from(this.snapshots.keys());

    if (snapshotIds.length > this.maxSnapshots) {
      // Sort by timestamp, keep newest
      snapshotIds.sort((a, b) => {
        const aTime = this.snapshots.get(a)?.timestamp || 0;
        const bTime = this.snapshots.get(b)?.timestamp || 0;
        return bTime - aTime;
      });

      // Remove oldest snapshots
      const toRemove = snapshotIds.slice(this.maxSnapshots);
      toRemove.forEach(id => {
        this.snapshots.delete(id);
        this.metadata.delete(id);
      });
    }
  }

  // Get snapshot by ID
  getSnapshot(snapshotId: string): WorkflowSnapshot | null {
    return this.snapshots.get(snapshotId) || null;
  }

  // Get all snapshot metadata
  getSnapshotMetadata(): SnapshotMetadata[] {
    return Array.from(this.metadata.values()).sort((a, b) => b.timestamp - a.timestamp);
  }

  // Restore snapshot
  restoreSnapshot(snapshotId: string): { nodes: Map<string, any>; connections: Map<string, any>; canvas: any } | null {
    const snapshot = this.snapshots.get(snapshotId);
    if (!snapshot) return null;

    // Decompress data
    const nodes = this.decompressNodeData(snapshot.nodes);
    const connections = this.decompressConnectionData(snapshot.connections);
    const canvas = this.decompressCanvasData(snapshot.canvas);

    return { nodes, connections, canvas };
  }

  // Calculate diff between two snapshots
  calculateDiff(fromSnapshotId: string, toSnapshotId: string): VersionDiff | null {
    const fromSnapshot = this.snapshots.get(fromSnapshotId);
    const toSnapshot = this.snapshots.get(toSnapshotId);

    if (!fromSnapshot || !toSnapshot) return null;

    const addedNodes: string[] = [];
    const removedNodes: string[] = [];
    const modifiedNodes: string[] = [];
    const addedConnections: string[] = [];
    const removedConnections: string[] = [];
    const modifiedConnections: string[] = [];

    // Compare nodes
    const fromNodeIds = new Set(fromSnapshot.nodes.keys());
    const toNodeIds = new Set(toSnapshot.nodes.keys());

    // Added nodes
    for (const nodeId of toNodeIds) {
      if (!fromNodeIds.has(nodeId)) {
        addedNodes.push(nodeId);
      } else if (!this.areNodesEqual(fromSnapshot.nodes.get(nodeId), toSnapshot.nodes.get(nodeId))) {
        modifiedNodes.push(nodeId);
      }
    }

    // Removed nodes
    for (const nodeId of fromNodeIds) {
      if (!toNodeIds.has(nodeId)) {
        removedNodes.push(nodeId);
      }
    }

    // Compare connections
    const fromConnectionIds = new Set(fromSnapshot.connections.keys());
    const toConnectionIds = new Set(toSnapshot.connections.keys());

    // Added connections
    for (const connectionId of toConnectionIds) {
      if (!fromConnectionIds.has(connectionId)) {
        addedConnections.push(connectionId);
      } else if (!this.areConnectionsEqual(
        fromSnapshot.connections.get(connectionId),
        toSnapshot.connections.get(connectionId)
      )) {
        modifiedConnections.push(connectionId);
      }
    }

    // Removed connections
    for (const connectionId of fromConnectionIds) {
      if (!toConnectionIds.has(connectionId)) {
        removedConnections.push(connectionId);
      }
    }

    const totalChanges = addedNodes.length + removedNodes.length + modifiedNodes.length +
                        addedConnections.length + removedConnections.length + modifiedConnections.length;

    const complexityChange = (addedNodes.length + addedConnections.length) -
                           (removedNodes.length + removedConnections.length);

    const breakingChanges = removedNodes.length > 0 || modifiedConnections.length > 0;

    return {
      addedNodes,
      removedNodes,
      modifiedNodes,
      addedConnections,
      removedConnections,
      modifiedConnections,
      summary: {
        totalChanges,
        complexityChange,
        breakingChanges
      }
    };
  }

  // Decompression methods
  private decompressNodeData(nodes: Map<string, any>): Map<string, any> {
    const decompressed = new Map();

    for (const [id, node] of nodes) {
      const decompressedNode = this.decompressNode(node);
      decompressed.set(id, decompressedNode);
    }

    return decompressed;
  }

  private decompressConnectionData(connections: Map<string, any>): Map<string, any> {
    const decompressed = new Map();

    for (const [id, connection] of connections) {
      const decompressedConnection = this.decompressConnection(connection);
      decompressed.set(id, decompressedConnection);
    }

    return decompressed;
  }

  private decompressCanvasData(canvas: any): any {
    // Restore default values that were compressed out
    return {
      viewport: canvas.viewport || { x: 0, y: 0, zoom: 1 },
      config: canvas.config || {}
    };
  }

  private decompressNode(node: any): any {
    const decompressed = { ...node };

    // Restore default values
    if (!decompressed.data?.properties) {
      decompressed.data = { properties: {} };
    }

    // Restore default property values
    const defaults = {
      label: '',
      width: 120,
      height: 48,
      color: '#3498db',
      visible: true,
      enabled: true
    };

    Object.keys(defaults).forEach(key => {
      if (!(key in decompressed.data.properties)) {
        decompressed.data.properties[key] = defaults[key];
      }
    });

    return decompressed;
  }

  private decompressConnection(connection: any): any {
    return { ...connection };
  }

  // Comparison helpers
  private areNodesEqual(node1: any, node2: any): boolean {
    return JSON.stringify(node1) === JSON.stringify(node2);
  }

  private areConnectionsEqual(conn1: any, conn2: any): boolean {
    return JSON.stringify(conn1) === JSON.stringify(conn2);
  }

  // Get statistics
  getStatistics(): {
    totalSnapshots: number;
    totalSize: number;
    averageSize: number;
    oldestSnapshot: number;
    newestSnapshot: number;
  } {
    const snapshots = Array.from(this.metadata.values());

    return {
      totalSnapshots: snapshots.length,
      totalSize: snapshots.reduce((sum, s) => sum + s.size, 0),
      averageSize: snapshots.length > 0 ? Math.round(snapshots.reduce((sum, s) => sum + s.size, 0) / snapshots.length) : 0,
      oldestSnapshot: snapshots.length > 0 ? Math.min(...snapshots.map(s => s.timestamp)) : 0,
      newestSnapshot: snapshots.length > 0 ? Math.max(...snapshots.map(s => s.timestamp)) : 0
    };
  }

  // Export/Import functionality
  exportSnapshots(): string {
    const data = {
      snapshots: Array.from(this.snapshots.entries()),
      metadata: Array.from(this.metadata.entries()),
      currentSnapshotId: this.currentSnapshotId,
      config: {
        maxSnapshots: this.maxSnapshots,
        compressionEnabled: this.compressionEnabled
      }
    };

    return JSON.stringify(data);
  }

  importSnapshots(data: string): boolean {
    try {
      const parsed = JSON.parse(data);

      this.snapshots = new Map(parsed.snapshots);
      this.metadata = new Map(parsed.metadata);
      this.currentSnapshotId = parsed.currentSnapshotId;

      if (parsed.config) {
        this.maxSnapshots = parsed.config.maxSnapshots || 100;
        this.compressionEnabled = parsed.config.compressionEnabled !== false;
      }

      return true;
    } catch (error) {
      console.error('Failed to import snapshots:', error);
      return false;
    }
  }

  // Clear all snapshots
  clear(): void {
    this.snapshots.clear();
    this.metadata.clear();
    this.currentSnapshotId = null;
  }
}

// Factory function
export const createOptimizedVersionControl = (
  maxSnapshots: number = 100,
  compressionEnabled: boolean = true
): OptimizedVersionControl => {
  return new OptimizedVersionControl(maxSnapshots, compressionEnabled);
};
