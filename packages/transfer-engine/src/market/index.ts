/**
 * Transfer Market Engine
 * Handles market analysis, pricing, and transfer matching
 */

import {
  TransferPlayer as Player,
  TransferClub as Club,
  TransferOffer,
  MarketAnalysis,
  PriceTrend,
  TransferMarketConfig,
} from '../types';

export class MarketEngine {
  private marketConfig: TransferMarketConfig;
  private priceHistory: Map<string, PriceTrend[]> = new Map();

  constructor(config: Partial<TransferMarketConfig> = {}) {
    this.marketConfig = {
      transferWindowOpen: true,
      windowType: 'SUMMER',
      deadlineDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      maxTransferLength: 5,
      minTransferLength: 1,
      agentFeePercentage: 5,
      ...config,
    };
  }

  /**
   * Calculate player market value based on multiple factors
   */
  public calculateMarketValue(
    player: Player,
    marketConditions?: MarketAnalysis
  ): number {
    const baseValue = this.calculateBaseValue(player);
    const ageMultiplier = this.getAgeMultiplier(player.age);
    const potentialMultiplier = this.getPotentialMultiplier(player);
    const contractMultiplier = this.getContractMultiplier(player);
    const formMultiplier = 1.0; // Would use recent performance data
    const demandMultiplier = this.getDemandMultiplier(player.position, marketConditions);

    return Math.round(
      baseValue *
        ageMultiplier *
        potentialMultiplier *
        contractMultiplier *
        formMultiplier *
        demandMultiplier
    );
  }

  /**
   * Generate a fair transfer offer
   */
  public generateOffer(
    player: Player,
    buyingClub: Club,
    sellingClub: Club,
    options?: {
      aggressive?: boolean;
      lowball?: boolean;
    }
  ): TransferOffer {
    const marketValue = this.calculateMarketValue(player);
    
    let offerPercentage = 1.0;
    if (options?.aggressive) offerPercentage = 1.2;
    if (options?.lowball) offerPercentage = 0.7;

    const offerAmount = Math.round(marketValue * offerPercentage);
    const wageOffer = this.calculateWageOffer(player, buyingClub);
    const contractLength = this.determineContractLength(player.age, player.potentialRating);

    return {
      id: this.generateOfferId(),
      playerId: player.id,
      fromClubId: sellingClub.id,
      toClubId: buyingClub.id,
      offerAmount,
      wageOffer,
      contractLength,
      status: 'PENDING',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      agentFee: offerAmount * (this.marketConfig.agentFeePercentage / 100),
    };
  }

  /**
   * Analyze market trends for a position
   */
  public analyzePosition(position: string): MarketAnalysis {
    const trends = this.priceHistory.get(position) || [];
    const latestTrend = trends[trends.length - 1];
    
    return {
      averagePrices: {
        [position]: latestTrend?.averagePrice || 0,
      },
      trendData: trends,
      demandSupply: {
        [position]: this.assessDemandSupply(position),
      },
    };
  }

  /**
   * Update market prices after a transfer completes
   */
  public recordTransfer(
    player: Player,
    transferFee: number,
    timestamp: Date = new Date()
  ): void {
    const position = player.position;
    const trend: PriceTrend = {
      date: timestamp,
      position,
      averagePrice: transferFee,
      volume: 1,
    };

    if (!this.priceHistory.has(position)) {
      this.priceHistory.set(position, []);
    }

    const history = this.priceHistory.get(position)!;
    history.push(trend);

    // Keep only last 100 records per position
    if (history.length > 100) {
      history.shift();
    }
  }

  /**
   * Check if transfer window is open
   */
  public isWindowOpen(): boolean {
    if (!this.marketConfig.transferWindowOpen) return false;
    return new Date() <= this.marketConfig.deadlineDate;
  }

  /**
   * Get days remaining in transfer window
   */
  public getDaysRemaining(): number {
    if (!this.isWindowOpen()) return 0;
    const diff = this.marketConfig.deadlineDate.getTime() - Date.now();
    return Math.ceil(diff / (24 * 60 * 60 * 1000));
  }

  // Private helper methods

  private calculateBaseValue(player: Player): number {
    const abilityBase = player.overallRating * 100000;
    const potentialBonus = (player.potentialRating - player.overallRating) * 50000;
    const ageAdjustment = Math.max(0.5, 1 - (Math.abs(player.age - 27) * 0.02)); // Peak at 27
    
    return (abilityBase + potentialBonus) * ageAdjustment;
  }

  private getAgeMultiplier(age: number): number {
    if (age < 21) return 1.3; // Young talent premium
    if (age < 25) return 1.2;
    if (age < 29) return 1.0; // Prime years
    if (age < 32) return 0.8;
    return 0.6; // Declining phase
  }

  private getPotentialMultiplier(player: Player): number {
    const gap = player.potentialRating - player.overallRating;
    if (gap > 20) return 1.4; // High potential
    if (gap > 10) return 1.2;
    if (gap > 5) return 1.1;
    return 1.0; // Limited growth
  }

  private getContractMultiplier(player: Player): number {
    if (!player.contractExpires) return 0.6; // No contract = low value
    const yearsLeft = (new Date(player.contractExpires).getTime() - Date.now()) / (365 * 24 * 60 * 60 * 1000);
    
    if (yearsLeft > 3) return 1.2;
    if (yearsLeft > 2) return 1.0;
    if (yearsLeft > 1) return 0.8;
    return 0.6; // Contract running down
  }

  private getDemandMultiplier(
    position: string,
    marketConditions?: MarketAnalysis
  ): number {
    if (!marketConditions) return 1.0;

    const demand = marketConditions.demandSupply[position];
    switch (demand) {
      case 'HIGH': return 1.3;
      case 'MEDIUM': return 1.0;
      case 'LOW': return 0.8;
      default: return 1.0;
    }
  }

  private assessDemandSupply(position: string): 'HIGH' | 'MEDIUM' | 'LOW' {
    // Simplified logic - would use real market data in production
    const highDemandPositions = ['ST', 'CB', 'CM'];
    const lowDemandPositions = ['GK', 'RB', 'LB'];

    if (highDemandPositions.includes(position)) return 'HIGH';
    if (lowDemandPositions.includes(position)) return 'LOW';
    return 'MEDIUM';
  }

  private calculateWageOffer(player: Player, buyingClub: Club): number {
    const baseWage = player.wage;
    const clubBudgetRatio = buyingClub.wageBudget / 1000000;
    
    // Offer based on club's financial power and player's current wage
    const wageIncrease = Math.min(50, clubBudgetRatio * 20);
    return Math.round(baseWage * (1 + wageIncrease / 100));
  }

  private determineContractLength(age: number, potential: number): number {
    if (age < 23 && potential > 80) return 5;
    if (age < 27) return 4;
    if (age < 30) return 3;
    if (age < 33) return 2;
    return 1;
  }

  private generateOfferId(): string {
    return `TRF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default MarketEngine;
