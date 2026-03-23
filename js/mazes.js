/**
 * Maze generation algorithms.
 * Each returns an array of {row, col} positions that should become walls.
 * The generation is done step-by-step so it can be animated.
 */
const Mazes = (() => {

    // ════════════ Recursive Division ════════════

    function recursiveDivision(grid, skew = 'none') {
        const walls = [];
        const rows = grid.rows;
        const cols = grid.cols;

        // Add border walls
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) {
                    if (!isStartOrFinish(grid, r, c)) {
                        walls.push({ row: r, col: c });
                    }
                }
            }
        }

        divide(grid, walls, 1, rows - 2, 1, cols - 2, skew);
        return walls;
    }

    function recursiveDivisionH(grid) {
        return recursiveDivision(grid, 'horizontal');
    }

    function recursiveDivisionV(grid) {
        return recursiveDivision(grid, 'vertical');
    }

    function divide(grid, walls, rowStart, rowEnd, colStart, colEnd, skew) {
        if (rowEnd < rowStart || colEnd < colStart) return;

        const width = colEnd - colStart;
        const height = rowEnd - rowStart;
        if (width < 1 && height < 1) return;

        let horizontal;
        if (skew === 'horizontal') horizontal = true;
        else if (skew === 'vertical') horizontal = false;
        else horizontal = height > width ? true : (height < width ? false : Math.random() < 0.5);

        if (horizontal) {
            // Draw horizontal wall
            const possibleRows = [];
            for (let r = rowStart; r <= rowEnd; r += 2) possibleRows.push(r);
            if (possibleRows.length === 0) return;
            const wallRow = possibleRows[randInt(0, possibleRows.length - 1)];
            const passageCol = colStart + randInt(0, Math.floor((colEnd - colStart) / 2)) * 2 + 1;

            for (let c = colStart; c <= colEnd; c++) {
                if (c === passageCol) continue;
                if (!isStartOrFinish(grid, wallRow, c)) {
                    walls.push({ row: wallRow, col: c });
                }
            }

            divide(grid, walls, rowStart, wallRow - 1, colStart, colEnd, skew);
            divide(grid, walls, wallRow + 1, rowEnd, colStart, colEnd, skew);
        } else {
            // Draw vertical wall
            const possibleCols = [];
            for (let c = colStart; c <= colEnd; c += 2) possibleCols.push(c);
            if (possibleCols.length === 0) return;
            const wallCol = possibleCols[randInt(0, possibleCols.length - 1)];
            const passageRow = rowStart + randInt(0, Math.floor((rowEnd - rowStart) / 2)) * 2 + 1;

            for (let r = rowStart; r <= rowEnd; r++) {
                if (r === passageRow) continue;
                if (!isStartOrFinish(grid, r, wallCol)) {
                    walls.push({ row: r, col: wallCol });
                }
            }

            divide(grid, walls, rowStart, rowEnd, colStart, wallCol - 1, skew);
            divide(grid, walls, rowStart, rowEnd, wallCol + 1, colEnd, skew);
        }
    }

    // ════════════ Random Walls ════════════

    function randomWalls(grid) {
        const walls = [];
        for (let r = 0; r < grid.rows; r++) {
            for (let c = 0; c < grid.cols; c++) {
                if (isStartOrFinish(grid, r, c)) continue;
                if (Math.random() < 0.3) {
                    walls.push({ row: r, col: c });
                }
            }
        }
        return walls;
    }

    // ════════════ Staircase ════════════

    function staircase(grid) {
        const walls = [];
        let r = 0, c = 0;
        const dir = 1; // step right then down
        while (r < grid.rows && c < grid.cols) {
            if (!isStartOrFinish(grid, r, c)) {
                walls.push({ row: r, col: c });
            }
            // step diagonally
            if (c + 2 < grid.cols) {
                c += 2;
            } else {
                c = 0;
                r += 2;
            }
            if (r < grid.rows && !isStartOrFinish(grid, r, c)) {
                walls.push({ row: r, col: c });
            }
            r += 2;
        }
        return walls;
    }

    // ════════════ Helpers ════════════

    function isStartOrFinish(grid, r, c) {
        return (r === grid.startRow && c === grid.startCol) ||
               (r === grid.finishRow && c === grid.finishCol);
    }

    function randInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    return { recursiveDivision, recursiveDivisionH, recursiveDivisionV, randomWalls, staircase };
})();
