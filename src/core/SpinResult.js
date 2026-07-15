export default class SpinResult {

  constructor(rawSpin) {
    this.reelsSlices = rawSpin.data.reelsSlices || []
    this.reelHeights = [
      this.reel1Height = rawSpin.data.reel1Height || 3,
      this.reel2Height = rawSpin.data.reel2Height || 3,
      this.reel3Height = rawSpin.data.reel3Height || 3
    ]
    
    
    this.moneySymbolValues = rawSpin.data.money_symbols_values || []

    this.trigger_fs = rawSpin.data.trigger_fs || null
    this.remainingFreeGames = rawSpin.data.remainingFreeGames
    this.freeGames = rawSpin.data.freeGames
    
    this.ways_win = rawSpin.data.ways_win ?? 0
    this.wonPrizes = rawSpin.data.wonPrizes || []
    this.coins_win = rawSpin.data.coins_win ?? 0
    this.wonCredits = rawSpin.data.wonCredits ?? this.coins_win + this.ways_win
    
    this.spinType = rawSpin.type
  }
}