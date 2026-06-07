// TACTICO World Engine - Contract Engine
// Handles player contracts, transfers, and negotiations

import { EntityId, DateString, Player, Club } from '../core/types';
import {
  ContractType,
  ContractStatus,
  PlayerContract,
  ContractOffer,
  ContractNegotiation,
  PlayerContractHistory,
  ContractClause,
  ClauseType,
  BonusClause,
  ContractTemplate,
  TransferType,
  TransferStatus,
  Transfer,
  TransferBid,
  TransferBidAddOn,
  TransferNegotiation,
  TransferWindow,
  PlayerTransferHistory,
  TransferListing,
  Agent,
  AgentCommission,
  DEFAULT_CONTRACT_DURATIONS,
  MIN_CONTRACT_DURATIONS,
  MAX_CONTRACT_DURATIONS,
  WAGE_MULTIPLIERS,
  SIGNING_BONUS_MULTIPLIERS,
  RELEASE_CLAUSE_MULTIPLIERS,
  DEFAULT_SELL_ON_PERCENTAGE,
  DEFAULT_LOAN_WAGE_PERCENTAGE,
  DEFAULT_LOAN_FEE,
  DEFAULT_OPTION_FEE,
  CONTRACT_EXPIRY_WARNING_DAYS,
  CONTRACT_EXPIRY_DANGER_DAYS,
} from './types';

/**
 * ContractEngine - Manages player contracts and transfers
 * 
 * Handles:
 * - Contract creation, renewal, and termination
 * - Transfer negotiations and completions
 * - Contract clauses and bonuses
 * - Agent involvement
 * - Free agents and releases
 */
export class ContractEngine {
  private players: Map<EntityId, Player> = new Map();
  private clubs: Map<EntityId, Club> = new Map();
  private contracts: Map<EntityId, PlayerContract> = new Map();
  private playerContracts: Map<EntityId, PlayerContract[]> = new Map();
  private negotiations: Map<EntityId, ContractNegotiation> = new Map();
  private transfers: Map<EntityId, Transfer> = new Map();
  private playerTransfers: Map<EntityId, Transfer[]> = new Map();
  private transferBids: Map<EntityId, TransferBid[]> = new Map();
  private transferNegotiations: Map<EntityId, TransferNegotiation[]> = new Map();
  private transferListings: Map<EntityId, TransferListing> = new Map();
  private agents: Map<EntityId, Agent> = new Map();
  private agentCommissions: Map<EntityId, AgentCommission[]> = new Map();
  private transferWindows: TransferWindow[] = [];
  private contractTemplates: ContractTemplate[] = [];

  /**
   * Initialize the contract engine
   */
  initialize(
    players: Player[],
    clubs: Club[],
    transferWindows: TransferWindow[] = []
  ): void {
    players.forEach(player => this.players.set(player.id, player));
    clubs.forEach(club => this.clubs.set(club.id, club));
    this.transferWindows = transferWindows;

    // Initialize default contract templates
    this.initializeDefaultTemplates();
  }

  /**
   * Initialize default contract templates
   */
  private initializeDefaultTemplates(): void {
    this.contractTemplates = [
      {
        id: 1,
        name: 'Standard Professional',
        description: 'Standard 4-year contract for established professionals',
        type: 'full_time',
        durationYears: 4,
        wageMultiplier: 1.0,
        signingBonusMultiplier: 1.0,
        releaseClauseMultiplier: 1.0,
        sellOnPercentage: DEFAULT_SELL_ON_PERCENTAGE,
        isDefault: true,
      },
      {
        id: 2,
        name: 'Youth Contract',
        description: '2-year contract for youth players',
        type: 'youth',
        durationYears: 2,
        wageMultiplier: 0.5,
        signingBonusMultiplier: 0.5,
        releaseClauseMultiplier: 0.5,
        sellOnPercentage: DEFAULT_SELL_ON_PERCENTAGE,
        isDefault: true,
      },
      {
        id: 3,
        name: 'Star Player',
        description: '5-year contract for star players with high wages',
        type: 'full_time',
        durationYears: 5,
        wageMultiplier: 1.5,
        signingBonusMultiplier: 2.0,
        releaseClauseMultiplier: 2.0,
        sellOnPercentage: DEFAULT_SELL_ON_PERCENTAGE,
        isDefault: false,
      },
      {
        id: 4,
        name: 'Loan Deal',
        description: '1-year loan with option to buy',
        type: 'loan',
        durationYears: 1,
        wageMultiplier: 0.5,
        signingBonusMultiplier: 0.0,
        releaseClauseMultiplier: 0.0,
        sellOnPercentage: DEFAULT_SELL_ON_PERCENTAGE,
        isDefault: false,
      },
    ];
  }

  // ============================================
  // CONTRACT METHODS
  // ============================================

  /**
   * Create a new contract for a player
   */
  createContract(
    playerId: EntityId,
    clubId: EntityId,
    templateOrOptions: ContractTemplate | Partial<PlayerContract> = {}
  ): PlayerContract | null {
    const player = this.players.get(playerId);
    const club = this.clubs.get(clubId);
    
    if (!player || !club) return null;

    // If it's a template, use it to create the contract
    let contractData: Partial<PlayerContract>;
    if ('id' in templateOrOptions && 'name' in templateOrOptions) {
      const template = templateOrOptions as ContractTemplate;
      contractData = this.createContractFromTemplate(player, club, template);
    } else {
      contractData = templateOrOptions as Partial<PlayerContract>;
    }

    // Generate unique ID
    const id = this.generateId();

    // Set default values
    const contract: PlayerContract = {
      id,
      playerId,
      clubId,
      type: contractData.type || 'full_time',
      startDate: contractData.startDate || this.getCurrentDate(),
      expiryDate: contractData.expiryDate || this.calculateExpiryDate(
        contractData.startDate || this.getCurrentDate(),
        contractData.type || 'full_time'
      ),
      wage: contractData.wage || this.calculateWage(player, contractData.type || 'full_time'),
      signingBonus: contractData.signingBonus || this.calculateSigningBonus(player, contractData.type || 'full_time'),
      releaseClause: contractData.releaseClause ?? this.calculateReleaseClause(player, contractData.type || 'full_time'),
      sellOnPercentage: contractData.sellOnPercentage ?? DEFAULT_SELL_ON_PERCENTAGE,
      isLoan: contractData.isLoan || false,
      parentClubId: contractData.parentClubId || null,
      loanExpiryDate: contractData.loanExpiryDate || null,
      loanFee: contractData.loanFee ?? null,
      loanWagePercentage: contractData.loanWagePercentage ?? null,
      status: 'active',
      createdAt: this.getCurrentDate(),
      updatedAt: this.getCurrentDate(),
    };

    // Add to storage
    this.contracts.set(id, contract);
    this.addPlayerContract(playerId, contract);

    // Update player's club
    player.clubId = clubId;

    return contract;
  }

  /**
   * Create contract data from a template
   */
  private createContractFromTemplate(
    player: Player,
    club: Club,
    template: ContractTemplate
  ): Partial<PlayerContract> {
    return {
      type: template.type,
      startDate: this.getCurrentDate(),
      wage: Math.round(this.calculateBaseWage(player) * template.wageMultiplier),
      signingBonus: Math.round(this.calculateBaseSigningBonus(player) * template.signingBonusMultiplier),
      releaseClause: Math.round(this.calculateBaseReleaseClause(player) * template.releaseClauseMultiplier),
      sellOnPercentage: template.sellOnPercentage,
    };
  }

  /**
   * Calculate base wage for a player
   */
  private calculateBaseWage(player: Player): number {
    // Find the closest wage multiplier based on current ability
    const abilities = Object.keys(WAGE_MULTIPLIERS).map(Number).sort((a, b) => a - b);
    let baseAbility = 50;
    for (const ability of abilities) {
      if (player.currentAbility >= ability) {
        baseAbility = ability;
      } else {
        break;
      }
    }
    return WAGE_MULTIPLIERS[baseAbility];
  }

  /**
   * Calculate base signing bonus for a player
   */
  private calculateBaseSigningBonus(player: Player): number {
    const abilities = Object.keys(SIGNING_BONUS_MULTIPLIERS).map(Number).sort((a, b) => a - b);
    let baseAbility = 50;
    for (const ability of abilities) {
      if (player.currentAbility >= ability) {
        baseAbility = ability;
      } else {
        break;
      }
    }
    return SIGNING_BONUS_MULTIPLIERS[baseAbility];
  }

  /**
   * Calculate base release clause for a player
   */
  private calculateBaseReleaseClause(player: Player): number {
    const abilities = Object.keys(RELEASE_CLAUSE_MULTIPLIERS).map(Number).sort((a, b) => a - b);
    let baseAbility = 50;
    for (const ability of abilities) {
      if (player.currentAbility >= ability) {
        baseAbility = ability;
      } else {
        break;
      }
    }
    return RELEASE_CLAUSE_MULTIPLIERS[baseAbility];
  }

  /**
   * Calculate wage based on player attributes
   */
  private calculateWage(player: Player, contractType: ContractType): number {
    const baseWage = this.calculateBaseWage(player);
    
    // Adjust based on contract type
    let multiplier = 1.0;
    switch (contractType) {
      case 'youth':
        multiplier = 0.5;
        break;
      case 'loan':
        multiplier = DEFAULT_LOAN_WAGE_PERCENTAGE / 100;
        break;
      case 'trial':
        multiplier = 0.3;
        break;
    }

    return Math.round(baseWage * multiplier);
  }

  /**
   * Calculate signing bonus
   */
  private calculateSigningBonus(player: Player, contractType: ContractType): number {
    if (contractType === 'loan' || contractType === 'trial' || contractType === 'youth') {
      return 0;
    }
    return this.calculateBaseSigningBonus(player);
  }

  /**
   * Calculate release clause
   */
  private calculateReleaseClause(player: Player, contractType: ContractType): number | null {
    if (contractType === 'loan' || contractType === 'trial' || contractType === 'youth') {
      return null;
    }
    return this.calculateBaseReleaseClause(player);
  }

  /**
   * Calculate expiry date based on start date and contract type
   */
  private calculateExpiryDate(startDate: DateString, contractType: ContractType): DateString {
    const duration = DEFAULT_CONTRACT_DURATIONS[contractType];
    return this.addYearsToDate(startDate, duration);
  }

  /**
   * Renew a player's contract
   */
  renewContract(
    contractId: EntityId,
    newExpiryDate?: DateString,
    newWage?: number,
    newSigningBonus?: number,
    newReleaseClause?: number | null
  ): PlayerContract | null {
    const contract = this.contracts.get(contractId);
    if (!contract) return null;

    // Create new contract
    const newContract: PlayerContract = {
      ...contract,
      id: this.generateId(),
      startDate: contract.expiryDate,
      expiryDate: newExpiryDate || this.calculateExpiryDate(contract.expiryDate, contract.type),
      wage: newWage ?? contract.wage,
      signingBonus: newSigningBonus ?? 0,
      releaseClause: newReleaseClause ?? contract.releaseClause,
      status: 'active',
      createdAt: this.getCurrentDate(),
      updatedAt: this.getCurrentDate(),
    };

    // Mark old contract as expired
    contract.status = 'expired';
    contract.updatedAt = this.getCurrentDate();
    this.contracts.set(contractId, contract);

    // Add new contract
    this.contracts.set(newContract.id, newContract);
    this.addPlayerContract(contract.playerId, newContract);

    return newContract;
  }

  /**
   * Terminate a contract early
   */
  terminateContract(contractId: EntityId, reason: string): boolean {
    const contract = this.contracts.get(contractId);
    if (!contract) return false;

    // Can't terminate expired or already terminated contracts
    if (contract.status === 'expired' || contract.status === 'terminated') {
      return false;
    }

    contract.status = 'terminated';
    contract.updatedAt = this.getCurrentDate();
    this.contracts.set(contractId, contract);

    // Release the player
    const player = this.players.get(contract.playerId);
    if (player) {
      player.clubId = null;
    }

    return true;
  }

  /**
   * Release a player from their contract
   */
  releasePlayer(playerId: EntityId, reason: string): boolean {
    const player = this.players.get(playerId);
    if (!player) return false;

    const contracts = this.playerContracts.get(playerId);
    if (!contracts || contracts.length === 0) return false;

    // Get active contract
    const activeContract = contracts.find(c => c.status === 'active');
    if (!activeContract) return false;

    // Terminate the contract
    return this.terminateContract(activeContract.id, `Released: ${reason}`);
  }

  /**
   * Offer a new contract to a player
   */
  offerContract(offer: Omit<ContractOffer, 'id' | 'status' | 'offeredAt'>): ContractOffer {
    const id = this.generateId();
    const fullOffer: ContractOffer = {
      id,
      ...offer,
      status: 'pending',
      offeredAt: this.getCurrentDate(),
      respondedAt: null,
      counterOffers: [],
    };

    // Add to negotiations
    const negotiation: ContractNegotiation = {
      id: this.generateId(),
      playerId: offer.playerId,
      clubId: offer.clubId,
      offers: [fullOffer],
      status: 'ongoing',
      startedAt: this.getCurrentDate(),
      completedAt: null,
      notes: '',
    };

    this.negotiations.set(negotiation.id, negotiation);

    return fullOffer;
  }

  /**
   * Accept a contract offer
   */
  acceptContractOffer(offerId: EntityId): PlayerContract | null {
    const offer = this.getContractOffer(offerId);
    if (!offer) return null;

    // Create contract from offer
    const contract = this.createContract(
      offer.playerId,
      offer.clubId,
      {
        type: offer.type,
        startDate: offer.startDate,
        expiryDate: offer.expiryDate,
        wage: offer.wage,
        signingBonus: offer.signingBonus,
        releaseClause: offer.releaseClause,
        isLoan: offer.isLoan,
        loanExpiryDate: offer.loanExpiryDate,
        loanFee: offer.loanFee,
        loanWagePercentage: offer.loanWagePercentage,
      }
    );

    if (!contract) return null;

    // Update offer status
    offer.status = 'accepted';
    offer.respondedAt = this.getCurrentDate();

    // Update negotiation status
    const negotiation = this.getNegotiationForOffer(offerId);
    if (negotiation) {
      negotiation.status = 'completed';
      negotiation.completedAt = this.getCurrentDate();
      this.negotiations.set(negotiation.id, negotiation);
    }

    return contract;
  }

  /**
   * Reject a contract offer
   */
  rejectContractOffer(offerId: EntityId, reason?: string): boolean {
    const offer = this.getContractOffer(offerId);
    if (!offer) return false;

    offer.status = 'rejected';
    offer.respondedAt = this.getCurrentDate();

    // Update negotiation status
    const negotiation = this.getNegotiationForOffer(offerId);
    if (negotiation) {
      // If all offers are rejected, mark negotiation as failed
      const allRejected = negotiation.offers.every(o => o.status === 'rejected');
      if (allRejected) {
        negotiation.status = 'failed';
        negotiation.completedAt = this.getCurrentDate();
        this.negotiations.set(negotiation.id, negotiation);
      }
    }

    return true;
  }

  /**
   * Get a contract offer by ID
   */
  private getContractOffer(offerId: EntityId): ContractOffer | null {
    for (const negotiation of this.negotiations.values()) {
      const offer = negotiation.offers.find(o => o.id === offerId);
      if (offer) return offer;
    }
    return null;
  }

  /**
   * Get negotiation for an offer
   */
  private getNegotiationForOffer(offerId: EntityId): ContractNegotiation | null {
    for (const negotiation of this.negotiations.values()) {
      if (negotiation.offers.some(o => o.id === offerId)) {
        return negotiation;
      }
    }
    return null;
  }

  /**
   * Get contract by ID
   */
  getContract(contractId: EntityId): PlayerContract | null {
    return this.contracts.get(contractId) || null;
  }

  /**
   * Get all contracts for a player
   */
  getPlayerContracts(playerId: EntityId): PlayerContract[] {
    return this.playerContracts.get(playerId) || [];
  }

  /**
   * Get active contract for a player
   */
  getActiveContract(playerId: EntityId): PlayerContract | null {
    const contracts = this.getPlayerContracts(playerId);
    return contracts.find(c => c.status === 'active') || null;
  }

  /**
   * Get contracts for a club
   */
  getClubContracts(clubId: EntityId): PlayerContract[] {
    const allContracts: PlayerContract[] = [];
    this.contracts.forEach(contract => {
      if (contract.clubId === clubId) {
        allContracts.push(contract);
      }
    });
    return allContracts;
  }

  /**
   * Add a contract to a player's history
   */
  private addPlayerContract(playerId: EntityId, contract: PlayerContract): void {
    if (!this.playerContracts.has(playerId)) {
      this.playerContracts.set(playerId, []);
    }
    this.playerContracts.get(playerId)!.push(contract);
  }

  // ============================================
  // TRANSFER METHODS
  // ============================================

  /**
   * Initiate a transfer for a player
   */
  initiateTransfer(
    playerId: EntityId,
    fromClubId: EntityId,
    toClubId: EntityId,
    type: TransferType = 'permanent',
    initialFee?: number
  ): Transfer | null {
    const player = this.players.get(playerId);
    const fromClub = this.clubs.get(fromClubId);
    const toClub = this.clubs.get(toClubId);
    
    if (!player || !fromClub || !toClub) return null;

    // Check if transfer window is open (unless it's a free transfer)
    if (type !== 'free' && type !== 'end_of_contract' && !this.isTransferWindowOpen()) {
      return null;
    }

    // Check if player has an active contract
    const activeContract = this.getActiveContract(playerId);
    if (!activeContract && type !== 'free') {
      return null;
    }

    // Generate transfer ID
    const id = this.generateId();

    // Calculate fee if not provided
    const fee = initialFee ?? this.calculateInitialTransferFee(player);

    const transfer: Transfer = {
      id,
      playerId,
      fromClubId: type === 'free' ? null : fromClubId,
      toClubId,
      type,
      status: 'negotiating',
      fee,
      wage: this.calculateTransferWage(player, toClub),
      signingBonus: this.calculateTransferSigningBonus(player, toClub),
      sellOnPercentage: DEFAULT_SELL_ON_PERCENTAGE,
      isLoan: type === 'loan' || type === 'loan_with_option',
      loanDuration: type === 'loan' || type === 'loan_with_option' ? 12 : null, // 12 months
      loanExpiryDate: type === 'loan' || type === 'loan_with_option' 
        ? this.addMonthsToDate(this.getCurrentDate(), 12)
        : null,
      loanFee: type === 'loan' || type === 'loan_with_option' 
        ? DEFAULT_LOAN_FEE[Math.min(100, Math.max(50, player.currentAbility))]
        : null,
      loanWagePercentage: DEFAULT_LOAN_WAGE_PERCENTAGE,
      optionToBuy: type === 'loan_with_option',
      optionFee: type === 'loan_with_option' 
        ? DEFAULT_OPTION_FEE[Math.min(100, Math.max(50, player.currentAbility))]
        : null,
      announcedDate: null,
      completionDate: null,
      agentId: player.contract?.agentId || null,
      agentFee: null,
      createdAt: this.getCurrentDate(),
      updatedAt: this.getCurrentDate(),
    };

    // Add to storage
    this.transfers.set(id, transfer);
    this.addPlayerTransfer(playerId, transfer);

    return transfer;
  }

  /**
   * Calculate initial transfer fee for a player
   */
  private calculateInitialTransferFee(player: Player): number {
    // Base fee based on current ability and potential
    const baseFee = (player.currentAbility + player.potentialAbility) * 100000;
    
    // Adjust based on contract status
    const activeContract = this.getActiveContract(player.id);
    if (activeContract) {
      // If contract has a release clause, use that as minimum
      if (activeContract.releaseClause) {
        return Math.max(baseFee, activeContract.releaseClause);
      }
      
      // If contract has more than 2 years left, increase fee
      const yearsLeft = this.getYearsBetween(
        this.getCurrentDate(),
        activeContract.expiryDate
      );
      if (yearsLeft > 2) {
        return baseFee * 1.5;
      }
    }

    return baseFee;
  }

  /**
   * Calculate transfer wage for a player at a new club
   */
  private calculateTransferWage(player: Player, toClub: Club): number {
    // Base wage based on player's current ability
    const baseWage = this.calculateBaseWage(player);
    
    // Adjust based on club's wage budget
    const wageBudgetRatio = toClub.wageBudget / 1000000; // Normalize
    const wageMultiplier = 0.5 + (wageBudgetRatio / 20); // 0.5 to 1.0 multiplier
    
    return Math.round(baseWage * wageMultiplier);
  }

  /**
   * Calculate transfer signing bonus
   */
  private calculateTransferSigningBonus(player: Player, toClub: Club): number {
    const baseBonus = this.calculateBaseSigningBonus(player);
    
    // Adjust based on club's financial strength
    const financialMultiplier = toClub.finances / 10000000; // Normalize
    return Math.round(baseBonus * (0.5 + financialMultiplier / 20));
  }

  /**
   * Place a bid on a transfer
   */
  placeTransferBid(
    transferId: EntityId,
    clubId: EntityId,
    amount: number,
    installments?: number,
    upfrontPercentage?: number,
    addOns?: TransferBidAddOn[]
  ): TransferBid | null {
    const transfer = this.transfers.get(transferId);
    if (!transfer) return null;

    // Can't bid on your own transfer
    if (clubId === transfer.fromClubId || clubId === transfer.toClubId) {
      return null;
    }

    // Can't bid if transfer is completed or cancelled
    if (transfer.status !== 'negotiating' && transfer.status !== 'agreed_personal_terms') {
      return null;
    }

    const id = this.generateId();
    const bid: TransferBid = {
      id,
      transferId,
      clubId,
      amount,
      installments: installments || 1,
      upfrontPercentage: upfrontPercentage || 100,
      addOns: addOns || [],
      status: 'pending',
      bidDate: this.getCurrentDate(),
      expiryDate: this.addDaysToDate(this.getCurrentDate(), 7), // 7 days to respond
    };

    this.transferBids.set(id, bid);
    return bid;
  }

  /**
   * Accept a transfer bid
   */
  acceptTransferBid(bidId: EntityId): boolean {
    const bid = this.transferBids.get(bidId);
    if (!bid) return false;

    const transfer = this.transfers.get(bid.transferId);
    if (!transfer) return false;

    // Only the selling club can accept bids
    if (transfer.fromClubId !== bid.clubId) return false;

    // Update bid status
    bid.status = 'accepted';
    this.transferBids.set(bidId, bid);

    // Update transfer status
    transfer.status = 'agreed_fee';
    transfer.fee = bid.amount;
    transfer.updatedAt = this.getCurrentDate();
    this.transfers.set(transfer.id, transfer);

    return true;
  }

  /**
   * Reject a transfer bid
   */
  rejectTransferBid(bidId: EntityId, counterOffer?: number): boolean {
    const bid = this.transferBids.get(bidId);
    if (!bid) return false;

    const transfer = this.transfers.get(bid.transferId);
    if (!transfer) return false;

    // Only the selling club can reject bids
    if (transfer.fromClubId !== bid.clubId) return false;

    // Update bid status
    bid.status = 'rejected';
    this.transferBids.set(bidId, bid);

    // If there's a counter offer, create a new bid
    if (counterOffer) {
      this.placeTransferBid(
        transfer.id,
        transfer.fromClubId!,
        counterOffer,
        bid.installments,
        bid.upfrontPercentage,
        bid.addOns
      );
    }

    return true;
  }

  /**
   * Agree personal terms with a player
   */
  agreePersonalTerms(transferId: EntityId, wage: number, signingBonus: number): boolean {
    const transfer = this.transfers.get(transferId);
    if (!transfer) return false;

    // Can only agree personal terms after fee is agreed (or for free transfers)
    if (transfer.status !== 'agreed_fee' && transfer.type !== 'free') {
      return false;
    }

    transfer.wage = wage;
    transfer.signingBonus = signingBonus;
    transfer.status = 'agreed_personal_terms';
    transfer.updatedAt = this.getCurrentDate();
    this.transfers.set(transferId, transfer);

    return true;
  }

  /**
   * Complete a transfer
   */
  completeTransfer(transferId: EntityId): boolean {
    const transfer = this.transfers.get(transferId);
    if (!transfer) return false;

    // Can only complete after personal terms are agreed
    if (transfer.status !== 'agreed_personal_terms' && transfer.type !== 'free') {
      return false;
    }

    // Check if medical is needed and completed
    if (transfer.status !== 'medical' && this.requiresMedical(transfer)) {
      transfer.status = 'medical';
      transfer.updatedAt = this.getCurrentDate();
      this.transfers.set(transferId, transfer);
      return false;
    }

    // Complete the transfer
    transfer.status = 'completed';
    transfer.completionDate = this.getCurrentDate();
    transfer.updatedAt = this.getCurrentDate();
    this.transfers.set(transferId, transfer);

    // Update player's club
    const player = this.players.get(transfer.playerId);
    if (player) {
      player.clubId = transfer.toClubId;

      // If it's a loan, don't change the parent club
      if (!transfer.isLoan) {
        // Terminate old contract
        const oldContract = this.getActiveContract(transfer.playerId);
        if (oldContract) {
          oldContract.status = 'terminated';
          oldContract.updatedAt = this.getCurrentDate();
          this.contracts.set(oldContract.id, oldContract);
        }

        // Create new contract
        this.createContract(transfer.playerId, transfer.toClubId, {
          type: 'full_time',
          startDate: this.getCurrentDate(),
          wage: transfer.wage,
          signingBonus: transfer.signingBonus,
          releaseClause: transfer.fee * 2, // Release clause = 2x transfer fee
        });
      } else {
        // For loans, create a loan contract
        this.createContract(transfer.playerId, transfer.toClubId, {
          type: 'loan',
          startDate: this.getCurrentDate(),
          expiryDate: transfer.loanExpiryDate!,
          wage: Math.round(transfer.wage * (transfer.loanWagePercentage! / 100)),
          isLoan: true,
          parentClubId: transfer.fromClubId,
          loanExpiryDate: transfer.loanExpiryDate,
          loanFee: transfer.loanFee,
          loanWagePercentage: transfer.loanWagePercentage,
        });
      }
    }

    // Pay transfer fee
    if (transfer.fromClubId && transfer.fee > 0) {
      const fromClub = this.clubs.get(transfer.fromClubId);
      const toClub = this.clubs.get(transfer.toClubId);
      
      if (fromClub && toClub) {
        fromClub.balance += transfer.fee;
        toClub.balance -= transfer.fee;
      }
    }

    // Pay agent fee if applicable
    if (transfer.agentId && transfer.agentFee) {
      const agent = this.agents.get(transfer.agentId);
      if (agent) {
        this.addAgentCommission({
          agentId: transfer.agentId,
          transferId: transfer.id,
          amount: transfer.agentFee,
          percentage: agent.commissionRate,
          paid: false,
          paymentDate: null,
        });
      }
    }

    return true;
  }

  /**
   * Check if a transfer requires a medical
   */
  private requiresMedical(transfer: Transfer): boolean {
    // Permanent transfers and loans with option to buy require medicals
    return transfer.type === 'permanent' || 
           (transfer.isLoan && transfer.optionToBuy);
  }

  /**
   * Pass a medical for a transfer
   */
  passMedical(transferId: EntityId): boolean {
    const transfer = this.transfers.get(transferId);
    if (!transfer) return false;

    if (transfer.status !== 'medical') return false;

    // 90% chance of passing medical
    if (Math.random() > 0.9) {
      transfer.status = 'agreed_personal_terms';
      transfer.updatedAt = this.getCurrentDate();
      this.transfers.set(transferId, transfer);
      return true;
    }

    // 10% chance of failing medical
    transfer.status = 'cancelled';
    transfer.updatedAt = this.getCurrentDate();
    this.transfers.set(transferId, transfer);
    return false;
  }

  /**
   * Cancel a transfer
   */
  cancelTransfer(transferId: EntityId, reason: string): boolean {
    const transfer = this.transfers.get(transferId);
    if (!transfer) return false;

    // Can't cancel completed transfers
    if (transfer.status === 'completed') return false;

    transfer.status = 'cancelled';
    transfer.updatedAt = this.getCurrentDate();
    this.transfers.set(transferId, transfer);

    return true;
  }

  /**
   * Get a transfer by ID
   */
  getTransfer(transferId: EntityId): Transfer | null {
    return this.transfers.get(transferId) || null;
  }

  /**
   * Get all transfers for a player
   */
  getPlayerTransfers(playerId: EntityId): Transfer[] {
    return this.playerTransfers.get(playerId) || [];
  }

  /**
   * Get transfers for a club (as buyer or seller)
   */
  getClubTransfers(clubId: EntityId): Transfer[] {
    const transfers: Transfer[] = [];
    this.transfers.forEach(transfer => {
      if (transfer.fromClubId === clubId || transfer.toClubId === clubId) {
        transfers.push(transfer);
      }
    });
    return transfers;
  }

  /**
   * Add a transfer to a player's history
   */
  private addPlayerTransfer(playerId: EntityId, transfer: Transfer): void {
    if (!this.playerTransfers.has(playerId)) {
      this.playerTransfers.set(playerId, []);
    }
    this.playerTransfers.get(playerId)!.push(transfer);
  }

  // ============================================
  // AGENT METHODS
  // ============================================

  /**
   * Add an agent
   */
  addAgent(agent: Agent): void {
    this.agents.set(agent.id, agent);
  }

  /**
   * Remove an agent
   */
  removeAgent(agentId: EntityId): void {
    this.agents.delete(agentId);
  }

  /**
   * Get an agent by ID
   */
  getAgent(agentId: EntityId): Agent | null {
    return this.agents.get(agentId) || null;
  }

  /**
   * Get all agents
   */
  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Add agent commission
   */
  private addAgentCommission(commission: Omit<AgentCommission, 'id'>): AgentCommission {
    const id = this.generateId();
    const fullCommission: AgentCommission = { id, ...commission };
    
    if (!this.agentCommissions.has(commission.agentId)) {
      this.agentCommissions.set(commission.agentId, []);
    }
    this.agentCommissions.get(commission.agentId)!.push(fullCommission);

    return fullCommission;
  }

  /**
   * Get commissions for an agent
   */
  getAgentCommissions(agentId: EntityId): AgentCommission[] {
    return this.agentCommissions.get(agentId) || [];
  }

  /**
   * Pay agent commission
   */
  payAgentCommission(commissionId: EntityId): boolean {
    const commission = this.getAgentCommission(commissionId);
    if (!commission) return false;

    commission.paid = true;
    commission.paymentDate = this.getCurrentDate();

    // Update agent's earnings
    const agent = this.agents.get(commission.agentId);
    if (agent) {
      agent.earnings += commission.amount;
    }

    return true;
  }

  /**
   * Get a commission by ID
   */
  private getAgentCommission(commissionId: EntityId): AgentCommission | null {
    for (const commissions of this.agentCommissions.values()) {
      const commission = commissions.find(c => c.id === commissionId);
      if (commission) return commission;
    }
    return null;
  }

  // ============================================
  // TRANSFER WINDOW METHODS
  // ============================================

  /**
   * Check if transfer window is open
   */
  isTransferWindowOpen(): boolean {
    const today = this.getCurrentDate();
    return this.transferWindows.some(window => {
      return today >= window.startDate && today <= window.endDate;
    });
  }

  /**
   * Get active transfer windows
   */
  getActiveTransferWindows(): TransferWindow[] {
    const today = this.getCurrentDate();
    return this.transferWindows.filter(window => {
      return today >= window.startDate && today <= window.endDate;
    });
  }

  /**
   * Add a transfer window
   */
  addTransferWindow(window: TransferWindow): void {
    this.transferWindows.push(window);
  }

  /**
   * Remove a transfer window
   */
  removeTransferWindow(windowId: EntityId): void {
    this.transferWindows = this.transferWindows.filter(w => w.id !== windowId);
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

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
   * Add months to a date
   */
  private addMonthsToDate(date: DateString, months: number): DateString {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d.toISOString().split('T')[0];
  }

  /**
   * Add years to a date
   */
  private addYearsToDate(date: DateString, years: number): DateString {
    const d = new Date(date);
    d.setFullYear(d.getFullYear() + years);
    return d.toISOString().split('T')[0];
  }

  /**
   * Get years between two dates
   */
  private getYearsBetween(startDate: DateString, endDate: DateString): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    return diffTime / (1000 * 60 * 60 * 24 * 365);
  }

  /**
   * Generate a unique ID
   */
  private generateId(): EntityId {
    return Math.floor(Math.random() * 1000000000);
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
   * Clear all data
   */
  clear(): void {
    this.players.clear();
    this.clubs.clear();
    this.contracts.clear();
    this.playerContracts.clear();
    this.negotiations.clear();
    this.transfers.clear();
    this.playerTransfers.clear();
    this.transferBids.clear();
    this.transferNegotiations.clear();
    this.transferListings.clear();
    this.agents.clear();
    this.agentCommissions.clear();
    this.transferWindows = [];
    this.contractTemplates = [];
  }
}
