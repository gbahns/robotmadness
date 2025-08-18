## Backlog
* reset cards is executing the logic on both the client and the server; only need one
* prompt to choose whether to stay powered down should be in GameControls instead of a modal so the player can see the current game status to help them decide
* fix problem with dulicate key errors in ExecutionLog and/or remove the id from the log properties
* player wins the game if all other robots are dead
* rename BoardPreview to CoursePreview
* consolidate getTileAt methods (or clarify why there are multiple different implementations)
* when all players are powered down the game gets stuck
* hide the whole registers section and the player's hand when powered down?
* somehow make checkpoints and possibly other board elements visible when a robot is sitting on them
* tooltips so a player can hover their mouse pointer over a tile and see what's there when a robot is sitting on it
* server got stuck resetting or dealing cards for next turn; one robot had 9 damage, might be related to that
* fix it so resetting your program doesn't affect other players
* pushers
* wrenches
* hammers
* handle endgame properly (pop up a modal with the game still visible, celebrate the winner, etc)
* Prevent further changes after timer expires
* When timer hits 0, randomly fill empty registers
* show all players cards for the current register / incremental card reveal
* reduce the padding around the board to make better use of the space
* make the robot arrow black instead of white when the robot color is light
* move the legend to a separate component
* improve the card look
    * add an up arrow to the move cards - make it big and lay the number over it in a circle like it is
    * make the back up arrow the same as the move cards, just pointing down instead of up
    * make the move 2 card a slightly darker shade of blue, and the move 3 slightly darker than the move 3
    * make the turn left and turn right cards thicker and rounded arrows
* make the screen layout adapt correctly to different window sizes and zoom level
* improve the game page layout
* display the list phases and sub-phases and highlight the active one
* delete the code for the game start modal (unless we think of a reason to reinstate it; board selection needs to be either here or on the game screen)
* add the risky exchange board
* add all standard game boards
* make it so robot lasers only fire if there's a robot for them to it?
* ability for players to register with a username and password for unique identity
* migrate data from legacy RoboRally game
* make the execution delay configurable

## In Progress
* you should be able to announce power down when you have zero damage - this can be in anticipation of receiving damage in the current turn
* other players don't see your intent to power down until the cards are submitted.  in the official rules, when one player's decision to power down might be affected by another player's decision, the playwers announce in clockwise order. in our automated implementation we don't need this; each player makes their decision independently.
* display a powered down marker on powered down robots
* powering down indicator that's visibible during execution for the player that's powering down
* powering down indicator on the robot and/or in the player list for other players
* after dying and returning powered down, the robot was not healed
* what's this Stay Powered Down button?

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
* detect when someone has won the race
* draw 2 arrows for an express conveyor belt
* draw a red line for board lasers
* when a robot shoots another robot, say "<player 1> takes <n> damage from <player 2>" in the ExecutionLog
* don't respawn until the end of the turn
* when all robots are dead end the turn
* draw a momentary red line when robot lasers fire
* conveyor belts
* express conveyor belts
* ability to select board when starting game
* add a "reset" button to clear the programmed registers
* ability to unsubmit
* change the card colors - needs some thought - e.g. I don't like red for U-Turn
* make the U-Turn the same color as the other turns
* orient the U-Turn arrow like an upside-down U
* walls
* respawn robots on their archive marker


## Defect Fix History
* damage isn't reducing number of cards dealt
* damage isn't properly locking registers
* when a robot is powered down the game doesn't proceed to execution after all other players have submitted their cards
* after being powered down, the player needs to be prompted whether they want to remain powered down or not.  this needs to happen before cards are dealt
* robots are not supposed to fire when powered down
* hide the reset button when powered down
* when preparing the deck we need to leave out cards that are locked in player registers
* when player elects to stay powered down it asks again
* toggling power down should not reset your registers
* fix conveyors, wrenches, and gears not rendering
* fix it so the robots don't show up on the board in preview mode
* one player resetting their programmed registers should not reset other players programmed registers
* when your damage is cleared locked registers need to be cleared accordingly
