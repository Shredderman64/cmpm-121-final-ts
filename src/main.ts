import { Grid } from "./models.ts";
import { Player } from "./models.ts";
import { Plant } from "./models.ts";

interface Command {
    execute(): void;
    undo(): void;
}

interface Save {
    playerPos: { x: number, y: number };
    gridState: string;
    plantMap: [string, Plant][];
    inGameTime: number;
    timestamp: string;
}

const grid = new Grid();
const playerCharacter = new Player(0, 0, grid.GRID_WIDTH, grid.GRID_WIDTH);

const undoStack: Command[] = [];
const redoStack: Command[] = [];

const plants = new Map<string, Plant>();
let currentPlantType = "🌽";
let currentDay = 0;
let reapFull = 0;

function createMoveCommand(player: Player, dx: number, dy: number): Command | null {
    const data = { before_dx: 0, before_dy: 0 };
    if (player.boundsCheck(dx, dy)) {
        return {
            execute() {
                player.move(dx, dy)
                data.before_dx = -dx;
                data.before_dy = -dy;
            },
            undo() {
                player.move(data.before_dx, data.before_dy);
            }
        }
    }
    return null;
}

function createTurnCommand(grid: Grid): Command {
    const data = {
        before_grid: grid.serialize(),
        after_grid: "",
        growthMap: new Map<string, number>()
    }
    return {
        execute() {
            if (!data.after_grid) {
                grid.randomize();
                data.after_grid = grid.serialize();
            } else {
                grid.deserialize(data.after_grid);
            }
            for (const [key, plant] of plants) {
                data.growthMap.set(key, plant.growthStage);
                plant.grow(grid.getSunAt(plant.x, plant.y), grid.getWaterAt(plant.x, plant.y), plants);
            }
        },
        undo() {
            grid.deserialize(data.before_grid);
            for (const [key, plant] of plants) {
                plant.growthStage = data.growthMap.get(key)!;
            }
        }
    }
}

function createSowCommand(x: number, y: number): Command {
    const data = { plant: Plant.switchPlant(currentPlantType, x, y, 0) }
    return {
        execute() {
            plants.set(`${x}${y}`, data.plant);
            grid.sowCell(x, y);
        },
        undo() {
            plants.delete(`${x}${y}`);
            grid.sowCell(x, y);
        }
    }
}

function createReapCommand(x: number, y: number): Command {
    const data = { plant: plants.get(`${x}${y}`)! }
    return {
        execute() {
            plants.delete(`${x}${y}`);
            grid.sowCell(x, y);
            advanceScenario(data.plant);
        },
        undo() {
            plants.set(`${x}${y}`, data.plant);
            grid.sowCell(x, y);
            revertScenario(data.plant);
        }
    }
}

function advanceScenario(plant: Plant) {
    if (plant.growthStage == 3)
        reapFull++;
}

function revertScenario(plant: Plant) {
    if (plant.growthStage == 3)
        reapFull--;
}

function handleKeyboardInput(key: string) {
    redoStack.splice(0, redoStack.length);

    const inputMap: Record<string, Command> = {
        "ArrowLeft": createMoveCommand(playerCharacter, -1, 0)!,
        "ArrowRight": createMoveCommand(playerCharacter, 1, 0)!,
        "ArrowUp": createMoveCommand(playerCharacter, 0, -1)!,
        "ArrowDown": createMoveCommand(playerCharacter, 0, 1)!,
        "Enter": createTurnCommand(grid),
    };

    const command = inputMap[key];
    manageCommand(command);
}

function farmTheLand(x: number, y: number) {
    redoStack.splice(0, redoStack.length);

    if (playerCharacter.isAdjacent(x, y)) {
        if (!grid.readCell(x, y).sowed)
            manageCommand(createSowCommand(x, y));
        else
            manageCommand(createReapCommand(x, y));
    }
}

function manageCommand(command: Command) {
    if (command) {
        undoStack.push(command);
        command.execute();
        notify("scene-changed");
    }
}

function Undo() {
    if (undoStack.length > 0) {
        const command = undoStack.pop()!;
        command.undo();
        redoStack.push(command);
        notify("scene-changed");
    }
}

function Redo() {
    if (redoStack.length > 0) {
        const command = redoStack.pop()!;
        command.execute();
        undoStack.push(command);
        notify("scene-changed");
    }
}

function createSave(key: string) {
    const saveFile: Save = {
        playerPos: { x: playerCharacter.x, y: playerCharacter.y },
        gridState: grid.serialize(),
        plantMap: Array.from(plants.entries()),
        inGameTime: currentDay,
        timestamp: new Date().toISOString(),
    };

    const saveData = JSON.stringify(saveFile);
    localStorage.setItem(key, saveData);
    if (key != "autosave")
        console.log(`Game saved under ${key}`);
}

function copyDataFromFile(saveFile: Save) {
    playerCharacter.x = saveFile.playerPos.x;
    playerCharacter.y = saveFile.playerPos.y;
    grid.deserialize(saveFile.gridState);

    plants.clear();
    saveFile.plantMap.forEach((plant: [string, Plant]) => {
        plants.set(plant[0], Plant.deepCopy(plant[1]));
    });
}

function listSaves() {
    console.log("Saves found:");
    for (let i = 0, len = localStorage.length; i < len; i++) {
        console.log(localStorage.key(i)!);
    }
}

function loadSave(key: string) {
    const saveData = localStorage.getItem(key);
    if (!saveData) {
        console.error(`No save file found under ${key}`);
        return;
    }
    const saveFile: Save = JSON.parse(saveData);

    undoStack.splice(0, undoStack.length);
    redoStack.splice(0, redoStack.length);

    copyDataFromFile(saveFile);

    notify("scene-changed");
    console.log(`Game loaded from save ${key}`);
}

function autosavePrompt() {
    if (localStorage.getItem("autosave")) {
        if (confirm("Would you like to continue where you left off?"))
            loadSave("autosave");
        else
            localStorage.removeItem("autosave");
    }
}

function checkScenarioWin() {
    if (reapFull >= 20)
        return true;
}

type EventName = "scene-changed";
function notify(name: EventName) {
    canvas.dispatchEvent(new Event(name));
}

window.addEventListener("keydown", (e) => {
    handleKeyboardInput(e.key);
})

const canvas = document.createElement("canvas");
canvas.height = canvas.width = 400;
document.body.appendChild(canvas);

const ctx = canvas.getContext("2d")!;
const tileWidth = canvas.width / grid.GRID_WIDTH;

canvas.addEventListener("click", (e) => {
    const mouseX = e.offsetX;
    const mouseY = e.offsetY;

    const gridX = Math.floor(mouseX / tileWidth);
    const gridY = Math.floor(mouseY / tileWidth);

    farmTheLand(gridX, gridY);
})

function drawGrid() {
    ctx.fillStyle = "green";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "black";
    for (let x = 0; x <= grid.GRID_WIDTH; x++) {
        ctx.beginPath();
        ctx.moveTo(x * tileWidth, 0);
        ctx.lineTo(x * tileWidth, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y <= grid.GRID_WIDTH; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * tileWidth);
        ctx.lineTo(canvas.width, y * tileWidth);
        ctx.stroke();
    }
}

function drawPlayer(player: Player) {
    const basePositionX = tileWidth * player.x;
    const basePositionY = tileWidth * player.y;
    const centerOffset = tileWidth / 2 - 10;

    ctx.fillStyle = "black";
    ctx.fillRect(basePositionX + centerOffset, basePositionY + centerOffset, 20, 20);
}

function drawPlants() {
    for (const [key, plant] of plants) {
        const basePositionX = tileWidth * plant.x;
        const basePositionY = tileWidth * plant.y;
        const centerOffset = tileWidth / 4;
        const fontList = [
            "24px monospace",
            "28px monospace",
            "32px monospace",
            "36px monospace"
        ]
        ctx.font = fontList[plant.growthStage];
        ctx.fillText(plant.type, basePositionX + centerOffset, basePositionY + 2.5 * centerOffset);
    }
}

canvas.addEventListener("scene-changed", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    drawPlayer(playerCharacter);
    drawPlants();
    createSave("autosave");

    const winnerNode = document.getElementById("winner");
    if (winnerNode)
        winnerNode.remove();
    if (checkScenarioWin())
        document.body.appendChild(winText);
})

const undoButton = document.createElement("button");
undoButton.innerHTML = "Undo";
undoButton.addEventListener("click", Undo);
document.body.appendChild(undoButton);

const redoButton = document.createElement("button");
redoButton.innerHTML = "Redo";
redoButton.addEventListener("click", Redo)
document.body.appendChild(redoButton);

const saveButton = document.createElement("button");
saveButton.innerHTML = "Save";
saveButton.addEventListener("click", () => {
    const key = prompt("Enter save name")!;
    createSave(key);
})
document.body.appendChild(saveButton);

const loadButton = document.createElement("button");
loadButton.innerHTML = "Load";
loadButton.addEventListener("click", () => {
    listSaves();
    const key = prompt("Enter save name")!;
    loadSave(key);
})
document.body.appendChild(loadButton);

function createPlantButton(icon: string) {
    const plantButton = document.createElement("button");
    plantButton.innerHTML = `${icon}`;
    plantButton.addEventListener("click", () => {
        currentPlantType = icon;
        console.log(currentPlantType);
    })
    return plantButton;
}

const winText = document.createElement("h1");
winText.innerHTML = "You win!"
winText.id = "winner";

document.body.appendChild(createPlantButton("🌽"));
document.body.appendChild(createPlantButton("🫘"));

autosavePrompt();
notify("scene-changed");