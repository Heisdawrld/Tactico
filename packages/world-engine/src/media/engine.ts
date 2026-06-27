// TACTICO World Engine - Media Engine
// Handles news stories, rumors, interviews, and all media content

import { EntityId, DateString, Player, Club, Manager, Match } from '../core/types';
import {
  MediaStoryType,
  MediaSentiment,
  MediaImportance,
  MediaStory,
  NewsArticle,
  NewsCategory,
  Rumor,
  Interview,
  InterviewQuestion,
  PressConference,
  PressConferenceQuestion,
  MatchReport,
  MatchReportKeyMoment,
  MatchPreview,
  TeamNews,
  HeadToHeadStats,
  AnalysisArticle,
  AnalysisFocus,
  OpinionPiece,
  OpinionArgument,
  TransferNews,
  TransferQuote,
  InjuryUpdate,
  InjuryQuote,
  ContractNews,
  ContractQuote,
  TacticalAnalysis,
  TacticalAnalysisTactic,
  TacticalRecommendation,
  PlayerProfile,
  PlayerProfileEvent,
  PlayerProfileQuote,
  ClubProfile,
  ClubHonour,
  ClubProfilePlayer,
  ClubProfileEvent,
  ManagerProfile,
  ManagerProfileEvent,
  ManagerProfileQuote,
  SeasonReview,
  SeasonReviewStanding,
  SeasonReviewAward,
  SeasonPreview,
  SeasonPreviewStanding,
  MediaSource,
  Journalist,
  SocialMediaAccount,
  SocialMediaPost,
  STORY_TYPE_FREQUENCIES,
  STORY_IMPORTANCE_BY_TYPE,
  STORY_SENTIMENT_DISTRIBUTION,
  NEWS_CATEGORY_FREQUENCIES,
  MATCH_REPORT_KEY_MOMENT_TYPES,
  ANALYSIS_FOCUS_FREQUENCIES,
} from './types';

/**
 * MediaEngine - Generates and manages media content
 * 
 * Handles:
 * - News stories generation
 * - Rumor creation and propagation
 * - Interviews and press conferences
 * - Match reports and previews
 * - Analysis articles
 * - Opinion pieces
 * - Transfer news
 * - Injury updates
 * - Player/club/manager profiles
 * - Season reviews and previews
 * - Media sources and journalists
 * - Social media content
 */
export class MediaEngine {
  private players: Map<EntityId, Player> = new Map();
  private clubs: Map<EntityId, Club> = new Map();
  private managers: Map<EntityId, Manager> = new Map();
  private matches: Map<EntityId, Match> = new Map();
  
  private mediaStories: Map<EntityId, MediaStory> = new Map();
  private newsArticles: Map<EntityId, NewsArticle> = new Map();
  private rumors: Map<EntityId, Rumor> = new Map();
  private interviews: Map<EntityId, Interview> = new Map();
  private pressConferences: Map<EntityId, PressConference> = new Map();
  private matchReports: Map<EntityId, MatchReport> = new Map();
  private matchPreviews: Map<EntityId, MatchPreview> = new Map();
  private analysisArticles: Map<EntityId, AnalysisArticle> = new Map();
  private opinionPieces: Map<EntityId, OpinionPiece> = new Map();
  private transferNews: Map<EntityId, TransferNews> = new Map();
  private injuryUpdates: Map<EntityId, InjuryUpdate> = new Map();
  private contractNews: Map<EntityId, ContractNews> = new Map();
  private tacticalAnalyses: Map<EntityId, TacticalAnalysis> = new Map();
  private playerProfiles: Map<EntityId, PlayerProfile> = new Map();
  private clubProfiles: Map<EntityId, ClubProfile> = new Map();
  private managerProfiles: Map<EntityId, ManagerProfile> = new Map();
  private seasonReviews: Map<EntityId, SeasonReview> = new Map();
  private seasonPreviews: Map<EntityId, SeasonPreview> = new Map();
  
  private mediaSources: Map<EntityId, MediaSource> = new Map();
  private journalists: Map<EntityId, Journalist> = new Map();
  private socialMediaAccounts: Map<EntityId, SocialMediaAccount[]> = new Map();
  private socialMediaPosts: Map<EntityId, SocialMediaPost[]> = new Map();

  /**
   * Initialize the media engine
   */
  initialize(
    players: Player[],
    clubs: Club[],
    managers: Manager[],
    matches: Match[]
  ): void {
    players.forEach(player => this.players.set(player.id, player));
    clubs.forEach(club => this.clubs.set(club.id, club));
    managers.forEach(manager => this.managers.set(manager.id, manager));
    matches.forEach(match => this.matches.set(match.id, match));

    // Initialize default media sources
    this.initializeDefaultMediaSources();
    
    // Initialize default journalists
    this.initializeDefaultJournalists();
  }

  /**
   * Initialize default media sources
   */
  private initializeDefaultMediaSources(): void {
    const defaultSources: MediaSource[] = [
      {
        id: 1,
        name: 'TACTICO News',
        type: 'website',
        country: 'Global',
        language: 'English',
        reputation: 90,
        politicalBias: 0,
        sportsBias: 100,
        clubAffiliation: null,
        foundedYear: 2020,
        website: 'https://tactico.com/news',
      },
      {
        id: 2,
        name: 'Football Daily',
        type: 'newspaper',
        country: 'UK',
        language: 'English',
        reputation: 85,
        politicalBias: 10,
        sportsBias: 95,
        clubAffiliation: null,
        foundedYear: 1990,
        website: 'https://footballdaily.com',
      },
      {
        id: 3,
        name: 'Goal Global',
        type: 'website',
        country: 'Global',
        language: 'English',
        reputation: 80,
        politicalBias: 0,
        sportsBias: 100,
        clubAffiliation: null,
        foundedYear: 2005,
        website: 'https://goal.com',
      },
      {
        id: 4,
        name: 'Transfer Insider',
        type: 'website',
        country: 'Global',
        language: 'English',
        reputation: 75,
        politicalBias: 0,
        sportsBias: 100,
        clubAffiliation: null,
        foundedYear: 2015,
        website: 'https://transferinsider.com',
      },
      {
        id: 5,
        name: 'The Football Analyst',
        type: 'magazine',
        country: 'UK',
        language: 'English',
        reputation: 70,
        politicalBias: -5,
        sportsBias: 90,
        clubAffiliation: null,
        foundedYear: 2010,
        website: 'https://footballanalyst.com',
      },
    ];

    defaultSources.forEach(source => {
      this.mediaSources.set(source.id, source);
    });
  }

  /**
   * Initialize default journalists
   */
  private initializeDefaultJournalists(): void {
    const defaultJournalists: Journalist[] = [
      {
        id: 1,
        name: 'John Smith',
        sourceId: 1,
        specializesIn: ['news', 'match_report', 'analysis'],
        reputation: 85,
        credibility: 90,
        style: 'balanced',
        bias: 0,
        storiesWritten: 500,
        startDate: '2020-01-01',
      },
      {
        id: 2,
        name: 'Sarah Johnson',
        sourceId: 2,
        specializesIn: ['interview', 'press_conference', 'player_profile'],
        reputation: 80,
        credibility: 85,
        style: 'analytical',
        bias: 5,
        storiesWritten: 300,
        startDate: '2018-03-15',
      },
      {
        id: 3,
        name: 'Mike Davis',
        sourceId: 3,
        specializesIn: ['transfer_news', 'rumor', 'contract_news'],
        reputation: 75,
        credibility: 70,
        style: 'sensational',
        bias: -10,
        storiesWritten: 800,
        startDate: '2015-06-20',
      },
      {
        id: 4,
        name: 'Emma Wilson',
        sourceId: 4,
        specializesIn: ['news', 'transfer_news', 'finance'],
        reputation: 70,
        credibility: 75,
        style: 'investigative',
        bias: 0,
        storiesWritten: 200,
        startDate: '2021-09-01',
      },
      {
        id: 5,
        name: 'David Brown',
        sourceId: 5,
        specializesIn: ['analysis', 'tactical_analysis', 'opinion'],
        reputation: 88,
        credibility: 95,
        style: 'analytical',
        bias: 0,
        storiesWritten: 400,
        startDate: '2012-01-10',
      },
    ];

    defaultJournalists.forEach(journalist => {
      this.journalists.set(journalist.id, journalist);
    });
  }

  // ============================================
  // STORY GENERATION METHODS
  // ============================================

  /**
   * Generate media stories for the day
   * @param date Current date
   * @returns Array of generated media stories
   */
  generateDailyStories(date: DateString): MediaStory[] {
    const stories: MediaStory[] = [];

    // Generate different types of stories based on frequency
    for (const [storyType, frequency] of Object.entries(STORY_TYPE_FREQUENCIES)) {
      const numStories = Math.floor(frequency + Math.random() * frequency * 0.5);
      
      for (let i = 0; i < numStories; i++) {
        const story = this.generateStory(storyType as MediaStoryType, date);
        if (story) {
          stories.push(story);
        }
      }
    }

    return stories;
  }

  /**
   * Generate a random story of a specific type
   */
  private generateStory(storyType: MediaStoryType, date: DateString): MediaStory | null {
    switch (storyType) {
      case 'news':
        return this.generateNewsArticle(date);
      case 'rumor':
        return this.generateRumor(date);
      case 'interview':
        return this.generateInterview(date);
      case 'press_conference':
        return this.generatePressConference(date);
      case 'match_report':
        return this.generateMatchReport(date);
      case 'match_preview':
        return this.generateMatchPreview(date);
      case 'analysis':
        return this.generateAnalysisArticle(date);
      case 'opinion':
        return this.generateOpinionPiece(date);
      case 'transfer_news':
        return this.generateTransferNews(date);
      case 'injury_update':
        return this.generateInjuryUpdate(date);
      case 'contract_news':
        return this.generateContractNews(date);
      case 'tactical_analysis':
        return this.generateTacticalAnalysis(date);
      case 'player_profile':
        return this.generatePlayerProfile(date);
      case 'club_profile':
        return this.generateClubProfile(date);
      case 'manager_profile':
        return this.generateManagerProfile(date);
      case 'season_review':
        return this.generateSeasonReview(date);
      case 'season_preview':
        return this.generateSeasonPreview(date);
      default:
        return null;
    }
  }

  /**
   * Generate a news article
   */
  private generateNewsArticle(date: DateString): NewsArticle | null {
    // Select a random news category based on frequency
    const category = this.selectWeightedRandom(NEWS_CATEGORY_FREQUENCIES);
    
    // Select a random entity to focus on
    const [entityType, entityId, title, content] = this.generateNewsContent(category);
    
    if (!entityId) return null;

    // Select a random journalist
    const journalist = this.getRandomJournalist(['news']);
    const source = journalist ? this.mediaSources.get(journalist.sourceId) : this.getRandomMediaSource();

    const id = this.generateId();
    const sentiment = this.selectWeightedRandom(STORY_SENTIMENT_DISTRIBUTION.news);
    const importance = STORY_IMPORTANCE_BY_TYPE.news;

    const article: NewsArticle = {
      id,
      type: 'news',
      title,
      content,
      date,
      authorId: journalist?.id || null,
      source: source?.name || 'TACTICO News',
      primaryEntityId: entityId,
      primaryEntityType: entityType,
      secondaryEntityIds: [],
      sentiment,
      importance,
      views: 0,
      likes: 0,
      shares: 0,
      comments: 0,
      category,
      isBreaking: Math.random() > 0.9,
      relatedStories: [],
      tags: this.generateTags(category, entityType, entityId),
    };

    this.mediaStories.set(id, article);
    this.newsArticles.set(id, article);

    return article;
  }

  /**
   * Generate news content based on category
   */
  private generateNewsContent(category: NewsCategory): [entityType: 'player' | 'club' | 'manager' | 'nation' | 'match' | null, entityId: EntityId | null, title: string, content: string] {
    switch (category) {
      case 'transfers':
        const player = this.getRandomPlayer();
        if (player) {
          const club = this.clubs.get(player.clubId!);
          return [
            'player',
            player.id,
            `${player.firstName} ${player.lastName} linked with surprise move`,
            `Reports suggest that ${player.firstName} ${player.lastName} could be on the move this summer. The ${club?.name || 'current club'} star has been in excellent form, attracting interest from several top clubs.`
          ];
        }
        break;

      case 'matches':
        const match = this.getRandomMatch();
        if (match) {
          const homeClub = this.clubs.get(match.home_club_id);
          const awayClub = this.clubs.get(match.away_club_id);
          return [
            'match',
            match.id,
            `${homeClub?.name || 'Home'} vs ${awayClub?.name || 'Away'}: Match preview`,
            `The highly anticipated match between ${homeClub?.name || 'Home'} and ${awayClub?.name || 'Away'} is set to take place on ${match.match_date}. Both teams will be looking to secure an important victory.`
          ];
        }
        break;

      case 'injuries':
        const injuredPlayer = this.getRandomPlayer();
        if (injuredPlayer) {
          return [
            'player',
            injuredPlayer.id,
            `${injuredPlayer.firstName} ${injuredPlayer.lastName} faces spell on the sidelines`,
            `${injuredPlayer.firstName} ${injuredPlayer.lastName} is expected to miss the next 2-3 weeks with a ${['hamstring', 'ankle', 'knee', 'calf'][Math.floor(Math.random() * 4)]} injury. This is a blow for their club as they prepare for a crucial run of fixtures.`
          ];
        }
        break;

      case 'tactics':
        const manager = this.getRandomManager();
        if (manager) {
          const club = this.clubs.get(manager.clubId!);
          return [
            'manager',
            manager.id,
            `${manager.firstName} ${manager.lastName} reveals new tactical approach`,
            `${manager.firstName} ${manager.lastName} has revealed that ${club?.name || 'the club'} will be adopting a new tactical approach for the upcoming season. The manager believes this will help the team compete at a higher level.`
          ];
        }
        break;

      case 'finance':
        const wealthyClub = this.getRandomClub();
        if (wealthyClub) {
          return [
            'club',
            wealthyClub.id,
            `${wealthyClub.name} announces record financial results`,
            `${wealthyClub.name} has announced record financial results for the last fiscal year. The club's revenue has increased by ${Math.floor(Math.random() * 50) + 10}% compared to the previous year, thanks to strong commercial performance and success on the pitch.`
          ];
        }
        break;

      case 'youth':
        const youthClub = this.getRandomClub();
        if (youthClub) {
          return [
            'club',
            youthClub.id,
            `${youthClub.name} unveils exciting youth prospect`,
            `${youthClub.name} has unveiled a new exciting prospect from their youth academy. The young ${['midfielder', 'forward', 'defender', 'goalkeeper'][Math.floor(Math.random() * 4)]} has been impressing in training and is tipped for a bright future.`
          ];
        }
        break;

      case 'international':
        const nationCode = this.getRandomNationCode();
        if (nationCode) {
          return [
            'nation',
            nationCode,
            `${nationCode} national team announces squad for upcoming fixtures`,
            `The ${nationCode} national team manager has announced the squad for the upcoming ${['World Cup qualifiers', 'friendly matches', 'European Championship'][Math.floor(Math.random() * 3)]}. Several young players have been given their first call-ups.`
          ];
        }
        break;

      case 'domestic':
        const domesticClub = this.getRandomClub();
        if (domesticClub) {
          return [
            'club',
            domesticClub.id,
            `${domesticClub.name} makes statement with impressive victory`,
            `${domesticClub.name} sent a strong message to their league rivals with an impressive victory over the weekend. The performance has been praised by pundits and fans alike.`
          ];
        }
        break;

      default:
        const defaultClub = this.getRandomClub();
        if (defaultClub) {
          return [
            'club',
            defaultClub.id,
            `Breaking: Major development at ${defaultClub.name}`,
            `There has been a major development at ${defaultClub.name}. More details to follow as this story unfolds.`
          ];
        }
    }

    return [null, null, 'Breaking News', 'A major story is developing. Check back for updates.'];
  }

  /**
   * Generate a rumor
   */
  private generateRumor(date: DateString): Rumor | null {
    // Select a random player for the rumor
    const player = this.getRandomPlayer();
    if (!player) return null;

    const club = this.clubs.get(player.clubId!);
    if (!club) return null;

    // Generate rumor content
    const rumorTypes = [
      { type: 'transfer', text: `${player.firstName} ${player.lastName} to join ${this.getRandomClubOtherThan(club.id)?.name || 'a top club'}` },
      { type: 'contract', text: `${player.firstName} ${player.lastName} demands new contract` },
      { type: 'injury', text: `${player.firstName} ${player.lastName} facing longer spell on sidelines` },
      { type: 'retirement', text: `${player.firstName} ${player.lastName} considering retirement` },
      { type: 'manager', text: `${club.name} manager to be sacked` },
    ];

    const rumorType = rumorTypes[Math.floor(Math.random() * rumorTypes.length)];

    // Select a random journalist (preferably one who specializes in rumors)
    const journalist = this.getRandomJournalist(['rumor', 'transfer_news']);
    const source = journalist ? this.mediaSources.get(journalist.sourceId) : this.getRandomMediaSource();

    const id = this.generateId();
    const sentiment = this.selectWeightedRandom(STORY_SENTIMENT_DISTRIBUTION.rumor);
    const importance = STORY_IMPORTANCE_BY_TYPE.rumor;
    const reliability = journalist ? journalist.credibility : 50 + Math.floor(Math.random() * 50);
    const sourceType = ['anonymous', 'reliable', 'unreliable', 'agent', 'club_official'][Math.floor(Math.random() * 5)] as const;

    const rumor: Rumor = {
      id,
      type: 'rumor',
      title: `RUMOR: ${rumorType.text}`,
      content: `According to sources close to the situation, ${rumorType.text.toLowerCase()}. While nothing has been confirmed yet, this rumor is gaining traction.`,
      date,
      authorId: journalist?.id || null,
      source: source?.name || 'Anonymous Source',
      primaryEntityId: player.id,
      primaryEntityType: 'player',
      secondaryEntityIds: [],
      sentiment,
      importance,
      views: 0,
      likes: 0,
      shares: 0,
      comments: 0,
      tags: this.generateTags('transfers', 'player', player.id),
      reliability,
      sourceType,
      confirmationStatus: 'unconfirmed',
      relatedFacts: [],
    };

    this.mediaStories.set(id, rumor);
    this.rumors.set(id, rumor);

    return rumor;
  }

  /**
   * Generate an interview
   */
  private generateInterview(date: DateString): Interview | null {
    // Select a random player or manager to interview
    const isPlayerInterview = Math.random() > 0.5;
    const entity = isPlayerInterview ? this.getRandomPlayer() : this.getRandomManager();
    
    if (!entity) return null;

    const entityType = isPlayerInterview ? 'player' : 'manager';
    const intervieweeId = entity.id;
    const intervieweeName = `${entity.firstName} ${entity.lastName}`;

    // Select a random journalist
    const journalist = this.getRandomJournalist(['interview']);
    const source = journalist ? this.mediaSources.get(journalist.sourceId) : this.getRandomMediaSource();

    // Generate questions
    const questions: InterviewQuestion[] = [];
    const numQuestions = 3 + Math.floor(Math.random() * 3);

    for (let i = 0; i < numQuestions; i++) {
      questions.push({
        id: this.generateId(),
        question: this.generateInterviewQuestion(entityType, intervieweeName),
        answer: this.generateInterviewAnswer(entityType, intervieweeName),
        order: i + 1,
        topic: ['form', 'tactics', 'future', 'past', 'personal'][Math.floor(Math.random() * 5)],
        sentiment: this.selectWeightedRandom(STORY_SENTIMENT_DISTRIBUTION.interview),
      });
    }

    const id = this.generateId();
    const sentiment = this.selectWeightedRandom(STORY_SENTIMENT_DISTRIBUTION.interview);
    const importance = STORY_IMPORTANCE_BY_TYPE.interview;

    const interview: Interview = {
      id,
      type: 'interview',
      title: `Exclusive interview: ${intervieweeName}`,
      content: `In an exclusive interview with ${source?.name || 'our reporter'}, ${intervieweeName} discusses various topics including their recent form, future ambitions, and thoughts on the current state of football.`,
      date,
      authorId: journalist?.id || null,
      source: source?.name || 'TACTICO News',
      primaryEntityId: intervieweeId,
      primaryEntityType: entityType,
      secondaryEntityIds: [],
      sentiment,
      importance,
      views: 0,
      likes: 0,
      shares: 0,
      comments: 0,
      tags: this.generateTags('interview', entityType, intervieweeId),
      intervieweeId,
      intervieweeType: entityType,
      interviewerId: journalist?.id || null,
      questions,
      location: `${['London', 'Manchester', 'Madrid', 'Barcelona', 'Munich', 'Milan'][Math.floor(Math.random() * 6)]}, ${entityType === 'player' ? 'Training Ground' : 'Press Room'}`,
      durationMinutes: 15 + Math.floor(Math.random() * 30),
    };

    this.mediaStories.set(id, interview);
    this.interviews.set(id, interview);

    return interview;
  }

  /**
   * Generate an interview question
   */
  private generateInterviewQuestion(entityType: 'player' | 'manager', intervieweeName: string): string {
    const playerQuestions = [
      `How do you feel about your recent performances?`,
      `What are your thoughts on the team's current form?`,
      `How do you handle the pressure of playing at the highest level?`,
      `Who has been your biggest inspiration in football?`,
      `What are your personal targets for this season?`,
      `How do you prepare mentally for big matches?`,
      `What's it like playing under your current manager?`,
      `How do you deal with criticism from fans and pundits?`,
      `What advice would you give to young players starting their careers?`,
      `Where do you see yourself in five years' time?`,
    ];

    const managerQuestions = [
      `How would you assess your team's performance so far this season?`,
      `What's your tactical philosophy?`,
      `How do you handle pressure from the board and fans?`,
      `What's the secret to managing a successful dressing room?`,
      `How do you decide on your starting lineup?`,
      `What's your approach to transfers?`,
      `How do you motivate players during a difficult run of form?`,
      `What's your opinion on the current state of football?`,
      `Who do you see as your biggest rivals this season?`,
      `What are your expectations for the rest of the season?`,
    ];

    const questions = entityType === 'player' ? playerQuestions : managerQuestions;
    return questions[Math.floor(Math.random() * questions.length)];
  }

  /**
   * Generate an interview answer
   */
  private generateInterviewAnswer(entityType: 'player' | 'manager', intervieweeName: string): string {
    const positiveResponses = [
      `I'm feeling really good at the moment. The hard work is paying off, and I'm just trying to focus on helping the team.`,
      `It's been a challenging period, but we're working hard to turn things around. I have faith in this team.`,
      `Pressure is part of the game at this level. I've learned to embrace it and use it as motivation.`,
      `My inspiration has always been my family. They've supported me through everything.`,
      `My target is to keep improving and help the team achieve our goals. That's what matters most.`,
      `Mentally, I just try to stay focused on the process rather than the outcome.`,
      `The manager has been great. He gives me the freedom to express myself on the pitch.`,
      `Criticism comes with the territory. I try to learn from it and move forward.`,
      `My advice to young players would be to work hard, stay humble, and never stop learning.`,
      `In five years, I hope to be playing at the highest level and winning trophies.`,
    ];

    const managerResponses = [
      `I think we've shown some good signs, but there's still room for improvement. We're working hard every day.`,
      `My philosophy is about playing attacking, entertaining football while maintaining defensive solidity.`,
      `Pressure is part of the job. I focus on making the right decisions for the club.`,
      `Managing a dressing room is about respect, communication, and leading by example.`,
      `I look at form, fitness, and the opposition when selecting my starting lineup.`,
      `My transfer approach is to identify players who fit our system and can improve the squad.`,
      `During difficult periods, I remind the players of our goals and the hard work we've put in.`,
      `Football is constantly evolving. It's important to adapt and innovate.`,
      `Every team is a rival. We respect all opponents but fear none.`,
      `My expectation is that we continue to improve and compete at the highest level.`,
    ];

    const responses = entityType === 'player' ? positiveResponses : managerResponses;
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Generate a press conference
   */
  private generatePressConference(date: DateString): PressConference | null {
    // Select a random manager for the press conference
    const manager = this.getRandomManager();
    if (!manager) return null;

    const club = this.clubs.get(manager.clubId!);
    if (!club) return null;

    // Select a random journalist to host
    const journalist = this.getRandomJournalist(['press_conference']);
    const source = journalist ? this.mediaSources.get(journalist.sourceId) : this.getRandomMediaSource();

    // Generate questions
    const questions: PressConferenceQuestion[] = [];
    const numQuestions = 4 + Math.floor(Math.random() * 4);

    for (let i = 0; i < numQuestions; i++) {
      const journalistForQuestion = this.getRandomJournalist();
      questions.push({
        id: this.generateId(),
        journalistId: journalistForQuestion?.id || null,
        journalistName: journalistForQuestion ? `${journalistForQuestion.name} (${this.mediaSources.get(journalistForQuestion.sourceId)?.name || 'Reporter'})` : 'Reporter',
        question: this.generatePressConferenceQuestion(manager, club),
        answer: this.generatePressConferenceAnswer(manager, club),
        order: i + 1,
        topic: ['tactics', 'team_selection', 'results', 'future', 'transfers'][Math.floor(Math.random() * 5)],
        sentiment: this.selectWeightedRandom(STORY_SENTIMENT_DISTRIBUTION.press_conference),
        followUp: Math.random() > 0.7,
      });
    }

    const id = this.generateId();
    const sentiment = this.selectWeightedRandom(STORY_SENTIMENT_DISTRIBUTION.press_conference);
    const importance = STORY_IMPORTANCE_BY_TYPE.press_conference;
    const context = ['pre_match', 'post_match', 'general', 'crisis', 'announcement'][Math.floor(Math.random() * 5)] as const;

    const pressConference: PressConference = {
      id,
      type: 'press_conference',
      title: `${manager.firstName} ${manager.lastName} press conference`,
      content: `${manager.firstName} ${manager.lastName} held a press conference today to discuss ${context.replace('_', ' ')}. The ${club.name} manager answered questions from the media on various topics.`,
      date,
      authorId: journalist?.id || null,
      source: source?.name || 'TACTICO News',
      primaryEntityId: manager.id,
      primaryEntityType: 'manager',
      secondaryEntityIds: [club.id],
      sentiment,
      importance,
      views: 0,
      likes: 0,
      shares: 0,
      comments: 0,
      tags: this.generateTags('press_conference', 'manager', manager.id),
      managerId: manager.id,
      clubId: club.id,
      context,
      questions,
      attendance: 10 + Math.floor(Math.random() * 40),
    };

    this.mediaStories.set(id, pressConference);
    this.pressConferences.set(id, pressConference);

    return pressConference;
  }

  /**
   * Generate a press conference question
   */
  private generatePressConferenceQuestion(manager: Manager, club: Club): string {
    const questions = [
      `Manager, how do you reflect on your team's performance in the last match?`,
      `What tactical changes are you considering for the upcoming game?`,
      `There have been rumors about a big-name signing. Can you comment on that?`,
      `How are you handling the injury crisis in your squad?`,
      `What's your message to the fans after the recent run of poor results?`,
      `How do you plan to stop ${this.getRandomPlayerFromOtherClub(club.id)?.firstName || "the opposition's star player"} in the next match?`,
      `Are you under pressure from the board to improve results?`,
      `What's your assessment of your team's chances in the upcoming competition?`,
      `How do you motivate your players during a difficult period?`,
      `What's your long-term vision for this club?`,
    ];
    return questions[Math.floor(Math.random() * questions.length)];
  }

  /**
   * Generate a press conference answer
   */
  private generatePressConferenceAnswer(manager: Manager, club: Club): string {
    const responses = [
      `I think we showed some positive signs, but we need to be more clinical in front of goal. That's something we're working on in training.`,
      `We're looking at a few tactical adjustments, but I don't want to give too much away to our opponents.`,
      `I can't comment on specific transfer targets, but we're always looking to strengthen the squad where we can.`,
      `Injuries are part of football. We have a strong squad, and the players stepping in have done well.`,
      `The fans have been fantastic, and we're all working hard to give them the results they deserve.`,
      `We're aware of their quality, and we'll have a plan to deal with them. But our focus is on our own performance.`,
      `There's always pressure in this job, but I'm confident in our ability to turn things around.`,
      `We're taking it one game at a time. Our focus is on the next match, and we believe we can compete with anyone.`,
      `I remind the players of the hard work we've put in and the progress we've made. We need to stay focused on our goals.`,
      `My vision is to build a team that plays attractive, effective football and competes for trophies.`,
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Generate a match report
   */
  private generateMatchReport(date: DateString): MatchReport | null {
    // Find a match that was played on or before the current date
    const match = this.getRandomCompletedMatch(date);
    if (!match) return null;

    const homeClub = this.clubs.get(match.home_club_id);
    const awayClub = this.clubs.get(match.away_club_id);
    
    if (!homeClub || !awayClub) return null;

    // Select a random journalist
    const journalist = this.getRandomJournalist(['match_report']);
    const source = journalist ? this.mediaSources.get(journalist.sourceId) : this.getRandomMediaSource();

    // Generate key moments
    const keyMoments: MatchReportKeyMoment[] = [];
    const numMoments = 5 + Math.floor(Math.random() * 6);

    for (let i = 0; i < numMoments; i++) {
      const minute = 1 + Math.floor(Math.random() * 90);
      const second = Math.floor(Math.random() * 60);
      const type = MATCH_REPORT_KEY_MOMENT_TYPES[Math.floor(Math.random() * MATCH_REPORT_KEY_MOMENT_TYPES.length)];
      const isHome = Math.random() > 0.5;
      const player = isHome ? this.getRandomPlayerFromClub(homeClub.id) : this.getRandomPlayerFromClub(awayClub.id);

      keyMoments.push({
        minute,
        second,
        type,
        playerId: player?.id || null,
        clubId: isHome ? homeClub.id : awayClub.id,
        description: this.generateKeyMomentDescription(type, player, isHome ? homeClub : awayClub),
        isSignificant: Math.random() > 0.7,
      });
    }

    // Generate player ratings
    const playerRatings: Record<EntityId, number> = {};
    
    // Rate home team players
    const homePlayers = this.getPlayersFromClub(homeClub.id);
    homePlayers.forEach(player => {
      playerRatings[player.id] = 6 + Math.floor(Math.random() * 5); // 6-10
    });

    // Rate away team players
    const awayPlayers = this.getPlayersFromClub(awayClub.id);
    awayPlayers.forEach(player => {
      playerRatings[player.id] = 6 + Math.floor(Math.random() * 5);
    });

    // Select man of the match
    const manOfTheMatch = Math.random() > 0.5 
      ? homePlayers[Math.floor(Math.random() * homePlayers.length)] 
      : awayPlayers[Math.floor(Math.random() * awayPlayers.length)];

    // Generate stats
    const homePossession = 40 + Math.floor(Math.random() * 21); // 40-60%
    const awayPossession = 100 - homePossession;

    const id = this.generateId();
    const sentiment = match.home_score > match.away_score 
      ? (match.home_club_id === homeClub.id ? 'positive' : 'negative')
      : match.home_score < match.away_score
        ? (match.home_club_id === homeClub.id ? 'negative' : 'positive')
        : 'neutral';
    const importance = STORY_IMPORTANCE_BY_TYPE.match_report;

    const matchReport: MatchReport = {
      id,
      type: 'match_report',
      title: `${homeClub.name} ${match.home_score}-${match.away_score} ${awayClub.name}: Match report`,
      content: `Full match report from the game between ${homeClub.name} and ${awayClub.name} which ended ${match.home_score}-${match.away_score}.`,
      date,
      authorId: journalist?.id || null,
      source: source?.name || 'TACTICO News',
      primaryEntityId: match.id,
      primaryEntityType: 'match',
      secondaryEntityIds: [homeClub.id, awayClub.id],
      sentiment: sentiment as MediaSentiment,
      importance,
      views: 0,
      likes: 0,
      shares: 0,
      comments: 0,
      tags: this.generateTags('match_report', 'match', match.id),
      matchId: match.id,
      homeClubId: homeClub.id,
      awayClubId: awayClub.id,
      homeScore: match.home_score,
      awayScore: match.away_score,
      stats: {
        possession: { home: homePossession, away: awayPossession },
        shots: { 
          home: 10 + Math.floor(Math.random() * 11), 
          away: 8 + Math.floor(Math.random() * 11),
          onTarget: { 
            home: 4 + Math.floor(Math.random() * 5), 
            away: 3 + Math.floor(Math.random() * 5) 
          } 
        },
        passes: {
          home: { 
            completed: 300 + Math.floor(Math.random() * 200), 
            attempted: 400 + Math.floor(Math.random() * 200) 
          },
          away: {
            completed: 250 + Math.floor(Math.random() * 200), 
            attempted: 350 + Math.floor(Math.random() * 200) 
          }
        },
        tackles: {
          home: { 
            won: 15 + Math.floor(Math.random() * 10), 
            attempted: 20 + Math.floor(Math.random() * 10) 
          },
          away: {
            won: 12 + Math.floor(Math.random() * 10), 
            attempted: 18 + Math.floor(Math.random() * 10) 
          }
        },
        fouls: { 
          home: 8 + Math.floor(Math.random() * 8), 
          away: 10 + Math.floor(Math.random() * 8) 
        },
        cards: {
          home: { 
            yellow: Math.floor(Math.random() * 3), 
            red: Math.random() > 0.9 ? 1 : 0 
          },
          away: {
            yellow: Math.floor(Math.random() * 3), 
            red: Math.random() > 0.9 ? 1 : 0 
          }
        },
      },
      keyMoments,
      playerRatings,
      manOfTheMatchId: manOfTheMatch?.id || null,
    };

    this.mediaStories.set(id, matchReport);
    this.matchReports.set(id, matchReport);

    return matchReport;
  }

  /**
   * Generate key moment description
   */
  private generateKeyMomentDescription(type: string, player: Player | null, club: Club): string {
    if (!player) {
      return `Key moment: ${type}`;
    }

    switch (type) {
      case 'goal':
        return `${player.firstName} ${player.lastName} scores for ${club.name}!`;
      case 'assist':
        return `${player.firstName} ${player.lastName} provides the assist for ${club.name}!`;
      case 'save':
        return `${player.firstName} ${player.lastName} makes a crucial save for ${club.name}!`;
      case 'miss':
        return `${player.firstName} ${player.lastName} misses a great chance for ${club.name}!`;
      case 'foul':
        return `${player.firstName} ${player.lastName} commits a foul for ${club.name}.`;
      case 'card':
        const cardType = Math.random() > 0.7 ? 'red' : 'yellow';
        return `${player.firstName} ${player.lastName} receives a ${cardType} card for ${club.name}!`;
      case 'substitution':
        return `${player.firstName} ${player.lastName} is substituted for ${club.name}.`;
      case 'penalty':
        return `Penalty awarded to ${club.name}!`;
      case 'injury':
        return `${player.firstName} ${player.lastName} appears to be injured for ${club.name}.`;
      default:
        return `Key moment involving ${player.firstName} ${player.lastName} from ${club.name}.`;
    }
  }

  /**
   * Generate a match preview
   */
  private generateMatchPreview(date: DateString): MatchPreview | null {
    // Find an upcoming match
    const match = this.getRandomUpcomingMatch(date);
    if (!match) return null;

    const homeClub = this.clubs.get(match.home_club_id);
    const awayClub = this.clubs.get(match.away_club_id);
    
    if (!homeClub || !awayClub) return null;

    // Select a random journalist
    const journalist = this.getRandomJournalist(['match_preview']);
    const source = journalist ? this.mediaSources.get(journalist.sourceId) : this.getRandomMediaSource();

    // Generate predicted score
    const homeStrength = homeClub.reputation + (homeClub.home_kit_color ? 5 : 0); // Home advantage
    const awayStrength = awayClub.reputation;
    const totalStrength = homeStrength + awayStrength;
    const homeScore = Math.floor(Math.random() * 4);
    const awayScore = Math.floor(Math.random() * 4);

    // Calculate probabilities
    const homeWinProb = Math.round((homeStrength / totalStrength) * 100);
    const awayWinProb = Math.round((awayStrength / totalStrength) * 100);
    const drawProb = 100 - homeWinProb - awayWinProb;

    // Generate team news
    const homeTeamNews: TeamNews = {
      injuries: this.getRandomPlayersFromClub(homeClub.id, 1),
      suspensions: this.getRandomPlayersFromClub(homeClub.id, 1),
      doubts: this.getRandomPlayersFromClub(homeClub.id, 1),
      likelyLineup: this.getRandomPlayersFromClub(homeClub.id, 11),
      formation: ['4-4-2', '4-3-3', '3-5-2', '4-2-3-1'][Math.floor(Math.random() * 4)],
      managerQuote: this.generateManagerQuote(homeClub.id),
    };

    const awayTeamNews: TeamNews = {
      injuries: this.getRandomPlayersFromClub(awayClub.id, 1),
      suspensions: this.getRandomPlayersFromClub(awayClub.id, 1),
      doubts: this.getRandomPlayersFromClub(awayClub.id, 1),
      likelyLineup: this.getRandomPlayersFromClub(awayClub.id, 11),
      formation: ['4-4-2', '4-3-3', '3-5-2', '4-2-3-1'][Math.floor(Math.random() * 4)],
      managerQuote: this.generateManagerQuote(awayClub.id),
    };

    // Generate head to head stats
    const headToHead: HeadToHeadStats = {
      totalMatches: 10 + Math.floor(Math.random() * 31),
      homeWins: 3 + Math.floor(Math.random() * 8),
      awayWins: 2 + Math.floor(Math.random() * 7),
      draws: 5 + Math.floor(Math.random() * 16),
      homeGoals: 15 + Math.floor(Math.random() * 41),
      awayGoals: 10 + Math.floor(Math.random() * 36),
      last5: ['W', 'D', 'L', 'W', 'D'].sort(() => Math.random() - 0.5).join(''),
    };

    // Generate key players to watch
    const keyPlayers = [
      ...this.getRandomPlayersFromClub(homeClub.id, 2),
      ...this.getRandomPlayersFromClub(awayClub.id, 2)
    ].map(p => p.id);

    const id = this.generateId();
    const sentiment = 'neutral' as MediaSentiment;
    const importance = STORY_IMPORTANCE_BY_TYPE.match_preview;

    const matchPreview: MatchPreview = {
      id,
      type: 'match_preview',
      title: `${homeClub.name} vs ${awayClub.name}: Match preview`,
      content: `Preview of the upcoming match between ${homeClub.name} and ${awayClub.name}. Both teams will be looking to secure an important victory.`,
      date,
      authorId: journalist?.id || null,
      source: source?.name || 'TACTICO News',
      primaryEntityId: match.id,
      primaryEntityType: 'match',
      secondaryEntityIds: [homeClub.id, awayClub.id],
      sentiment,
      importance,
      views: 0,
      likes: 0,
      shares: 0,
      comments: 0,
      tags: this.generateTags('match_preview', 'match', match.id),
      matchId: match.id,
      homeClubId: homeClub.id,
      awayClubId: awayClub.id,
      homeWinProbability: homeWinProb,
      drawProbability: drawProb,
      awayWinProbability: awayWinProb,
      predictedScore: `${homeScore}-${awayScore}`,
      keyPlayers,
      teamNews: {
        home: homeTeamNews,
        away: awayTeamNews,
      },
      headToHead,
    };

    this.mediaStories.set(id, matchPreview);
    this.matchPreviews.set(id, matchPreview);

    return matchPreview;
  }

  /**
   * Generate a manager quote
   */
  private generateManagerQuote(clubId: EntityId): string {
    const quotes = [
      `We're taking it one game at a time.`,
      `The players have been working hard in training.`,
      `We respect all opponents, but we fear none.`,
      `Injuries are part of the game. We have a strong squad.`,
      `We're focused on our own performance.`,
      `The fans have been fantastic, and we want to give them something to cheer about.`,
      `We're not getting ahead of ourselves. There's still a long way to go.`,
      `I'm confident in our ability to get a positive result.`,
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  }

  /**
   * Generate an analysis article
   */
  private generateAnalysisArticle(date: DateString): AnalysisArticle | null {
    // Select a random focus
    const focus = this.selectWeightedRandom(ANALYSIS_FOCUS_FREQUENCIES);

    let entityId: EntityId | null = null;
    let entityType: 'player' | 'club' | 'manager' | 'match' | null = null;
    let title = '';
    let content = '';
    let data: Record<string, number | string> = {};
    let conclusions: string[] = [];
    let recommendations: string[] = [];

    switch (focus) {
      case 'player_performance':
        const player = this.getRandomPlayer();
        if (player) {
          entityId = player.id;
          entityType = 'player';
          title = `Analyzing ${player.firstName} ${player.lastName}'s recent performances`;
          content = `In-depth analysis of ${player.firstName} ${player.lastName}'s recent form, looking at their statistics, contributions, and impact on the team.`;
          data = {
            appearances: 10 + Math.floor(Math.random() * 21),
            goals: Math.floor(Math.random() * 11),
            assists: Math.floor(Math.random() * 8),
            averageRating: (6 + Math.random() * 4).toFixed(1),
            passingAccuracy: (70 + Math.random() * 30).toFixed(1),
            shotsPerGame: (1 + Math.random() * 3).toFixed(1),
          };
          conclusions = [
            `${player.firstName} has been in excellent form recently.`,
            `Their contribution to both attacking and defensive phases has been crucial.`,
            `The player's consistency has been a key factor in the team's success.`,
          ];
          recommendations = [
            `Continue to play in their preferred position.`,
            `Consider giving them more creative freedom.`,
            `Monitor their workload to prevent fatigue.`,
          ];
        }
        break;

      case 'team_performance':
        const club = this.getRandomClub();
        if (club) {
          entityId = club.id;
          entityType = 'club';
          title = `Tactical breakdown: ${club.name}'s recent form`;
          content = `Analysis of ${club.name}'s recent performances, examining their tactical approach, strengths, and areas for improvement.`;
          data = {
            wins: 3 + Math.floor(Math.random() * 8),
            draws: 2 + Math.floor(Math.random() * 6),
            losses: 0 + Math.floor(Math.random() * 5),
            goalsFor: 10 + Math.floor(Math.random() * 21),
            goalsAgainst: 5 + Math.floor(Math.random() * 16),
            possession: (45 + Math.random() * 21).toFixed(1),
            passingAccuracy: (70 + Math.random() * 21).toFixed(1),
          };
          conclusions = [
            `The team has shown good defensive organization.`,
            `Their attacking play has been effective but could be more clinical.`,
            `The midfield has been controlling games well.`,
          ];
          recommendations = [
            `Consider adding more width to the attack.`,
            `Work on set-piece defending.`,
            `Give more freedom to creative players.`,
          ];
        }
        break;

      case 'tactical_analysis':
        const manager = this.getRandomManager();
        if (manager) {
          const managerClub = this.clubs.get(manager.clubId!);
          if (managerClub) {
            entityId = manager.id;
            entityType = 'manager';
            title = `Analyzing ${manager.firstName} ${manager.lastName}'s tactics at ${managerClub.name}`;
            content = `In-depth analysis of the tactical approach employed by ${manager.firstName} ${manager.lastName} at ${managerClub.name}, looking at formations, styles, and effectiveness.`;
            data = {
              formation: manager.preferred_formation,
              possession: (45 + Math.random() * 31).toFixed(1),
              pressingIntensity: ['Low', 'Medium', 'High', 'Very High'][Math.floor(Math.random() * 4)],
              defensiveLine: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
              attackingStyle: ['Direct', 'Possession', 'Counter'][Math.floor(Math.random() * 3)],
            };
            conclusions = [
              `The manager's tactical setup has been effective.`,
              `The team has shown good adaptability.`,
              `There's room for improvement in defensive transitions.`,
            ];
            recommendations = [
              `Consider varying the tactical approach based on opponents.`,
              `Work on improving the team's pressing triggers.`,
              `Give players more clarity in their roles.`,
            ];
          }
        }
        break;

      default:
        // Fallback to player performance
        const fallbackPlayer = this.getRandomPlayer();
        if (fallbackPlayer) {
          entityId = fallbackPlayer.id;
          entityType = 'player';
          title = `Player analysis: ${fallbackPlayer.firstName} ${fallbackPlayer.lastName}`;
          content = `Analysis of ${fallbackPlayer.firstName} ${fallbackPlayer.lastName}'s performances.`;
          data = {
            currentAbility: fallbackPlayer.currentAbility,
            potentialAbility: fallbackPlayer.potentialAbility,
            recentForm: (6 + Math.random() * 4).toFixed(1),
          };
          conclusions = [`Player has been performing at a good level.`];
          recommendations = [`Continue to develop the player's strengths.`];
        }
    }

    if (!entityId) return null;

    // Select a random journalist
    const journalist = this.getRandomJournalist(['analysis']);
    const source = journalist ? this.mediaSources.get(journalist.sourceId) : this.getRandomMediaSource();

    const id = this.generateId();
    const sentiment = this.selectWeightedRandom(STORY_SENTIMENT_DISTRIBUTION.analysis);
    const importance = STORY_IMPORTANCE_BY_TYPE.analysis;

    const analysis: AnalysisArticle = {
      id,
      type: 'analysis',
      title,
      content,
      date,
      authorId: journalist?.id || null,
      source: source?.name || 'TACTICO Analysis',
      primaryEntityId: entityId,
      primaryEntityType: entityType,
      secondaryEntityIds: [],
      sentiment,
      importance,
      views: 0,
      likes: 0,
      shares: 0,
      comments: 0,
      tags: this.generateTags('analysis', entityType, entityId),
      focus,
      data,
      conclusions,
      recommendations,
    };

    this.mediaStories.set(id, analysis);
    this.analysisArticles.set(id, analysis);

    return analysis;
  }

  /**
   * Generate an opinion piece
   */
  private generateOpinionPiece(date: DateString): OpinionPiece | null {
    // Select a random topic
    const topics = [
      'state_of_the_game',
      'best_player',
      'best_manager',
      'transfer_window',
      'youth_development',
      'tactical_trends',
      'financial_fair_play',
      'var_impact',
    ];
    const topic = topics[Math.floor(Math.random() * topics.length)];

    // Select a random journalist
    const journalist = this.getRandomJournalist(['opinion']);
    const source = journalist ? this.mediaSources.get(journalist.sourceId) : this.getRandomMediaSource();

    let title = '';
    let content = '';
    let stance: 'critical' | 'supportive' | 'balanced' | 'controversial' = 'balanced';
    let arguments: OpinionArgument[] = [];
    let counterArguments: OpinionArgument[] = [];

    switch (topic) {
      case 'state_of_the_game':
        title = `The current state of football: A cause for concern?`;
        content = `Football has changed dramatically in recent years. But are these changes for the better?`;
        stance = ['balanced', 'critical'][Math.floor(Math.random() * 2)] as const;
        arguments = [
          { id: this.generateId(), point: `The quality of football has never been higher.`, evidence: ['Technical ability of players', 'Tactical sophistication'], strength: 80 },
          { id: this.generateId(), point: `The game has become too commercialized.`, evidence: ['Rising ticket prices', 'Increased TV revenue'], strength: 70 },
        ];
        counterArguments = [
          { id: this.generateId(), point: `Tradition and history are being lost.`, evidence: ['Old stadiums being replaced', 'Local fans priced out'], strength: 75 },
          { id: this.generateId(), point: `The game is more accessible than ever.`, evidence: ['Global TV coverage', 'Social media presence'], strength: 65 },
        ];
        break;

      case 'best_player':
        const bestPlayer = this.getRandomPlayer();
        if (bestPlayer) {
          title = `Is ${bestPlayer.firstName} ${bestPlayer.lastName} the best player in the world?`;
          content = `An argument for why ${bestPlayer.firstName} ${bestPlayer.lastName} deserves to be considered the best player on the planet.`;
          stance = 'supportive' as const;
          arguments = [
            { id: this.generateId(), point: `Unmatched technical ability.`, evidence: [`Dribbling stats`, `Passing accuracy`], strength: 90 },
            { id: this.generateId(), point: `Consistently performs at the highest level.`, evidence: [`Goals per season`, `Assists per season`], strength: 85 },
          ];
          counterArguments = [
            { id: this.generateId(), point: `Other players have better all-round games.`, evidence: [`Defensive contributions`, `Work rate`], strength: 70 },
            { id: this.generateId(), point: `Hasn't won the biggest trophies.`, evidence: [`Lack of Champions League titles`], strength: 60 },
          ];
        }
        break;

      case 'best_manager':
        const bestManager = this.getRandomManager();
        if (bestManager) {
          title = `${bestManager.firstName} ${bestManager.lastName}: The best manager in the business?`;
          content = `Making the case for why ${bestManager.firstName} ${bestManager.lastName} is the top manager in world football.`;
          stance = 'supportive' as const;
          arguments = [
            { id: this.generateId(), point: `Tactical genius.`, evidence: [`Innovative formations`, `Adaptability`], strength: 85 },
            { id: this.generateId(), point: `Consistent success.`, evidence: [`Trophies won`, `Win percentage`], strength: 90 },
          ];
          counterArguments = [
            { id: this.generateId(), point: `Hasn't won the Champions League.`, evidence: [`Best finish: Semi-finals`], strength: 70 },
            { id: this.generateId(), point: `Other managers have more resources.`, evidence: [`Transfer budgets`, `Squad quality`], strength: 65 },
          ];
        }
        break;

      default:
        title = `The future of football: What lies ahead?`;
        content = `Looking at the trends shaping the future of the beautiful game.`;
        stance = 'balanced' as const;
        arguments = [
          { id: this.generateId(), point: `Technology will continue to revolutionize the game.`, evidence: [`VAR`, `Data analytics`], strength: 80 },
        ];
        counterArguments = [
          { id: this.generateId(), point: `Traditional values must be preserved.`, evidence: [`Fair play`, `Fan culture`], strength: 75 },
        ];
    }

    const id = this.generateId();
    const sentiment = stance === 'critical' ? 'negative' : stance === 'supportive' ? 'positive' : 'neutral';
    const importance = STORY_IMPORTANCE_BY_TYPE.opinion;

    const opinion: OpinionPiece = {
      id,
      type: 'opinion',
      title,
      content,
      date,
      authorId: journalist?.id || null,
      source: source?.name || 'TACTICO Opinion',
      primaryEntityId: null,
      primaryEntityType: null,
      secondaryEntityIds: [],
      sentiment: sentiment as MediaSentiment,
      importance,
      views: 0,
      likes: 0,
      shares: 0,
      comments: 0,
      tags: this.generateTags('opinion', null, null),
      authorType: journalist ? 'journalist' : 'pundit',
      stance,
      arguments,
      counterArguments,
    };

    this.mediaStories.set(id, opinion);
    this.opinionPieces.set(id, opinion);

    return opinion;
  }

  /**
   * Generate transfer news
   */
  private generateTransferNews(date: DateString): TransferNews | null {
    // Select a random player for transfer news
    const player = this.getRandomPlayer();
    if (!player) return null;

    const currentClub = this.clubs.get(player.clubId!);
    if (!currentClub) return null;

    // Decide if it's a completed transfer or a rumor
    const isCompleted = Math.random() > 0.7;
    const toClub = isCompleted ? this.getRandomClubOtherThan(currentClub.id) : null;

    // Select a random journalist
    const journalist = this.getRandomJournalist(['transfer_news']);
    const source = journalist ? this.mediaSources.get(journalist.sourceId) : this.getRandomMediaSource();

    const id = this.generateId();
    const sentiment = isCompleted ? 'positive' : 'neutral';
    const importance = STORY_IMPORTANCE_BY_TYPE.transfer_news;
    const status = isCompleted ? 'completed' : ['negotiating', 'medical', 'rumor'][Math.floor(Math.random() * 3)] as const;

    const transferNews: TransferNews = {
      id,
      type: 'transfer_news',
      title: isCompleted 
        ? `${player.firstName} ${player.lastName} completes move to ${toClub?.name || 'new club'}`
        : `${player.firstName} ${player.lastName} transfer update`,
      content: isCompleted
        ? `${player.firstName} ${player.lastName} has completed their move from ${currentClub.name} to ${toClub?.name || 'their new club'}. The transfer fee is reported to be in the region of $${Math.floor(Math.random() * 50) + 10}M.`
        : `There are updates in the transfer saga surrounding ${player.firstName} ${player.lastName}. ${currentClub.name} are reportedly in negotiations with several clubs.`,
      date,
      authorId: journalist?.id || null,
      source: source?.name || 'Transfer Insider',
      primaryEntityId: player.id,
      primaryEntityType: 'player',
      secondaryEntityIds: currentClub.id ? [currentClub.id, toClub?.id || 0].filter(Boolean) as EntityId[] : [],
      sentiment: sentiment as MediaSentiment,
      importance,
      views: 0,
      likes: 0,
      shares: 0,
      comments: 0,
      tags: this.generateTags('transfer_news', 'player', player.id),
      playerId: player.id,
      fromClubId: currentClub.id,
      toClubId: toClub?.id || null,
      status,
      fee: isCompleted ? (20000000 + Math.floor(Math.random() * 80000000)) : null,
      wage: isCompleted ? (100000 + Math.floor(Math.random() * 400000)) : null,
      contractLength: isCompleted ? (2 + Math.floor(Math.random() * 4)) : null,
      quotes: this.generateTransferQuotes(player, currentClub, toClub),
    };

    this.mediaStories.set(id, transferNews);
    this.transferNews.set(id, transferNews);

    return transferNews;
  }

  /**
   * Generate transfer quotes
   */
  private generateTransferQuotes(player: Player, fromClub: Club, toClub: Club | null): TransferQuote[] {
    const quotes: TransferQuote[] = [];

    // Player quote
    if (Math.random() > 0.5) {
      quotes.push({
        speakerId: player.id,
        speakerType: 'player',
        speakerName: `${player.firstName} ${player.lastName}`,
        quote: toClub 
          ? `I'm delighted to join ${toClub.name}. This is a great opportunity for me.`
          : `I'm focused on my current club, but I'm always open to new challenges.`,
        sentiment: 'positive' as MediaSentiment,
      });
    }

    // Manager quote (from current club)
    const fromManager = this.getManagerForClub(fromClub.id);
    if (fromManager && Math.random() > 0.5) {
      quotes.push({
        speakerId: fromManager.id,
        speakerType: 'manager',
        speakerName: `${fromManager.firstName} ${fromManager.lastName}`,
        quote: toClub 
          ? `It's a good deal for the club. We wish ${player.firstName} all the best.`
          : `He's an important player for us. We're not looking to sell.`,
        sentiment: toClub ? 'neutral' : 'negative',
      });
    }

    // Manager quote (from new club)
    if (toClub) {
      const toManager = this.getManagerForClub(toClub.id);
      if (toManager && Math.random() > 0.5) {
        quotes.push({
          speakerId: toManager.id,
          speakerType: 'manager',
          speakerName: `${toManager.firstName} ${toManager.lastName}`,
          quote: `We're delighted to bring ${player.firstName} to the club. He'll be a great addition to the squad.`,
          sentiment: 'positive' as MediaSentiment,
        });
      }
    }

    // Agent quote
    if (Math.random() > 0.7) {
      quotes.push({
        speakerId: null,
        speakerType: 'agent',
        speakerName: 'Player Agent',
        quote: toClub 
          ? `This is a great move for my client. The club has big ambitions.`
          : `There's a lot of interest in my client. We're evaluating all options.`,
        sentiment: 'positive' as MediaSentiment,
      });
    }

    return quotes;
  }

  /**
   * Generate an injury update
   */
  private generateInjuryUpdate(date: DateString): InjuryUpdate | null {
    // Select a random player for injury update
    const player = this.getRandomPlayer();
    if (!player) return null;

    const club = this.clubs.get(player.clubId!);
    if (!club) return null;

    // Generate injury details
    const injuryTypes = ['hamstring', 'ankle', 'knee', 'calf', 'groin'];
    const severities = ['minor', 'moderate', 'serious'];
    const injuryType = injuryTypes[Math.floor(Math.random() * injuryTypes.length)];
    const severity = severities[Math.floor(Math.random() * severities.length)];
    const estimatedReturn = this.addDaysToDate(date, [7, 14, 21, 28][Math.floor(Math.random() * 4)]);

    // Select a random journalist
    const journalist = this.getRandomJournalist(['injury_update']);
    const source = journalist ? this.mediaSources.get(journalist.sourceId) : this.getRandomMediaSource();

    const id = this.generateId();
    const sentiment = severity === 'serious' ? 'negative' : 'neutral';
    const importance = STORY_IMPORTANCE_BY_TYPE.injury_update;

    const injuryUpdate: InjuryUpdate = {
      id,
      type: 'injury_update',
      title: `${player.firstName} ${player.lastName} injury update`,
      content: `${player.firstName} ${player.lastName} has suffered a ${severity} ${injuryType} injury and is expected to return on ${estimatedReturn}. This is a blow for ${club.name} as they prepare for their upcoming fixtures.`,
      date,
      authorId: journalist?.id || null,
      source: source?.name || 'Football Medical',
      primaryEntityId: player.id,
      primaryEntityType: 'player',
      secondaryEntityIds: [club.id],
      sentiment: sentiment as MediaSentiment,
      importance,
      views: 0,
      likes: 0,
      shares: 0,
      comments: 0,
      tags: this.generateTags('injury_update', 'player', player.id),
      playerId: player.id,
      clubId: club.id,
      injuryType,
      severity,
      estimatedReturn,
      quotes: this.generateInjuryQuotes(player, club, injuryType, severity, estimatedReturn),
    };

    this.mediaStories.set(id, injuryUpdate);
    this.injuryUpdates.set(id, injuryUpdate);

    return injuryUpdate;
  }

  /**
   * Generate injury quotes
   */
  private generateInjuryQuotes(
    player: Player,
    club: Club,
    injuryType: string,
    severity: string,
    estimatedReturn: DateString
  ): InjuryQuote[] {
    const quotes: InjuryQuote[] = [];

    // Manager quote
    const manager = this.getManagerForClub(club.id);
    if (manager && Math.random() > 0.5) {
      quotes.push({
        speakerId: manager.id,
        speakerType: 'manager',
        speakerName: `${manager.firstName} ${manager.lastName}`,
        quote: `It's a blow to lose ${player.firstName}. He's an important player for us, but we have a strong squad.`,
        sentiment: 'neutral' as MediaSentiment,
      });
    }

    // Doctor/physio quote
    if (Math.random() > 0.6) {
      quotes.push({
        speakerId: null,
        speakerType: 'doctor',
        speakerName: 'Club Doctor',
        quote: `The ${injuryType} injury is ${severity}. We expect ${player.firstName} to return around ${estimatedReturn}.`,
        sentiment: 'neutral' as MediaSentiment,
      });
    }

    // Player quote (if not too serious)
    if (severity !== 'serious' && Math.random() > 0.7) {
      quotes.push({
        speakerId: player.id,
        speakerType: 'player',
        speakerName: `${player.firstName} ${player.lastName}`,
        quote: `I'm working hard on my recovery. I hope to be back soon to help the team.`,
        sentiment: 'positive' as MediaSentiment,
      });
    }

    return quotes;
  }

  /**
   * Generate contract news
   */
  private generateContractNews(date: DateString): ContractNews | null {
    // Select a random player for contract news
    const player = this.getRandomPlayer();
    if (!player) return null;

    const club = this.clubs.get(player.clubId!);
    if (!club) return null;

    // Decide contract type
    const contractTypes = ['new', 'extension', 'expiry', 'release'];
    const contractType = contractTypes[Math.floor(Math.random() * contractTypes.length)] as const;

    // Select a random journalist
    const journalist = this.getRandomJournalist(['contract_news']);
    const source = journalist ? this.mediaSources.get(journalist.sourceId) : this.getRandomMediaSource();

    let title = '';
    let content = '';
    let duration: number | null = null;
    let wage: number | null = null;

    switch (contractType) {
      case 'new':
        title = `${player.firstName} ${player.lastName} signs new contract`;
        content = `${player.firstName} ${player.lastName} has signed a new contract with ${club.name}, keeping them at the club until ${this.addYearsToDate(date, 2 + Math.floor(Math.random() * 3))}.`;
        duration = 2 + Math.floor(Math.random() * 3);
        wage = player.wage * (1 + Math.random() * 0.5);
        break;
      case 'extension':
        title = `${player.firstName} ${player.lastName} extends contract`;
        content = `${player.firstName} ${player.lastName} has agreed to extend their contract with ${club.name} by ${1 + Math.floor(Math.random() * 2)} year(s).`;
        duration = 1 + Math.floor(Math.random() * 2);
        wage = player.wage * (1 + Math.random() * 0.3);
        break;
      case 'expiry':
        title = `${player.firstName} ${player.lastName}'s contract to expire`;
        content = `${player.firstName} ${player.lastName}'s contract with ${club.name} is set to expire at the end of the season. The club is in negotiations to extend the deal.`;
        break;
      case 'release':
        title = `${player.firstName} ${player.lastName} released by ${club.name}`;
        content = `${club.name} has announced that ${player.firstName} ${player.lastName} will be released when their contract expires at the end of the season.`;
        break;
    }

    const id = this.generateId();
    const sentiment = contractType === 'release' ? 'negative' : 'positive';
    const importance = STORY_IMPORTANCE_BY_TYPE.contract_news;

    const contractNews: ContractNews = {
      id,
      type: 'contract_news',
      title,
      content,
      date,
      authorId: journalist?.id || null,
      source: source?.name || 'Football Contracts',
      primaryEntityId: player.id,
      primaryEntityType: 'player',
      secondaryEntityIds: [club.id],
      sentiment: sentiment as MediaSentiment,
      importance,
      views: 0,
      likes: 0,
      shares: 0,
      comments: 0,
      tags: this.generateTags('contract_news', 'player', player.id),
      playerId: player.id,
      clubId: club.id,
      contractType,
      duration,
      wage,
      quotes: this.generateContractQuotes(player, club, contractType),
    };

    this.mediaStories.set(id, contractNews);
    this.contractNews.set(id, contractNews);

    return contractNews;
  }

  /**
   * Generate contract quotes
   */
  private generateContractQuotes(
    player: Player,
    club: Club,
    contractType: 'new' | 'extension' | 'expiry' | 'release'
  ): ContractQuote[] {
    const quotes: ContractQuote[] = [];

    // Player quote
    if (contractType !== 'release' && Math.random() > 0.5) {
      quotes.push({
        speakerId: player.id,
        speakerType: 'player',
        speakerName: `${player.firstName} ${player.lastName}`,
        quote: contractType === 'new' 
          ? `I'm delighted to sign a new contract. I'm happy here and looking forward to the future.`
          : `I'm pleased to extend my stay at the club. We have big ambitions.`,
        sentiment: 'positive' as MediaSentiment,
      });
    }

    // Manager quote
    const manager = this.getManagerForClub(club.id);
    if (manager && Math.random() > 0.5) {
      quotes.push({
        speakerId: manager.id,
        speakerType: 'manager',
        speakerName: `${manager.firstName} ${manager.lastName}`,
        quote: contractType === 'release'
          ? `It's a difficult decision, but we wish ${player.firstName} all the best for the future.`
          : `We're delighted that ${player.firstName} has committed their future to the club.`,
        sentiment: contractType === 'release' ? 'neutral' : 'positive',
      });
    }

    // Chairman quote
    if (Math.random() > 0.7) {
      quotes.push({
        speakerId: null,
        speakerType: 'chairman',
        speakerName: 'Club Chairman',
        quote: contractType === 'release'
          ? `Sometimes difficult decisions have to be made. We thank ${player.firstName} for their service.`
          : `Securing ${player.firstName}'s future is a statement of our ambition.`,
        sentiment: contractType === 'release' ? 'neutral' : 'positive',
      });
    }

    return quotes;
  }

  /**
   * Generate a tactical analysis
   */
  private generateTacticalAnalysis(date: DateString): TacticalAnalysis | null {
    // Select a random manager for tactical analysis
    const manager = this.getRandomManager();
    if (!manager) return null;

    const club = this.clubs.get(manager.clubId!);
    if (!club) return null;

    // Select a random journalist
    const journalist = this.getRandomJournalist(['tactical_analysis']);
    const source = journalist ? this.mediaSources.get(journalist.sourceId) : this.getRandomMediaSource();

    // Generate tactics
    const tactics: TacticalAnalysisTactic[] = [
      { name: 'Possession Play', description: 'Building from the back with short passes', usage: 60 + Math.floor(Math.random() * 31), successRate: 70 + Math.floor(Math.random() * 21) },
      { name: 'High Press', description: 'Pressing high up the pitch to win the ball', usage: 40 + Math.floor(Math.random() * 31), successRate: 65 + Math.floor(Math.random() * 21) },
      { name: 'Counter-Attacking', description: 'Quick transitions from defense to attack', usage: 30 + Math.floor(Math.random() * 31), successRate: 75 + Math.floor(Math.random() * 16) },
      { name: 'Direct Play', description: 'Playing long balls to bypass the midfield', usage: 20 + Math.floor(Math.random() * 21), successRate: 60 + Math.floor(Math.random() * 21) },
    ];

    // Generate effectiveness
    const effectiveness: Record<string, number> = {};
    tactics.forEach(tactic => {
      effectiveness[tactic.name] = tactic.successRate;
    });

    // Generate recommendations
    const recommendations: TacticalRecommendation[] = [
      { type: 'formation_change', description: 'Consider switching to a 4-3-3 formation for more width', expectedImpact: 'Increased attacking options', priority: 'medium' },
      { type: 'personnel_change', description: 'Bring in a more creative midfielder to unlock defenses', expectedImpact: 'Better chance creation', priority: 'high' },
      { type: 'style_change', description: 'Be more direct in attacking transitions', expectedImpact: 'More goalscoring opportunities', priority: 'low' },
    ];

    const id = this.generateId();
    const sentiment = this.selectWeightedRandom(STORY_SENTIMENT_DISTRIBUTION.tactical_analysis);
    const importance = STORY_IMPORTANCE_BY_TYPE.tactical_analysis;

    const analysis: TacticalAnalysis = {
      id,
      type: 'tactical_analysis',
      title: `Tactical analysis: ${manager.firstName} ${manager.lastName}'s ${club.name}`,
      content: `In-depth tactical analysis of ${manager.firstName} ${manager.lastName}'s approach at ${club.name}, looking at their preferred formations, styles, and effectiveness.`,
      date,
      authorId: journalist?.id || null,
      source: source?.name || 'TACTICO Tactics',
      primaryEntityId: manager.id,
      primaryEntityType: 'manager',
      secondaryEntityIds: [club.id],
      sentiment,
      importance,
      views: 0,
      likes: 0,
      shares: 0,
      comments: 0,
      tags: this.generateTags('tactical_analysis', 'manager', manager.id),
      matchId: null,
      clubId: club.id,
      playerId: null,
      formation: manager.preferred_formation,
      tactics,
      effectiveness,
      recommendations,
    };

    this.mediaStories.set(id, analysis);
    this.tacticalAnalyses.set(id, analysis);

    return analysis;
  }

  /**
   * Generate a player profile
   */
  private generatePlayerProfile(date: DateString): PlayerProfile | null {
    // Select a random player for profile
    const player = this.getRandomPlayer();
    if (!player) return null;

    const club = this.clubs.get(player.clubId!);
    if (!club) return null;

    // Select a random journalist
    const journalist = this.getRandomJournalist(['player_profile']);
    const source = journalist ? this.mediaSources.get(journalist.sourceId) : this.getRandomMediaSource();

    // Generate career stats
    const careerStats = {
      appearances: 100 + Math.floor(Math.random() * 401),
      goals: Math.floor(Math.random() * 101),
      assists: Math.floor(Math.random() * 61),
      cleanSheets: player.position === 'GK' ? 20 + Math.floor(Math.random() * 41) : 0,
      yellowCards: Math.floor(Math.random() * 21),
      redCards: Math.floor(Math.random() * 4),
      trophies: Math.floor(Math.random() * 11),
    };

    // Generate attributes
    const attributes = { ...player.attributes };

    // Generate career timeline
    const careerTimeline: PlayerProfileEvent[] = [];
    const years = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
    
    for (const year of years) {
      if (Math.random() > 0.7) {
        const eventTypes = ['debut', 'transfer', 'trophy', 'award', 'milestone'];
        const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)] as const;
        
        careerTimeline.push({
          date: `${year}-${String(1 + Math.floor(Math.random() * 12)).padStart(2, '0')}-${String(1 + Math.floor(Math.random() * 28)).padStart(2, '0')}`,
          type: eventType,
          description: this.generateCareerTimelineEvent(eventType, player, club),
          clubId: club.id,
        });
      }
    }

    // Generate quotes
    const quotes: PlayerProfileQuote[] = [];
    
    // Teammate quote
    const teammate = this.getRandomPlayerFromClub(club.id, player.id);
    if (teammate && Math.random() > 0.5) {
      quotes.push({
        speakerId: teammate.id,
        speakerType: 'teammate',
        speakerName: `${teammate.firstName} ${teammate.lastName}`,
        quote: `${player.firstName} is an amazing player and a great teammate. We're lucky to have him.`,
        context: 'On playing alongside the player',
      });
    }

    // Manager quote
    const manager = this.getManagerForClub(club.id);
    if (manager && Math.random() > 0.5) {
      quotes.push({
        speakerId: manager.id,
        speakerType: 'manager',
        speakerName: `${manager.firstName} ${manager.lastName}`,
        quote: `${player.firstName} is a key player for us. He brings quality and leadership to the team.`,
        context: "On the player's importance to the team",
      });
    }

    // Self quote
    if (Math.random() > 0.5) {
      quotes.push({
        speakerId: player.id,
        speakerType: 'self',
        speakerName: `${player.firstName} ${player.lastName}`,
        quote: `I've worked hard to get to where I am today. I want to keep improving and help the team achieve success.`,
        context: 'On personal ambitions',
      });
    }

    // Generate fun facts
    const funFacts = [
      `Started playing football at the age of 5`,
      `Idolizes ${['Cristiano Ronaldo', 'Lionel Messi', 'Zinedine Zidane', 'Thierry Henry'][Math.floor(Math.random() * 4)]} `,
      `Holds the record for most ${['goals', 'assists', 'clean sheets', 'appearances'][Math.floor(Math.random() * 4)]} in a season at ${club.name}`,
      `Speaks ${['3', '4', '5'][Math.floor(Math.random() * 3)]} languages fluently`,
      `Favorite hobby outside football is ${['gaming', 'reading', 'cooking', 'music', 'travel'][Math.floor(Math.random() * 5)]}`,
    ];

    const id = this.generateId();
    const sentiment = 'positive' as MediaSentiment;
    const importance = STORY_IMPORTANCE_BY_TYPE.player_profile;

    const profile: PlayerProfile = {
      id,
      type: 'player_profile',
      title: `${player.firstName} ${player.lastName}: Player profile`,
      content: `Comprehensive profile of ${player.firstName} ${player.lastName}, including career statistics, playing style, and personal information.`,
      date,
      authorId: journalist?.id || null,
      source: source?.name || 'TACTICO Profiles',
      primaryEntityId: player.id,
      primaryEntityType: 'player',
      secondaryEntityIds: [club.id],
      sentiment,
      importance,
      views: 0,
      likes: 0,
      shares: 0,
      comments: 0,
      tags: this.generateTags('player_profile', 'player', player.id),
      playerId: player.id,
      careerStats,
      attributes,
      careerTimeline,
      quotes,
      funFacts,
    };

    this.mediaStories.set(id, profile);
    this.playerProfiles.set(id, profile);

    return profile;
  }

  /**
   * Generate career timeline event description
   */
  private generateCareerTimelineEvent(
    type: 'debut' | 'transfer' | 'trophy' | 'award' | 'milestone',
    player: Player,
    club: Club
  ): string {
    switch (type) {
      case 'debut':
        return `Made professional debut for ${club.name}`;
      case 'transfer':
        return `Joined ${club.name} from previous club`;
      case 'trophy':
        return `Won ${['League Title', 'Domestic Cup', 'Champions League'][Math.floor(Math.random() * 3)]} with ${club.name}`;
      case 'award':
        return `Won ${['Player of the Year', 'Golden Boot', 'Ballon d\'Or'][Math.floor(Math.random() * 3)]} award`;
      case 'milestone':
        return `Reached ${Math.floor(Math.random() * 5) + 1}00 appearances for ${club.name}`;
      default:
        return `Career event`;
    }
  }

  /**
   * Generate a club profile
   */
  private generateClubProfile(date: DateString): ClubProfile | null {
    // Select a random club for profile
    const club = this.getRandomClub();
    if (!club) return null;

    // Select a random journalist
    const journalist = this.getRandomJournalist(['club_profile']);
    const source = journalist ? this.mediaSources.get(journalist.sourceId) : this.getRandomMediaSource();

    // Generate honours
    const honours: ClubHonour[] = [
      { competition: 'League Title', titles: 5 + Math.floor(Math.random() * 11), years: Array.from({ length: 3 }, () => 1990 + Math.floor(Math.random() * 31)) },
      { competition: 'Domestic Cup', titles: 3 + Math.floor(Math.random() * 8), years: Array.from({ length: 2 }, () => 1995 + Math.floor(Math.random() * 26)) },
      { competition: 'Champions League', titles: Math.floor(Math.random() * 3), years: Array.from({ length: Math.floor(Math.random() * 2) + 1 }, () => 2000 + Math.floor(Math.random() * 21)) },
    ];

    // Generate squad
    const squad: ClubProfilePlayer[] = this.getPlayersFromClub(club.id).map(player => ({
      playerId: player.id,
      name: `${player.firstName} ${player.lastName}`,
      position: player.position,
      currentAbility: player.currentAbility,
      potentialAbility: player.potentialAbility,
      wage: player.wage,
      contractExpiry: player.contract?.expiryDate || 'Unknown',
    }));

    // Generate finances
    const finances = {
      revenue: 100000000 + Math.floor(Math.random() * 400000001),
      expenses: 80000000 + Math.floor(Math.random() * 300000001),
      profit: -5000000 + Math.floor(Math.random() * 50000001),
      wageBill: 50000000 + Math.floor(Math.random() * 100000001),
      transferBalance: -10000000 + Math.floor(Math.random() * 50000001),
    };

    // Generate history
    const history: ClubProfileEvent[] = [];
    const years = [1900, 1925, 1950, 1975, 2000, 2005, 2010, 2015, 2020];
    
    for (const year of years) {
      if (Math.random() > 0.6) {
        const eventTypes = ['founded', 'stadium_move', 'trophy', 'relegation', 'promotion', 'takeover'];
        const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)] as const;
        
        history.push({
          date: `${year}-01-01`,
          type: eventType,
          description: this.generateClubHistoryEvent(eventType, club),
        });
      }
    }

    const id = this.generateId();
    const sentiment = 'positive' as MediaSentiment;
    const importance = STORY_IMPORTANCE_BY_TYPE.club_profile;

    const profile: ClubProfile = {
      id,
      type: 'club_profile',
      title: `${club.name}: Club profile`,
      content: `Comprehensive profile of ${club.name}, including history, honours, squad, and financial information.`,
      date,
      authorId: journalist?.id || null,
      source: source?.name || 'TACTICO Club Profiles',
      primaryEntityId: club.id,
      primaryEntityType: 'club',
      secondaryEntityIds: [],
      sentiment,
      importance,
      views: 0,
      likes: 0,
      shares: 0,
      comments: 0,
      tags: this.generateTags('club_profile', 'club', club.id),
      clubId: club.id,
      founded: club.foundedYear || 1900,
      stadium: club.stadiumName || 'Stadium',
      capacity: club.stadiumCapacity,
      honours,
      squad,
      finances,
      history,
    };

    this.mediaStories.set(id, profile);
    this.clubProfiles.set(id, profile);

    return profile;
  }

  /**
   * Generate club history event description
   */
  private generateClubHistoryEvent(type: 'founded' | 'stadium_move' | 'trophy' | 'relegation' | 'promotion' | 'takeover', club: Club): string {
    switch (type) {
      case 'founded':
        return `Club was founded`;
      case 'stadium_move':
        return `Moved to ${club.stadiumName || 'new stadium'}`;
      case 'trophy':
        return `Won first major trophy`;
      case 'relegation':
        return `Suffered relegation to lower division`;
      case 'promotion':
        return `Achieved promotion to top division`;
      case 'takeover':
        return `New ownership took over the club`;
      default:
        return `Historical event`;
    }
  }

  /**
   * Generate a manager profile
   */
  private generateManagerProfile(date: DateString): ManagerProfile | null {
    // Select a random manager for profile
    const manager = this.getRandomManager();
    if (!manager) return null;

    const club = this.clubs.get(manager.clubId!);
    if (!club) return null;

    // Select a random journalist
    const journalist = this.getRandomJournalist(['manager_profile']);
    const source = journalist ? this.mediaSources.get(journalist.sourceId) : this.getRandomMediaSource();

    // Generate career stats
    const careerStats = {
      matches: 200 + Math.floor(Math.random() * 301),
      wins: 100 + Math.floor(Math.random() * 151),
      draws: 50 + Math.floor(Math.random() * 51),
      losses: 50 + Math.floor(Math.random() * 51),
      winPercentage: 50 + Math.floor(Math.random() * 21),
      trophies: 5 + Math.floor(Math.random() * 11),
    };

    // Generate management style
    const managementStyle = {
      formation: manager.preferred_formation,
      philosophy: ['Possession-based football', 'High pressing', 'Counter-attacking', 'Defensive solidity'][Math.floor(Math.random() * 4)],
      strengths: Array.from({ length: 3 }, () => ['Tactical knowledge', 'Man management', 'Motivation', 'Adaptability', 'Leadership'][Math.floor(Math.random() * 5)]),
      weaknesses: Array.from({ length: 2 }, () => ['Stubbornness', 'Lack of patience', 'Over-rotation', 'Poor man management'][Math.floor(Math.random() * 4)]),
    };

    // Generate career timeline
    const careerTimeline: ManagerProfileEvent[] = [];
    const years = [2000, 2005, 2010, 2015, 2018, 2020, 2022];
    
    for (const year of years) {
      if (Math.random() > 0.6) {
        const eventTypes = ['appointment', 'departure', 'trophy', 'award', 'sacking'];
        const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)] as const;
        
        careerTimeline.push({
          date: `${year}-${String(1 + Math.floor(Math.random() * 12)).padStart(2, '0')}-01`,
          type: eventType,
          description: this.generateManagerCareerEvent(eventType, manager, club),
          clubId: club.id,
        });
      }
    }

    // Generate quotes
    const quotes: ManagerProfileQuote[] = [];

    // Player quote
    const player = this.getRandomPlayerFromClub(club.id);
    if (player && Math.random() > 0.5) {
      quotes.push({
        speakerId: player.id,
        speakerType: 'player',
        speakerName: `${player.firstName} ${player.lastName}`,
        quote: `The manager has been great for my development. He gives me the confidence to play my game.`,
        context: 'On working with the manager',
      });
    }

    // Chairman quote
    if (Math.random() > 0.5) {
      quotes.push({
        speakerId: null,
        speakerType: 'chairman',
        speakerName: 'Club Chairman',
        quote: `${manager.firstName} has done an excellent job. We're very happy with his work.`,
        context: "On the manager's performance",
      });
    }

    // Self quote
    if (Math.random() > 0.5) {
      quotes.push({
        speakerId: manager.id,
        speakerType: 'self',
        speakerName: `${manager.firstName} ${manager.lastName}`,
        quote: `I'm proud of what we've achieved so far, but there's still a lot of work to do.`,
        context: 'On personal philosophy',
      });
    }

    const id = this.generateId();
    const sentiment = 'positive' as MediaSentiment;
    const importance = STORY_IMPORTANCE_BY_TYPE.manager_profile;

    const profile: ManagerProfile = {
      id,
      type: 'manager_profile',
      title: `${manager.firstName} ${manager.lastName}: Manager profile`,
      content: `Comprehensive profile of ${manager.firstName} ${manager.lastName}, including career statistics, management style, and achievements.`,
      date,
      authorId: journalist?.id || null,
      source: source?.name || 'TACTICO Manager Profiles',
      primaryEntityId: manager.id,
      primaryEntityType: 'manager',
      secondaryEntityIds: [club.id],
      sentiment,
      importance,
      views: 0,
      likes: 0,
      shares: 0,
      comments: 0,
      tags: this.generateTags('manager_profile', 'manager', manager.id),
      managerId: manager.id,
      careerStats,
      managementStyle,
      careerTimeline,
      quotes,
    };

    this.mediaStories.set(id, profile);
    this.managerProfiles.set(id, profile);

    return profile;
  }

  /**
   * Generate manager career event description
   */
  private generateManagerCareerEvent(
    type: 'appointment' | 'departure' | 'trophy' | 'award' | 'sacking' | 'resignation',
    manager: Manager,
    club: Club
  ): string {
    switch (type) {
      case 'appointment':
        return `Appointed as manager of ${club.name}`;
      case 'departure':
        return `Left ${club.name} to join another club`;
      case 'trophy':
        return `Won ${['League Title', 'Domestic Cup', 'Champions League'][Math.floor(Math.random() * 3)]} with ${club.name}`;
      case 'award':
        return `Won Manager of the Year award`;
      case 'sacking':
        return `Sacked by ${club.name} after poor results`;
      case 'resignation':
        return `Resigned as manager of ${club.name}`;
      default:
        return `Career event`;
    }
  }

  /**
   * Generate a season review
   */
  private generateSeasonReview(date: DateString): SeasonReview | null {
    // Select a random competition for season review
    const competitionId = 1; // Premier League
    const season = 2025; // Last completed season

    // Select a random journalist
    const journalist = this.getRandomJournalist(['season_review']);
    const source = journalist ? this.mediaSources.get(journalist.sourceId) : this.getRandomMediaSource();

    // Generate final standings
    const finalStandings: SeasonReviewStanding[] = [];
    const clubs = Array.from(this.clubs.values()).slice(0, 20); // Top 20 clubs
    
    clubs.forEach((club, index) => {
      finalStandings.push({
        position: index + 1,
        clubId: club.id,
        clubName: club.name,
        played: 38,
        won: 10 + Math.floor(Math.random() * 19),
        drawn: 5 + Math.floor(Math.random() * 11),
        lost: 13 - Math.floor(Math.random() * 14),
        goalsFor: 40 + Math.floor(Math.random() * 41),
        goalsAgainst: 30 + Math.floor(Math.random() * 31),
        goalDifference: -10 + Math.floor(Math.random() * 41),
        points: 40 + Math.floor(Math.random() * 41),
      });
    });

    // Sort by points
    finalStandings.sort((a, b) => b.points - a.points);

    // Generate top performers
    const topScorer = this.getRandomPlayer();
    const mostAssists = this.getRandomPlayer();
    const mostCleanSheets = this.getRandomPlayer();
    const playerOfTheSeason = this.getRandomPlayer();
    const youngPlayerOfTheSeason = this.getRandomPlayer();
    const managerOfTheSeason = this.getRandomManager();

    // Generate season stats
    const totalGoals = finalStandings.reduce((sum, team) => sum + team.goalsFor, 0);
    const totalMatches = 380; // 20 teams * 19 matches each
    const averageGoalsPerGame = totalGoals / totalMatches;

    const stats = {
      totalGoals,
      averageGoalsPerGame: Math.round(averageGoalsPerGame * 10) / 10,
      totalMatches,
      homeWins: 150 + Math.floor(Math.random() * 51),
      awayWins: 100 + Math.floor(Math.random() * 51),
      draws: 100 + Math.floor(Math.random() * 31),
      losses: 30 + Math.floor(Math.random() * 21),
    };

    // Generate awards
    const awards: SeasonReviewAward[] = [
      { name: 'Player of the Season', winnerId: playerOfTheSeason?.id || null, winnerName: playerOfTheSeason ? `${playerOfTheSeason.firstName} ${playerOfTheSeason.lastName}` : 'Unknown', clubId: playerOfTheSeason?.clubId || null },
      { name: 'Young Player of the Season', winnerId: youngPlayerOfTheSeason?.id || null, winnerName: youngPlayerOfTheSeason ? `${youngPlayerOfTheSeason.firstName} ${youngPlayerOfTheSeason.lastName}` : 'Unknown', clubId: youngPlayerOfTheSeason?.clubId || null },
      { name: 'Manager of the Season', winnerId: managerOfTheSeason?.id || null, winnerName: managerOfTheSeason ? `${managerOfTheSeason.firstName} ${managerOfTheSeason.lastName}` : 'Unknown', clubId: managerOfTheSeason?.clubId || null },
      { name: 'Top Scorer', winnerId: topScorer?.id || null, winnerName: topScorer ? `${topScorer.firstName} ${topScorer.lastName}` : 'Unknown', clubId: topScorer?.clubId || null },
      { name: 'Most Assists', winnerId: mostAssists?.id || null, winnerName: mostAssists ? `${mostAssists.firstName} ${mostAssists.lastName}` : 'Unknown', clubId: mostAssists?.clubId || null },
      { name: 'Golden Glove', winnerId: mostCleanSheets?.id || null, winnerName: mostCleanSheets ? `${mostCleanSheets.firstName} ${mostCleanSheets.lastName}` : 'Unknown', clubId: mostCleanSheets?.clubId || null },
    ];

    const id = this.generateId();
    const sentiment = 'positive' as MediaSentiment;
    const importance = STORY_IMPORTANCE_BY_TYPE.season_review;

    const review: SeasonReview = {
      id,
      type: 'season_review',
      title: `Season review: ${season}/${season + 1} ${this.getCompetitionName(competitionId)}`,
      content: `Comprehensive review of the ${season}/${season + 1} season, including final standings, top performers, statistics, and awards.`,
      date,
      authorId: journalist?.id || null,
      source: source?.name || 'TACTICO Season Review',
      primaryEntityId: competitionId,
      primaryEntityType: 'match',
      secondaryEntityIds: [],
      sentiment,
      importance,
      views: 0,
      likes: 0,
      shares: 0,
      comments: 0,
      tags: this.generateTags('season_review', 'match', competitionId),
      clubId: null,
      competitionId,
      season,
      finalStandings,
      topPerformers: {
        topScorer: topScorer?.id || null,
        mostAssists: mostAssists?.id || null,
        mostCleanSheets: mostCleanSheets?.id || null,
        playerOfTheSeason: playerOfTheSeason?.id || null,
        youngPlayerOfTheSeason: youngPlayerOfTheSeason?.id || null,
        managerOfTheSeason: managerOfTheSeason?.id || null,
      },
      stats,
      awards,
    };

    this.mediaStories.set(id, review);
    this.seasonReviews.set(id, review);

    return review;
  }

  /**
   * Get competition name
   */
  private getCompetitionName(competitionId: EntityId): string {
    // In a real implementation, this would look up the competition name
    return 'Premier League';
  }

  /**
   * Generate a season preview
   */
  private generateSeasonPreview(date: DateString): SeasonPreview | null {
    // Select a random competition for season preview
    const competitionId = 1; // Premier League
    const season = 2026; // Upcoming season

    // Select a random journalist
    const journalist = this.getRandomJournalist(['season_preview']);
    const source = journalist ? this.mediaSources.get(journalist.sourceId) : this.getRandomMediaSource();

    // Generate predicted standings
    const predictedStandings: SeasonPreviewStanding[] = [];
    const clubs = Array.from(this.clubs.values()).slice(0, 20); // Top 20 clubs
    
    clubs.forEach((club, index) => {
      predictedStandings.push({
        position: index + 1,
        clubId: club.id,
        clubName: club.name,
        predictedPoints: 40 + Math.floor(Math.random() * 51),
        predictedGoalsFor: 40 + Math.floor(Math.random() * 41),
        predictedGoalsAgainst: 30 + Math.floor(Math.random() * 31),
      });
    });

    // Sort by predicted points
    predictedStandings.sort((a, b) => b.predictedPoints - a.predictedPoints);

    // Generate title contenders (top 4)
    const titleContenders = predictedStandings.slice(0, 4).map(t => t.clubId);

    // Generate relegation candidates (bottom 3)
    const relegationCandidates = predictedStandings.slice(-3).map(t => t.clubId);

    // Generate players to watch
    const playersToWatch = Array.from({ length: 5 }, () => this.getRandomPlayer()?.id || 0).filter(Boolean) as EntityId[];

    // Generate managers to watch
    const managersToWatch = Array.from({ length: 5 }, () => this.getRandomManager()?.id || 0).filter(Boolean) as EntityId[];

    // Generate key questions
    const keyQuestions = [
      `Can ${this.clubs.get(titleContenders[0])?.name || 'the champions'} retain their title?`,
      `Which newly promoted team will make the biggest impact?`,
      `Will the top scorer from last season repeat their feat?`,
      `Can any team break into the top four?`,
      `Who will be the surprise package of the season?`,
    ];

    const id = this.generateId();
    const sentiment = 'positive' as MediaSentiment;
    const importance = STORY_IMPORTANCE_BY_TYPE.season_preview;

    const preview: SeasonPreview = {
      id,
      type: 'season_preview',
      title: `Season preview: ${season}/${season + 1} ${this.getCompetitionName(competitionId)}`,
      content: `Preview of the upcoming ${season}/${season + 1} season, including predicted standings, title contenders, relegation candidates, and players to watch.`,
      date,
      authorId: journalist?.id || null,
      source: source?.name || 'TACTICO Season Preview',
      primaryEntityId: competitionId,
      primaryEntityType: 'match',
      secondaryEntityIds: [],
      sentiment,
      importance,
      views: 0,
      likes: 0,
      shares: 0,
      comments: 0,
      tags: this.generateTags('season_preview', 'match', competitionId),
      competitionId,
      season,
      predictedStandings,
      titleContenders,
      relegationCandidates,
      playersToWatch,
      managersToWatch,
      keyQuestions,
    };

    this.mediaStories.set(id, preview);
    this.seasonPreviews.set(id, preview);

    return preview;
  }

  // ============================================
  // MEDIA SOURCE AND JOURNALIST METHODS
  // ============================================

  /**
   * Add a media source
   */
  addMediaSource(source: MediaSource): void {
    this.mediaSources.set(source.id, source);
  }

  /**
   * Remove a media source
   */
  removeMediaSource(sourceId: EntityId): void {
    this.mediaSources.delete(sourceId);
    // Remove journalists from this source
    this.journalists.forEach((journalist, journalistId) => {
      if (journalist.sourceId === sourceId) {
        this.journalists.delete(journalistId);
      }
    });
  }

  /**
   * Get a media source
   */
  getMediaSource(sourceId: EntityId): MediaSource | null {
    return this.mediaSources.get(sourceId) || null;
  }

  /**
   * Get all media sources
   */
  getAllMediaSources(): MediaSource[] {
    return Array.from(this.mediaSources.values());
  }

  /**
   * Add a journalist
   */
  addJournalist(journalist: Journalist): void {
    this.journalists.set(journalist.id, journalist);
  }

  /**
   * Remove a journalist
   */
  removeJournalist(journalistId: EntityId): void {
    this.journalists.delete(journalistId);
  }

  /**
   * Get a journalist
   */
  getJournalist(journalistId: EntityId): Journalist | null {
    return this.journalists.get(journalistId) || null;
  }

  /**
   * Get all journalists
   */
  getAllJournalists(): Journalist[] {
    return Array.from(this.journalists.values());
  }

  /**
   * Get a random media source
   */
  private getRandomMediaSource(): MediaSource | null {
    const sources = Array.from(this.mediaSources.values());
    if (sources.length === 0) return null;
    return sources[Math.floor(Math.random() * sources.length)];
  }

  /**
   * Get a random journalist with specific specializations
   */
  private getRandomJournalist(specializations?: MediaStoryType[]): Journalist | null {
    const journalists = Array.from(this.journalists.values());
    if (journalists.length === 0) return null;

    if (specializations && specializations.length > 0) {
      const specializedJournalists = journalists.filter(j =>
        specializations.some(s => j.specializesIn.includes(s))
      );
      if (specializedJournalists.length > 0) {
        return specializedJournalists[Math.floor(Math.random() * specializedJournalists.length)];
      }
    }

    return journalists[Math.floor(Math.random() * journalists.length)];
  }

  // ============================================
  // ENTITY GETTERS
  // ============================================

  /**
   * Get a random player
   */
  private getRandomPlayer(): Player | null {
    const players = Array.from(this.players.values());
    if (players.length === 0) return null;
    return players[Math.floor(Math.random() * players.length)];
  }

  /**
   * Get a random club
   */
  private getRandomClub(): Club | null {
    const clubs = Array.from(this.clubs.values());
    if (clubs.length === 0) return null;
    return clubs[Math.floor(Math.random() * clubs.length)];
  }

  /**
   * Get a random manager
   */
  private getRandomManager(): Manager | null {
    const managers = Array.from(this.managers.values());
    if (managers.length === 0) return null;
    return managers[Math.floor(Math.random() * managers.length)];
  }

  /**
   * Get a random match
   */
  private getRandomMatch(): Match | null {
    const matches = Array.from(this.matches.values());
    if (matches.length === 0) return null;
    return matches[Math.floor(Math.random() * matches.length)];
  }

  /**
   * Get a random completed match (played before or on the given date)
   */
  private getRandomCompletedMatch(date: DateString): Match | null {
    const completedMatches = Array.from(this.matches.values()).filter(
      m => m.status === 'completed' && m.match_date <= date
    );
    if (completedMatches.length === 0) return null;
    return completedMatches[Math.floor(Math.random() * completedMatches.length)];
  }

  /**
   * Get a random upcoming match (played after the given date)
   */
  private getRandomUpcomingMatch(date: DateString): Match | null {
    const upcomingMatches = Array.from(this.matches.values()).filter(
      m => m.status === 'scheduled' && m.match_date > date
    );
    if (upcomingMatches.length === 0) return null;
    return upcomingMatches[Math.floor(Math.random() * upcomingMatches.length)];
  }

  /**
   * Get a random club other than the specified one
   */
  private getRandomClubOtherThan(excludeId: EntityId): Club | null {
    const clubs = Array.from(this.clubs.values()).filter(c => c.id !== excludeId);
    if (clubs.length === 0) return null;
    return clubs[Math.floor(Math.random() * clubs.length)];
  }

  /**
   * Get players from a specific club
   */
  private getPlayersFromClub(clubId: EntityId): Player[] {
    return Array.from(this.players.values()).filter(p => p.clubId === clubId);
  }

  /**
   * Get a random player from a specific club
   */
  private getRandomPlayerFromClub(clubId: EntityId, excludeId?: EntityId): Player | null {
    const players = this.getPlayersFromClub(clubId).filter(p => p.id !== excludeId);
    if (players.length === 0) return null;
    return players[Math.floor(Math.random() * players.length)];
  }

  /**
   * Get random players from a specific club
   */
  private getRandomPlayersFromClub(clubId: EntityId, count: number): EntityId[] {
    const players = this.getPlayersFromClub(clubId);
    const selected: EntityId[] = [];
    
    for (let i = 0; i < Math.min(count, players.length); i++) {
      const player = players[Math.floor(Math.random() * players.length)];
      if (player && !selected.includes(player.id)) {
        selected.push(player.id);
      }
    }
    
    return selected;
  }

  /**
   * Get a random nation code
   */
  private getRandomNationCode(): string | null {
    // In a real implementation, this would get from the nations map
    const nationCodes = ['ENG', 'ESP', 'DEU', 'FRA', 'ITA', 'BRA', 'ARG', 'NED', 'POR', 'BEL'];
    return nationCodes[Math.floor(Math.random() * nationCodes.length)];
  }

  /**
   * Get manager for a club
   */
  private getManagerForClub(clubId: EntityId): Manager | null {
    return Array.from(this.managers.values()).find(m => m.clubId === clubId) || null;
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Select a random item based on weights
   */
  private selectWeightedRandom<T extends string>(weights: Record<T, number>): T {
    const entries = Object.entries(weights) as [T, number][];
    const totalWeight = entries.reduce((sum, [_, weight]) => sum + weight, 0);
    let random = Math.random() * totalWeight;

    for (const [item, weight] of entries) {
      random -= weight;
      if (random <= 0) {
        return item;
      }
    }

    return entries[0][0];
  }

  /**
   * Generate tags for a story
   */
  private generateTags(storyType: MediaStoryType, entityType: 'player' | 'club' | 'manager' | 'nation' | 'match' | null, entityId: EntityId | null): string[] {
    const tags: string[] = [storyType];

    if (entityType) {
      tags.push(entityType);
      
      if (entityId) {
        switch (entityType) {
          case 'player':
            const player = this.players.get(entityId);
            if (player) {
              tags.push(player.position.toLowerCase());
              tags.push(player.clubId ? this.clubs.get(player.clubId)?.name.toLowerCase().replace(/\s+/g, '-') || '' : '');
            }
            break;
          case 'club':
            const club = this.clubs.get(entityId);
            if (club) {
              tags.push(club.name.toLowerCase().replace(/\s+/g, '-'));
              tags.push(club.nationCode.toLowerCase());
            }
            break;
          case 'manager':
            const manager = this.managers.get(entityId);
            if (manager) {
              tags.push(manager.preferred_formation.toLowerCase().replace(/[-_]/g, ''));
              if (manager.clubId) {
                const managerClub = this.clubs.get(manager.clubId);
                if (managerClub) {
                  tags.push(managerClub.name.toLowerCase().replace(/\s+/g, '-'));
                }
              }
            }
            break;
          case 'match':
            const match = this.matches.get(entityId);
            if (match) {
              const homeClub = this.clubs.get(match.home_club_id);
              const awayClub = this.clubs.get(match.away_club_id);
              if (homeClub) tags.push(homeClub.name.toLowerCase().replace(/\s+/g, '-'));
              if (awayClub) tags.push(awayClub.name.toLowerCase().replace(/\s+/g, '-'));
            }
            break;
        }
      }
    }

    // Add some general tags
    const generalTags = ['football', 'soccer', 'tactico'];
    tags.push(...generalTags);

    return tags.filter(tag => tag && tag.length > 0);
  }

  /**
   * Get current date
   */
  private getCurrentDate(): DateString {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Add days to a date
   */
  private addDaysToDate(date: DateString, days: number): DateString {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }

  /**
   * Generate a unique ID
   */
  private generateId(): EntityId {
    return Math.floor(Math.random() * 1000000000);
  }

  // ============================================
  // ENTITY MANAGEMENT METHODS
  // ============================================

  /**
   * Add a player
   */
  addPlayer(player: Player): void {
    this.players.set(player.id, player);
  }

  /**
   * Remove a player
   */
  removePlayer(playerId: EntityId): void {
    this.players.delete(playerId);
  }

  /**
   * Add a club
   */
  addClub(club: Club): void {
    this.clubs.set(club.id, club);
  }

  /**
   * Remove a club
   */
  removeClub(clubId: EntityId): void {
    this.clubs.delete(clubId);
  }

  /**
   * Add a manager
   */
  addManager(manager: Manager): void {
    this.managers.set(manager.id, manager);
  }

  /**
   * Remove a manager
   */
  removeManager(managerId: EntityId): void {
    this.managers.delete(managerId);
  }

  /**
   * Add a match
   */
  addMatch(match: Match): void {
    this.matches.set(match.id, match);
  }

  /**
   * Remove a match
   */
  removeMatch(matchId: EntityId): void {
    this.matches.delete(matchId);
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.players.clear();
    this.clubs.clear();
    this.managers.clear();
    this.matches.clear();
    this.mediaStories.clear();
    this.newsArticles.clear();
    this.rumors.clear();
    this.interviews.clear();
    this.pressConferences.clear();
    this.matchReports.clear();
    this.matchPreviews.clear();
    this.analysisArticles.clear();
    this.opinionPieces.clear();
    this.transferNews.clear();
    this.injuryUpdates.clear();
    this.contractNews.clear();
    this.tacticalAnalyses.clear();
    this.playerProfiles.clear();
    this.clubProfiles.clear();
    this.managerProfiles.clear();
    this.seasonReviews.clear();
    this.seasonPreviews.clear();
    this.mediaSources.clear();
    this.journalists.clear();
    this.socialMediaAccounts.clear();
    this.socialMediaPosts.clear();
  }
}
