import {
  ConnectionPoint,
  ConnectionPath,
  RoutingContext,
  RoutingResult,
  Position,
  Rectangle,
  ConnectionStyle
} from '../types/connections';

export class ConnectionRouter {
  private static readonly GRID_SIZE = 20;
  private static readonly OBSTACLE_PADDING = 15;
  private static readonly MAX_ITERATIONS = 100;
  private static readonly SMOOTHING_FACTOR = 0.3;

  /**
   * Calculate optimal connection path using A* algorithm with obstacle avoidance
   */
  static calculatePath(
    source: ConnectionPoint,
    target: ConnectionPoint,
    context: RoutingContext
  ): RoutingResult {
    const startTime = performance.now();

    // Basic straight line path for simple cases
    if (this.canConnectDirectly(source, target, context)) {
      return {
        path: [source, target],
        waypoints: [],
        obstacles: [],
        cost: this.calculateDistance(source, target),
        valid: true
      };
    }

    // Use A* algorithm for complex routing
    const result = this.findOptimalPath(source, target, context);

    // Smooth the path to reduce sharp angles
    if (result.valid && result.path.length > 2) {
      result.path = this.smoothPath(result.path);
    }

    result.cost = this.calculatePathCost(result.path, context);
    return result;
  }

  /**
   * Check if direct connection is possible without obstacles
   */
  private static canConnectDirectly(
    source: ConnectionPoint,
    target: ConnectionPoint,
    context: RoutingContext
  ): boolean {
    const line = this.createLine(source, target);
    return !this.lineIntersectsObstacles(line, context.nodes, context.existingConnections);
  }

  /**
   * A* pathfinding algorithm for connection routing
   */
  private static findOptimalPath(
    start: ConnectionPoint,
    goal: ConnectionPoint,
    context: RoutingContext
  ): RoutingResult {
    const openSet: PathNode[] = [];
    const closedSet: Set<string> = new Set();
    const cameFrom: Map<string, PathNode> = new Map();

    const startNode: PathNode = {
      position: start,
      gScore: 0,
      fScore: this.heuristic(start, goal),
      parent: null
    };

    openSet.push(startNode);

    let iterations = 0;
    while (openSet.length > 0 && iterations < this.MAX_ITERATIONS) {
      iterations++;

      // Find node with lowest fScore
      openSet.sort((a, b) => a.fScore - b.fScore);
      const current = openSet.shift()!;

      if (this.positionsEqual(current.position, goal)) {
        // Reconstruct path
        return this.reconstructPath(current, cameFrom);
      }

      closedSet.add(this.positionKey(current.position));

      // Generate neighbors
      const neighbors = this.getNeighbors(current.position, context);

      for (const neighbor of neighbors) {
        if (closedSet.has(this.positionKey(neighbor))) continue;

        const tentativeGScore = current.gScore + this.calculateDistance(current.position, neighbor);

        const existingNeighbor = openSet.find(n => this.positionsEqual(n.position, neighbor));
        if (!existingNeighbor) {
          const neighborNode: PathNode = {
            position: neighbor,
            gScore: tentativeGScore,
            fScore: tentativeGScore + this.heuristic(neighbor, goal),
            parent: current
          };
          openSet.push(neighborNode);
        } else if (tentativeGScore < existingNeighbor.gScore) {
          existingNeighbor.gScore = tentativeGScore;
          existingNeighbor.fScore = tentativeGScore + this.heuristic(neighbor, goal);
          existingNeighbor.parent = current;
        }
      }
    }

    // No path found, return best effort
    return {
      path: [start, goal],
      waypoints: [],
      obstacles: context.nodes,
      cost: Infinity,
      valid: false
    };
  }

  /**
   * Get valid neighbor positions for pathfinding
   */
  private static getNeighbors(position: Position, context: RoutingContext): Position[] {
    const neighbors: Position[] = [];
    const gridSize = context.gridSize || this.GRID_SIZE;

    // Generate 8-directional neighbors
    const directions = [
      { x: 0, y: -gridSize }, // North
      { x: gridSize, y: -gridSize }, // Northeast
      { x: gridSize, y: 0 }, // East
      { x: gridSize, y: gridSize }, // Southeast
      { x: 0, y: gridSize }, // South
      { x: -gridSize, y: gridSize }, // Southwest
      { x: -gridSize, y: 0 }, // West
      { x: -gridSize, y: -gridSize } // Northwest
    ];

    for (const dir of directions) {
      const neighbor: Position = {
        x: position.x + dir.x,
        y: position.y + dir.y
      };

      // Check if neighbor is valid (not inside obstacles)
      if (this.isValidPosition(neighbor, context)) {
        neighbors.push(neighbor);
      }
    }

    return neighbors;
  }

  /**
   * Check if a position is valid (not inside obstacles)
   */
  private static isValidPosition(position: Position, context: RoutingContext): boolean {
    const padding = this.OBSTACLE_PADDING;

    for (const obstacle of context.nodes) {
      if (this.pointInRectangle(position, {
        x: obstacle.x - padding,
        y: obstacle.y - padding,
        width: obstacle.width + 2 * padding,
        height: obstacle.height + 2 * padding
      })) {
        return false;
      }
    }

    return true;
  }

  /**
   * Reconstruct path from A* result
   */
  private static reconstructPath(current: PathNode, cameFrom: Map<string, PathNode>): RoutingResult {
    const path: Position[] = [];
    let node: PathNode | null = current;

    while (node) {
      path.unshift(node.position);
      node = node.parent;
    }

    // Extract waypoints (significant direction changes)
    const waypoints = this.extractWaypoints(path);

    return {
      path,
      waypoints,
      obstacles: [],
      cost: current.gScore,
      valid: true
    };
  }

  /**
   * Extract waypoints from path (points where direction changes significantly)
   */
  private static extractWaypoints(path: Position[]): Position[] {
    if (path.length < 3) return [];

    const waypoints: Position[] = [];
    const angleThreshold = Math.PI / 6; // 30 degrees

    for (let i = 1; i < path.length - 1; i++) {
      const prev = path[i - 1];
      const current = path[i];
      const next = path[i + 1];

      const angle1 = Math.atan2(current.y - prev.y, current.x - prev.x);
      const angle2 = Math.atan2(next.y - current.y, next.x - current.x);
      const angleDiff = Math.abs(angle2 - angle1);

      if (angleDiff > angleThreshold) {
        waypoints.push(current);
      }
    }

    return waypoints;
  }

  /**
   * Smooth path using Chaikin's algorithm
   */
  private static smoothPath(path: Position[]): Position[] {
    if (path.length < 3) return path;

    let smoothed = [...path];
    const iterations = 2;

    for (let iter = 0; iter < iterations; iter++) {
      const newPath: Position[] = [smoothed[0]];

      for (let i = 0; i < smoothed.length - 1; i++) {
        const p0 = smoothed[i];
        const p1 = smoothed[i + 1];

        // Create intermediate points
        const q = {
          x: p0.x * (1 - this.SMOOTHING_FACTOR) + p1.x * this.SMOOTHING_FACTOR,
          y: p0.y * (1 - this.SMOOTHING_FACTOR) + p1.y * this.SMOOTHING_FACTOR
        };

        const r = {
          x: p0.x * this.SMOOTHING_FACTOR + p1.x * (1 - this.SMOOTHING_FACTOR),
          y: p0.y * this.SMOOTHING_FACTOR + p1.y * (1 - this.SMOOTHING_FACTOR)
        };

        newPath.push(q, r);
      }

      newPath.push(smoothed[smoothed.length - 1]);
      smoothed = newPath;
    }

    return smoothed;
  }

  /**
   * Calculate heuristic distance (Euclidean)
   */
  private static heuristic(a: Position, b: Position): number {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }

  /**
   * Calculate actual distance between two points
   */
  private static calculateDistance(a: Position, b: Position): number {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }

  /**
   * Calculate total path cost including obstacle penalties
   */
  private static calculatePathCost(path: Position[], context: RoutingContext): number {
    let cost = 0;
    for (let i = 1; i < path.length; i++) {
      cost += this.calculateDistance(path[i - 1], path[i]);
    }

    // Add penalty for paths near obstacles
    const penalty = this.calculateObstaclePenalty(path, context);
    return cost + penalty;
  }

  /**
   * Calculate penalty for path proximity to obstacles
   */
  private static calculateObstaclePenalty(path: Position[], context: RoutingContext): number {
    let penalty = 0;
    const penaltyRadius = 50;

    for (const point of path) {
      for (const obstacle of context.nodes) {
        const distance = this.distanceToRectangle(point, obstacle);
        if (distance < penaltyRadius) {
          penalty += (penaltyRadius - distance) * 2;
        }
      }
    }

    return penalty;
  }

  /**
   * Check if line intersects with obstacles
   */
  private static lineIntersectsObstacles(
    line: { start: Position; end: Position },
    obstacles: Rectangle[],
    connections: ConnectionPath[]
  ): boolean {
    // Check intersection with nodes
    for (const obstacle of obstacles) {
      if (this.lineIntersectsRectangle(line, obstacle)) {
        return true;
      }
    }

    // Check intersection with other connections (optional, for cleaner routing)
    for (const connection of connections) {
      if (this.linesIntersect(line, {
        start: connection.source,
        end: connection.target
      })) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if line intersects rectangle
   */
  private static lineIntersectsRectangle(
    line: { start: Position; end: Position },
    rect: Rectangle
  ): boolean {
    // Check if line intersects any of the four rectangle sides
    const sides = [
      { start: { x: rect.x, y: rect.y }, end: { x: rect.x + rect.width, y: rect.y } },
      { start: { x: rect.x + rect.width, y: rect.y }, end: { x: rect.x + rect.width, y: rect.y + rect.height } },
      { start: { x: rect.x + rect.width, y: rect.y + rect.height }, end: { x: rect.x, y: rect.y + rect.height } },
      { start: { x: rect.x, y: rect.y + rect.height }, end: { x: rect.x, y: rect.y } }
    ];

    for (const side of sides) {
      if (this.linesIntersect(line, side)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if two lines intersect
   */
  private static linesIntersect(
    line1: { start: Position; end: Position },
    line2: { start: Position; end: Position }
  ): boolean {
    const { start: p1, end: q1 } = line1;
    const { start: p2, end: q2 } = line2;

    const orientation = (p: Position, q: Position, r: Position) => {
      const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
      if (Math.abs(val) < 1e-9) return 0; // collinear
      return val > 0 ? 1 : 2; // clock or counterclock wise
    };

    const onSegment = (p: Position, q: Position, r: Position) => {
      return Math.min(p.x, r.x) <= q.x && q.x <= Math.max(p.x, r.x) &&
             Math.min(p.y, r.y) <= q.y && q.y <= Math.max(p.y, r.y);
    };

    const o1 = orientation(p1, q1, p2);
    const o2 = orientation(p1, q1, q2);
    const o3 = orientation(p2, q2, p1);
    const o4 = orientation(p2, q2, q1);

    if (o1 !== o2 && o3 !== o4) return true;

    if (o1 === 0 && onSegment(p1, p2, q1)) return true;
    if (o2 === 0 && onSegment(p1, q2, q1)) return true;
    if (o3 === 0 && onSegment(p2, p1, q2)) return true;
    if (o4 === 0 && onSegment(p2, q1, q2)) return true;

    return false;
  }

  /**
   * Create line object from two points
   */
  private static createLine(start: Position, end: Position) {
    return { start, end };
  }

  /**
   * Check if point is inside rectangle
   */
  private static pointInRectangle(point: Position, rect: Rectangle): boolean {
    return point.x >= rect.x &&
           point.x <= rect.x + rect.width &&
           point.y >= rect.y &&
           point.y <= rect.y + rect.height;
  }

  /**
   * Calculate distance from point to rectangle
   */
  private static distanceToRectangle(point: Position, rect: Rectangle): number {
    const dx = Math.max(rect.x - point.x, 0, point.x - (rect.x + rect.width));
    const dy = Math.max(rect.y - point.y, 0, point.y - (rect.y + rect.height));
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Position equality check
   */
  private static positionsEqual(a: Position, b: Position): boolean {
    const threshold = 1;
    return Math.abs(a.x - b.x) < threshold && Math.abs(a.y - b.y) < threshold;
  }

  /**
   * Create position key for map/set
   */
  private static positionKey(pos: Position): string {
    return `${Math.round(pos.x)},${Math.round(pos.y)}`;
  }
}

// Internal pathfinding node
interface PathNode {
  position: Position;
  gScore: number;
  fScore: number;
  parent: PathNode | null;
}
