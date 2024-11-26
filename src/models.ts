interface Cell {
    i: number;
    j: number;
    sun: number;
    water: number;
    sowed: number;
}

export class Grid {
    public readonly GRID_WIDTH = 6;

    private readonly colOffset = 0;
    private readonly rowOffset = 4;
    private readonly sunOffset = 8;
    private readonly waterOffset = 12;
    private readonly sowOffset = 16;
    private readonly cellSize = 20;

    private readonly numCells = this.GRID_WIDTH * this.GRID_WIDTH;
    private grid = new ArrayBuffer(this.cellSize * this.numCells);
    private gridView = new DataView(this.grid);

    constructor() {
        for (let col = 0; col < this.GRID_WIDTH; col++) {
            for (let row = 0; row < this.GRID_WIDTH; row++) {
                const sun = Math.floor(Math.random() * 10);
                const water = Math.floor(Math.random() * 3);
                this.initCell(col, row, sun, water);
            }
        }
    }

    private getCellOffset(i: number, j: number) {
        const index = j * this.GRID_WIDTH + i;
        const cellOffset = index * this.cellSize;
        return cellOffset;
    }

    initCell(i: number, j: number, sun: number, water: number) {
        const cellOffset = this.getCellOffset(i, j);

        this.gridView.setInt32(cellOffset + this.colOffset, i);
        this.gridView.setInt32(cellOffset + this.rowOffset, j);
        this.gridView.setInt32(cellOffset + this.sunOffset, sun);
        this.gridView.setInt32(cellOffset + this.waterOffset, water);
        this.gridView.setInt8(cellOffset + this.sowOffset, 0);
    }

    readCell(col: number, row: number): Cell {
        const cellOffset = this.getCellOffset(col, row);

        const i = this.gridView.getInt32(cellOffset + this.colOffset);
        const j = this.gridView.getInt32(cellOffset + this.rowOffset);
        const sun = this.gridView.getInt32(cellOffset + this.sunOffset);
        const water = this.gridView.getInt32(cellOffset + this.waterOffset);
        const sowed = this.gridView.getInt32(cellOffset + this.sowOffset);

        return { i, j, sun, water, sowed };
    }

    sowCell(col: number, row: number) {
        const cellOffset = this.getCellOffset(col, row);
        const sowBool = this.gridView.getInt32(cellOffset + this.sowOffset);
        if (sowBool == 0)
            this.gridView.setInt32(cellOffset + this.sowOffset, 1);
        else
            this.gridView.setInt32(cellOffset + this.sowOffset, 0);
    }

    randomize() {
        for (let col = 0; col < this.GRID_WIDTH; col++) {
            for (let row = 0; row < this.GRID_WIDTH; row++) {
                const cellOffset = this.getCellOffset(col, row);
                const sun = Math.floor(Math.random() * 10);
                this.gridView.setInt32(cellOffset + this.sunOffset, sun);

                const waterVars: number[] = [-1, -1, 0, 1, 1];
                const waterDelta = waterVars[Math.floor(Math.random() * waterVars.length)];
                let water = this.gridView.getInt32(cellOffset + this.waterOffset) + waterDelta;
                water = Math.min(Math.max(water, 0), 3);
                this.gridView.setInt32(cellOffset + this.waterOffset, water);
            }
        }
    }

    serialize() {
        const gridData = new Uint8Array(this.grid);
        return btoa(String.fromCharCode(...gridData));
    }

    deserialize(serializedGrid: string) {
        const binaryGrid = atob(serializedGrid);
        const gridData = new Uint8Array(binaryGrid.length);
        for (let i = 0; i < binaryGrid.length; i++) {
            gridData[i] = binaryGrid.charCodeAt(i);
        }
        this.grid = gridData.buffer;
        this.gridView = new DataView(gridData.buffer);
    }
}

export class Player {
    constructor(public x: number, public y: number, private xMax: number, private yMax: number) { }

    move(dx: number, dy: number) {
        this.x += dx;
        this.y += dy;
    }

    boundsCheck(dx: number, dy: number) {
        const x = this.x + dx;
        const y = this.y + dy;
        if (x < 0 || this.xMax <= x)
            return false;
        if (y < 0 || this.yMax <= y)
            return false;
        return true;
    }

    isAdjacent(gridX: number, gridY: number) {
        const adjColumn = this.x - 1 <= gridX && gridX <= this.x + 1;
        const adjRow = this.y - 1 <= gridY && gridY <= this.y + 1;

        if (adjColumn && adjRow)
            return true;
    }

    getPosition() {
        return { x: this.x, y: this.y };
    }
}

export class Plant {
    constructor(
        public type: string,  // Example: "flower", "tree", etc.
        public position : { x: number, y: number },
        public growthStage: number = 0,  // Tracks how grown a plant is
        public familyNeighbors: number = 0, // Keeps track of same plants in neighboring cells
        public minSun: number = 0,
        public minWater: number = 0,
    ) { }

    grow(sun: number, water: number) {
        // Logic for plant growth
        const canGrow = this.checkSunAndWater(sun, water);
        if (canGrow) {
            this.growthStage++;
        }
    }

    checkSunAndWater(sun: number, water: number): boolean {
        // Check if the passed values meet minimum conditions
        if (sun < this.minSun) {
            // needs more sun
            return false;
        }
        if (water < this.minWater) {
            // needs more water
            return false;
        }
        return true; // Meets conditions
    }
}