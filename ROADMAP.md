# Tactico Project Roadmap

> **Version**: 1.0.0  
> **Last Updated**: June 2025  
> **Status**: Active Development

---

##  Overview

Tactico is a revolutionary football manager game combining the depth of Football Manager with physics-based match simulation. This roadmap outlines the strategic vision, key milestones, and delivery timeline for building the world's first physics-based football management experience.

**Current State**: Foundation phase with monorepo structure, core packages (simulation-engine, world-engine, transfer-engine), and basic frontend/backend in place.

---

##  Vision & Goals

### Core Philosophy
-  **You're the Manager, Not Just a Spectator**: Every decision matters
-  **Physics-Based, Not Just Animated**: Real collisions, ball physics, and player interactions
-  **AI That Thinks Like a Real Manager**: Adaptive opponents that learn and evolve
-  **A Living, Breathing Football World**: Dynamic leagues, economies, and player careers
-  **Massive Scale**: 100+ leagues, 50,000+ real players, procedural youth talents

### Unique Selling Points
1. **First Physics-Based Football Manager** - Matter.js + PixiJS for realistic 2D matches
2. **Adaptive AI Opponents** - Learn your playstyle and counter it
3. **Living World Simulation** - Dynamic leagues, sackings, retirements
4. **Progressive Web App** - Installable on any device, offline play
5. **No Pay-to-Win** - One-time purchase or free with ads

---

##  Roadmap Phases

###  Phase 0: Project Setup (COMPLETED )

**Duration**: Weeks 1-2  
**Status**:  COMPLETE  
**Objective**: Establish project foundation and architecture

#### Milestones Achieved
- [x] Monorepo structure (Turborepo + pnpm)
- [x] Package architecture (frontend, backend, shared, database, simulation-engine, world-engine, transfer-engine, auth)
- [x] Technology stack selection (Next.js, PixiJS, Matter.js, Turso, Socket.io)
- [x] Initial documentation (README, DATA_ARCHITECTURE, blueprint)
- [x] Bzzoiro API integration planning
- [x] Turso database schema design
- [x] Sync scripts for data population

#### Deliverables
- Repository structure
- Package.json configurations
- TypeScript setup
- Initial documentation

---

###  Phase 1: Foundation - "The Skeleton" (IN PROGRESS)

**Duration**: Weeks 3-8  
**Status**:  IN PROGRESS (Est. 60% Complete)  
**Objective**: Build the core infrastructure and basic UI

#### Key Milestones

##### M1.1: Data Pipeline & Database
- [x] Turso schema implementation
- [x] Bzzoiro API proxy endpoint (`/api/football`)
- [ ] Full sync script optimization (currently ~3-5 hours for full sync)
- [ ] Caching layer for Bzzoiro responses (24h TTL)
- [ ] Rate limiting with exponential backoff
- [ ] Data validation and error handling
- [ ] **Milestone Deliverable**: Production-ready data pipeline

##### M1.2: Authentication & User Management
- [ ] NextAuth.js configuration (email + OAuth providers)
- [ ] User schema in Turso
- [ ] Session management
- [ ] Profile system (manager name, preferred club, etc.)
- [ ] **Milestone Deliverable**: Users can sign up, log in, and manage profiles

##### M1.3: Basic UI Framework
- [ ] Design system with Tailwind CSS + shadcn/ui
- [ ] Responsive layout system
- [ ] Navigation structure
- [ ] Club dashboard skeleton
- [ ] Player/transfer market UI skeleton
- [ ] **Milestone Deliverable**: Navigable UI with placeholder data

##### M1.4: Static 2D Pitch Renderer
- [ ] PixiJS integration and configuration
- [ ] Basic pitch rendering (grass, lines, markings)
- [ ] Player sprites and positioning
- [ ] Team kits and colors
- [ ] Camera controls (zoom, pan)
- [ ] **Milestone Deliverable**: Visual pitch with static player positions

##### M1.5: Core State Management
- [ ] Zustand store setup
- [ ] Game state types and interfaces
- [ ] Career save/load system
- [ ] Per-career data snapshot mechanism
- [ ] **Milestone Deliverable**: State management foundation

#### Phase 1 Success Criteria
- [ ] Users can view clubs and players from real data
- [ ] Basic navigation works across the app
- [ ] Static pitch renders correctly
- [ ] Authentication flow is functional
- [ ] Data sync works reliably

#### Phase 1 Deliverables
- Playable prototype with real football data
- Functional authentication
- Static 2D pitch visualization
- Basic club and player viewing

---

###  Phase 2: Core Gameplay - "The Manager Experience"

**Duration**: Weeks 9-16  
**Status**:  NOT STARTED  
**Objective**: Implement the core management simulation

#### Key Milestones

##### M2.1: Club Management System
- [ ] Club selection at career start
- [ ] Squad management (view, sort, filter players)
- [ ] Team sheet and formations editor
- [ ] Drag-and-drop formation builder
- [ ] Player roles and instructions
- [ ] **Milestone Deliverable**: Full squad management interface

##### M2.2: Transfer Market
- [ ] Transfer engine integration
- [ ] Player search and filtering
- [ ] Transfer negotiations (bid, counter-bid, acceptance)
- [ ] Contract negotiations (wage, length, bonuses)
- [ ] Transfer budget management
- [ ] Loan system
- [ ] **Milestone Deliverable**: Functional transfer market with AI negotiation

##### M2.3: Match Simulation (Non-Physics)
- [ ] Fixture generation algorithm
- [ ] Text-based match simulation
- [ ] Match results and statistics
- [ ] League standings computation
- [ ] Cup competitions
- [ ] **Milestone Deliverable**: Text-based matches with results and standings

##### M2.4: AI Opponents (Static)
- [ ] AI manager personalities (attacking, defensive, possession, counter-attacking, balanced)
- [ ] Fixed playstyles (no adaptation yet)
- [ ] AI team selection logic
- [ ] AI transfer behavior
- [ ] **Milestone Deliverable**: AI opponents with distinct playstyles

##### M2.5: Career Mode Foundation
- [ ] Career start flow (club selection, start date)
- [ ] Season progression system
- [ ] Promotion/relegation logic
- [ ] Board expectations system
- [ ] Sacking system
- [ ] Save/load career functionality
- [ ] **Milestone Deliverable**: Playable career mode with progression

##### M2.6: Finances & Contracts
- [ ] Club finances system (balance, wage budget, transfer budget)
- [ ] Revenue streams (ticket sales, sponsorships, TV money)
- [ ] Expenses (wages, bonuses, facilities)
- [ ] Contract expiration and renewal
- [ ] **Milestone Deliverable**: Working financial system

#### Phase 2 Success Criteria
- [ ] Users can start a career at any club
- [ ] Users can buy/sell players
- [ ] Users can set tactics and manage their squad
- [ ] Text-based matches simulate with results
- [ ] League standings update correctly
- [ ] AI opponents provide reasonable competition
- [ ] Financial system affects gameplay

#### Phase 2 Deliverables
- Fully playable manager simulation (without physics)
- Deep management features
- Functional career mode
- AI opponents with static behaviors

---

###  Phase 3: Physics & Immersion - "The Revolution"

**Duration**: Weeks 17-24  
**Status**:  NOT STARTED  
**Objective**: Implement the physics-based match engine and dynamic AI

#### Key Milestones

##### M3.1: Physics Engine Integration
- [ ] Matter.js configuration and optimization
- [ ] Player body physics (collision, mass, friction)
- [ ] Ball physics (friction, spin, air resistance, bounce)
- [ ] Player-ball interactions (kicking, heading, trapping)
- [ ] Player-player collisions (tackles, shoulder barges)
- [ ] **Milestone Deliverable**: Basic physics interactions working

##### M3.2: Player Movement & Controls
- [ ] Player movement system (walk, jog, sprint)
- [ ] Stamina system with fatigue effects
- [ ] Directional controls
- [ ] Player acceleration/deceleration curves
- [ ] **Milestone Deliverable**: Players move realistically with stamina

##### M3.3: Match Actions
- [ ] Passing system (short, long, through balls)
- [ ] Shooting system (power, accuracy, technique)
- [ ] Tackling system (slide, standing, timing)
- [ ] Dribbling system (ball control, agility)
- [ ] Goalkeeping system (saves, distributions)
- [ ] **Milestone Deliverable**: All core match actions implemented

##### M3.4: Live Match Experience
- [ ] Real-time 2D match rendering
- [ ] User vs. AI match controls
- [ ] Pause and adjust tactics mid-match
- [ ] Match speed controls
- [ ] Camera angles (tactical, TV-style, first-person)
- [ ] **Milestone Deliverable**: Playable live matches with physics

##### M3.5: Dynamic AI (Adaptive)
- [ ] AI playstyle adaptation based on user behavior
- [ ] AI learns from previous matches
- [ ] AI exploits user weaknesses
- [ ] AI personality modulation based on match state
- [ ] **Milestone Deliverable**: AI that adapts to user playstyle

##### M3.6: Visual Polish
- [ ] Smooth animations (running, tackling, shooting, celebrating)
- [ ] Particle effects (dust, grass, rain)
- [ ] Replay system (goals, saves, fouls)
- [ ] Slow-motion replays
- [ ] Multiple camera angles
- [ ] **Milestone Deliverable**: Visually polished match experience

##### M3.7: Match Events & Statistics
- [ ] Event detection (goals, assists, tackles, fouls)
- [ ] Real-time statistics tracking
- [ ] Match highlights generation
- [ ] Player ratings calculation
- [ ] **Milestone Deliverable**: Comprehensive match analytics

#### Phase 3 Success Criteria
- [ ] Physics-based matches are playable and fun
- [ ] Players interact realistically
- [ ] AI adapts to user's playstyle
- [ ] Matches have visual polish
- [ ] Statistics and events are tracked accurately

#### Phase 3 Deliverables
- World's first physics-based football manager game
- Dynamic, adaptive AI opponents
- Visually impressive 2D matches
- Comprehensive match analytics

---

###  Phase 4: Polish & Scale - "The Masterpiece"

**Duration**: Weeks 25-32  
**Status**:  NOT STARTED  
**Objective**: Add advanced features, optimize performance, and prepare for launch

#### Key Milestones

##### M4.1: Offline PWA Capabilities
- [ ] Workbox configuration for caching
- [ ] Offline match simulation
- [ ] Data synchronization when coming online
- [ ] Push notifications (match results, transfer offers)
- [ ] Install prompt and app manifest
- [ ] **Milestone Deliverable**: Fully functional PWA

##### M4.2: Advanced Game Features
- [ ] Weather effects (rain, wind, snow)
- [ ] Pitch condition system (affects ball behavior)
- [ ] Set piece control (free kicks, penalties, corners)
- [ ] Manual set piece aiming
- [ ] Player traits system (weak foot, flair, work rate)
- [ ] **Milestone Deliverable**: Enhanced realism and control

##### M4.3: Media & Fan Interaction
- [ ] Press conference system
- [ ] Player morale system
- [ ] Fan mood tracking
- [ ] Social media reactions
- [ ] News feed system
- [ ] **Milestone Deliverable**: Immersive world interaction

##### M4.4: World Engine Enhancements
- [ ] Youth intake system (procedural generation)
- [ ] Player development and aging
- [ ] Retirement system
- [ ] AI manager sackings and hirings
- [ ] Dynamic league reputation
- [ ] **Milestone Deliverable**: Living, breathing football world

##### M4.5: Performance Optimization
- [ ] Physics optimization (disable off-screen calculations)
- [ ] Rendering optimization (object pooling, culling)
- [ ] Database query optimization
- [ ] Memory management
- [ ] Load testing (10,000+ concurrent users)
- [ ] **Milestone Deliverable**: Optimized for scale

##### M4.6: Multiplayer-Ready Architecture
- [ ] WebSocket infrastructure for real-time multiplayer
- [ ] Matchmaking system
- [ ] Asynchronous multiplayer architecture
- [ ] Live multiplayer match system
- [ ] Custom league creation
- [ ] **Milestone Deliverable**: Architecture for future PvP

##### M4.7: Testing & Quality Assurance
- [ ] Comprehensive unit tests
- [ ] Integration tests
- [ ] End-to-end tests
- [ ] Performance benchmarks
- [ ] Security audit
- [ ] **Milestone Deliverable**: Production-ready quality

#### Phase 4 Success Criteria
- [ ] App works offline and syncs when online
- [ ] Advanced features enhance gameplay
- [ ] Performance is optimized for scale
- [ ] Multiplayer architecture is in place
- [ ] All tests pass
- [ ] Security is production-ready

#### Phase 4 Deliverables
- Polished, production-ready football manager game
- All advanced features implemented
- Optimized for performance and scale
- Multiplayer-ready architecture

---

###  Phase 5: Launch & Beyond - "The Legacy"

**Duration**: Weeks 33+  
**Status**:  NOT STARTED  
**Objective**: Launch, iterate, and expand

#### Key Milestones

##### M5.1: Beta Testing
- [ ] Closed beta with select testers
- [ ] Bug fixing and polish
- [ ] Performance monitoring
- [ ] User feedback collection
- [ ] **Milestone Deliverable**: Stable beta release

##### M5.2: Public Launch
- [ ] Marketing campaign
- [ ] App store submissions (PWA)
- [ ] Launch day support
- [ ] Community building
- [ ] **Milestone Deliverable**: Public launch

##### M5.3: Post-Launch Features
- [ ] Mobile app (React Native)
- [ ] Desktop app (Tauri)
- [ ] Multiplayer leagues
- [ ] Custom tournaments
- [ ] Editor mode (create custom players, teams, leagues)
- [ ] **Milestone Deliverable**: Expanded platform support

##### M5.4: Content Updates
- [ ] Regular data updates (transfers, new seasons)
- [ ] New leagues and competitions
- [ ] Historical data (play as manager in past seasons)
- [ ] **Milestone Deliverable**: Continuous content refresh

##### M5.5: Community Features
- [ ] Online leaderboards
- [ ] Achievements system
- [ ] Sharing features (squads, tactics, achievements)
- [ ] Modding support
- [ ] **Milestone Deliverable**: Engaged community

---

##  Detailed Timeline

### 2025 Timeline

#### Q2 2025 (April - June)
-  **April**: Phase 0 completion, Phase 1 kickoff
-  **May**: Phase 1 development (Data pipeline, auth, UI framework)
-  **June**: Phase 1 completion, Phase 2 kickoff

#### Q3 2025 (July - September)
-  **July**: Phase 2 development (Club management, transfers)
-  **August**: Phase 2 completion, Phase 3 kickoff
-  **September**: Phase 3 development (Physics engine, live matches)

#### Q4 2025 (October - December)
-  **October**: Phase 3 completion, Phase 4 kickoff
-  **November**: Phase 4 development (PWA, advanced features)
-  **December**: Phase 4 completion, Beta testing

#### Q1 2026 (January - March)
-  **January**: Beta testing and polish
-  **February**: Final preparations
-  **March**: Public launch

---

##  Package Development Priority

### High Priority (Phase 1-2)
1. **database** - Turso schema, migrations, seeding
2. **shared** - Types, utilities, constants
3. **auth** - Authentication and user management
4. **world-engine** - World simulation (leagues, seasons, progression)
5. **transfer-engine** - Transfer market and negotiations
6. **simulation-engine** - Match simulation (text-based initially)

### Medium Priority (Phase 3)
1. **simulation-engine** - Physics-based match simulation
2. **frontend** - Match renderer, UI components
3. **backend** - API routes, Socket.io integration

### Lower Priority (Phase 4-5)
1. Multiplayer infrastructure
2. Advanced AI systems
3. Mobile/desktop ports

---

##  Technical Dependencies

### External Services
- **Bzzoiro API** - Football data provider (leagues, teams, players)
- **Turso** - Database hosting (SQLite at the edge)
- **Render** - Hosting (frontend, backend)
- **GitHub** - Version control and CI/CD

### Key Libraries
- **Frontend**: Next.js, PixiJS, Matter.js, Tailwind CSS, shadcn/ui, Zustand
- **Backend**: Next.js API Routes, Socket.io, NextAuth.js
- **Build**: Turborepo, pnpm, TypeScript
- **PWA**: Workbox, Service Worker

---

##  Risk Assessment

### High Risk Items
1. **Bzzoiro API Rate Limiting** - Need robust caching and backoff
2. **Physics Performance** - Matter.js optimization for large-scale matches
3. **Data Sync Time** - Full sync takes 3-5 hours, need incremental improvements
4. **AI Complexity** - Adaptive AI may be computationally expensive

### Mitigation Strategies
1. Implement aggressive caching for Bzzoiro API
2. Use physics optimization techniques (sleeping bodies, broad-phase collision)
3. Break sync into smaller, parallelizable chunks
4. Start with simpler AI and iterate

---

##  Success Metrics

### Technical Metrics
- **Performance**: 60 FPS match rendering
- **Load Time**: < 2 seconds for initial page load
- **Data Sync**: < 1 hour for full sync (optimized from 3-5 hours)
- **Concurrent Users**: Support 10,000+ simultaneous users

### User Metrics
- **Retention**: 50%+ day 7 retention
- **Session Length**: Average 30+ minutes per session
- **Completion Rate**: 70%+ of users complete first season
- **Rating**: 4.5+ stars on app stores

### Business Metrics
- **MAU**: 100,000+ monthly active users (first year)
- **Revenue**: Sustainable through one-time purchases
- **Community**: 10,000+ Discord members

---

##  Team & Resources

### Current Team
- **Lead Developer**: Heisdawrld (Full-stack, architecture, core systems)

### Required Resources
- **Frontend Developer**: UI/UX, PixiJS, animations
- **Backend Developer**: API, Socket.io, database optimization
- **Game Designer**: Balance, mechanics, progression systems
- **QA Tester**: Testing, bug reporting, quality assurance
- **Community Manager**: User support, feedback collection

### Budget Estimates
- **Hosting**: ~$50-100/month (Render + Turso)
- **API Costs**: ~$0-50/month (Bzzoiro API)
- **Development**: Varies based on team size
- **Marketing**: ~$1,000-5,000 for launch campaign

---

##  Next Steps

### Immediate (Next 2 Weeks)
1. Complete Phase 1 milestones
2. Begin Phase 2 development
3. Set up CI/CD pipeline
4. Implement comprehensive testing

### Short-term (Next Month)
1. Finish data pipeline optimization
2. Complete authentication system
3. Build basic UI framework
4. Implement static pitch renderer

### Medium-term (Next 3 Months)
1. Complete Phase 2 (Core Gameplay)
2. Begin Phase 3 (Physics Engine)
3. Start beta testing with internal team

---

##  Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | June 2025 | Initial roadmap creation |

---

##  Appendix

### Glossary
- **Bzzoiro API**: Football data provider for real-world data
- **Turso**: SQLite database at the edge
- **PixiJS**: WebGL renderer for 2D graphics
- **Matter.js**: Physics engine for 2D collisions
- **PWA**: Progressive Web App (installable web application)
- **Monorepo**: Single repository with multiple packages

### Related Documents
- [README.md](./README.md) - Project overview and setup
- [DATA_ARCHITECTURE.md](./DATA_ARCHITECTURE.md) - Data model and sync strategy
- [blueprint](./blueprint) - Original vision and feature list

### Contacts
- **Project Lead**: Heisdawrld
- **Repository**: https://github.com/Heisdawrld/Tactico

---

> **Note**: This roadmap is a living document and will be updated regularly as the project progresses. Milestones and timelines may shift based on priorities, dependencies, and resource availability.
