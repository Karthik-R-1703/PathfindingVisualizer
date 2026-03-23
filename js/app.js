/**
 * Main application – wires up the grid, controls, mouse interactions,
 * and ties algorithms + visualizer together.
 */
(() => {
    // ═══════════ Configuration ═══════════
    const CELL_SIZE = 26; // px, matches CSS
    const NAV_HEIGHT = 160; // approximate px eaten by navbar + info + legend

    // ═══════════ DOM refs ═══════════
    const gridTable       = document.getElementById('grid');
    const btnVisualize    = document.getElementById('btn-visualize');
    const btnClearBoard   = document.getElementById('btn-clear-board');
    const btnClearWalls   = document.getElementById('btn-clear-walls');
    const btnClearPath    = document.getElementById('btn-clear-path');
    const btnAddWeight    = document.getElementById('btn-add-weight');
    const speedSelect     = document.getElementById('speed');
    const algoDropdown    = document.getElementById('algo-dropdown');
    const algoMenu        = document.getElementById('algo-menu');
    const mazeDropdown    = document.getElementById('maze-dropdown');
    const mazeMenu        = document.getElementById('maze-menu');
    const algoDescription = document.getElementById('algo-description');

    // ═══════════ State ═══════════
    let grid;
    let selectedAlgo = 'dijkstra';
    let weightMode = false;
    let mouseIsDown = false;
    let draggingStart = false;
    let draggingFinish = false;
    let controlsDisabled = false;
    let hasVisualized = false; // whether a visualization has been done (for live updates on drag)

    const ALGO_DESCRIPTIONS = {
        dijkstra:      "Dijkstra's Algorithm is <strong>weighted</strong> and <strong>guarantees</strong> the shortest path!",
        astar:         "A* Search uses heuristics and is <strong>weighted</strong>; <strong>guarantees</strong> the shortest path!",
        greedy:        "Greedy Best-first Search is <strong>weighted</strong> but <strong>does not guarantee</strong> the shortest path.",
        bfs:           "Breadth-first Search is <strong>unweighted</strong> and <strong>guarantees</strong> the shortest path!",
        dfs:           "Depth-first Search is <strong>unweighted</strong> and <strong>does not guarantee</strong> the shortest path.",
        bidirectional: "Bidirectional BFS searches from both ends; <strong>unweighted</strong>, <strong>guarantees</strong> shortest path!",
    };

    // ═══════════ Init ═══════════
    initGrid();

    // ═══════════ Grid creation ═══════════

    function computeGridSize() {
        const availW = window.innerWidth - 8;
        const availH = window.innerHeight - NAV_HEIGHT - 8;
        const cols = Math.max(10, Math.floor(availW / CELL_SIZE));
        const rows = Math.max(5, Math.floor(availH / CELL_SIZE));
        return { rows, cols };
    }

    function initGrid() {
        const { rows, cols } = computeGridSize();
        const startRow = Math.floor(rows / 2);
        const startCol = Math.max(1, Math.floor(cols / 4));
        const finishRow = Math.floor(rows / 2);
        const finishCol = Math.min(cols - 2, Math.floor(3 * cols / 4));

        grid = new Grid(rows, cols, startRow, startCol, finishRow, finishCol);
        renderGrid();
        hasVisualized = false;
    }

    function renderGrid() {
        gridTable.innerHTML = '';
        for (let r = 0; r < grid.rows; r++) {
            const tr = document.createElement('tr');
            for (let c = 0; c < grid.cols; c++) {
                const td = document.createElement('td');
                const node = grid.getNode(r, c);
                td.id = node.id();
                applyCellClasses(td, node);
                addCellListeners(td, node);
                tr.appendChild(td);
            }
            gridTable.appendChild(tr);
        }
    }

    function renderCell(node) {
        const td = document.getElementById(node.id());
        if (!td) return;
        // Strip all state classes
        td.className = '';
        applyCellClasses(td, node);
    }

    function applyCellClasses(td, node) {
        if (node.isStart)       td.classList.add('node-start');
        else if (node.isFinish) td.classList.add('node-finish');
        else if (node.isWall)   td.classList.add('node-wall');
        else if (node.isWeight) td.classList.add('node-weight');
    }

    // ═══════════ Mouse interaction on cells ═══════════

    function addCellListeners(td, node) {
        td.addEventListener('mousedown', (e) => {
            e.preventDefault();
            if (controlsDisabled) return;
            mouseIsDown = true;
            if (node.isStart) { draggingStart = true; return; }
            if (node.isFinish) { draggingFinish = true; return; }
            toggleWallOrWeight(node);
        });

        td.addEventListener('mouseenter', () => {
            if (!mouseIsDown || controlsDisabled) return;
            if (draggingStart)  { moveStartTo(node); return; }
            if (draggingFinish) { moveFinishTo(node); return; }
            toggleWallOrWeight(node);
        });

        td.addEventListener('mouseup', () => {
            mouseIsDown = false;
            draggingStart = false;
            draggingFinish = false;
        });

        // Touch support
        td.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (controlsDisabled) return;
            mouseIsDown = true;
            if (node.isStart) { draggingStart = true; return; }
            if (node.isFinish) { draggingFinish = true; return; }
            toggleWallOrWeight(node);
        }, { passive: false });

        td.addEventListener('touchend', () => {
            mouseIsDown = false;
            draggingStart = false;
            draggingFinish = false;
        });
    }

    document.addEventListener('mouseup', () => {
        mouseIsDown = false;
        draggingStart = false;
        draggingFinish = false;
    });

    function toggleWallOrWeight(node) {
        if (node.isStart || node.isFinish) return;
        clearPathVisuals();

        if (weightMode) {
            node.isWall = false;
            node.isWeight = !node.isWeight;
            node.weight = node.isWeight ? 5 : 1;
        } else {
            node.isWeight = false;
            node.weight = 1;
            node.isWall = !node.isWall;
        }
        renderCell(node);

        if (hasVisualized) rerunInstant();
    }

    function moveStartTo(node) {
        if (node.isFinish) return;
        const oldTd = document.getElementById(`node-${grid.startRow}-${grid.startCol}`);
        grid.moveStart(node.row, node.col);
        if (oldTd) { oldTd.className = ''; }
        renderCell(node);

        if (hasVisualized) rerunInstant();
    }

    function moveFinishTo(node) {
        if (node.isStart) return;
        const oldTd = document.getElementById(`node-${grid.finishRow}-${grid.finishCol}`);
        grid.moveFinish(node.row, node.col);
        if (oldTd) { oldTd.className = ''; }
        renderCell(node);

        if (hasVisualized) rerunInstant();
    }

    // ═══════════ Clear helpers ═══════════

    function clearPathVisuals() {
        const tds = gridTable.querySelectorAll('td');
        tds.forEach(td => {
            td.classList.remove('node-visited', 'node-visited-instant',
                                'node-shortest-path', 'node-shortest-path-instant');
        });
    }

    function clearBoard() {
        if (Visualizer.isRunning()) Visualizer.stop();
        const { rows, cols } = computeGridSize();
        // Keep same size — just reset everything
        for (const n of grid.getAllNodes()) n.reset();
        grid.nodes[grid.startRow][grid.startCol].isStart = true;
        grid.nodes[grid.finishRow][grid.finishCol].isFinish = true;
        renderGrid();
        hasVisualized = false;
        setControlsDisabled(false);
    }

    function clearWalls() {
        if (Visualizer.isRunning()) return;
        for (const n of grid.getAllNodes()) {
            n.isWall = false;
            n.isWeight = false;
            n.weight = 1;
        }
        clearPathVisuals();
        renderGrid();
        if (hasVisualized) rerunInstant();
    }

    function clearPath() {
        if (Visualizer.isRunning()) return;
        grid.resetAlgo();
        clearPathVisuals();
        hasVisualized = false;
    }

    // ═══════════ Run algorithm (instant, for live drag feedback) ═══════════

    function rerunInstant() {
        grid.resetAlgo();
        clearPathVisuals();
        const result = runSelectedAlgo();
        Visualizer.showInstant(result.visitedInOrder, result.shortestPath);
    }

    function runSelectedAlgo() {
        const map = {
            dijkstra:      Pathfinding.dijkstra,
            astar:         Pathfinding.astar,
            greedy:        Pathfinding.greedy,
            bfs:           Pathfinding.bfs,
            dfs:           Pathfinding.dfs,
            bidirectional: Pathfinding.bidirectional,
        };
        return map[selectedAlgo](grid);
    }

    // ═══════════ Visualize button ═══════════

    function visualize() {
        if (Visualizer.isRunning()) return;
        // Clear previous visualization
        grid.resetAlgo();
        clearPathVisuals();

        const result = runSelectedAlgo();

        setControlsDisabled(true);
        const speed = speedSelect.value;

        Visualizer.animatePathfinding(
            result.visitedInOrder,
            result.shortestPath,
            speed,
            () => {
                setControlsDisabled(false);
                hasVisualized = true;
            }
        );
    }

    // ═══════════ Maze generation ═══════════

    function generateMaze(mazeType) {
        if (Visualizer.isRunning()) return;
        // Clear board first (except start/finish positions)
        for (const n of grid.getAllNodes()) {
            n.isWall = false;
            n.isWeight = false;
            n.weight = 1;
            n.resetAlgo();
        }
        clearPathVisuals();
        renderGrid();
        hasVisualized = false;

        const mazeMap = {
            recursiveDivision:  Mazes.recursiveDivision,
            recursiveDivisionH: Mazes.recursiveDivisionH,
            recursiveDivisionV: Mazes.recursiveDivisionV,
            randomWalls:        Mazes.randomWalls,
            staircase:          Mazes.staircase,
        };

        const mazeFunc = mazeMap[mazeType];
        if (!mazeFunc) return;

        const wallPositions = mazeFunc(grid);
        const speed = speedSelect.value;

        setControlsDisabled(true);
        Visualizer.animateMaze(wallPositions, grid, renderCell, speed, () => {
            setControlsDisabled(false);
        });
    }

    // ═══════════ UI enable / disable ═══════════

    function setControlsDisabled(disabled) {
        controlsDisabled = disabled;
        btnVisualize.disabled = disabled;
        btnClearBoard.disabled = disabled;
        btnClearWalls.disabled = disabled;
        btnClearPath.disabled = disabled;
        btnAddWeight.disabled = disabled;
        algoDropdown.disabled = disabled;
        mazeDropdown.disabled = disabled;
    }

    // ═══════════ Event listeners ═══════════

    btnVisualize.addEventListener('click', visualize);
    btnClearBoard.addEventListener('click', clearBoard);
    btnClearWalls.addEventListener('click', clearWalls);
    btnClearPath.addEventListener('click', clearPath);

    btnAddWeight.addEventListener('click', () => {
        if (controlsDisabled) return;
        weightMode = !weightMode;
        btnAddWeight.classList.toggle('active-weight', weightMode);
    });

    // Dropdown toggles
    algoDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
        algoMenu.classList.toggle('show');
        mazeMenu.classList.remove('show');
    });

    mazeDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
        mazeMenu.classList.toggle('show');
        algoMenu.classList.remove('show');
    });

    document.addEventListener('click', () => {
        algoMenu.classList.remove('show');
        mazeMenu.classList.remove('show');
    });

    // Algo selection
    algoMenu.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            selectedAlgo = item.dataset.algo;
            algoMenu.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            algoMenu.classList.remove('show');
            algoDropdown.innerHTML = `${item.textContent} <i class="fa fa-caret-down"></i>`;
            algoDescription.innerHTML = ALGO_DESCRIPTIONS[selectedAlgo] || '';
            // Update Visualize button text
            btnVisualize.textContent = `Visualize ${item.textContent.split(' ')[0]}!`;
        });
    });

    // Maze selection
    mazeMenu.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            mazeMenu.classList.remove('show');
            generateMaze(item.dataset.maze);
        });
    });

    // Keyboard shortcut: Enter to visualize
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') visualize();
    });

    // Resize – rebuild grid (but lose walls)
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (!Visualizer.isRunning()) initGrid();
        }, 300);
    });

    // Set initial description
    algoDescription.innerHTML = ALGO_DESCRIPTIONS[selectedAlgo];
    btnVisualize.textContent = "Visualize Dijkstra's!";
})();
