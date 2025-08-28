## Backlog
* make the robot arrow black instead of white when the robot color is light
* make the screen layout adapt correctly to different window sizes and zoom level
* reset cards is executing the logic on both the client and the server; only need one
* handle endgame properly (pop up a modal with the game still visible, celebrate the winner, etc)
* reduce the padding around the board to make better use of the space
* improve the card look
    * add an up arrow to the move cards - make it big and lay the number over it in a circle like it is
    * make the back up arrow the same as the move cards, just pointing down instead of up
    * make the move 2 card a slightly darker shade of blue, and the move 3 slightly darker than the move 3
    * make the turn left and turn right cards thicker and rounded arrows
* display the list phases and sub-phases and highlight the active one
* delete the code for the game start modal (unless we think of a reason to reinstate it; board selection needs to be either here or on the game screen)
* add all standard game boards
* make it so robot lasers only fire if there's a robot for them to hit?
* ability for players to register with a username and password for unique identity
* migrate data from legacy RoboRally game
* make the execution delay configurable
* when one robot dies, it's asking other players if they want to enter powered down (couldn't reproduce)
* add "Jump Jets" option card - allows robot to jump over pits when executing Move 2 or Move 3 cards (normally robots fall into any pit they move over)
* email integration for password resets

## Authentication Enhancements (Future)
* Email verification for new signups - prevent fake accounts
* Two-Factor Authentication (2FA) - enhanced security
* Session management UI - view/revoke active sessions
* Password strength requirements - enforce minimum complexity
* Rate limiting on auth endpoints - prevent brute force attacks
* Authentication audit log - track login events for security

## In Progress
* when a player dies they lose ONE option card and they get to pick which one

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
* other players don't see your intent to power down until the cards are submitted.  in the official rules, when one player's decision to power down might be affected by another player's decision, the playwers announce in clockwise order. in our automated implementation we don't need this; each player makes their decision independently.
* display a powered down marker on powered down robots
* wrenches
* add the ability for new player to name themself on the home page
* disable the create game button until the player is named or fix the name yourself dialog to correctly navigate to the new game
* powering down indicator that's visible during execution for the player that's powering down
* powering down indicator on the robot and/or in the player list for other players
* prompt to choose whether to stay powered down should be in GameControls instead of a modal so the player can see the current game status to help them decide
* consolidate getTileAt methods (or clarify why there are multiple different implementations)
* rename BoardPreview to CoursePreview
* tooltips so a player can hover their mouse pointer over a tile and see what's there when a robot is sitting on it
* add the exchange board and risky exchange course
* pushers
* player wins the game if all other robots are dead
* reentering players need to make their power down decision before cards are dealt
* allow players to choose which direction they're facing when reentering
* refine the look of pits
* improve the game page layout
* When timer hits 0, randomly fill empty registers
* when a player submits their cards color their little register indicators green
* when two robots reenter on the same archive marker, the second on picks an adjacent tile on which to reenter
* more distinction between the registers and cards in your hands
* register phases keep executing after a player has won (fixed - stops after current register completes)
* show all players cards for the current register / incremental card reveal while executing
* "Player reached flag n" in green in execution log
* when the game is waiting on a player to make a decision it needs to show other players what they're waiting on
* display robots' archive markers
* somehow make checkpoints and possibly other board elements visible when a robot is sitting on them

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
* don't deal cards to a player who chooses to stay powered down; make them actually stay powered down
* one player announcing power down causes other player's submit button to re-enable (but they're still submitted)
* you should be able to announce power down when you have zero damage - this can be in anticipation of receiving damage in the current turn
* a robot that takes 5+ damage while powered down gets a card from the deck placed randomly into its locked registers
* after dying the player is not presented with the option to enter powered down
* when reentering powered down it's supposed to enter you immediately powered down with zero damage
* after dying and returning powered down, the robot was not healed
* fix problem with dulicate key errors in ExecutionLog and/or remove the id from the log properties
* fix it so resetting your program doesn't affect other players
* when all players are powered down the game gets stuck
* when a robot has lost all of its lives, they're still asked how they want to reenter, dealt cards, etc
* pits aren't killing robots
* when conveyor moves robot into a gear it rotates you as if it thinks its a corner conveyor, then the gear rotates you again
* when you respawn on a flag it repairs damage; it's executing those things in the wrong order; should do repair damage, then respawn destroyed robots
* need to put the timer below the registers so the cards don't jump around when it appears
* in the Power Rankings swap the display name and username
* in the game history show the host's and winner's dispaly name, and when a game is expanded show all the players' display names
