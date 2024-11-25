import { Grid } from "./models";
import { Player } from "./models";

interface Command {
    execute(): void;
    undo(): void;
}

interface Save {
    playerPos: { x: number, y: number };
    gridState: string;
    timestamp: string;
}

localStorage.clear();

const grid = new Grid();
const playerCharacter = new Player(0, 0, grid.GRID_WIDTH);

const undoStack: Command[] = [];
const redoStack: Command[] = [];

function createMoveCommand(player: Player, dx: number, dy: number) : Command | null {
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

function createTurnCommand(grid: Grid) : Command {
    const data = { before_grid: grid.serialize() }
    return {
        execute() {
            grid.randomize();
        },
        undo() {
            grid.deserialize(data.before_grid);
        }
    }
}

function handleInput(key: string) {
    const inputMap: Record<string, Command> = {
        "ArrowLeft": createMoveCommand(playerCharacter, -1, 0)!,
        "ArrowRight": createMoveCommand(playerCharacter, 1, 0)!,
        "ArrowUp": createMoveCommand(playerCharacter, 0, -1)!,
        "ArrowDown": createMoveCommand(playerCharacter, 0, 1)!,
        "Enter": createTurnCommand(grid),
    };

    const command = inputMap[key];
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
        timestamp: new Date().toISOString(),
    };

    const saveData = JSON.stringify(saveFile);
    localStorage.setItem(key, saveData);
    console.log(`Game saved under ${key}:`, saveFile);
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

    playerCharacter.x = saveFile.playerPos.x;
    playerCharacter.y = saveFile.playerPos.y;
    grid.deserialize(saveFile.gridState);
    notify("scene-changed");
    console.log(`Game loaded from save ${key}`);
}

type EventName = "scene-changed";
function notify(name: EventName) {
    canvas.dispatchEvent(new Event(name));
}

window.addEventListener("keydown", (e) => {
    handleInput(e.key);
})

const canvas = document.createElement("canvas");
canvas.height = canvas.width = 400;
document.body.appendChild(canvas);

const ctx = canvas.getContext("2d")!;
const tileWidth = canvas.width / grid.GRID_WIDTH;

function drawPlayer(player: Player) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const basePositionX = tileWidth * player.x;
    const basePositionY = tileWidth * player.y;
    const centerOffset = tileWidth / 2 - 10;
    ctx.fillRect(basePositionX + centerOffset, basePositionY + centerOffset, 20, 20);
}

canvas.addEventListener("scene-changed", () => {
    drawPlayer(playerCharacter);
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
    const key = prompt("Enter save name")!;
    loadSave(key);
})
document.body.appendChild(loadButton);

notify("scene-changed");