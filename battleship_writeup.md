# Battleship Project Writeup

## Challenges Faced

### 1. Database State Management
The biggest challenge was designing how to store the game board state in MongoDB. Initially, I considered separate fields for "hasShip" and "isHit", but this created complex state combinations. I solved this by using a single state array with four values: ['empty', 'ship', 'hit', 'miss']. It simplified both database storage and game logic, as each cell has exactly one clear state that contains both ship placement and hit status.

### 2. Real-time Game Updates
In my React project, I needed to keep track of the game’s current state and progress. Since the game logic was pretty complex, I ended up going with a light-backend, heavy-frontend setup. The backend just stores the game state, and the frontend handles all the rendering based on that state. This gave me more flexibility on the frontend to display the game progress clearly. To keep things up to date, I implemented polling — the frontend sends a request every second to check for updates, so the user doesn’t have to do anything manually.

## 3. Assumptions
I assumed that all users are using modern browsers, so I did not put much effort into compatibility for older browsers. Additionally, I assumed that the database connection and network are stable, so I did not implement extensive error handling for these aspects.

## 4. Time
I think I spent almost 140 hours to complete. The biggest chunk of time went to actually writing code, but I spent almost as much time researching to figure out how to implement features I'd never built before. Debugging is honestly the most frustrating part, It took up lots of hours way more than I expected, mostly dealing with tricky game state issues and database problems. I also spent time watching tutorials, planning out solutions, rewriting code that didn't work, and getting everything deployed properly. What surprised me most was that actual coding was only about a third of the total time - the rest was learning, problem-solving, and fixing things that broke. 