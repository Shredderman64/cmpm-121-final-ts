# Devlog Entry - 11/27/2024
## Important update regarding project tools
11/24/2024 - Redoing project in Typescript with HTML. Alternate platform is now TypeScript with Three.js. Our intended implementation with Unity proved to be too complex for the move to Godot. Morale has taken a hit but we'll forge onward.

## How we satisfied the requirements
## F0.a
Each cell holds information on its relative position within the grid, as well as sun and water levels specific to that cell which are randomized on initialization. 
Functions are provided that enable access to cells based on column and row. 
Player is now a simple object that keeps track of its position in a similar format to the grid cells. 
Player movement is triggered through event listeners on the arrow keys which map to coordinate pairs that are added to the player's position. 
This position is bounded based on the size of the grid itself.

## F0.b
11/25/2024 - Furthermore, time can now be advanced by using the enter key to randomize cells on the grid. This is wrapped in a command that serializes the grid state to allow for undo and redo functionality. The pattern is managed through the same top-level function as player movement.

## F0.c
11/26/2024 - Game now allows players to sow plants on empty cells and reap plants from sowed cells. A click handler on the canvas is used to dispatch reap and sow commands based on the cursor's position and the plant status of the corresponding cell within the grid, which both commands update on execution.

## F0.d
11/24/2024 - As mentioned in F0.a, each grid cell has a sun and water level specific to it. A randomize function is implemented that assigns new values to each level. Sun levels are assigned values within a certain range as before whereas water is randomly incremented or decremented.

## F0.e
11/26/2024 - Plants have two subclasses corresponding to two different kinds of crop. Using the subclass sandbox pattern, these subclasses inherit methods from the base class that check for various growth conditions.

## F0.f
11/26/2024 - The base class also has a grow method that can be overridden to allow for different growing conditions for each distinct crop. To represent their growth, plants keep track of their current stage which gets updated when the right conditions are met.

## F0.g
11/27/2024 - Game now features a win condition, where upon harvesting 20 fully grown crops, a message appears confirming that the player won the game. The win condition also recognizes if the player hits undo, which unchecks the progression towards the win condition and resets the state unless the player has already won the game. This should satisfy the requirements for the specific play scenario for F0.g, and should hopefully be the last of the F0 and F1 requirements that we need to work on for this iteration.

## F1.a
11/24/2024 - Grid is now represented as an ArrayBuffer of cells, which satisfies the AoS format. 
![F1.a data structure diagram](./f1_a_diagram.png)

## F1.b 
11/25/2024 - Game now has save functionality that allows players to save and load player position and grid state from localStorage. The Grid now has a serialize function that turns its current state into a string and a deserialize function that allows it to revert to a previously serialized state. </br>
11/26/2024 - Plants are stored in a map with their cell coordinates as the key to allow for simplified access and stringification for save and load functionality. 

## F1.c 
11/26/2024 - Game now has implicit autosave. This is achieved by writing to an "autosave" slot every time the scene is changed. When opening a new session, players are prompted if they want to continue where they left off, loading the most recent autosave if they accept.

## F1.d 
11/24/2024 - Player movement is currently wrapped in a command pattern that allows for separate undo and redo functionality. The command pattern is managed through a top-level function that handles input from the player. </br>
11/25/2024 - Commands are now pushed to command stacks to allow players to undo and redo significant actions. This necessitates that commands store previous state through enclosed data structures. </br>
11/26/2024 - As stated above (F1.c 11/26/2024), reaping and sowing are now wrapped in a command pattern to allow either action to be undone. A command manager is now implemented to allow for separate input handlers to pass commands. </br>

## Reflection

Upon turning in F0, our team was pretty disheartened by the assignment's expectations not being met despite us fulfilling the requirements. 
Considering our previous plan of action was considered unsuitable for the scope of the assignment's progression, we opted to work in TypeScript and to transfer over to Three.JS when the time came.
A lot of our time has been focused towards porting our understanding of the code to TypeScript, and essentially having to do both F0 and F1 from scratch.
We also spent some time setting up our Three.JS environment so that we have a comprehensive understanding of the platform and how we plan to adapt our game to it.
Though we have some regrets not understanding the full scope of the assignment and initially starting in Unity, we are very appreciative of the experience and proud of what we were able to accomplish then.
We haven't really focused on evolving our game design because of the time crunch in reimplementing our code, but it's something that we plan to consider when we port over to Three.JS.

# Devlog Entry - 11/14/2024

## Introducing the Team
Issac Kim - Engine Lead </br>
Nolan Jensen - Design Co-Lead </br>
Steven Hernandez - Design Co-Lead </br>
Garrett Yu - Tools Co-Lead </br>
Kellum Inglin - Tools Co-Lead </br>

## Tools and Materials
In regards to the engines we plan on using, we chose Unity as our initial engine based off
the team's relative familiarity with it. We also found that it would be useful to gain additional 
experience in a game engine used typically in modern game development compared to the likes of Phaser.
We were also interested in making the game 3D, which other older game engines may be uncapable of doing,
whereas Unity is one of a few engines that is perfect for that. We plan to use placeholder assets from
within Unity, though we are interested in making our own if possible to add flair to the game.

We intend on using C# as our primary programming language due it being the default language 
in Unity. Unity also features a multitude of scripting opportunities so we intend to use them to
their fullest extent to execute our game. We may need to convert our game objects to JSON, so that
is something we may need to consider as an additional data language to help our process.

For tools, we plan on using VSCode for our IDE with Git version control. Again, these were
chosen largely based on team familiarity alongside their ease of integration with our chosen
engines. Issues regarding merge conflicts would also likely be kept to a minimum since Unity 
is object-based in terms of its coding. We also have one team member who has experience in 3D 
modeling, so we'll likely use the appropriate software needed for that, such as Blender and Substance
Painter.

Our alternative platform that we intend to use is Godot. Our main reason being that the engine is
similar to Unity and is also based in C#. This would allow us to easily transfer our game from one engine
to another when we need to make the switch. In terms of recreating the essential objects required for the
game, the similarities in engines should play to our advantage and hopefully shouldn't deter the process.

## Outlook

One of the outcomes that we expect from this project is that we'll gain more relevant experience
in regards to building and deploying software from scratch, especially since up to this point,
we've mainly been given the appropriate frameworks to begin with. We anticipate the hardest
parts of this project to be time management and communicating clearly on what each of us is
developing.