import { CourseDefinition } from './factoryFloorBoards';

// =============================================================================
// OFFICIAL MULTI-BOARD COURSES (from RoboRally manual)
// =============================================================================

export const RISKY_EXCHANGE_COURSE: CourseDefinition = {
    id: 'risky_exchange',
    name: 'Risky Exchange',
    description: 'The official Risky Exchange course with conveyor highway',
    difficulty: 'beginner',
    minPlayers: 2,
    maxPlayers: 8,
    boards: ['risky-exchange-docking-bay', 'exchange-factory-floor']
};

export const BURNOUT_COURSE: CourseDefinition = {
    id: 'burnout',
    name: 'Burnout',
    description: 'Fast-paced course with express conveyors and laser gauntlet',
    difficulty: 'intermediate',
    minPlayers: 2,
    maxPlayers: 8,
    boards: ['burnout-docking-bay', 'burnout-factory-floor']
};

export const HEAVY_TRAFFIC_COURSE: CourseDefinition = {
    id: 'heavy_traffic',
    name: 'Heavy Traffic',
    description: 'Navigate through congested conveyor systems',
    difficulty: 'intermediate',
    minPlayers: 2,
    maxPlayers: 8,
    boards: ['heavy-traffic-docking-bay', 'heavy-traffic-factory-floor']
};

// Export array of official courses
export const OFFICIAL_COURSE_DEFINITIONS: CourseDefinition[] = [
    RISKY_EXCHANGE_COURSE,
    BURNOUT_COURSE,
    HEAVY_TRAFFIC_COURSE
];

// =============================================================================
// COMBINED BOARD COURSES (using the combined board approach)
// =============================================================================

export const BEGINNER_COMBINED_COURSE: CourseDefinition = {
    id: 'beginner_course',
    name: 'Beginner Course',
    description: 'A simple course for new players',
    difficulty: 'beginner',
    minPlayers: 2,
    maxPlayers: 8,
    boards: ['beginner-combined-board']
};

export const INTERMEDIATE_COMBINED_COURSE: CourseDefinition = {
    id: 'intermediate_course',
    name: 'Intermediate Course',
    description: 'A challenging course with conveyor loops',
    difficulty: 'intermediate',
    minPlayers: 2,
    maxPlayers: 8,
    boards: ['intermediate-combined-board']
};

export const ADVANCED_COMBINED_COURSE: CourseDefinition = {
    id: 'advanced_course',
    name: 'Advanced Course',
    description: 'Expert level course with multiple hazards',
    difficulty: 'expert',
    minPlayers: 2,
    maxPlayers: 8,
    boards: ['advanced-combined-board']
};

export const COMBINED_COURSES: CourseDefinition[] = [
    BEGINNER_COMBINED_COURSE,
    INTERMEDIATE_COMBINED_COURSE,
    ADVANCED_COMBINED_COURSE
];

// =============================================================================
// SINGLE BOARD COURSES
// =============================================================================

export const CHECKMATE_COURSE: CourseDefinition = {
    id: 'checkmate',
    name: 'Checkmate',
    description: 'Quick and easy—just like chess. Right?',
    difficulty: 'beginner',
    minPlayers: 2,
    maxPlayers: 8,
    boards: ['checkmate-board']
};

export const DIZZY_DASH_COURSE: CourseDefinition = {
    id: 'dizzy_dash',
    name: 'Dizzy Dash',
    description: 'Whoops, was that the flag over there? Don\'t worry—it\'s still an easy course.',
    difficulty: 'beginner',
    minPlayers: 2,
    maxPlayers: 8,
    boards: ['dizzy-dash-board']
};

export const ISLAND_HOP_COURSE: CourseDefinition = {
    id: 'island_hop',
    name: 'Island Hop',
    description: 'Over the island or around?',
    difficulty: 'intermediate',
    minPlayers: 2,
    maxPlayers: 8,
    boards: ['island-hop-board']
};

export const SINGLE_BOARD_COURSE_DEFINITIONS: CourseDefinition[] = [
    CHECKMATE_COURSE,
    DIZZY_DASH_COURSE,
    ISLAND_HOP_COURSE
];

// =============================================================================
// TEST & LEGACY COURSES
// =============================================================================

export const TEST_COURSE: CourseDefinition = {
    id: 'test',
    name: 'Test Course',
    description: 'Simple test course for development',
    difficulty: 'beginner',
    minPlayers: 2,
    maxPlayers: 8,
    boards: ['test']
};

export const CONVEYOR_LOOP_COURSE: CourseDefinition = {
    id: 'conveyor_loop',
    name: 'Conveyor Loop Test',
    description: 'Test course with complex conveyor patterns',
    difficulty: 'intermediate',
    minPlayers: 2,
    maxPlayers: 8,
    boards: ['conveyor-loop-test']
};

export const LASER_TEST_COURSE: CourseDefinition = {
    id: 'laser_test',
    name: 'Laser Test Arena',
    description: 'A testing ground for laser mechanics',
    difficulty: 'intermediate',
    minPlayers: 2,
    maxPlayers: 8,
    boards: ['laser-arena']
};

export const LEGACY_COURSE_DEFINITIONS: CourseDefinition[] = [
    TEST_COURSE,
    CONVEYOR_LOOP_COURSE,
    LASER_TEST_COURSE
];

// =============================================================================
// ALL COURSES COMBINED
// =============================================================================

export const ALL_COURSE_DEFINITIONS: CourseDefinition[] = [
    ...OFFICIAL_COURSE_DEFINITIONS,  // Official courses first
    ...SINGLE_BOARD_COURSE_DEFINITIONS,
    ...COMBINED_COURSES,
    ...LEGACY_COURSE_DEFINITIONS
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getCourseById(courseId: string): CourseDefinition | undefined {
    return ALL_COURSE_DEFINITIONS.find(course => course.id === courseId);
}

export function getCoursesByDifficulty(difficulty: 'beginner' | 'intermediate' | 'expert'): CourseDefinition[] {
    return ALL_COURSE_DEFINITIONS.filter(course => course.difficulty === difficulty);
}

export function getCoursesForPlayerCount(playerCount: number): CourseDefinition[] {
    return ALL_COURSE_DEFINITIONS.filter(
        course => playerCount >= course.minPlayers && playerCount <= course.maxPlayers
    );
}

// Backward compatibility exports
export const ALL_COURSES = ALL_COURSE_DEFINITIONS;
export const COURSES = ALL_COURSE_DEFINITIONS;