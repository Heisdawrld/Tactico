/**
 * Transfer Negotiation Engine
 * Handles negotiation logic between clubs, players, and agents
 */

import {
  TransferOffer,
  NegotiationState,
  NegotiationHistory,
  Player,
  Club,
  TransferStatus,
} from '../types';

export class NegotiationEngine {
  private state: Map<string, NegotiationState> = new Map();

  /**
   * Initialize a new negotiation for a transfer offer
   */
  public initiateNegotiation(offer: TransferOffer): NegotiationState {
    const initialState: NegotiationState = {
      offerId: offer.id,
      currentStep: 0,
      history: [],
      playerInterest: this.calculatePlayerInterest(offer),
      clubInterest: this.calculateClubInterest(offer),
      likelihood: 50, // Initial baseline
    };

    this.state.set(offer.id, initialState);
    this.addHistory(initialState, 'CLUB', 'OFFER_MADE', `Initial offer of €${offer.offerAmount.toLocaleString()}`);

    return initialState;
  }

  /**
   * Process a counter-offer from the selling club
   */
  public handleCounterOffer(
    offerId: string,
    counterAmount: number,
    sellingClub: Club
  ): NegotiationState {
    const state = this.state.get(offerId);
    if (!state) throw new Error(`Negotiation ${offerId} not found`);

    const originalOffer = this.getOffer(offerId); // Would fetch from DB in production
    const difference = counterAmount - (originalOffer?.offerAmount || 0);
    const acceptanceProbability = this.calculateAcceptanceProbability(state, counterAmount);

    this.addHistory(state, 'CLUB', 'COUNTER_OFFER', `Counter offer: €${counterAmount.toLocaleString()} (+€${difference.toLocaleString()})`);
    
    state.currentStep++;
    state.clubInterest = Math.min(100, state.clubInterest + 10);
    state.likelihood = acceptanceProbability;

    return state;
  }

  /**
   * Handle player's response to contract terms
   */
  public handlePlayerResponse(
    offerId: string,
    wageOffer: number,
    player: Player
  ): NegotiationState {
    const state = this.state.get(offerId);
    if (!state) throw new Error(`Negotiation ${offerId} not found`);

    const wageIncrease = ((wageOffer - player.wage) / player.wage) * 100;
    const interestChange = this.calculatePlayerInterestChange(player, wageIncrease);

    this.addHistory(state, 'PLAYER', 'WAGE_RESPONSE', `Wage offer: €${wageOffer.toLocaleString()/1000}k/week (${wageIncrease > 0 ? '+' : ''}${wageIncrease.toFixed(1)}%)`);

    state.currentStep++;
    state.playerInterest = Math.max(0, Math.min(100, state.playerInterest + interestChange));
    state.likelihood = this.recalculateLikelihood(state);

    return state;
  }

  /**
   * Agent intervention in negotiations
   */
  public handleAgentIntervention(
    offerId: string,
    agentFeeRequest: number,
    player: Player
  ): NegotiationState {
    const state = this.state.get(offerId);
    if (!state) throw new Error(`Negotiation ${offerId} not found`);

    const agentInfluence = this.calculateAgentInfluence(player, agentFeeRequest);

    this.addHistory(state, 'AGENT', 'FEE_REQUEST', `Agent fee request: €${agentFeeRequest.toLocaleString()}`);

    state.currentStep++;
    state.playerInterest = Math.max(0, Math.min(100, state.playerInterest + agentInfluence.playerImpact));
    state.clubInterest = Math.max(0, Math.min(100, state.clubInterest + agentInfluence.clubImpact));
    state.likelihood = this.recalculateLikelihood(state);

    return state;
  }

  /**
   * Accept the current offer
   */
  public acceptOffer(offerId: string): boolean {
    const state = this.state.get(offerId);
    if (!state) return false;

    this.addHistory(state, 'BOTH', 'ACCEPTED', 'Transfer agreement reached');
    state.likelihood = 100;
    
    return true;
  }

  /**
   * Reject the current offer
   */
  public rejectOffer(offerId: string, reason?: string): boolean {
    const state = this.state.get(offerId);
    if (!state) return false;

    this.addHistory(state, 'BOTH', 'REJECTED', reason || 'Offer rejected');
    state.likelihood = 0;
    
    return true;
  }

  /**
   * Withdraw the offer
   */
  public withdrawOffer(offerId: string, reason?: string): boolean {
    const state = this.state.get(offerId);
    if (!state) return false;

    this.addHistory(state, 'CLUB', 'WITHDRAWN', reason || 'Offer withdrawn');
    state.likelihood = 0;
    
    return true;
  }

  /**
   * Get current negotiation state
   */
  public getState(offerId: string): NegotiationState | undefined {
    return this.state.get(offerId);
  }

  // Private helper methods

  private calculatePlayerInterest(offer: TransferOffer): number {
    // Base calculation considering wage increase, contract length, and club reputation
    const wageFactor = Math.min(50, (offer.wageOffer / 1000) * 10); // Normalize wage
    const contractFactor = offer.contractLength * 5;
    const baseInterest = wageFactor + contractFactor;
    
    return Math.max(0, Math.min(100, baseInterest));
  }

  private calculateClubInterest(offer: TransferOffer): number {
    // Simplified club interest based on offer amount vs market value
    // In production, would consider tactical fit, age, potential, etc.
    return 60; // Baseline
  }

  private calculateAcceptanceProbability(
    state: NegotiationState,
    counterAmount: number
  ): number {
    const avgInterest = (state.playerInterest + state.clubInterest) / 2;
    const stepPenalty = state.currentStep * 5; // Each step reduces likelihood slightly
    
    return Math.max(0, Math.min(100, avgInterest - stepPenalty));
  }

  private calculatePlayerInterestChange(
    player: Player,
    wageIncreasePercent: number
  ): number {
    const ambitionFactor = player.ambition / 10;
    const loyaltyPenalty = player.loyalty / 20;
    
    if (wageIncreasePercent > 50) return 30 * ambitionFactor;
    if (wageIncreasePercent > 20) return 15 * ambitionFactor;
    if (wageIncreasePercent > 0) return 5 * ambitionFactor;
    
    return -20 * loyaltyPenalty; // Wage cut
  }

  private calculateAgentInfluence(
    player: Player,
    agentFeeRequest: number
  ): { playerImpact: number; clubImpact: number } {
    const feeImpact = agentFeeRequest / 1000000; // Normalize to millions
    
    // High agent fees can frustrate clubs but benefit players
    return {
      playerImpact: feeImpact * 5,
      clubImpact: -feeImpact * 10,
    };
  }

  private recalculateLikelihood(state: NegotiationState): number {
    return this.calculateAcceptanceProbability(state, 0);
  }

  private addHistory(
    state: NegotiationState,
    actor: 'CLUB' | 'PLAYER' | 'AGENT' | 'BOTH',
    action: string,
    details: string
  ): void {
    state.history.push({
      timestamp: new Date(),
      actor,
      action,
      details,
    });
  }

  private getOffer(offerId: string): TransferOffer | null {
    // Placeholder - would fetch from database in production
    return null;
  }
}

export default NegotiationEngine;
