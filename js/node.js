/**
 * Node model – represents a single cell in the pathfinding grid.
 */
class Node {
    constructor(row, col) {
        this.row = row;
        this.col = col;
        this.isStart = false;
        this.isFinish = false;
        this.isWall = false;
        this.isWeight = false;
        this.isVisited = false;
        this.distance = Infinity;       // Dijkstra / BFS
        this.heuristic = Infinity;      // A* / Greedy
        this.totalCost = Infinity;      // A*: f = g + h
        this.previousNode = null;
        this.weight = 1;                // default weight
    }

    /** Reset algorithm-specific data while keeping walls/weights/start/finish */
    resetAlgo() {
        this.isVisited = false;
        this.distance = Infinity;
        this.heuristic = Infinity;
        this.totalCost = Infinity;
        this.previousNode = null;
    }

    /** Full reset */
    reset() {
        this.isStart = false;
        this.isFinish = false;
        this.isWall = false;
        this.isWeight = false;
        this.weight = 1;
        this.resetAlgo();
    }

    id() {
        return `node-${this.row}-${this.col}`;
    }
}

/**
 * Grid – 2-D array of nodes, manages creation and neighbour look-ups.
 */
class Grid {
    constructor(rows, cols, startRow, startCol, finishRow, finishCol) {
        this.rows = rows;
        this.cols = cols;
        this.startRow = startRow;
        this.startCol = startCol;
        this.finishRow = finishRow;
        this.finishCol = finishCol;
        this.nodes = this._build();
    }

    _build() {
        const nodes = [];
        for (let r = 0; r < this.rows; r++) {
            const row = [];
            for (let c = 0; c < this.cols; c++) {
                const n = new Node(r, c);
                if (r === this.startRow && c === this.startCol) n.isStart = true;
                if (r === this.finishRow && c === this.finishCol) n.isFinish = true;
                row.push(n);
            }
            nodes.push(row);
        }
        return nodes;
    }

    getNode(r, c) {
        return this.nodes[r][c];
    }

    getNeighbours(node) {
        const { row, col } = node;
        const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
        const neighbours = [];
        for (const [dr, dc] of dirs) {
            const nr = row + dr;
            const nc = col + dc;
            if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                neighbours.push(this.nodes[nr][nc]);
            }
        }
        return neighbours;
    }

    getAllNodes() {
        const all = [];
        for (const row of this.nodes) {
            for (const n of row) all.push(n);
        }
        return all;
    }

    resetAlgo() {
        for (const n of this.getAllNodes()) n.resetAlgo();
    }

    moveStart(row, col) {
        this.nodes[this.startRow][this.startCol].isStart = false;
        this.startRow = row;
        this.startCol = col;
        this.nodes[row][col].isStart = true;
        this.nodes[row][col].isWall = false;
        this.nodes[row][col].isWeight = false;
    }

    moveFinish(row, col) {
        this.nodes[this.finishRow][this.finishCol].isFinish = false;
        this.finishRow = row;
        this.finishCol = col;
        this.nodes[row][col].isFinish = true;
        this.nodes[row][col].isWall = false;
        this.nodes[row][col].isWeight = false;
    }
}
