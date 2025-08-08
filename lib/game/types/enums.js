const Direction = {
    UP: 0,
    RIGHT: 1,
    DOWN: 2,
    LEFT: 3
};

const TileType = {
    EMPTY: 'empty',
    PIT: 'pit',
    REPAIR: 'repair',
    OPTION: 'option',
    CONVEYOR: 'conveyor',
    EXPRESS_CONVEYOR: 'express',
    GEAR_CW: 'gear_cw',
    GEAR_CCW: 'gear_ccw',
    PUSHER: 'pusher'
};

module.exports = {
    Direction,
    TileType
};