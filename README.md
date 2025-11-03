**Fourfront**
> "Find your connection, or break it."

# Overview

**Fourfront** is a narrative-driven evolution of Connect Four. It combines puzzle strategy, character-based storytelling, and psychological tension into a progression-based campaign.

You play as a human challenger in a world where every match determines your standing in society. As you climb toward **THE CONNECTOR**, a nearly perfect AI, you uncover how connection itself became power—and why imperfection might be the only way to win.

# Gameplay

Core Connect Four rules with unique boss mechanics
- Every boss bends the rules: reversed gravity, hidden pieces, diagonal-only wins, etc.
- Stress carries between matches, affecting tone and dialogue
- Optional skips with tradeoffs: faster progress but less power and understanding
- Multiple endings that reflect how you interact with the system

# World

In this world, Connect Four defines status.
- Winners rise. Losers vanish. The system only recognizes perfection.
- You are an anomaly, unpredictable by the AI that runs everything.
- Your purpose isn’t just to win—it’s to break the cycle that decides human worth.

## Boss Summary
| Name	| Title	| Gimmick	| Board	| Theme |
|-|-|-|-|-|
|Abraham	| The Defeatist	| Standard rules	| 7x6	| Beginner’s Luck |
|Andy | The Doublecrossed	| Diagonal wins	| 7x6 | X'D OUT |
|Thanh	| The National	| Destroys player pieces	| 7x8	| Match Point // Flick Serve |
|Hana	| The Tideturner	| Swaps player pieces	| 7x6	| The Wheel of Fortune (And Fate) |
|Hayden	| The Gambler	| RNG corruption	| 5x5	| All In // Roll Again |
|Ryan	| The Harbinger	| Gravity reversal	| 7x6	| Fatal Exception // Alt F4 |
|Lilian	| The Connector	| Perfect AI	| 7x6	| The End Is At Hand |

> Full configuration is stored in `/data/bosslist.csv`.

## Controls
| Action	| Key |
|-|-|
| Move cursor	| Arrow keys / A, D |
| Drop piece	| Space / Enter |
| Pause	| Esc |
| Skip dialogue	| Z / Enter |
| Inspect board	| Shift |


## Technical Overview
Frontend: TypeScript with Phaser 3
Backend: Java Spring Boot
Database: JSON or SQLite (depending on deployment)
Build Tools: Vite for frontend, Maven for backend

## Project Structure
```.
├── README.md
├── build.gradle.kts
├── gradle
│   └── wrapper
│       ├── gradle-wrapper.jar
│       └── gradle-wrapper.properties
├── gradlew
├── gradlew.bat
├── settings.gradle.kts
└── src
    ├── main
    │   ├── frontend
    │   │   ├── package.json
    │   │   ├── src
    │   │   │   └── main.ts
    │   │   └── tsconfig.json
    │   ├── java
    │   │   └── com
    │   │       └── game
    │   │           └── fourfront
    │   │               ├── Application.java
    │   │               ├── HomeController.java
    │   │               ├── controller
    │   │               │   ├── AIController.java
    │   │               │   └── GameController.java
    │   │               ├── model
    │   │               │   ├── AIPlayer.java
    │   │               │   ├── Board.java
    │   │               │   ├── BoardState.java
    │   │               │   ├── Move.java
    │   │               │   └── MoveResult.java
    │   │               └── service
    │   │                   └── GameService.java
    │   └── resources
    │       ├── application.properties
    │       └── templates
    │           └── home.html
    └── test
        └── java
            └── com
                └── game
                    └── fourfront
                        └── ApplicationTests.java
```

# Art Direction

Overworld uses pixel-style visuals for simplicity and clarity  
Portraits and cinematics use vector or line-drawn art  
Art becomes cleaner and more abstract as the story progresses, symbolizing the loss of humanity and the rise of perfection

# Music
The OST for this game is **Fourfront - The Stars Align**
Each major boss fight features a unique track tied to their theme and personality.

## Track	Context
|||
|-|-|
| Ouroboros // Square One	| Abraham’s opening match | 
| X'D Out // You’re Out	| Andy / Anderson | 
| Match Point // Flick Serve	| Thanh |
| All In // Roll Again	| The Gambler | 
| Fatal Exception // Alt F4	| Ryan |
| The End Is At Hand	| Final battle with Lilian | 
| And Then There Were None	| End credits |

Music mixes glitch, electronic, and ambient styles to match the tone of each fight.

# Installation

## Local setup
1. Clone this repository

### In `/client`:
`npm install`  
`npm run dev`

### In `/server`:
`mvn spring-boot:run`  
Access via `http://localhost:8080`  

Local saves are stored in `placeholder path`.

# Design Notes

Every fight can technically be skipped, but skipping has consequences
> Defeated bosses grant powers, though weaker versions can be found elsewhere
> Finishing without powers is possible but nearly unwinnable
> True completion requires understanding, not just victory

## Development Philosophy

The entire game is designed around the idea that mechanics reflect meaning.
Every rule change, power, and constraint exists to reinforce narrative themes.

> Connected // Four isn’t about mastering Connect Four.
> It’s about questioning the system that demands mastery in the first place.

# License

MIT License
Non-commercial use only
For commercial use or derivative works, contact the developer

# Credits
|||
|-|-|
| Director / Programmer: | [HikarusTenacity] |
| Backend / Systems: | [HikarusTenacity] |
| Music: | [HikarusTenacity] |
| Art / Design: | [HikarusTenacity] |
| Writing: | [HikarusTenacity] |

# Developer Note

You can’t outthink perfection.
But you can break it.
