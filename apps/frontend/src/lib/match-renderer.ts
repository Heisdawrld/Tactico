// TACTICO Match Renderer — PixiJS + Matter.js Bridge
// Renders the 2D match simulation with tactical visualization

import * as PIXI from 'pixi.js';
import * as Matter from 'matter-js';
import { SimulationEngine } from '@tactico/simulation-engine';
import type { MatchEvent, AITeamState, AIPlayerState, Coordinates } from '@tactico/simulation-engine';

// ============================================================
// CONFIGURATION
// ============================================================

const PITCH_CONFIG = {
  width: 1050,  // Scaled pitch width (105m = 1050px)
  height: 680,  // Scaled pitch height (68m = 680px)
  margin: 40,
  lineColor: 0xFFFFFF,
  lineWidth: 2,
  lineAlpha: 0.6,
  grassColor1: 0x1B5E20,
  grassColor2: 0x2E7D32,
  grassStripeWidth: 68,
};

const PLAYER_CONFIG = {
  radius: 12,
  strokeWidth: 2,
  labelFontSize: 10,
  numberFontSize: 14,
  selectionGlow: 0xFFD700,
  homeColor: 0x6CABDD,
  awayColor: 0xDA0E20,
  ballColor: 0xFFFFFF,
  ballRadius: 6,
};

const ANIMATION_CONFIG = {
  passDuration: 800,      // ms
  shotDuration: 1200,     // ms
  tackleDuration: 400,    // ms
  goalCelebration: 2000,  // ms
  playerMoveSpeed: 0.15, // lerp factor per frame
};

// ============================================================
// TACTICAL POSITIONS (normalized 0-1 coordinates)
// ============================================================

const FORMATION_POSITIONS: Record<string, Record<string, { x: number; y: number }>> = {
  '4-3-3': {
    GK: { x: 0.05, y: 0.5 },
    RB: { x: 0.25, y: 0.15 },
    RCB: { x: 0.22, y: 0.38 },
    LCB: { x: 0.22, y: 0.62 },
    LB: { x: 0.25, y: 0.85 },
    CDM: { x: 0.38, y: 0.5 },
    RCM: { x: 0.45, y: 0.35 },
    LCM: { x: 0.45, y: 0.65 },
    RW: { x: 0.72, y: 0.2 },
    ST: { x: 0.78, y: 0.5 },
    LW: { x: 0.72, y: 0.8 },
  },
  '4-4-2': {
    GK: { x: 0.05, y: 0.5 },
    RB: { x: 0.25, y: 0.15 },
    RCB: { x: 0.22, y: 0.38 },
    LCB: { x: 0.22, y: 0.62 },
    LB: { x: 0.25, y: 0.85 },
    RM: { x: 0.45, y: 0.15 },
    RCM: { x: 0.42, y: 0.38 },
    LCM: { x: 0.42, y: 0.62 },
    LM: { x: 0.45, y: 0.85 },
    ST: { x: 0.75, y: 0.42 },
    CF: { x: 0.75, y: 0.58 },
  },
  '3-5-2': {
    GK: { x: 0.05, y: 0.5 },
    RCB: { x: 0.22, y: 0.25 },
    CB: { x: 0.20, y: 0.5 },
    LCB: { x: 0.22, y: 0.75 },
    RWB: { x: 0.45, y: 0.12 },
    CDM: { x: 0.40, y: 0.38 },
    CM: { x: 0.40, y: 0.62 },
    LWB: { x: 0.45, y: 0.88 },
    CAM: { x: 0.58, y: 0.5 },
    ST: { x: 0.78, y: 0.42 },
    CF: { x: 0.78, y: 0.58 },
  },
  '4-2-3-1': {
    GK: { x: 0.05, y: 0.5 },
    RB: { x: 0.25, y: 0.15 },
    RCB: { x: 0.22, y: 0.38 },
    LCB: { x: 0.22, y: 0.62 },
    LB: { x: 0.25, y: 0.85 },
    CDM: { x: 0.38, y: 0.38 },
    CDM2: { x: 0.38, y: 0.62 },
    CAM: { x: 0.58, y: 0.25 },
    CAM2: { x: 0.58, y: 0.5 },
    CAM3: { x: 0.58, y: 0.75 },
    ST: { x: 0.78, y: 0.5 },
  },
  '5-3-2': {
    GK: { x: 0.05, y: 0.5 },
    RWB: { x: 0.25, y: 0.12 },
    RCB: { x: 0.22, y: 0.30 },
    CB: { x: 0.20, y: 0.5 },
    LCB: { x: 0.22, y: 0.70 },
    LWB: { x: 0.25, y: 0.88 },
    CDM: { x: 0.42, y: 0.5 },
    CM: { x: 0.45, y: 0.35 },
    CM2: { x: 0.45, y: 0.65 },
    ST: { x: 0.78, y: 0.42 },
    CF: { x: 0.78, y: 0.58 },
  },
  '3-4-3': {
    GK: { x: 0.05, y: 0.5 },
    RCB: { x: 0.22, y: 0.25 },
    CB: { x: 0.20, y: 0.5 },
    LCB: { x: 0.22, y: 0.75 },
    RM: { x: 0.42, y: 0.15 },
    CM: { x: 0.40, y: 0.38 },
    CM2: { x: 0.40, y: 0.62 },
    LM: { x: 0.42, y: 0.85 },
    RW: { x: 0.72, y: 0.22 },
    ST: { x: 0.78, y: 0.5 },
    LW: { x: 0.72, y: 0.78 },
  },
  '4-1-4-1': {
    GK: { x: 0.05, y: 0.5 },
    RB: { x: 0.25, y: 0.15 },
    RCB: { x: 0.22, y: 0.38 },
    LCB: { x: 0.22, y: 0.62 },
    LB: { x: 0.25, y: 0.85 },
    CDM: { x: 0.38, y: 0.5 },
    RM: { x: 0.55, y: 0.15 },
    CM: { x: 0.52, y: 0.38 },
    CM2: { x: 0.52, y: 0.62 },
    LM: { x: 0.55, y: 0.85 },
    ST: { x: 0.78, y: 0.5 },
  },
  '5-4-1': {
    GK: { x: 0.05, y: 0.5 },
    RWB: { x: 0.25, y: 0.12 },
    RCB: { x: 0.22, y: 0.30 },
    CB: { x: 0.20, y: 0.5 },
    LCB: { x: 0.22, y: 0.70 },
    LWB: { x: 0.25, y: 0.88 },
    RM: { x: 0.45, y: 0.18 },
    CM: { x: 0.42, y: 0.40 },
    CM2: { x: 0.42, y: 0.60 },
    LM: { x: 0.45, y: 0.82 },
    ST: { x: 0.78, y: 0.5 },
  },
};

// ============================================================
// MATCH RENDERER CLASS
// ============================================================

export class MatchRenderer {
  private app: PIXI.Application;
  private engine: SimulationEngine;
  private pitchContainer: PIXI.Container;
  private playersContainer: PIXI.Container;
  private ballContainer: PIXI.Container;
  private effectsContainer: PIXI.Container;
  private uiContainer: PIXI.Container;

  private playerSprites: Map<number, PIXI.Container> = new Map();
  private ballSprite: PIXI.Graphics | null = null;
  private pitchGraphics: PIXI.Graphics | null = null;

  private homeTeamColor: number;
  private awayTeamColor: number;
  private homeFormation: string;
  private awayFormation: string;

  private animationQueue: Array<() => boolean> = [];
  private isAnimating: boolean = false;

  private onEventCallback: ((event: MatchEvent) => void) | null = null;
  private onStateUpdateCallback: ((state: any) => void) | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    engine: SimulationEngine,
    options: {
      homeColor?: number;
      awayColor?: number;
      homeFormation?: string;
      awayFormation?: string;
    } = {}
  ) {
    this.engine = engine;
    this.homeTeamColor = options.homeColor || PLAYER_CONFIG.homeColor;
    this.awayTeamColor = options.awayColor || PLAYER_CONFIG.awayColor;
    this.homeFormation = options.homeFormation || '4-3-3';
    this.awayFormation = options.awayFormation || '4-3-3';

    this.app = new PIXI.Application({
      canvas,
      width: PITCH_CONFIG.width + PITCH_CONFIG.margin * 2,
      height: PITCH_CONFIG.height + PITCH_CONFIG.margin * 2,
      backgroundColor: 0x0A0A0F,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    this.pitchContainer = new PIXI.Container();
    this.playersContainer = new PIXI.Container();
    this.ballContainer = new PIXI.Container();
    this.effectsContainer = new PIXI.Container();
    this.uiContainer = new PIXI.Container();

    this.app.stage.addChild(this.pitchContainer);
    this.app.stage.addChild(this.playersContainer);
    this.app.stage.addChild(this.ballContainer);
    this.app.stage.addChild(this.effectsContainer);
    this.app.stage.addChild(this.uiContainer);

    this.drawPitch();
    this.createBall();

    // Start render loop
    this.app.ticker.add(() => this.onTick());
  }

  // ============================================================
  // PITCH DRAWING
  // ============================================================

  private drawPitch(): void {
    const g = new PIXI.Graphics();
    this.pitchGraphics = g;

    const { width, height, margin, grassColor1, grassColor2, grassStripeWidth } = PITCH_CONFIG;
    const pitchX = margin;
    const pitchY = margin;

    // Grass stripes
    for (let x = 0; x < width; x += grassStripeWidth) {
      g.beginFill(x % (grassStripeWidth * 2) === 0 ? grassColor1 : grassColor2);
      g.drawRect(pitchX + x, pitchY, Math.min(grassStripeWidth, width - x), height);
      g.endFill();
    }

    // Pitch lines
    g.lineStyle(PITCH_CONFIG.lineWidth, PITCH_CONFIG.lineColor, PITCH_CONFIG.lineAlpha);

    // Outer boundary
    g.drawRect(pitchX, pitchY, width, height);

    // Center line
    g.moveTo(pitchX + width / 2, pitchY);
    g.lineTo(pitchX + width / 2, pitchY + height);

    // Center circle
    g.drawCircle(pitchX + width / 2, pitchY + height / 2, height * 0.15);

    // Center spot
    g.beginFill(PITCH_CONFIG.lineColor, PITCH_CONFIG.lineAlpha);
    g.drawCircle(pitchX + width / 2, pitchY + height / 2, 3);
    g.endFill();

    // Left goal area
    const goalAreaWidth = width * 0.05;
    const goalAreaHeight = height * 0.35;
    g.drawRect(pitchX, pitchY + (height - goalAreaHeight) / 2, goalAreaWidth, goalAreaHeight);

    // Left penalty area
    const penAreaWidth = width * 0.165;
    const penAreaHeight = height * 0.6;
    g.drawRect(pitchX, pitchY + (height - penAreaHeight) / 2, penAreaWidth, penAreaHeight);

    // Left penalty spot
    g.beginFill(PITCH_CONFIG.lineColor, PITCH_CONFIG.lineAlpha);
    g.drawCircle(pitchX + width * 0.11, pitchY + height / 2, 3);
    g.endFill();

    // Left penalty arc
    g.arc(pitchX + width * 0.11, pitchY + height / 2, height * 0.15, -Math.PI / 3, Math.PI / 3);

    // Left goal
    g.lineStyle(4, 0xFFFFFF, 0.9);
    g.drawRect(pitchX - 15, pitchY + height / 2 - 30, 15, 60);
    g.lineStyle(PITCH_CONFIG.lineWidth, PITCH_CONFIG.lineColor, PITCH_CONFIG.lineAlpha);

    // Right goal area (mirror)
    g.drawRect(pitchX + width - goalAreaWidth, pitchY + (height - goalAreaHeight) / 2, goalAreaWidth, goalAreaHeight);

    // Right penalty area (mirror)
    g.drawRect(pitchX + width - penAreaWidth, pitchY + (height - penAreaHeight) / 2, penAreaWidth, penAreaHeight);

    // Right penalty spot
    g.beginFill(PITCH_CONFIG.lineColor, PITCH_CONFIG.lineAlpha);
    g.drawCircle(pitchX + width - width * 0.11, pitchY + height / 2, 3);
    g.endFill();

    // Right penalty arc
    g.arc(pitchX + width - width * 0.11, pitchY + height / 2, height * 0.15, Math.PI * 2 / 3, Math.PI * 4 / 3);

    // Right goal
    g.lineStyle(4, 0xFFFFFF, 0.9);
    g.drawRect(pitchX + width, pitchY + height / 2 - 30, 15, 60);

    // Corner arcs
    const cornerRadius = 10;
    g.lineStyle(PITCH_CONFIG.lineWidth, PITCH_CONFIG.lineColor, PITCH_CONFIG.lineAlpha);
    g.arc(pitchX, pitchY, cornerRadius, 0, Math.PI / 2);
    g.arc(pitchX + width, pitchY, cornerRadius, Math.PI / 2, Math.PI);
    g.arc(pitchX + width, pitchY + height, cornerRadius, Math.PI, Math.PI * 3 / 2);
    g.arc(pitchX, pitchY + height, cornerRadius, Math.PI * 3 / 2, Math.PI * 2);

    this.pitchContainer.addChild(g);
  }

  // ============================================================
  // PLAYER CREATION
  // ============================================================

  createPlayers(homeTeam: AITeamState, awayTeam: AITeamState): void {
    // Clear existing
    this.playerSprites.forEach(sprite => this.playersContainer.removeChild(sprite));
    this.playerSprites.clear();

    // Create home team players
    homeTeam.playerStates.forEach((player, index) => {
      const position = this.getTacticalPosition(player.position, this.homeFormation, true, index);
      const sprite = this.createPlayerSprite(player, this.homeTeamColor, true, position);
      this.playerSprites.set(player.playerId, sprite);
      this.playersContainer.addChild(sprite);
    });

    // Create away team players
    awayTeam.playerStates.forEach((player, index) => {
      const position = this.getTacticalPosition(player.position, this.awayFormation, false, index);
      const sprite = this.createPlayerSprite(player, this.awayTeamColor, false, position);
      this.playerSprites.set(player.playerId, sprite);
      this.playersContainer.addChild(sprite);
    });
  }

  private getTacticalPosition(
    role: string,
    formation: string,
    isHome: boolean,
    index: number
  ): { x: number; y: number } {
    const positions = FORMATION_POSITIONS[formation] || FORMATION_POSITIONS['4-3-3'];
    const pos = positions[role] || positions[Object.keys(positions)[index]] || { x: 0.5, y: 0.5 };

    if (isHome) {
      return {
        x: PITCH_CONFIG.margin + pos.x * PITCH_CONFIG.width,
        y: PITCH_CONFIG.margin + pos.y * PITCH_CONFIG.height,
      };
    } else {
      // Mirror for away team (they attack left-to-right)
      return {
        x: PITCH_CONFIG.margin + (1 - pos.x) * PITCH_CONFIG.width,
        y: PITCH_CONFIG.margin + pos.y * PITCH_CONFIG.height,
      };
    }
  }

  private createPlayerSprite(
    player: AIPlayerState,
    color: number,
    isHome: boolean,
    position: { x: number; y: number }
  ): PIXI.Container {
    const container = new PIXI.Container();
    container.x = position.x;
    container.y = position.y;

    // Player circle
    const circle = new PIXI.Graphics();
    circle.beginFill(color);
    circle.drawCircle(0, 0, PLAYER_CONFIG.radius);
    circle.endFill();

    // Stroke
    circle.lineStyle(PLAYER_CONFIG.strokeWidth, 0xFFFFFF, 0.8);
    circle.drawCircle(0, 0, PLAYER_CONFIG.radius);

    // Number
    const numberText = new PIXI.Text(player.playerId.toString(), {
      fontFamily: 'JetBrains Mono',
      fontSize: PLAYER_CONFIG.numberFontSize,
      fill: 0xFFFFFF,
      fontWeight: 'bold',
    });
    numberText.anchor.set(0.5);

    // Position label (below)
    const labelText = new PIXI.Text(player.position, {
      fontFamily: 'Inter',
      fontSize: PLAYER_CONFIG.labelFontSize,
      fill: 0xFFFFFF,
      fontWeight: '600',
    });
    labelText.anchor.set(0.5);
    labelText.y = PLAYER_CONFIG.radius + 8;

    container.addChild(circle);
    container.addChild(numberText);
    container.addChild(labelText);

    // Store data for updates
    (container as any).playerData = player;
    (container as any).targetPosition = { x: position.x, y: position.y };
    (container as any).currentPosition = { x: position.x, y: position.y };
    (container as any).isHome = isHome;

    return container;
  }

  // ============================================================
  // BALL
  // ============================================================

  private createBall(): void {
    const ball = new PIXI.Graphics();
    ball.beginFill(PLAYER_CONFIG.ballColor);
    ball.drawCircle(0, 0, PLAYER_CONFIG.ballRadius);
    ball.endFill();

    // Ball pattern
    ball.beginFill(0x000000, 0.3);
    ball.drawCircle(-2, -2, 2);
    ball.drawCircle(2, 2, 2);
    ball.endFill();

    ball.x = PITCH_CONFIG.margin + PITCH_CONFIG.width / 2;
    ball.y = PITCH_CONFIG.margin + PITCH_CONFIG.height / 2;

    this.ballSprite = ball;
    this.ballContainer.addChild(ball);
  }

  // ============================================================
  // ANIMATION SYSTEM
  // ============================================================

  animatePass(fromPlayerId: number, toPlayerId: number | null, toPosition?: Coordinates): void {
    const fromSprite = this.playerSprites.get(fromPlayerId);
    if (!fromSprite) return;

    let targetX: number, targetY: number;

    if (toPlayerId && this.playerSprites.has(toPlayerId)) {
      const toSprite = this.playerSprites.get(toPlayerId)!;
      targetX = toSprite.x;
      targetY = toSprite.y;
    } else if (toPosition) {
      targetX = PITCH_CONFIG.margin + toPosition.x * PITCH_CONFIG.width;
      targetY = PITCH_CONFIG.margin + toPosition.y * PITCH_CONFIG.height;
    } else {
      return;
    }

    // Draw pass line
    const passLine = new PIXI.Graphics();
    passLine.lineStyle(2, 0xFFFFFF, 0.6);
    passLine.moveTo(this.ballSprite!.x, this.ballSprite!.y);
    passLine.lineTo(targetX, targetY);
    this.effectsContainer.addChild(passLine);

    // Animate ball
    const startX = this.ballSprite!.x;
    const startY = this.ballSprite!.y;
    const startTime = Date.now();

    this.animationQueue.push(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / ANIMATION_CONFIG.passDuration, 1);

      // Easing
      const eased = 1 - Math.pow(1 - progress, 3);

      this.ballSprite!.x = startX + (targetX - startX) * eased;
      this.ballSprite!.y = startY + (targetY - startY) * eased;

      if (progress >= 1) {
        this.effectsContainer.removeChild(passLine);
        passLine.destroy();
        return true; // Animation complete
      }
      return false;
    });
  }

  animateShot(shooterId: number, onTarget: boolean, isGoal: boolean): void {
    const shooter = this.playerSprites.get(shooterId);
    if (!shooter) return;

    const isHome = (shooter as any).isHome;
    const goalX = isHome 
      ? PITCH_CONFIG.margin + PITCH_CONFIG.width + 20
      : PITCH_CONFIG.margin - 20;
    const goalY = PITCH_CONFIG.margin + PITCH_CONFIG.height / 2 + (Math.random() - 0.5) * 40;

    const startX = this.ballSprite!.x;
    const startY = this.ballSprite!.y;
    const startTime = Date.now();

    // Shot trail
    const trail = new PIXI.Graphics();
    this.effectsContainer.addChild(trail);

    this.animationQueue.push(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / ANIMATION_CONFIG.shotDuration, 1);

      // Arc trajectory
      const eased = 1 - Math.pow(1 - progress, 2);
      const height = Math.sin(progress * Math.PI) * 30; // Arc height

      this.ballSprite!.x = startX + (goalX - startX) * eased;
      this.ballSprite!.y = startY + (goalY - startY) * eased - height;

      // Trail
      trail.clear();
      trail.lineStyle(3, isGoal ? 0xFFD700 : 0xFFFFFF, 0.5 * (1 - progress));
      trail.moveTo(startX, startY);
      trail.lineTo(this.ballSprite!.x, this.ballSprite!.y);

      if (progress >= 1) {
        this.effectsContainer.removeChild(trail);
        trail.destroy();

        if (isGoal) {
          this.triggerGoalCelebration(isHome);
        }
        return true;
      }
      return false;
    });
  }

  animateTackle(tacklerId: number, tackledId: number, success: boolean): void {
    const tackler = this.playerSprites.get(tacklerId);
    const tackled = this.playerSprites.get(tackledId);
    if (!tackler || !tackled) return;

    const startTime = Date.now();

    this.animationQueue.push(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / ANIMATION_CONFIG.tackleDuration, 1);

      if (progress < 0.5) {
        // Tackler moves toward tackled
        const midProgress = progress * 2;
        const targetX = tackled.x;
        const targetY = tackled.y;
        tackler.x += (targetX - tackler.x) * midProgress * 0.3;
        tackler.y += (targetY - tackler.y) * midProgress * 0.3;
      } else {
        // Bounce back or fall
        if (!success) {
          tackled.x += (Math.random() - 0.5) * 10;
          tackled.y += (Math.random() - 0.5) * 10;
        }
      }

      if (progress >= 1) {
        return true;
      }
      return false;
    });
  }

  private triggerGoalCelebration(isHome: boolean): void {
    const goalX = isHome 
      ? PITCH_CONFIG.margin + PITCH_CONFIG.width + 50
      : PITCH_CONFIG.margin - 50;
    const goalY = PITCH_CONFIG.margin + PITCH_CONFIG.height / 2;

    // Flash effect
    const flash = new PIXI.Graphics();
    flash.beginFill(0xFFD700, 0.3);
    flash.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
    flash.endFill();
    this.effectsContainer.addChild(flash);

    // Particles
    for (let i = 0; i < 20; i++) {
      const particle = new PIXI.Graphics();
      particle.beginFill(0xFFD700);
      particle.drawCircle(0, 0, Math.random() * 4 + 2);
      particle.endFill();
      particle.x = goalX;
      particle.y = goalY;

      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      this.effectsContainer.addChild(particle);

      let life = 1.0;
      const updateParticle = () => {
        particle.x += vx;
        particle.y += vy;
        particle.alpha = life;
        life -= 0.02;

        if (life <= 0) {
          this.effectsContainer.removeChild(particle);
          particle.destroy();
          this.app.ticker.remove(updateParticle);
        }
      };
      this.app.ticker.add(updateParticle);
    }

    // Remove flash
    setTimeout(() => {
      this.effectsContainer.removeChild(flash);
      flash.destroy();
    }, 500);
  }

  // ============================================================
  // EVENT HANDLING
  // ============================================================

  onMatchEvent(event: MatchEvent): void {
    switch (event.type) {
      case 'pass':
        if (event.success && event.receiverId) {
          this.animatePass(event.passerId, event.receiverId, event.to);
        } else if (event.success && event.to) {
          this.animatePass(event.passerId, null, event.to);
        }
        break;

      case 'shot':
        this.animateShot(event.shooterId, event.onTarget, event.target === 'goal');
        break;

      case 'tackle':
        this.animateTackle(event.tacklerId, event.tackledId, event.success);
        break;

      case 'goal':
        // Goal is handled by shot animation if it was on target
        break;

      case 'foul':
        // Show card if applicable
        if (event.card) {
          this.showCard(event.foulerId, event.card);
        }
        break;

      case 'set_piece':
        // Reset ball position
        if (event.setPieceType === 'corner') {
          const cornerX = event.coordinates.x > 0.5 
            ? PITCH_CONFIG.margin + PITCH_CONFIG.width 
            : PITCH_CONFIG.margin;
          const cornerY = event.coordinates.y > 0.5
            ? PITCH_CONFIG.margin + PITCH_CONFIG.height
            : PITCH_CONFIG.margin;
          this.ballSprite!.x = cornerX;
          this.ballSprite!.y = cornerY;
        }
        break;
    }

    if (this.onEventCallback) {
      this.onEventCallback(event);
    }
  }

  private showCard(playerId: number, card: 'yellow' | 'red' | 'second_yellow'): void {
    const player = this.playerSprites.get(playerId);
    if (!player) return;

    const cardColor = card === 'red' ? 0xEF4444 : 0xEAB308;

    const cardSprite = new PIXI.Graphics();
    cardSprite.beginFill(cardColor);
    cardSprite.drawRoundedRect(-8, -12, 16, 24, 2);
    cardSprite.endFill();
    cardSprite.x = player.x + 15;
    cardSprite.y = player.y - 15;
    cardSprite.alpha = 0;

    this.effectsContainer.addChild(cardSprite);

    // Fade in
    let fadeIn = true;
    const animateCard = () => {
      if (fadeIn) {
        cardSprite.alpha += 0.1;
        if (cardSprite.alpha >= 1) {
          fadeIn = false;
          setTimeout(() => {
            this.effectsContainer.removeChild(cardSprite);
            cardSprite.destroy();
          }, 2000);
        }
      }
    };

    this.app.ticker.add(animateCard);
  }

  // ============================================================
  // UPDATE LOOP
  // ============================================================

  private onTick(): void {
    // Process animations
    this.animationQueue = this.animationQueue.filter(anim => !anim());

    // Smooth player movement to target positions
    this.playerSprites.forEach(sprite => {
      const target = (sprite as any).targetPosition;
      const current = (sprite as any).currentPosition;

      if (target && current) {
        current.x += (target.x - current.x) * PLAYER_CONFIG.playerMoveSpeed;
        current.y += (target.y - current.y) * PLAYER_CONFIG.playerMoveSpeed;

        sprite.x = current.x;
        sprite.y = current.y;
      }
    });

    // Update ball position from physics engine if available
    const physicsEngine = this.engine.getPhysicsEngine();
    if (physicsEngine) {
      const bodies = this.engine.getPhysicsBodies();
      const ballBody = bodies.find(b => b.label === 'ball');
      if (ballBody && this.ballSprite) {
        // Scale physics coordinates to pitch coordinates
        const scaleX = PITCH_CONFIG.width / 100;
        const scaleY = PITCH_CONFIG.height / 100;
        this.ballSprite.x = PITCH_CONFIG.margin + ballBody.position.x * scaleX;
        this.ballSprite.y = PITCH_CONFIG.margin + ballBody.position.y * scaleY;
      }
    }
  }

  // ============================================================
  // PUBLIC API
  // ============================================================

  updatePlayerPositions(teamStates: Map<number, AITeamState>): void {
    teamStates.forEach((teamState, teamId) => {
      const isHome = teamId === (teamState as any).isHomeTeam;
      const formation = isHome ? this.homeFormation : this.awayFormation;

      teamState.playerStates.forEach((player, index) => {
        const sprite = this.playerSprites.get(player.playerId);
        if (sprite) {
          const pos = this.getTacticalPosition(player.position, formation, isHome, index);
          (sprite as any).targetPosition = pos;
        }
      });
    });
  }

  highlightPlayer(playerId: number): void {
    this.playerSprites.forEach((sprite, id) => {
      const circle = sprite.children[0] as PIXI.Graphics;
      if (id === playerId) {
        // Add glow
        circle.clear();
        const color = (sprite as any).isHome ? this.homeTeamColor : this.awayTeamColor;
        circle.beginFill(color);
        circle.drawCircle(0, 0, PLAYER_CONFIG.radius + 4);
        circle.endFill();
        circle.beginFill(color);
        circle.drawCircle(0, 0, PLAYER_CONFIG.radius);
        circle.endFill();
        circle.lineStyle(2, PLAYER_CONFIG.selectionGlow, 1);
        circle.drawCircle(0, 0, PLAYER_CONFIG.radius + 4);
      } else {
        // Reset
        circle.clear();
        const color = (sprite as any).isHome ? this.homeTeamColor : this.awayTeamColor;
        circle.beginFill(color);
        circle.drawCircle(0, 0, PLAYER_CONFIG.radius);
        circle.endFill();
        circle.lineStyle(PLAYER_CONFIG.strokeWidth, 0xFFFFFF, 0.8);
        circle.drawCircle(0, 0, PLAYER_CONFIG.radius);
      }
    });
  }

  setOnEventCallback(callback: (event: MatchEvent) => void): void {
    this.onEventCallback = callback;
  }

  setOnStateUpdateCallback(callback: (state: any) => void): void {
    this.onStateUpdateCallback = callback;
  }

  resize(width: number, height: number): void {
    this.app.renderer.resize(width, height);

    // Scale pitch to fit
    const scale = Math.min(
      width / (PITCH_CONFIG.width + PITCH_CONFIG.margin * 2),
      height / (PITCH_CONFIG.height + PITCH_CONFIG.margin * 2)
    );

    this.pitchContainer.scale.set(scale);
    this.playersContainer.scale.set(scale);
    this.ballContainer.scale.set(scale);
    this.effectsContainer.scale.set(scale);
  }

  destroy(): void {
    this.app.destroy(true, { children: true, texture: true, baseTexture: true });
  }
}

