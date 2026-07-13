import config from "@config";
import { Model, SpinResult, ResponsiveManager } from "../core";
import { borderEffect, EFFECTS_MAP, ReelsController } from "../features/reels";
import { UIControlsBar, UIView } from "../ui";
import GameState from "./GameState";
import { SLOT_TYPES } from "../constants/slotTypes";
import { MYSTERY_ID } from "../constants/IDs";
import { DebugPanel, DevTool, StatsPanel } from "../utils";
import SessionManager from "../services/SessionManager";
import DraggableHelper from "../utils/DraggableHelper";

export default class GameController extends Phaser.Scene {
    constructor(){
        super("GameController")
    }

    async create(data){
        if (!data?.fontsReady) {
            await document.fonts.ready;
            await document.fonts.load('16px Inter');
            await document.fonts.load('bold 16px Inter');
            if (document.fontLoading) {
                await document.fontLoading;
            }
        }

        this.responsive = new ResponsiveManager(this);
        ResponsiveManager.setForScene(this, this.responsive);

        this._createDraggableHelper()
        this._createModel()
        this._createUI()
        this._createStatsPanel()
        this._createSessionManager()
        this._createControllers()
        this._createDevTools()
    }

    _createDraggableHelper() {
        this.draggableHelper = new DraggableHelper(this);

        if (config.debug) {
            this.input.keyboard.on('keydown-D', () => {
                this.draggableHelper.toggle();
            });
        }

        document.addEventListener('keydown', (event) => {
            if (event.code === 'Space' && !event.repeat) {
                if (document.activeElement && document.activeElement.blur) {
                    document.activeElement.blur();
                }
                event.preventDefault();
                const stopContainer = this.controls_bar?.spinButton?.getStopContainer();
                if (stopContainer?.visible) {
                    this.controls_bar?._onStopClick();
                } else if (!this.controls_bar?.isSpinning) {
                    if (this.controls_bar?.spinButton?.spinButtonIsLocked) return;
                    this.controls_bar?._onSpinClick();
                }
            }
        });
    }
    
    _createSessionManager(){
        this.sessionManager = new SessionManager();
    
        this.sessionManager.startInactivityTimer(
            () => {
                this.ui.showTimeoutScreen()
            },
            10,
            (minutes, seconds) => {
                this.statsPanel.updateSessionTimer(minutes, seconds);
            }
        );
    }
    // -------------------
    // CREATE ELEMENTS
    // -------------------
    _createStatsPanel(){
        this.statsPanel = new StatsPanel(this, false, this.responsive.isMobileView(), config.paytable);
    }

    _createDevTools(){
        if (!this.model.getDebugMode()) return

        this.devTool = new DevTool({scene: this})
        this.devTool.register([
            ...this.reelsController.getContainersToShowBorder(),
            ...this.ui.getContainersToShowBorder(),
        ])
        this.devTool.executeFunction(async ()=>{
            
        })
    }

    _createModel(){
        const gameConfig = config
        const gameName = gameConfig.gameName.toLowerCase().trim().split(/\s+/).map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1)).join(' ');
        document.title = `${gameName} | Slot Demo Tool`

        const emoji = config.emojiFavicon || "";

        document.head.innerHTML += `
        <link rel="icon" href="data:image/svg+xml,
        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
            <text y='0.9em' font-size='90'>${emoji}</text>
        </svg>">
        `;
        
        this.model = new Model(this, gameConfig, this.game.api)
        this.state = new GameState({model: this.model})
    }

    _createUI(){
        this.ui = new UIView({scene: this, model: this.model})
        if (this.game.api){
            const { version } = this.game.api.session
            this.ui.updateVersion(version)
        }
        
        this._createUIControls()
        
        this.bgm = this.sound.add('gameBGM', {
            volume: 0.02, 
            loop: true 
        });
        this.bgm.play();
    }
    
    _createUIControls(){
        this.controls_bar = new UIControlsBar({scene: this, model: this.model})
        
        this.controls_bar.on('startSpin', ()=>{
            this.startSpin({isBonusBuy: false, type: this.state.getGameType()})
        })
        
        this.controls_bar.on('setGameType', (value)=>{
            this.state.setGameType(value)
        })

        this.controls_bar.on('stopSpin', ()=>{
            this.stopSpin()
        })

        this.controls_bar.on('setSideBet', (isSideBet, sideBet)=>{
            const currentSideBet = isSideBet ? sideBet : null
            const multiplier = currentSideBet ? currentSideBet.multiplier : this.model.getSideBet()
            this.state.setSideBet(isSideBet, currentSideBet)
            this.controls_bar.betSelector.updateBetValues(isSideBet, multiplier, this.model.getBet())
        })

        this.controls_bar.on('autoPlay', (rounds)=>{
            this.controls_bar.updateRoundsLeft(rounds)
            this.state.setAutoPlay(true)
            this.state.setAutoPlayRounds(rounds)
            this.startSpin({isBonusBuy: false, type: this.state.getGameType()})
        })

        this.controls_bar.on('stopAutoPlay', () => {
            this.state.setAutoPlay(false)
            this.state.setAutoPlayRounds(0)
        })

        this.controls_bar.on('updateTotalBet', (value)=>{
            this.state.setTotalBet(value)
        })
        this.controls_bar.on('setTurbo', (isTurbo) => {
            this.state.setTurbo(isTurbo);
            const gameSpeed = this.state.getTurbo() ? 2 : 1
            this.tweens.timeScale = gameSpeed;
        });

        this.controls_bar.on('bonusBuy', (bonusBuyInfo)=>{
            if (this.state.sideBet) this.state.setSideBet(false);
            this.state.setBonusBuy(bonusBuyInfo)
            this.startSpin({isBonusBuy: true, type: this.state.bonusBuy.type})
        })
    }

    _createControllers() {
        this._createReels()
    }

    _createReels(){
        this.reelsController = new ReelsController({
            scene: this,
            model: this.model
        })
    }
    
    // -------------------
    // SPIN
    // -------------------

    async startSpin({isBonusBuy = true, type}){
        if (!this.chargeBalance(isBonusBuy)) {
            this.controls_bar.enableControls();
            return;
        }
    
        this._prepareUI();
        this.reelsController.resetReels()

        const spinType = isBonusBuy ? 'basegame' : type
        
        const newPlay = await this.model.getSpin({
            type: spinType, 
            sidebet: this.state.isSideBet() ? { id: this.state.getSideBetId() } : null,
            bonusBuy: isBonusBuy ? type : null
        });

        if (!newPlay){
            alert("No plays were found.")
            this.state.refundBalance();
            this.controls_bar.updateBalance(this.state.getBalance());
            this.controls_bar.enableControls()
            return
        }
        const meta = this.model.getPlayMeta()
        
        this.sessionManager.resetInactivityTimer()
        this.statsPanel.setMeta(meta.file, meta.playNumber)
        this.statsPanel.registerSpin(this.state.getBet())
        
        await this.spinResponse(newPlay)
    }

    async spinResponse(result) {
        try {
            this._updateAutoPlay();
            await this._prepareForSpin(result);
            this.controls_bar.disableStopButton();
            await this._resolveResult();
        } catch (error) {
            console.error('Spin error:', error);
            this.controls_bar.enableControls();
        }
    }
    
    stopSpin(){
        this.reelsController.stopSpin()
    }

    // -------------------
    // AUTOPLAY
    // -------------------

    _prepareUI(){
        this.state.setTotalWin(0);
        this.controls_bar.updateTotalWin(this.state.getTotalWin());
        this.controls_bar.disableControls();
    }

    _updateAutoPlay(){
        if (this.state.isAutoPlay() && !this.state.isBonusActive()){
            this.state.consumeAutoPlayRound()
            this.controls_bar.updateRoundsLeft(this.state.getRoundsLeft())
        }
    }

    async _prepareForSpin(result) {
        this.controls_bar.enableStopButton();

        this.state.resetValues();
        this.lastResult = new SpinResult(result);
        this.previousResultType = this.lastResult.spinType;

        this.state.addFreeSpins(this.lastResult.freeGames);

        if (this.state.isBonusActive()) {
            this.updateFSLeft(this.lastResult.remainingFreeGames);
        }

        await this.handleSpin()
    }

    async handleSpin(){
        const spinType = this.lastResult.spinType;
        
        switch(spinType){
            case "cascade":
                await this.handleCascade()
                break;
            case "freespins":
            default:
                await this.handleBasespin()
                break;
        }
    }

    async handleBasespin(){
        await this.reelsController.makeSymbolsFallFromScreen()
        await this.reelsController.addNewSymbols({strip: this.lastResult.reelsSlices})
        await this.reelsController.showNewSymbols({ steps: this.lastResult.reelsSlices.length * 6 });
    }

    async handleCascade(){
        await this.reelsController.applyGravityToSymbols();

        await this.reelsController.dropCascadeSymbols({ strip: this.lastResult.reelsSlices });
        
        this.reelsController.resetQuickStop()
    }

    async applyModifiers(){
        /** 
         * ACÁ VAN TODAS LAS FUNCIONES DE CADA MODIFICADOR
        */
    }

    async _resolveResult() {
        await this.playWinAnimations();
        await this.reelsController.destroyClusterSymbols();
        await this.handleSpinEnd();
    }

    updateFSLeft(remainingFreeGames){
        this.state.setRemainingFreeSpins(remainingFreeGames)
        this.ui.updateFSLeft(remainingFreeGames);
    }
    
    async spinFinished() {
        this.statsPanel.registerWin(this.state.totalWin, this.state.getBet())
        
        const shouldContinue = this.state.isAutoPlay();

        if (this.state.isBonusActive()) {
            await this.endFreeGames(this.state.getTotalWin());
        }

        if (shouldContinue) {
            this.startSpin({
                isBonusBuy: false,
                type: this.state.getGameType()
            });
        } else {
            this.controls_bar.hideStopAutoPlay()
            this.state.setAutoPlay(false);
            this.controls_bar.enableControls();
        }
    }

    _restartControls(){
        this.controls_bar.enableControls()
    }

    async handleSpinEnd() {
        const totalWin = this.lastResult.wonCredits
    
        await this._handleSpinWin(totalWin)

        if (this.state.hasFreeSpins()){
            await this._handleFreeGames(this.lastResult.freeGames);
        }

        const response = this.model.spinNextStep();

        if (!response){
            this.controls_bar.updateBalance(this.state.getBalance());
            this.spinFinished()
            return
        }

        this.spinResponse(response)
    }

    async _handleSpinWin(win) {
        this.state.addWin(win);

        const spinWin = this.state.getSpinWin();
        const isBigWin = this.state.isBigWin();

        if (win > 0) {
            if (isBigWin) {
                await this.ui.showBigWin(spinWin, isBigWin.type)
                await this.turboDelay(1000);
                await this.ui.closeBigWin();
            } else {
                await this.ui.showSpinWin(spinWin);
                await this.turboDelay(1000);
                await this.ui.closeSpinWin();
            }
        }

        this.controls_bar.updateBalance(this.state.getBalance());
        this.controls_bar.updateTotalWin(this.state.getTotalWin());

        if (win > 0) await this.turboDelay(500);
    }

    async _handleFreeGames(freeGamesNumber){
        if (this.previousResultType != "basespin") return
        this.state.setBonus(true);

        await this.ui.showWonFreeGamesSign(freeGamesNumber);
        this.ui.updateFSLeft(freeGamesNumber)
        this.ui.showFreeGamesScene()
        await this.turboDelay(1000)
        await this.ui.closeWonFreeGamesSign()
    }

    async endFreeGames(win){
        this.state.setBonus(false)

        if (win > 0){
            await this.ui.showTotalWin(win)
            await this.turboDelay(700)
            this.ui.showBaseScene()
            await this.ui.closeTotalWin()
        } else {
            await this.ui.showNoWinSign()
            await this.turboDelay(700)
            this.ui.showBaseScene()
            await this.ui.closeNoWinSign()
        }
    }
    
    async _handleWaysAnimation({ border, effects = [], duration, delayBetweenWays }) {
        const wonPrizes = this.lastResult.wonPrizes
        if (wonPrizes.length == 0) return

        this.reelsController.dimNonWinning(wonPrizes);

        if (border?.visible && !border.groupBySymbol) {
            this.reelsController.showAllBorders(wonPrizes);
        }

        let resolvedEffects = effects
            .map(name => {
                const effect = EFFECTS_MAP[name];

                if (!effect) {
                    console.warn(`Effect "${name}" no existe`);
                    return null;
                }

                return effect;
            }).filter(Boolean)

        if (border?.visible && border.groupBySymbol) {
            resolvedEffects.push(borderEffect);
        }

        await this.reelsController.playWaysAnimation({
            wonPrizes,
            effects: resolvedEffects,
            duration,
            delayBetweenWays
        });
    }

    async _handleLinesAnimation({ effects = [], duration, delayBetweenLines }) {
        const wonPrizes = this.lastResult.wonPrizes;
        if (wonPrizes.length == 0) return;

        this.reelsController.dimNonWinning(wonPrizes);

        const resolvedEffects = effects
            .map(name => {
                const effect = EFFECTS_MAP[name];
                if (!effect) {
                    console.warn(`Effect "${name}" no existe`);
                    return null;
                }
                return effect;
            }).filter(Boolean);


        await this.reelsController.playLinesAnimation({
            wonPrizes,
            effects: resolvedEffects,
            duration,
            delayBetweenLines
        });
    }

    async playWinAnimations(){
        await this.turboDelay(500)
        await this._handleCascadeAnimation()
    }

    async _handleCascadeAnimation(){
        await this.reelsController.showLines({ prizes: this.lastResult.wonPrizes });
    }

    chargeBalance(isBonusBuy) {
        let success;

        if (isBonusBuy) {
            success = this.state.chargeBonus(this.state.bonusBuy);
        } else {
            success = this.state.chargeBet();
        }

        if (success) {
            this.controls_bar.updateBalance(this.state.getBalance());
        }

        return success;
    }
    
    delay(ms) {
        return new Promise(resolve => {
            this.time.delayedCall(ms, resolve, null, this);
        });
    }
    turboDelay(ms) {
        return this.delay(ms / (this.state.getTurbo() ? 5 : 1));
    }
    async resetWinAnimations() {
        await this.reelsController.resetWinAnimations();
        await this.delay(100)
    }
}
