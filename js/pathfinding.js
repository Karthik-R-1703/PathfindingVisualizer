/**
 * Pathfinding algorithms.
 * Each returns { visitedInOrder: Node[], shortestPath: Node[] }.
 */
const Pathfinding = (() => {

    // ════════════ Helpers ════════════

    /** Backtrace from finish to start via previousNode pointers */
    function reconstructPath(finishNode) {
        const path = [];
        let cur = finishNode;
        while (cur !== null) {
            path.unshift(cur);
            cur = cur.previousNode;
        }
        return path;
    }

    /** Manhattan distance heuristic */
    function heuristic(a, b) {
        return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
    }

    /** Simple min-heap (priority queue) for efficiency */
    class MinHeap {
        constructor(comparator) {
            this._data = [];
            this._cmp = comparator;
        }
        get size() { return this._data.length; }
        push(val) { this._data.push(val); this._bubbleUp(this._data.length - 1); }
        pop() {
            const top = this._data[0];
            const last = this._data.pop();
            if (this._data.length > 0) { this._data[0] = last; this._sinkDown(0); }
            return top;
        }
        _bubbleUp(i) {
            while (i > 0) {
                const parent = (i - 1) >> 1;
                if (this._cmp(this._data[i], this._data[parent]) < 0) {
                    [this._data[i], this._data[parent]] = [this._data[parent], this._data[i]];
                    i = parent;
                } else break;
            }
        }
        _sinkDown(i) {
            const n = this._data.length;
            while (true) {
                let smallest = i;
                const l = 2 * i + 1, r = 2 * i + 2;
                if (l < n && this._cmp(this._data[l], this._data[smallest]) < 0) smallest = l;
                if (r < n && this._cmp(this._data[r], this._data[smallest]) < 0) smallest = r;
                if (smallest !== i) {
                    [this._data[i], this._data[smallest]] = [this._data[smallest], this._data[i]];
                    i = smallest;
                } else break;
            }
        }
    }

    // ════════════ Dijkstra ════════════

    function dijkstra(grid) {
        const start = grid.getNode(grid.startRow, grid.startCol);
        const finish = grid.getNode(grid.finishRow, grid.finishCol);
        start.distance = 0;
        const visitedInOrder = [];
        const heap = new MinHeap((a, b) => a.distance - b.distance);
        heap.push(start);

        while (heap.size > 0) {
            const current = heap.pop();
            if (current.isVisited) continue;
            if (current.isWall) continue;
            if (current.distance === Infinity) break;
            current.isVisited = true;
            visitedInOrder.push(current);
            if (current === finish) break;

            for (const neighbour of grid.getNeighbours(current)) {
                if (neighbour.isVisited || neighbour.isWall) continue;
                const newDist = current.distance + neighbour.weight;
                if (newDist < neighbour.distance) {
                    neighbour.distance = newDist;
                    neighbour.previousNode = current;
                    heap.push(neighbour);
                }
            }
        }

        const shortestPath = finish.isVisited ? reconstructPath(finish) : [];
        return { visitedInOrder, shortestPath };
    }

    // ════════════ A* Search ════════════

    function astar(grid) {
        const start = grid.getNode(grid.startRow, grid.startCol);
        const finish = grid.getNode(grid.finishRow, grid.finishCol);
        start.distance = 0;
        start.heuristic = heuristic(start, finish);
        start.totalCost = start.heuristic;
        const visitedInOrder = [];
        const heap = new MinHeap((a, b) => a.totalCost - b.totalCost);
        heap.push(start);

        while (heap.size > 0) {
            const current = heap.pop();
            if (current.isVisited) continue;
            if (current.isWall) continue;
            current.isVisited = true;
            visitedInOrder.push(current);
            if (current === finish) break;

            for (const neighbour of grid.getNeighbours(current)) {
                if (neighbour.isVisited || neighbour.isWall) continue;
                const tentativeG = current.distance + neighbour.weight;
                if (tentativeG < neighbour.distance) {
                    neighbour.distance = tentativeG;
                    neighbour.heuristic = heuristic(neighbour, finish);
                    neighbour.totalCost = tentativeG + neighbour.heuristic;
                    neighbour.previousNode = current;
                    heap.push(neighbour);
                }
            }
        }

        const shortestPath = finish.isVisited ? reconstructPath(finish) : [];
        return { visitedInOrder, shortestPath };
    }

    // ════════════ Greedy Best-first ════════════

    function greedy(grid) {
        const start = grid.getNode(grid.startRow, grid.startCol);
        const finish = grid.getNode(grid.finishRow, grid.finishCol);
        start.heuristic = heuristic(start, finish);
        const visitedInOrder = [];
        const heap = new MinHeap((a, b) => a.heuristic - b.heuristic);
        heap.push(start);

        while (heap.size > 0) {
            const current = heap.pop();
            if (current.isVisited) continue;
            if (current.isWall) continue;
            current.isVisited = true;
            visitedInOrder.push(current);
            if (current === finish) break;

            for (const neighbour of grid.getNeighbours(current)) {
                if (neighbour.isVisited || neighbour.isWall) continue;
                neighbour.heuristic = heuristic(neighbour, finish);
                neighbour.previousNode = current;
                heap.push(neighbour);
            }
        }

        const shortestPath = finish.isVisited ? reconstructPath(finish) : [];
        return { visitedInOrder, shortestPath };
    }

    // ════════════ BFS ════════════

    function bfs(grid) {
        const start = grid.getNode(grid.startRow, grid.startCol);
        const finish = grid.getNode(grid.finishRow, grid.finishCol);
        start.distance = 0;
        const visitedInOrder = [];
        const queue = [start];
        start.isVisited = true;

        while (queue.length > 0) {
            const current = queue.shift();
            if (current.isWall) continue;
            visitedInOrder.push(current);
            if (current === finish) break;

            for (const neighbour of grid.getNeighbours(current)) {
                if (neighbour.isVisited || neighbour.isWall) continue;
                neighbour.isVisited = true;
                neighbour.previousNode = current;
                neighbour.distance = current.distance + 1;
                queue.push(neighbour);
            }
        }

        const shortestPath = finish.isVisited ? reconstructPath(finish) : [];
        return { visitedInOrder, shortestPath };
    }

    // ════════════ DFS ════════════

    function dfs(grid) {
        const start = grid.getNode(grid.startRow, grid.startCol);
        const finish = grid.getNode(grid.finishRow, grid.finishCol);
        const visitedInOrder = [];
        const stack = [start];

        while (stack.length > 0) {
            const current = stack.pop();
            if (current.isVisited || current.isWall) continue;
            current.isVisited = true;
            visitedInOrder.push(current);
            if (current === finish) break;

            const neighbours = grid.getNeighbours(current);
            for (let i = neighbours.length - 1; i >= 0; i--) {
                const nb = neighbours[i];
                if (!nb.isVisited && !nb.isWall) {
                    nb.previousNode = current;
                    stack.push(nb);
                }
            }
        }

        const shortestPath = finish.isVisited ? reconstructPath(finish) : [];
        return { visitedInOrder, shortestPath };
    }

    // ════════════ Bidirectional BFS ════════════

    function bidirectional(grid) {
        const start = grid.getNode(grid.startRow, grid.startCol);
        const finish = grid.getNode(grid.finishRow, grid.finishCol);
        const visitedInOrder = [];

        const visitedFromStart = new Set();
        const visitedFromFinish = new Set();
        const parentFromStart = new Map();
        const parentFromFinish = new Map();

        const queueStart = [start];
        const queueFinish = [finish];
        visitedFromStart.add(start);
        visitedFromFinish.add(finish);

        let meetingNode = null;

        while (queueStart.length > 0 || queueFinish.length > 0) {
            // Expand from start
            if (queueStart.length > 0) {
                const current = queueStart.shift();
                if (!current.isWall) {
                    visitedInOrder.push(current);
                    if (visitedFromFinish.has(current)) { meetingNode = current; break; }
                    for (const nb of grid.getNeighbours(current)) {
                        if (!visitedFromStart.has(nb) && !nb.isWall) {
                            visitedFromStart.add(nb);
                            parentFromStart.set(nb, current);
                            queueStart.push(nb);
                        }
                    }
                }
            }
            // Expand from finish
            if (queueFinish.length > 0) {
                const current = queueFinish.shift();
                if (!current.isWall) {
                    visitedInOrder.push(current);
                    if (visitedFromStart.has(current)) { meetingNode = current; break; }
                    for (const nb of grid.getNeighbours(current)) {
                        if (!visitedFromFinish.has(nb) && !nb.isWall) {
                            visitedFromFinish.add(nb);
                            parentFromFinish.set(nb, current);
                            queueFinish.push(nb);
                        }
                    }
                }
            }
        }

        let shortestPath = [];
        if (meetingNode) {
            // Build path from start → meeting
            const pathFromStart = [];
            let cur = meetingNode;
            while (cur) {
                pathFromStart.unshift(cur);
                cur = parentFromStart.get(cur) || null;
            }
            // Build path from meeting → finish
            const pathFromFinish = [];
            cur = parentFromFinish.get(meetingNode) || null;
            while (cur) {
                pathFromFinish.push(cur);
                cur = parentFromFinish.get(cur) || null;
            }
            shortestPath = pathFromStart.concat(pathFromFinish);
        }

        return { visitedInOrder, shortestPath };
    }

    return { dijkstra, astar, greedy, bfs, dfs, bidirectional };
})();
