/**
 * Visualizer – animates visited nodes, shortest path, and maze walls on the DOM grid.
 */
const Visualizer = (() => {

    let timeouts = [];
    let _running = false;

    function isRunning() { return _running; }

    function stop() {
        _running = false;
        timeouts.forEach(clearTimeout);
        timeouts = [];
    }

    /**
     * Speed → base delay in ms for visited-node animation.
     */
    function getDelay(speed) {
        switch (speed) {
            case 'slow':    return 50;
            case 'average': return 20;
            case 'fast':
            default:        return 5;
        }
    }

    // ────────── Animate pathfinding result ──────────

    function animatePathfinding(visitedInOrder, shortestPath, speed, onDone) {
        stop();
        _running = true;
        const delay = getDelay(speed);

        for (let i = 0; i < visitedInOrder.length; i++) {
            const tid = setTimeout(() => {
                if (!_running) return;
                const node = visitedInOrder[i];
                if (!node.isStart && !node.isFinish) {
                    const el = document.getElementById(node.id());
                    if (el) el.classList.add('node-visited');
                }
                // After all visited nodes, animate shortest path
                if (i === visitedInOrder.length - 1) {
                    animateShortestPath(shortestPath, onDone);
                }
            }, i * delay);
            timeouts.push(tid);
        }

        // Edge case: no visited nodes
        if (visitedInOrder.length === 0) {
            _running = false;
            if (onDone) onDone();
        }
    }

    function animateShortestPath(shortestPath, onDone) {
        if (shortestPath.length === 0) {
            _running = false;
            if (onDone) onDone();
            return;
        }
        for (let i = 0; i < shortestPath.length; i++) {
            const tid = setTimeout(() => {
                if (!_running) return;
                const node = shortestPath[i];
                if (!node.isStart && !node.isFinish) {
                    const el = document.getElementById(node.id());
                    if (el) {
                        el.classList.remove('node-visited');
                        el.classList.add('node-shortest-path');
                    }
                }
                if (i === shortestPath.length - 1) {
                    _running = false;
                    if (onDone) onDone();
                }
            }, i * 40);
            timeouts.push(tid);
        }
    }

    // ────────── Animate maze walls ──────────

    function animateMaze(wallPositions, grid, renderCell, speed, onDone) {
        stop();
        _running = true;
        const delay = speed === 'slow' ? 30 : speed === 'average' ? 15 : 5;

        for (let i = 0; i < wallPositions.length; i++) {
            const tid = setTimeout(() => {
                if (!_running) return;
                const { row, col } = wallPositions[i];
                const node = grid.getNode(row, col);
                node.isWall = true;
                node.isWeight = false;
                node.weight = 1;
                renderCell(node);

                if (i === wallPositions.length - 1) {
                    _running = false;
                    if (onDone) onDone();
                }
            }, i * delay);
            timeouts.push(tid);
        }

        if (wallPositions.length === 0) {
            _running = false;
            if (onDone) onDone();
        }
    }

    // ────────── Instant (no animation) for re-running after drag ──────────

    function showInstant(visitedInOrder, shortestPath) {
        for (const node of visitedInOrder) {
            if (!node.isStart && !node.isFinish) {
                const el = document.getElementById(node.id());
                if (el) {
                    el.classList.remove('node-visited', 'node-shortest-path');
                    el.classList.add('node-visited-instant');
                }
            }
        }
        for (const node of shortestPath) {
            if (!node.isStart && !node.isFinish) {
                const el = document.getElementById(node.id());
                if (el) {
                    el.classList.remove('node-visited', 'node-visited-instant');
                    el.classList.add('node-shortest-path-instant');
                }
            }
        }
    }

    return { isRunning, stop, animatePathfinding, animateMaze, showInstant };
})();
