## Backlog
* detect when someone has won the race
* draw 2 arrows for an express conveyor belt
* when a robot shoots another robot, say "<player 1> shot by <player 2>" in the ExecutionLog
* draw a momentary red line when robot lasers fire
* add a "reset" button to clear the programmed registers
* draw a red line for board lasers
* walls
* conveyor belts
* express conveyor belts
* pushers
* wrenches
* hammers
* starting space mini boards
* ability to select board when starting game
* risky exchange board
* Prevent further changes after timer expires
* When timer hits 0, randomly fill empty registers
* show all players cards for the current register / incremental card reveal
* reduce the padding around the board to make better use of the space
* make the robot arrow black instead of white when the robot color is light
* move the legend to a separate component
* ability to unsubmit
* change the card colors - needs some thought - e.g. I don't like red for U-Turn
    * add an up arrow to the move cards - make it big and lay the number over it in a circle like it is
    * make the back up arrow the same as the move cards, just pointing down instead of up
    * make the move 2 card a slightly darker shade of blue, and the move 3 slightly darker than the move 3
    * make the U-Turn the same color as the other turns
    * orient the U-Turn arrow like an upside-down U
    * make the turn left and turn right cards thicker and rounded arrows
* get the execution log turn separator to work (tried to get this working but the roundNumber logic still doesn't work; not sure we really need this anyway, so putting it on hold)
* make the screen layout adapt correctly to different window sizes and zoom level
* improve the game page layout
* delete the code for the game start modal (unless we think of a reason to reinstate it; board selection needs to be either here or on the game screen)

## In Progress
  
## Done
* robots pushing each other
* during the execution phase move each robot one at a time
* remove the Game Board title
* execution log
    * displays key log messages (player executes card, executing board elements, player takes damage)
    * set a fixed height and add a scrollbar so that it aligns with the bottom of the game board
    * fix it so the player's name is displayed instead of "Player" for card execution
    * remove the word "executes" from those messages (superfluous)
    * log when a player submits their cards
* remove the legend from the game board (maybe re-add it later, parhaps in a popup or toggleable)
* don't show the current executing instruction in the 
* improve the game page layout
    * eliminate the box around the board
    * reduce the padding around the board
    * get rid of the Game Controls box
* board lasers
* robot lasers
* make the start game button go directly to the game
* show in ExecutionLog when a robot is moved by a conveyor belt
* make the conveyors move robots in the same direction they're visually pointing
* conveyor belt movement not reflected on the board promptly
