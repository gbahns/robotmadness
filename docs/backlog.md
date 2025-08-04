## Backlog
* lasers
* walls
* conveyor belts
* express conveyor belts
* pushers
* wrenches
* hammers
* starting space mini boards
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

## In Progress
* execution log
    * set a fixed height and add a scrollbar so that it aligns with the bottom of the game board
    * fix it so the player's name is displayed instead of "Player" for card execution
    * remove the word "executes" from those messages (superfluous)

## Done
* robots pushing each other
* during the execution phase move each robot one at a time
* remove the Game Board title
* execution log
    * displays key log messages (player executes card, executing board elements, player takes damage)
