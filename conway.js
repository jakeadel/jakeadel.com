
const numRows = 30;
const numCols = 30;

function createGrid() {
    const table = document.getElementById('conwayGrid');
    for (let row = 0; row < numRows; row++) {
        const tableRow = table.insertRow();
        for (let col = 0; col < numCols; col++) {
            const cell = tableRow.insertCell();
            cell.classList.add('cell', 'dead');
            cell.setAttribute('data-row', row);
            cell.setAttribute('data-col', col);
        }
    }
}

function updateGrid(changes) {
    // Example change structure: [{coords: [row, col], status: 1}, ...]
    changes.forEach(change => {
        grid[change.coords[0]][change.coords[1]] = change.status;
        const cell = document.querySelector(`[data-row='${change.coords[0]}'][data-col='${change.coords[1]}']`);
        if (change.status === 1) {
            cell.classList.remove('dead');
            cell.classList.add('alive');
        } else {
            cell.classList.remove('alive');
            cell.classList.add('dead');
        }
    });
}

let count = 0;
let loop = true;
function play() {
    loop = !loop;
    let text
    if (loop === false) {
        text = "Play"
    }
    else {
        text = "Pause"
    }
    document.getElementById('play').innerText = text;
}

setInterval(refreshCanvas, 100);

let grid = Array(numRows).fill().map(() => Array(numCols).fill(0));

const glider1 = [
    {coords: [0, 1], status: 1},
    {coords: [1, 2], status: 1},
    {coords: [2, 0], status: 1},
    {coords: [2, 1], status: 1},
    {coords: [2, 2], status: 1}
];

const glider2 = [
    {coords: [10, 11], status: 1},
    {coords: [11, 12], status: 1},
    {coords: [12, 10], status: 1},
    {coords: [12, 11], status: 1},
    {coords: [12, 12], status: 1}
];

const lwss = [
    {coords: [25, 15], status: 1},
    {coords: [25, 18], status: 1},
    {coords: [26, 19], status: 1},
    {coords: [27, 15], status: 1},
    {coords: [27, 19], status: 1},
    {coords: [28, 16], status: 1},
    {coords: [28, 17], status: 1},
    {coords: [28, 18], status: 1},
    {coords: [28, 19], status: 1}
];

createGrid();
updateGrid(glider1)
updateGrid(glider2)
updateGrid(lwss)

function getNumAdjacent(row, col) {
    const adjacentOffsets = [[-1, -1], [-1, 0], [-1, 1],
                             [0, -1], /*Pixel*/ [0, 1],
                             [1, -1], [1, 0], [1, 1]];
    let count = 0;
    for (let offset of adjacentOffsets) {
        if (count === 4) {
            return count;
        }
        const [yOffset, xOffset] = offset;
        let newY = row + yOffset;
        let newX = col + xOffset;

        if (newX === numCols) {
            newX = 0;
        }
        else if (newX === -1) {
            newX = numCols - 1;
        }
        if (newY === numRows) {
            newY = 0;
        }
        else if (newY === -1) {
            newY = numRows - 1;
        }
        if (grid[newY][newX] === 1) {
            count++;
        }
    }
    return count;
}

function refreshCanvas() {
    if (!loop) {
        return;
    }
    count++;
    refreshCount();
    let changes = new Set() // In the form {coords: [1, 0], status: 1}

    for (let row = 0; row < numRows; row++) {
        for (let col = 0; col < numCols; col++) {
            const status = grid[row][col]
            const numAdjacent = getNumAdjacent(row, col)
            if (status === 1) {
                if (numAdjacent < 2 || numAdjacent > 3) {
                    changes.add({coords: [row, col], status: 0})
                }
            }
            else if (status == 0) {
                if (numAdjacent === 3) {
                    changes.add({coords: [row, col], status: 1})
                }
            }
        }
    }
    updateGrid(changes)
}

function refreshCount() {
    let paragraph = document.getElementById("counter");
    paragraph.innerText = `${count} Generations`;
}
