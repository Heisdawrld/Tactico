// TACTICO World Engine - Media Types

import { EntityId, DateString } from '../core/types';

// ============================================
// MEDIA TYPES
// ============================================

/** Media story type */
export type MediaStoryType = 
  | 'news'
  | 'rumor'
  | 'interview'
  | 'press_conference'
  | 'match_report'
  | 'match_preview'
  | 'analysis'
  | 'opinion'
  | 'transfer_news'
  | 'injury_update'
  | 'contract_news'
  | 'tactical_analysis'
  | 'player_profile'
  | 'club_profile'
  | 'manager_profile'
  | 'season_review'
  | 'season_preview';

/** Media sentiment */
export type MediaSentiment = 
  | 'very_negative'
  | 'negative'
  | 'neutral'
  | 'positive'
  | 'very_positive';

/** Media importance */
export type MediaImportance = 
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

/** Media story */
export interface MediaStory {
  id: EntityId;
  type: MediaStoryType;
  title: string;
  content: string;
  // Metadata
  date: DateString;
  authorId: EntityId | null;
  source: string; // e.g., "TACTICO News", "Football Daily"
  // Related entities
  primaryEntityId: EntityId | null;
  primaryEntityType: 'player' | 'club' | 'manager' | 'nation' | 'match' | null;
  secondaryEntityIds: EntityId[];
  // Classification
  sentiment: MediaSentiment;
  importance: MediaImportance;
  // Engagement
  views: number;
  likes: number;
  shares: number;
  comments: number;
  // SEO
  tags: string[];
}

/** News article */
export interface NewsArticle extends MediaStory {
  type: 'news';
  category: NewsCategory;
  isBreaking: boolean;
  relatedStories: EntityId[];
}

/** News category */
export type NewsCategory = 
  | 'transfers'
  | 'matches'
  | 'injuries'
  | 'tactics'
  | 'finance'
  | 'youth'
  | 'international'
  | 'domestic'
  | 'other';

/** Rumor */
export interface Rumor extends MediaStory {
  type: 'rumor';
  reliability: number; // 0-100
  sourceType: 'anonymous' | 'reliable' | 'unreliable' | 'agent' | 'club_official';
  confirmationStatus: 'unconfirmed' | 'confirmed' | 'denied' | 'developing';
  relatedFacts: EntityId[]; // Related confirmed stories
}

/** Interview */
export interface Interview extends MediaStory {
  type: 'interview';
  intervieweeId: EntityId;
  intervieweeType: 'player' | 'manager' | 'chairman' | 'coach' | 'scout' | 'agent';
  interviewerId: EntityId | null;
  questions: InterviewQuestion[];
  location: string;
  durationMinutes: number;
}

/** Interview question */
export interface InterviewQuestion {
  id: EntityId;
  question: string;
  answer: string;
  order: number;
  topic: string;
  sentiment: MediaSentiment;
}

/** Press conference */
export interface PressConference extends MediaStory {
  type: 'press_conference';
  managerId: EntityId;
  clubId: EntityId;
  context: 'pre_match' | 'post_match' | 'general' | 'crisis' | 'announcement';
  questions: PressConferenceQuestion[];
  attendance: number;
}

/** Press conference question */
export interface PressConferenceQuestion {
  id: EntityId;
  journalistId: EntityId | null;
  journalistName: string;
  question: string;
  answer: string;
  order: number;
  topic: string;
  sentiment: MediaSentiment;
  followUp: boolean;
}

/** Match report */
export interface MatchReport extends MediaStory {
  type: 'match_report';
  matchId: EntityId;
  homeClubId: EntityId;
  awayClubId: EntityId;
  homeScore: number;
  awayScore: number;
  // Match stats
  stats: {
    possession: { home: number; away: number };
    shots: { home: number; away: number; onTarget: { home: number; away: number } };
    passes: { home: { completed: number; attempted: number }; away: { completed: number; attempted: number } };
    tackles: { home: { won: number; attempted: number }; away: { won: number; attempted: number } };
    fouls: { home: number; away: number };
    cards: { home: { yellow: number; red: number }; away: { yellow: number; red: number } };
  };
  // Key moments
  keyMoments: MatchReportKeyMoment[];
  // Player ratings
  playerRatings: Record<EntityId, number>;
  // Man of the match
  manOfTheMatchId: EntityId | null;
}

/** Match report key moment */
export interface MatchReportKeyMoment {
  minute: number;
  second: number;
  type: 'goal' | 'assist' | 'save' | 'miss' | 'foul' | 'card' | 'substitution' | 'penalty' | 'injury';
  playerId: EntityId | null;
  clubId: EntityId | null;
  description: string;
  isSignificant: boolean;
}

/** Match preview */
export interface MatchPreview extends MediaStory {
  type: 'match_preview';
  matchId: EntityId;
  homeClubId: EntityId;
  awayClubId: EntityId;
  // Predictions
  homeWinProbability: number; // 0-100
  drawProbability: number; // 0-100
  awayWinProbability: number; // 0-100
  predictedScore: string; // e.g., "2-1"
  // Key players to watch
  keyPlayers: EntityId[];
  // Team news
  teamNews: {
    home: TeamNews;
    away: TeamNews;
  };
  // Head to head
  headToHead: HeadToHeadStats;
}

/** Team news */
export interface TeamNews {
  injuries: EntityId[];
  suspensions: EntityId[];
  doubts: EntityId[];
  likelyLineup: EntityId[];
  formation: string;
  managerQuote: string | null;
}

/** Head to head stats */
export interface HeadToHeadStats {
  totalMatches: number;
  homeWins: number;
  awayWins: number;
  draws: number;
  homeGoals: number;
  awayGoals: number;
  last5: string; // e.g., "WWLDL"
}

/** Analysis article */
export interface AnalysisArticle extends MediaStory {
  type: 'analysis';
  focus: AnalysisFocus;
  data: Record<string, number | string>;
  conclusions: string[];
  recommendations: string[];
}

/** Analysis focus */
export type AnalysisFocus = 
  | 'player_performance'
  | 'team_performance'
  | 'tactical_analysis'
  | 'transfer_analysis'
  | 'financial_analysis'
  | 'youth_development'
  | 'manager_performance'
  | 'league_analysis'
  | 'season_review';

/** Opinion piece */
export interface OpinionPiece extends MediaStory {
  type: 'opinion';
  authorType: 'journalist' | 'pundit' | 'former_player' | 'former_manager' | 'fan';
  stance: 'critical' | 'supportive' | 'balanced' | 'controversial';
  arguments: OpinionArgument[];
  counterArguments: OpinionArgument[];
}

/** Opinion argument */
export interface OpinionArgument {
  id: EntityId;
  point: string;
  evidence: string[];
  strength: number; // 0-100
}

/** Transfer news */
export interface TransferNews extends MediaStory {
  type: 'transfer_news';
  playerId: EntityId;
  fromClubId: EntityId | null;
  toClubId: EntityId | null;
  status: 'rumor' | 'negotiating' | 'medical' | 'completed' | 'collapsed' | 'rejected';
  fee: number | null;
  wage: number | null;
  contractLength: number | null; // In years
  quotes: TransferQuote[];
}

/** Transfer quote */
export interface TransferQuote {
  speakerId: EntityId | null;
  speakerType: 'player' | 'manager' | 'chairman' | 'agent' | 'journalist';
  speakerName: string;
  quote: string;
  sentiment: MediaSentiment;
}

/** Injury update */
export interface InjuryUpdate extends MediaStory {
  type: 'injury_update';
  playerId: EntityId;
  clubId: EntityId;
  injuryType: string;
  severity: string;
  estimatedReturn: DateString | null;
  quotes: InjuryQuote[];
}

/** Injury quote */
export interface InjuryQuote {
  speakerId: EntityId | null;
  speakerType: 'manager' | 'doctor' | 'physio' | 'player' | 'journalist';
  speakerName: string;
  quote: string;
  sentiment: MediaSentiment;
}

/** Contract news */
export interface ContractNews extends MediaStory {
  type: 'contract_news';
  playerId: EntityId;
  clubId: EntityId;
  contractType: 'new' | 'extension' | 'expiry' | 'release' | 'retirement';
  duration: number | null; // In years
  wage: number | null;
  quotes: ContractQuote[];
}

/** Contract quote */
export interface ContractQuote {
  speakerId: EntityId | null;
  speakerType: 'player' | 'manager' | 'chairman' | 'agent';
  speakerName: string;
  quote: string;
  sentiment: MediaSentiment;
}

/** Tactical analysis */
export interface TacticalAnalysis extends MediaStory {
  type: 'tactical_analysis';
  matchId: EntityId | null;
  clubId: EntityId | null;
  playerId: EntityId | null;
  formation: string | null;
  tactics: TacticalAnalysisTactic[];
  effectiveness: Record<string, number>; // Tactic -> effectiveness (0-100)
  recommendations: TacticalRecommendation[];
}

/** Tactical analysis tactic */
export interface TacticalAnalysisTactic {
  name: string;
  description: string;
  usage: number; // 0-100 (how often used)
  successRate: number; // 0-100
}

/** Tactical recommendation */
export interface TacticalRecommendation {
  type: 'formation_change' | 'personnel_change' | 'style_change' | 'instruction_change';
  description: string;
  expectedImpact: string;
  priority: 'low' | 'medium' | 'high';
}

/** Player profile */
export interface PlayerProfile extends MediaStory {
  type: 'player_profile';
  playerId: EntityId;
  // Career stats
  careerStats: {
    appearances: number;
    goals: number;
    assists: number;
    cleanSheets: number;
    yellowCards: number;
    redCards: number;
    trophies: number;
  };
  // Attributes
  attributes: Record<string, number>;
  // Career timeline
  careerTimeline: PlayerProfileEvent[];
  // Quotes
  quotes: PlayerProfileQuote[];
  // Fun facts
  funFacts: string[];
}

/** Player profile event */
export interface PlayerProfileEvent {
  date: DateString;
  type: 'debut' | 'transfer' | 'trophy' | 'award' | 'milestone' | 'injury' | 'retirement';
  description: string;
  clubId: EntityId | null;
}

/** Player profile quote */
export interface PlayerProfileQuote {
  speakerId: EntityId | null;
  speakerType: 'teammate' | 'manager' | 'pundit' | 'fan' | 'self';
  speakerName: string;
  quote: string;
  context: string;
}

/** Club profile */
export interface ClubProfile extends MediaStory {
  type: 'club_profile';
  clubId: EntityId;
  // Club info
  founded: number;
  stadium: string;
  capacity: number;
  // Honours
  honours: ClubHonour[];
  // Squad
  squad: ClubProfilePlayer[];
  // Finances
  finances: {
    revenue: number;
    expenses: number;
    profit: number;
    wageBill: number;
    transferBalance: number;
  };
  // History
  history: ClubProfileEvent[];
}

/** Club honour */
export interface ClubHonour {
  competition: string;
  titles: number;
  years: number[];
}

/** Club profile player */
export interface ClubProfilePlayer {
  playerId: EntityId;
  name: string;
  position: string;
  currentAbility: number;
  potentialAbility: number;
  wage: number;
  contractExpiry: DateString;
}

/** Club profile event */
export interface ClubProfileEvent {
  date: DateString;
  type: 'founded' | 'stadium_move' | 'trophy' | 'relegation' | 'promotion' | 'takeover' | 'crisis';
  description: string;
}

/** Manager profile */
export interface ManagerProfile extends MediaStory {
  type: 'manager_profile';
  managerId: EntityId;
  // Career stats
  careerStats: {
    matches: number;
    wins: number;
    draws: number;
    losses: number;
    winPercentage: number;
    trophies: number;
  };
  // Management style
  managementStyle: {
    formation: string;
    philosophy: string;
    strengths: string[];
    weaknesses: string[];
  };
  // Career timeline
  careerTimeline: ManagerProfileEvent[];
  // Quotes
  quotes: ManagerProfileQuote[];
}

/** Manager profile event */
export interface ManagerProfileEvent {
  date: DateString;
  type: 'appointment' | 'departure' | 'trophy' | 'award' | 'sacking' | 'resignation';
  description: string;
  clubId: EntityId;
}

/** Manager profile quote */
export interface ManagerProfileQuote {
  speakerId: EntityId | null;
  speakerType: 'player' | 'chairman' | 'pundit' | 'journalist' | 'self';
  speakerName: string;
  quote: string;
  context: string;
}

/** Season review */
export interface SeasonReview extends MediaStory {
  type: 'season_review';
  clubId: EntityId | null;
  competitionId: EntityId | null;
  season: number;
  // Final standings
  finalStandings: SeasonReviewStanding[];
  // Top performers
  topPerformers: {
    topScorer: EntityId | null;
    mostAssists: EntityId | null;
    mostCleanSheets: EntityId | null;
    playerOfTheSeason: EntityId | null;
    youngPlayerOfTheSeason: EntityId | null;
    managerOfTheSeason: EntityId | null;
  };
  // Season stats
  stats: {
    totalGoals: number;
    averageGoalsPerGame: number;
    totalMatches: number;
    homeWins: number;
    awayWins: number;
    draws: number;
    losses: number;
  };
  // Awards
  awards: SeasonReviewAward[];
}

/** Season review standing */
export interface SeasonReviewStanding {
  position: number;
  clubId: EntityId;
  clubName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

/** Season review award */
export interface SeasonReviewAward {
  name: string;
  winnerId: EntityId | null;
  winnerName: string;
  clubId: EntityId | null;
}

/** Season preview */
export interface SeasonPreview extends MediaStory {
  type: 'season_preview';
  competitionId: EntityId;
  season: number;
  // Predictions
  predictedStandings: SeasonPreviewStanding[];
  // Title contenders
  titleContenders: EntityId[];
  // Relegation candidates
  relegationCandidates: EntityId[];
  // Players to watch
  playersToWatch: EntityId[];
  // Managers to watch
  managersToWatch: EntityId[];
  // Key questions
  keyQuestions: string[];
}

/** Season preview standing */
export interface SeasonPreviewStanding {
  position: number;
  clubId: EntityId;
  clubName: string;
  predictedPoints: number;
  predictedGoalsFor: number;
  predictedGoalsAgainst: number;
}

// ============================================
// MEDIA SOURCE TYPES
// ============================================

/** Media source */
export interface MediaSource {
  id: EntityId;
  name: string;
  type: 'news_outlet' | 'sports_network' | 'newspaper' | 'magazine' | 'website' | 'radio' | 'tv_channel' | 'social_media';
  country: string;
  language: string;
  reputation: number; // 0-100
  politicalBias: number; // -100 (left) to +100 (right)
  sportsBias: number; // -100 (anti-sports) to +100 (pro-sports)
  clubAffiliation: EntityId | null; // Club this source is affiliated with
  foundedYear: number;
  website: string | null;
}

/** Journalist */
export interface Journalist {
  id: EntityId;
  name: string;
  sourceId: EntityId;
  specializesIn: MediaStoryType[];
  reputation: number; // 0-100
  credibility: number; // 0-100
  style: 'sensational' | 'balanced' | 'analytical' | 'opinionated' | 'investigative';
  bias: number; // -100 to +100
  storiesWritten: number;
  startDate: DateString;
}

/** Social media account */
export interface SocialMediaAccount {
  id: EntityId;
  entityId: EntityId;
  entityType: 'player' | 'club' | 'manager' | 'journalist' | 'pundit';
  platform: 'twitter' | 'facebook' | 'instagram' | 'tiktok' | 'youtube';
  handle: string;
  followers: number;
  following: number;
  posts: number;
  engagementRate: number; // 0-100
  verified: boolean;
}

/** Social media post */
export interface SocialMediaPost {
  id: EntityId;
  accountId: EntityId;
  content: string;
  media: string[]; // URLs to images/videos
  date: DateString;
  likes: number;
  retweets: number;
  replies: number;
  quotes: number;
  sentiment: MediaSentiment;
  tags: string[];
}

// ============================================
// MEDIA CONSTANTS
// ============================================

/** Media source types with examples */
export const MEDIA_SOURCE_TYPES: Record<string, string[]> = {
  news_outlet: ['BBC Sport', 'Sky Sports', 'ESPN', 'Marca', 'Kicker'],
  sports_network: ['Sky Sports', 'BT Sport', 'beIN Sports', 'DAZN', 'Eleven Sports'],
  newspaper: ['The Guardian', 'The Times', 'Daily Mail', 'El Pais', 'Bild'],
  magazine: ['FourFourTwo', 'World Soccer', 'Kicker Magazine', 'France Football'],
  website: ['Goal.com', 'Transfermarkt', 'WhoScored', 'SofaScore', 'Football365'],
  radio: ['BBC Radio 5 Live', 'TalkSPORT', 'Radio Marca'],
  tv_channel: ['Sky Sports News', 'ESPN FC', 'beIN Sports News'],
  social_media: ['Twitter', 'Facebook', 'Instagram', 'TikTok'],
};

/** Story type frequencies (stories per day per entity) */
export const STORY_TYPE_FREQUENCIES: Record<MediaStoryType, number> = {
  news: 5,
  rumor: 3,
  interview: 1,
  press_conference: 0.5,
  match_report: 2,
  match_preview: 1,
  analysis: 1,
  opinion: 0.5,
  transfer_news: 2,
  injury_update: 1,
  contract_news: 0.5,
  tactical_analysis: 0.3,
  player_profile: 0.1,
  club_profile: 0.05,
  manager_profile: 0.05,
  season_review: 0.1,
  season_preview: 0.1,
};

/** Story importance by type */
export const STORY_IMPORTANCE_BY_TYPE: Record<MediaStoryType, MediaImportance> = {
  news: 'medium',
  rumor: 'low',
  interview: 'medium',
  press_conference: 'high',
  match_report: 'high',
  match_preview: 'medium',
  analysis: 'medium',
  opinion: 'low',
  transfer_news: 'high',
  injury_update: 'medium',
  contract_news: 'medium',
  tactical_analysis: 'medium',
  player_profile: 'low',
  club_profile: 'low',
  manager_profile: 'low',
  season_review: 'high',
  season_preview: 'medium',
};

/** Story sentiment distribution by type */
export const STORY_SENTIMENT_DISTRIBUTION: Record<MediaStoryType, Record<MediaSentiment, number>> = {
  news: { very_negative: 0.05, negative: 0.15, neutral: 0.6, positive: 0.15, very_positive: 0.05 },
  rumor: { very_negative: 0.1, negative: 0.2, neutral: 0.4, positive: 0.2, very_positive: 0.1 },
  interview: { very_negative: 0.05, negative: 0.1, neutral: 0.6, positive: 0.2, very_positive: 0.05 },
  press_conference: { very_negative: 0.05, negative: 0.15, neutral: 0.5, positive: 0.25, very_positive: 0.05 },
  match_report: { very_negative: 0.1, negative: 0.2, neutral: 0.4, positive: 0.2, very_positive: 0.1 },
  match_preview: { very_negative: 0.05, negative: 0.1, neutral: 0.6, positive: 0.2, very_positive: 0.05 },
  analysis: { very_negative: 0.05, negative: 0.15, neutral: 0.5, positive: 0.25, very_positive: 0.05 },
  opinion: { very_negative: 0.2, negative: 0.3, neutral: 0.2, positive: 0.2, very_positive: 0.1 },
  transfer_news: { very_negative: 0.05, negative: 0.1, neutral: 0.4, positive: 0.3, very_positive: 0.15 },
  injury_update: { very_negative: 0.2, negative: 0.3, neutral: 0.3, positive: 0.15, very_positive: 0.05 },
  contract_news: { very_negative: 0.05, negative: 0.1, neutral: 0.4, positive: 0.3, very_positive: 0.15 },
  tactical_analysis: { very_negative: 0.05, negative: 0.1, neutral: 0.6, positive: 0.2, very_positive: 0.05 },
  player_profile: { very_negative: 0.01, negative: 0.04, neutral: 0.8, positive: 0.1, very_positive: 0.05 },
  club_profile: { very_negative: 0.01, negative: 0.04, neutral: 0.8, positive: 0.1, very_positive: 0.05 },
  manager_profile: { very_negative: 0.01, negative: 0.04, neutral: 0.8, positive: 0.1, very_positive: 0.05 },
  season_review: { very_negative: 0.05, negative: 0.15, neutral: 0.5, positive: 0.25, very_positive: 0.05 },
  season_preview: { very_negative: 0.05, negative: 0.1, neutral: 0.6, positive: 0.2, very_positive: 0.05 },
};

/** News category frequencies */
export const NEWS_CATEGORY_FREQUENCIES: Record<NewsCategory, number> = {
  transfers: 3,
  matches: 4,
  injuries: 2,
  tactics: 1,
  finance: 1,
  youth: 1,
  international: 1,
  domestic: 2,
  other: 1,
};

/** Match report key moment types */
export const MATCH_REPORT_KEY_MOMENT_TYPES: string[] = [
  'goal', 'assist', 'save', 'miss', 'foul', 'card', 'substitution', 'penalty', 'injury'
];

/** Analysis focus frequencies */
export const ANALYSIS_FOCUS_FREQUENCIES: Record<AnalysisFocus, number> = {
  player_performance: 2,
  team_performance: 2,
  tactical_analysis: 1,
  transfer_analysis: 1,
  financial_analysis: 0.5,
  youth_development: 0.5,
  manager_performance: 1,
  league_analysis: 1,
  season_review: 0.5,
};
