////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////// HANDLE BOARD /////////////////////////////////////

// Default values
var sizeX = 5; // board size x
var sizeY = 5; // board size y
var A = [[]]; // cost matrix
var start = [0, 0]; // start position
var end = [4, 4]; // end position

// State can be one of follow:
// IDLE, CHOOSE_START, CHOOSE_END, RUNNING, SHOW_RESULT
var state = 'IDLE';

// Create a new board, re-init variables
function newBoard() {
    state = 'IDLE';
    setMessage("New board");

    // Set default start-cell and end-cell
    start = [0, 0];
    end = [sizeY-1, sizeX-1];

    // Re-draw the board
    var boardHtml = ``;
    for (let i = 0; i < sizeY; i++) {
        boardHtml += `<div id=r${i} class="row">`;
        for (let j = 0; j < sizeX; j++) {
            boardHtml += `<div id=${i}-${j} class="cell" onclick="clickCell(${i},${j})">${A[i][j]}</div>`;
        }
        boardHtml += `</div>`;
    }
    document.getElementById("board").innerHTML = boardHtml;

    setMessage("Created a new board");
}

// Find shortest-path
function run() {
    state = 'RUNNING';
    setMessage("Running");
    
    //////////////////////// Dijkstra algorithm //////////////////////////
    // Initialize variables
    var status = {};
    for (let i = 0; i < sizeY; i++) {
        for (let j = 0; j < sizeX; j++) {
            status[[i, j]] = [Infinity, null];
        }
    }

    var history = {};
    status[start] = [A[start[0]][start[1]], null];

    // Main loop
    while (Object.keys(status).length > 0) {
        // Find min node
        let minNode = [null, null];
        let minCost = Infinity;
        for (const [key, [cost, prev]] of Object.entries(status)) {
            [i, j] = key.split(',');
            i = parseInt(i);
            j = parseInt(j);
            if (cost < minCost) {
                minNode = [i, j];
                minCost = cost;
            }
        }

        // Move minNode from status to history
        history[minNode] = status[minNode];
        delete status[minNode];

        // Find all neighbors of min_node which is still in status dict.
        // If cost from min_node to that node < cost of that node, replace it
        for (let node of getNeighbors(minNode)) {
            if (status[node] != undefined) {
                [cost, prev] = status[node];
                if (minCost + A[node[0]][node[1]] < cost) {
                    status[node] = [minCost + A[node[0]][node[1]], minNode];
                }
            }
        }
    }
    //////////////////////// End Dijkstra algorithm //////////////////////////
    
    // Trace the path in history
    [cost, prev] = history[end];
    path = [];
    while (prev != null) {
        path.push(prev);
        [cost, prev] = history[prev];
    }
    path.pop(); // Remove start cell
    
    // Fill yellow color for cells in the path
    for (const [i, j] of path) {
        document.getElementById(`${i}-${j}`).style.backgroundColor = 'yellow';
    }

    state='SHOW_RESULT';
    setMessage("Done, mincost=" + history[end][0]);
}

// Find neighboring cells
function getNeighbors(pos=[0,0]) {
    let y = pos[0];
    let x = pos[1];

    let neighbors = [];
    if (y < sizeY - 1) {
        neighbors.push([y + 1, x]);
    }
    if (y > 0) {
        neighbors.push([y - 1, x]);
    }
    if (x < sizeX - 1) {
        neighbors.push([y, x + 1]);
    } 
    if (x > 0) {
        neighbors.push([y, x - 1]);
    }
    return neighbors;
}

function chooseStartCell() {
    state = "CHOOSE_START";
    setMessage("Let choose a start cell");
}

function chooseEndCell() {
    state = "CHOOSE_END";
    setMessage("Let choose a end cell");
}

function setMessage(message) {
    document.getElementById("message").innerHTML = message;
}

function clickCell(i, j) {
    if (state == "CHOOSE_START") {
        start = [i, j];
        document.getElementById(`${i}-${j}`).style.backgroundColor = 'green';
        setMessage("");
    } else if (state == "CHOOSE_END") {
        end = [i, j];
        document.getElementById(`${i}-${j}`).style.backgroundColor = 'red';
        setMessage("");
    }

    state = 'IDLE';
}

////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////// HANDLE IMAGE /////////////////////////////////////

var src; // small image

// Image and button
let imgElement = document.getElementById("imageSrc")
let inputElement = document.getElementById("fileInput");
inputElement.addEventListener("change", (e) => {
    imgElement.src = URL.createObjectURL(e.target.files[0]);
}, false);

// Open image event
imgElement.onload = reload;

function reload() {
    // Read image from element
    let src = cv.imread(imgElement, cv.IMREAD_GRAYSCALE);
    // Convert image to grayscale
    cv.cvtColor(src, src, cv.COLOR_RGB2GRAY);
    
    // Because image is too large, we need to resize it to a small image
    sizeX = parseInt(document.getElementById('board-size-x').value);
    sizeY = parseInt(document.getElementById('board-size-y').value);

    console.log(sizeX, sizeY);

    cv.resize(src, src, {width : sizeX, height : sizeY});
    // Display small image
    cv.imshow('outputCanvas', src);
    
    // Extract pixel values
    A = [] // clean A
    let width = src.size().width;
    let height = src.size().height;

    for (let i = 0; i < height; i++) {
        let a = [];
        for (let j = 0; j < width; j++) {
            a.push(src.ucharAt(i, j));
        }
        A.push(a);
    }
    
    // Draw board
    newBoard();
}

////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////// OTHER FUNCTIONS //////////////////////////////////

// Show or Hide background
function showBackground() {
    for (let i = 0; i < A.length; i++) {
        for (let j = 0; j < A[0].length; j++) {
            let cell = document.getElementById(`${i}-${j}`);
            cell.style.backgroundColor = getGrayColor(parseInt(cell.innerText));
        }
    }
}

function getGrayColor(value) {
    hex = value.toString(16);
    return `#${hex}${hex}${hex}`;
}

function hideBackground() {
    for (let i = 0; i < A.length; i++) {
        for (let j = 0; j < A[0].length; j++) {
            let cell = document.getElementById(`${i}-${j}`);
            cell.style.backgroundColor = '#FFF';
        }
    }
}

// Update cell size
function updateCellSize() {
    let inputSize = document.getElementById('cell-size').value;

    let cells = document.getElementsByClassName('cell');
    for (let i = 0; i < cells.length; i++) {
        cells[i].style.width = `${inputSize}px`;
        cells[i].style.height = `${inputSize}px`;
        cells[i].style.lineHeight = `${inputSize}px`;
    }
}