import config from "@config";
import { Model, SpinResult, ResponsiveManager } from "../core";
import { borderEffect, EFFECTS_MAP, ReelsController, ExtraReelController  } from "../features/reels";
import { UIControlsBar, UIView } from "../ui";
import GameState from "./GameState";
import { SLOT_TYPES } from "../constants/slotTypes";
import { MYSTERY_ID } from "../constants/IDs";
import {
    PP_SCATTER_ID,
    PP_SCATTER_SYMBOL_ID,
    PP_LEVEL_SCALES,
    PP_MAX_LEVEL,
    PP_NATURAL_MAX_LEVEL,
    PP_CONFIG,
    PP_SCATTER_DROP,
    getPPLevelForCounter
} from "../constants/PP";
import { DebugPanel, DevTool, StatsPanel } from "../utils";
import SessionManager from "../services/SessionManager";
import DraggableHelper from "../utils/DraggableHelper";
import LightningBeam from "../features/reels/effects/LightningBeamShader";

//config fs particle
const FS_COUNTER_CONFIG = {
    delayBeforeRetrigger: 400,
    delayBetweenScatters: 250,
    flyParticle: false,
    highlightScatter: true,
    retriggerTable: [0, 1, 3, 7],
    awardMode: 'total',
    retriggerInSameSpin: true,
    autoActivateOnFreeSpin: false,
};

export default class GameController extends Phaser.Scene {
    constructor(){
        super("GameController")
    }

    async create(data){
        if (!data?.fontsReady) {
            await document.fonts.ready;
            await document.fonts.load('16px Inter');
            await document.fonts.load('bold 16px Inter');
            await document.fonts.load('16px Metropolis-Bold');
            await document.fonts.load('16px Metropolis-Black');
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
        this._createPP()
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

    _createLightningBeam() {
        this.lightningBeam = new LightningBeam(this, {
            depth: 3,          // por encima de los reels/electro - depth2 
            thickness: 1.6,
            amplitude: 9,
            frequency: 0.02,
            speed: 3,
            node: 0.55,
            gain: 1,         
           //cyan/plasma/magenta disponibles
        });

        this.lightningBeam.connect(this.electro1, this.electro2);
        //console.log(this.electro1, this.electro2)
        
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
            if (this.state.isSideBet()) this.state.setSideBet(false);
            this.state.setBonusBuy(bonusBuyInfo)
            this.startSpin({isBonusBuy: true, type: this.state.bonusBuy.type})
        })
    }

    _createControllers() {
        this._createReels()
        this._createLightningBeam()
        
    }

    // -------------------
    // PP (PERCEIVED PERSISTANCE)
    // -------------------

    _createPP(){
        this.train = this.add.image(0, 0, 'train')
            .applyResponsive('train')
            .setDepth(2.9);
        this.ppRays = this.add.image(this.train.x, this.train.y, 'rays')
            .setDepth(this.train.depth - 1)
            .setVisible(false)
            .setAlpha(0)
            .setScale(0);

        this.ppRaysRotation = null;
        this.PPBaseScaleX = this.train.scaleX;
        this.PPBaseScaleY = this.train.scaleY;
        this.PPBaseY = this.train.y;

        this.PPCounter = 0; 
        this.PPLevel = 0;
        this.PPForcedMax = false;
        this.ppTriggeredFS = false;
        this.ppScatterSprites = [];

        this._applyPPLevelScale(0, { instant: true });
    }

    async _showPPRays() {
        if (!this.ppRays) return;

        this.ppRays.setPosition(this.train.x, this.train.y);
        this.ppRays
            .setVisible(true)
            .setAlpha(1)
            .setScale(0)
            .setAngle(0);

        return new Promise(resolve => {
            this.tweens.add({
                targets: this.ppRays,
                scale: 0.45,
                angle: 120,
                duration: 500,
                ease: 'Back.Out',
                onComplete: () => {

                    this.ppRaysRotation?.stop();

                    this.ppRaysRotation = this.tweens.add({
                        targets: this.ppRays,
                        angle: 480,
                        duration: 8000,
                        repeat: -1,
                        ease: 'Linear'
                    });

                    resolve();
                }
            });
        });
    }

    _hidePPRays() {
        if (!this.ppRays) return;

        this.ppRaysRotation?.stop();
        this.ppRaysRotation = null;

        this.tweens.killTweensOf(this.ppRays);

        this.ppRays
            .setVisible(false)
            .setAlpha(0)
            .setScale(0)
            .setAngle(0);
    }

    getPPCounter(){
        return this.PPCounter;
    }

    getPPLevel(){
        return this.PPLevel;
    }

    getPPTarget(){
        const matrix = this.train.getWorldTransformMatrix();
        return { x: matrix.tx, y: matrix.ty };
    }

    async updatePP({ forceMaxOnLast = false } = {}){
        if (!this.reelsController || !this.train) return;

        const scatters = this.reelsController.getSymbolsWorldPositionById(PP_SCATTER_ID);

        if (scatters.length === 0) {
            // Sin scatter normal no hay partícula de la cual colgar la explosión.
            if (forceMaxOnLast) await this.forcePPMaxLevel();
            return;
        }

        if (PP_CONFIG.sequential) {
            for (let i = 0; i < scatters.length; i++) {
                const isLast = i === scatters.length - 1;

                await this._sendPPParticle(scatters[i], { forceMax: forceMaxOnLast && isLast });

                if (!isLast) {
                    await this.turboDelay(PP_CONFIG.delayBetweenParticles);
                }
            }
        } else {
            await Promise.all(scatters.map(s => this._sendPPParticle(s)));
            if (forceMaxOnLast) await this.forcePPMaxLevel();
        }
    }

    async _sendPPParticle(scatter, { forceMax = false } = {}){
        const target = this.getPPTarget();

        if (PP_CONFIG.highlightSymbol) {
            scatter.symbol.growAnimation(0, 0.15);
        }

        await this.reelsController.sendParticleTo(scatter.x, scatter.y, target.x, target.y);

    
        if (forceMax) {
            this.PPCounter = Math.max(0, this.PPCounter + 1);
            await this.forcePPMaxLevel();
            return;
        }

        await this.addPP(1);
    }

    async addPP(amount = 1){
        const previousLevel = this.PPLevel;

        this.PPCounter = Math.max(0, this.PPCounter + amount);

        // El último nivel está bloqueado: por contador nunca se llega,
        // sólo se desbloquea forzado por PP_scatter.
        const cap = this.PPForcedMax ? PP_MAX_LEVEL : PP_NATURAL_MAX_LEVEL;
        const newLevel = Math.max(previousLevel, Math.min(getPPLevelForCounter(this.PPCounter), cap));

        if (newLevel !== previousLevel) {
            this.PPLevel = newLevel;
            await this._playPPLevelUp(newLevel);
        } else {
            await this._bouncePP();
        }
    }

    // -------------------
    // PP SCATTERS (símbolos que caen fuera del spin)
    // -------------------

    async handlePPSequence(){
        const slots = this._getPPScatterSlots();
        if (slots.length === 0) return;
        if (!this.reelsController) return;

        this.ppResolvedThisStep = true;

        await this.updatePP({ forceMaxOnLast: true });

        await this.turboDelay(PP_SCATTER_DROP.delayAfterExplosion);

        await this._dropPPScatters(slots);
    }

    async _dropPPScatters(slots){
        await this.turboDelay(PP_SCATTER_DROP.delayBeforeDrop);

        if (PP_SCATTER_DROP.sequential) {
            for (let i = 0; i < slots.length; i++) {
                await this._dropPPScatter(slots[i]);
                if (i < slots.length - 1) await this.turboDelay(PP_SCATTER_DROP.delayBetweenDrops);
            }
        } else {
            await Promise.all(
                slots.map((slot, i) => this._dropPPScatter(slot, i * PP_SCATTER_DROP.delayBetweenDrops))
            );
        }

        
        if (PP_SCATTER_DROP.countTowardsCounter) {
            this.PPCounter = Math.max(0, this.PPCounter + slots.length);
        }
    }

    _getPPScatterSlots(){
        const raw = this.lastResult?.ppScatters ?? [];

        return raw
            .map(item => ({
                reel: item.reel ?? 0,
                position: item.row ?? item.position ?? 0
            }))
            .filter(slot => this.reelsController?.getSymbolAt(slot));
    }

    _dropPPScatter(slot, delay = 0){
        const target = this.reelsController.getSlotWorldRect(slot);
        const source = this.reelsController.getSymbolAt(slot);

        if (!target || !source) return Promise.resolve();

        const frame = `sym_${PP_SCATTER_SYMBOL_ID}_h${source.reelHeight}`;

        const sprite = this.add.sprite(target.x, target.y, 'symbols', frame)
            .setOrigin(0.5)
            .setDepth(PP_SCATTER_DROP.depth);

        const finalScaleX = target.width / sprite.width;
        const finalScaleY = target.height / sprite.height;

        sprite.setPosition(target.x, target.y - PP_SCATTER_DROP.startOffsetY);
        //sprite.setScale(finalScaleX * PP_SCATTER_DROP.startScale, finalScaleY * PP_SCATTER_DROP.startScale);
        sprite.setAngle(PP_SCATTER_DROP.startAngle);
        sprite.setAlpha(0);

        return new Promise(resolve => {
            this.tweens.add({
                targets: sprite,
                delay,
                y: target.y,
                alpha: 1,
                angle: 0,
                scaleX: finalScaleX,
                scaleY: finalScaleY,
                duration: PP_SCATTER_DROP.flyDuration,
                ease: PP_SCATTER_DROP.flyEase,
                onComplete: () => this._landPPScatter({ slot, sprite, source, finalScaleX, finalScaleY, resolve })
            });
        });
    }

    _landPPScatter({ slot, sprite, source, finalScaleX, finalScaleY, resolve }){
        const { impactSquash, impactDuration } = PP_SCATTER_DROP;

        //source.growAnimation?.(0, 0);

        this.tweens.chain({
            targets: sprite,
            tweens: [
                {
                    scaleX: finalScaleX * (1 + impactSquash),
                    scaleY: finalScaleY * (1 - impactSquash),
                    duration: impactDuration,
                    ease: 'Sine.Out'
                },
                {
                    scaleX: finalScaleX,
                    scaleY: finalScaleY,
                    duration: impactDuration * 1.6,
                    ease: 'Back.Out'
                }
            ],
            onComplete: () => {
                if (PP_SCATTER_DROP.replaceReelSymbol) {
                    this.reelsController.setSymbolId(slot, PP_SCATTER_SYMBOL_ID);
                    sprite.destroy();
                } else {
                    this.ppScatterSprites.push(sprite);
                }
                resolve();
            }
        });

        
    }

    /** Desbloquea y fuerza el nivel máximo, sin importar el contador ni el nivel actual. */
    async forcePPMaxLevel() {

    if (!this.train) return;

    this.PPForcedMax = true;

    if (this.PPLevel === PP_MAX_LEVEL) {
        await this._bouncePP();
        return;
    }

    this.PPLevel = PP_MAX_LEVEL;

    await Promise.all([
        this._showPPRays(),
        this._playPPLevelUp(PP_MAX_LEVEL)
    ]);
}

    _clearPPScatterSprites(){
        this.ppScatterSprites?.forEach(sprite => sprite.destroy());
        this.ppScatterSprites = [];
    }

    async resetPP({ instant = false } = {}){
        this.PPCounter = 0;
        this.PPLevel = 0;
        this.PPForcedMax = false;

        this._clearPPScatterSprites();

        if (!this.train) return;

        this._hidePPRays();

        this._killPPTweens();
        this.train.y = this.PPBaseY;

        await this._applyPPLevelScale(0, { instant });
    }

    _getPPScaleForLevel(level){
        const factor = PP_LEVEL_SCALES[level] ?? PP_LEVEL_SCALES[PP_LEVEL_SCALES.length - 1];

        return {
            scaleX: this.PPBaseScaleX * factor,
            scaleY: this.PPBaseScaleY * factor
        };
    }

    _killPPTweens(){
        this.tweens.killTweensOf(this.train);
    }

    _applyPPLevelScale(level, { instant = false } = {}){
        const { scaleX, scaleY } = this._getPPScaleForLevel(level);

        if (instant) {
            this.train.setScale(scaleX, scaleY);
            return Promise.resolve();
        }

        const { duration, ease } = PP_CONFIG.reset;

        return new Promise(resolve => {
            this.tweens.add({
                targets: this.train,
                scaleX,
                scaleY,
                duration,
                ease,
                onComplete: resolve
            });
        });
    }

    _bouncePP(){
        const { scaleX, scaleY } = this._getPPScaleForLevel(this.PPLevel);
        const { hop, squash, duration } = PP_CONFIG.bounce;

        this._killPPTweens();

        this.tweens.add({
            targets: this.train,
            y: this.PPBaseY - hop,
            duration,
            ease: 'Sine.Out',
            yoyo: true
        });

        return new Promise(resolve => {
            this.tweens.chain({
                targets: this.train,
                tweens: [
                    {
                        scaleX: scaleX * (1 + squash),
                        scaleY: scaleY * (1 - squash),
                        duration,
                        ease: 'Sine.Out'
                    },
                    {
                        scaleX: scaleX * (1 - squash * 0.5),
                        scaleY: scaleY * (1 + squash * 0.8),
                        duration: duration * 1.2,
                        ease: 'Sine.InOut'
                    },
                    {
                        scaleX,
                        scaleY,
                        duration: duration * 2,
                        ease: 'Back.Out'
                    }
                ],
                onComplete: () => {
                    this.train.y = this.PPBaseY;
                    resolve();
                }
            });
        });
    }

    _playPPLevelUp(level){
        const { scaleX, scaleY } = this._getPPScaleForLevel(level);
        const { overshoot, duration, ease } = PP_CONFIG.levelUp;

        this._killPPTweens();

        return new Promise(resolve => {
            this.tweens.chain({
                targets: this.train,
                tweens: [
                    {
                        scaleX: scaleX * (1 + overshoot),
                        scaleY: scaleY * (1 + overshoot),
                        duration: duration * 0.45,
                        ease: 'Sine.Out'
                    },
                    {
                        scaleX,
                        scaleY,
                        duration: duration * 0.55,
                        ease
                    }
                ],
                onComplete: () => {
                    this.train.y = this.PPBaseY;
                    resolve();
                }
            });
        });
    }

    _createReels(){
        this.reelsController = new ReelsController({
            scene: this,
            model: this.model,
        })
        
        this.extraReelFrame = this.add.sprite(0, 0, 'extrareel')
        .applyResponsive('extraReel').setDepth(0);

        this.electro1 = this.add.sprite(0,0, 'electro1')
        .applyResponsive('electro1').setDepth(2).setOrigin(0.5, 0.8);
        
        this.electro2 = this.add.sprite(0,0, 'electro2')
        .applyResponsive('electro2').setDepth(2).setOrigin(0.5, 0.2);

        this.extraReelController = new ExtraReelController({
            scene: this,
            model: this.model,
            maskKey: 'extraReelMask'
        })

        this.squareBG= this.add.image(0,0,'squareBG').applyResponsive('squareBG').setDepth(0)
        this.squareExtra = this.add.image(0,0, 'squareExtra').applyResponsive('square').setDepth(2.5)
        

        // this.add.image(0, 0, 'grand_jackpot').applyResponsive('ui.grand_jackpot');
        // this.add.text(300, 200, "x1000", {fontFamily: "Metropolis-Black",fontSize: 32,fill: "#ffffff",stroke:"#000",strokeThickness: 4}).
        //     setDepth(2).setOrigin(0.5).setVisible(true).applyResponsive('ui.grand_jackpot_label');
    
        // this.add.image(0, 0, 'major_jackpot').applyResponsive('ui.major_jackpot');
        // this.add.text(300, 200, "x1000", {fontFamily: "Metropolis-Black",fontSize: 32,fill: "#ffffff",stroke:"#000",strokeThickness: 4}).
        //     setDepth(2).setOrigin(0.5).setVisible(true).applyResponsive('ui.grand_jackpot_label');


        // this.add.image(0, 0, 'mega_jackpot').applyResponsive('ui.mega_jackpot');
        //     this.add.text(300, 200, "x1000", {fontFamily: "Metropolis-Black",fontSize: 32,fill: "#ffffff",stroke:"#000",strokeThickness: 4}).
        //     setDepth(2).setOrigin(0.5).setVisible(true).applyResponsive('ui.grand_jackpot_label');

        // this.add.image(0, 0, 'mini_jackpot').applyResponsive('ui.mini_jackpot');
        //     this.add.text(300, 200, "x1000", {fontFamily: "Metropolis-Black",fontSize: 32,fill: "#ffffff",stroke:"#000",strokeThickness: 4}).
        //     setDepth(2).setOrigin(0.5).setVisible(true).applyResponsive('ui.grand_jackpot_label');


        // this.add.image(0, 0, 'minor_jackpot').applyResponsive('ui.minor_jackpot');
        //     this.add.text(300, 200, "x1000", {fontFamily: "Metropolis-Black",fontSize: 32,fill: "#ffffff",stroke:"#000",strokeThickness: 4}).
        //     setDepth(2).setOrigin(0.5).setVisible(true).applyResponsive('ui.grand_jackpot_label');
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
        this.extraReelController.reset()
        this._multiplierBaseSet = false

        const spinType = isBonusBuy ? 'basegame' : type
        
        const newPlay = await this.model.getSpin({
            type: spinType, 
            sidebet: !isBonusBuy && this.state.isSideBet() ? { id: this.state.getSideBetId() } : null,
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
        this._fsRawWin = 0;
        this._fsCredited = 0;
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

        this._maybeAutoActivateFreeGames();

        // 1
        if (this._isFreeSpinStart()) {
            this._fsRawWin = 0;
            this._fsCredited = 0;
        }

        if (this.state.isBonusActive() && this._isFreeSpinStart()) {
            this._consumeDisplayedFreeSpin();
        }

        await this.handleSpin()

        //2
        this.ppResolvedThisStep = false;
        await this.handlePPSequence();

        // 3
        if (this.state.isBonusActive()) {
            await this._handleScatterRetrigger();
        }
    }

    _isFreeSpinStart(){
        return this.lastResult.spinType === 'freespin';
    }

    _maybeAutoActivateFreeGames(){
        if (!FS_COUNTER_CONFIG.autoActivateOnFreeSpin) return;
        if (this.state.isBonusActive()) return;
        if (this.lastResult.spinType !== 'freespin') return;
        this.ppTriggeredFS = !!this.ppResolvedThisStep;
        this.state.setBonus(true);
        this.ui.showFreeGamesScene();
        this._resetFSCounter(this.lastResult.remainingFreeGames ?? 0);
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
        await this.reelsController.addNewSymbols({
            strip: this.lastResult.reelsSlices,
            heights: this.lastResult.reelHeights
        })
        await Promise.all([
            this.reelsController.showNewSymbols({ steps: this.lastResult.reelsSlices.length * 6 }),
            this._animateExtraReel() //Siempre
        ]);

        await this._updateMultiplierBarForStep();
    }

    async handleCascade(){
        await this.reelsController.applyGravityToSymbols();

        await this.reelsController.dropCascadeSymbols({ strip: this.lastResult.reelsSlices });
        
        this.reelsController.resetQuickStop()

        await this._updateMultiplierBarForStep();
    }

    async _animateExtraReel() {
        
        await this.extraReelController.spinMultipliersTo(this.lastResult.extraReel, 0); //delay cuarto reeel
        
        
        this.controls_bar.disableStopButton();
    }

    async _updateMultiplierBarForStep() {
        const min = this.lastResult.minMultiplier ?? 1;

        if (!this._multiplierBaseSet) {
            this.extraReelController.setBaseMinMultiplier(min);
            this._multiplierBaseSet = true;
        }

        await this.extraReelController.updateMinMultiplier(min);
    }
    

    async applyModifiers(){
        /** 
         * ACÁ VAN TODAS LAS FUNCIONES DE CADA MODIFICADOR
        */
       
        //if (this.lastResult.spinType == 'basespin' && this.lastResult.wonCredits == 0) await this.updatePP()
        //console.log(this.lastResult.spinType, this.lastResult.wonCredits)
    }

    async _resolveResult() {
        await this.playWinAnimations();
        await this.reelsController.destroyClusterSymbols();
        await this.handleSpinEnd();
    }

    // -------------------
    // FREE GAMES COUNTER (FSLeft)
    // -------------------

    /** Punto de entrada legacy: fija el contador al valor del backend. */
    updateFSLeft(remainingFreeGames){
        this._reconcileFSWithBackend(remainingFreeGames);
    }

    /** Arranca (o reinicia) el contador con un valor conocido. */
    _resetFSCounter(value = 0){
        this.fsDisplayed = Math.max(0, value ?? 0);
        this.fsPendingRetrigger = 0;
        this.fsScatterSeen = new Set();
        this._renderFSLeft(this.fsDisplayed, { pulse: false });
    }

    _renderFSLeft(value, { pulse = true } = {}){
        const safe = Math.max(0, Math.round(value ?? 0));

        this.state.setRemainingFreeSpins(safe);
        this.ui.updateFSLeft(safe);

        if (pulse) this._pulseFSLeft();
    }

    _pulseFSLeft(){
        const label = this.ui?.FSLeft;
        if (!label) return;

        this.tweens.killTweensOf(label);
        label.setScale(1);

        this.tweens.add({
            targets: label,
            scale: 1.35,
            duration: 110,
            yoyo: true,
            ease: 'Sine.InOut',
            onComplete: () => label.setScale(1)
        });
    }

    /** -1 por el spin que se está jugando + acredita lo pendiente del spin anterior. */
    _consumeDisplayedFreeSpin(){
        if (this.fsDisplayed == null) this._resetFSCounter(this.state.getRemainingFreeSpins() ?? 0);

        this.fsScatterSeen = new Set();

        if (!FS_COUNTER_CONFIG.retriggerInSameSpin && this.fsPendingRetrigger > 0){
            this.fsDisplayed += this.fsPendingRetrigger;
            this.fsPendingRetrigger = 0;
        }

        this.fsDisplayed = Math.max(0, this.fsDisplayed - 1);
        this._renderFSLeft(this.fsDisplayed);
    }

    async _handleScatterRetrigger(){
        if (!this.reelsController) return;
        if (!this.fsScatterSeen) this.fsScatterSeen = new Set();

        const onBoard = this.reelsController.getSymbolsWorldPositionById(PP_SCATTER_ID);
        const fresh = onBoard.filter(s => !this.fsScatterSeen.has(s.symbol));
        if (fresh.length === 0) return;

        const before = this.fsScatterSeen.size;
        fresh.forEach(s => this.fsScatterSeen.add(s.symbol));
        const after = this.fsScatterSeen.size;

        const award = this._getRetriggerAward(after) - this._getRetriggerAward(before);
        if (award <= 0) return;

        await this.turboDelay(FS_COUNTER_CONFIG.delayBeforeRetrigger);

        const byTotal = FS_COUNTER_CONFIG.awardMode === 'total';
        const perScatter = byTotal ? null : this._splitAward(award, fresh.length);

        for (let i = 0; i < fresh.length; i++){
            await this._animateScatterToFSLabel(fresh[i]);

            if (!byTotal) this._applyRetrigger(perScatter[i]);

            if (i < fresh.length - 1) await this.turboDelay(FS_COUNTER_CONFIG.delayBetweenScatters);
        }

        if (byTotal) this._applyRetrigger(award);
        await this.delay(400)
    }

    _applyRetrigger(amount){
        if (amount <= 0) return;

        if (FS_COUNTER_CONFIG.retriggerInSameSpin){
            this.fsDisplayed += amount;
            this._renderFSLeft(this.fsDisplayed);
        } else {
            this.fsPendingRetrigger += amount;
            this._pulseFSLeft();
        }
    }

    _getRetriggerAward(scatterCount){
        if (scatterCount <= 0) return 0;

        const table = FS_COUNTER_CONFIG.retriggerTable;
        return table[Math.min(scatterCount, table.length - 1)];
    }

    _splitAward(total, parts){
        if (parts <= 0) return [];

        const base = Math.floor(total / parts);
        const result = new Array(parts).fill(base);
        result[parts - 1] += total - base * parts;

        return result;
    }

    async _animateScatterToFSLabel(scatter){
        if (FS_COUNTER_CONFIG.highlightScatter) scatter.symbol?.growAnimation?.(0, 0.15);

        if (!FS_COUNTER_CONFIG.flyParticle) return;

        const target = this._getFSLabelTarget();
        if (!target) return;

        await this.reelsController.sendParticleTo(scatter.x, scatter.y, target.x, target.y);
    }

    _getFSLabelTarget(){
        const label = this.ui?.FSLeftBackground;
        if (!label) return null;

        const matrix = label.getWorldTransformMatrix();
        return { x: matrix.tx, y: matrix.ty };
    }

    /** El backend manda la verdad en el último paso: se corrige cualquier desvío. */
    _reconcileFSWithBackend(remainingFreeGames){
        if (remainingFreeGames == null) return;

        if (this.fsDisplayed == null) this._resetFSCounter(remainingFreeGames);

        const diff = remainingFreeGames - this.fsDisplayed;

        if (diff !== 0 && this.model.getDebugMode()){
            console.warn(`[FSLeft] desync -> predicho: ${this.fsDisplayed} | backend: ${remainingFreeGames} | diff: ${diff}`);
        }

        this.fsDisplayed = remainingFreeGames;
        this._renderFSLeft(this.fsDisplayed, { pulse: diff !== 0 });
    }
    
    async spinFinished() {
        await this.extraReelController.resetMinMultiplier();

        this.statsPanel.registerWin(this.state.totalWin, this.state.getBet())
        
        const shouldContinue = this.state.isAutoPlay();

        if (this.state.isBonusActive()) {
            await this.endFreeGames();
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
        //if(totalWin>0)this._animateExtraReel(); // Solo cuando hay win
        

        await this._handleSpinWin(totalWin)

        await this.applyModifiers();
        console.log(this.lastResult.trigger_fs)
        if (this.lastResult.trigger_fs){
            await this._handleFreeGames(this.lastResult.freeGames);
        }

        if (this.state.isBonusActive()) {
            if (this.lastResult.lastSpin) this._fsLastSpin = true;
            this._reconcileFSWithBackend(this.lastResult.remainingFreeGames);
        }

        const response = this.model.spinNextStep();

        if (!response){
            await this.updatePP()
            this.controls_bar.updateBalance(this.state.getBalance());
            
            this.spinFinished()
            return
        }

        this.spinResponse(response)
    }

    async _handleSpinWin(win) {
        const inBonus = this.state.isBonusActive();

        this.state.addWin(win, !inBonus);

        if (inBonus) this._fsRawWin = (this._fsRawWin ?? 0) + win;

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

        if (this.lastResult.totalCredits != null) {
            if (inBonus) {
                const credits = this.lastResult.totalCredits;
                const delta = Math.max(0, credits - (this._fsCredited ?? 0));

                this._fsCredited = credits;
                this.state.accrueWin(delta);

                const multiplier = this._fsRawWin > 0 ? credits / this._fsRawWin : 1;

                if (Math.abs(multiplier - 1) > 0.0001) {
                    await this.ui.showMultiWin(this.state.getCash(credits));
                    await this.turboDelay(600);
                    await this.ui.closeMultiWin();
                }
            } else {
                const rawWin = this.state.totalWin;

                this.state.settleWin(this.lastResult.totalCredits);

                const multiplier = rawWin > 0 ? this.state.totalWin / rawWin : 1;

                if (Math.abs(multiplier - 1) > 0.0001) {
                    await this.ui.showMultiWin(this.state.getTotalWin());
                    await this.turboDelay(600);
                    await this.ui.closeMultiWin();
                }
            }
        }

        this.controls_bar.updateBalance(this.state.getBalance());
        this.controls_bar.updateTotalWin(this.state.getTotalWin());

        if (win > 0) await this.turboDelay(500);
    }

    async _handleFreeGames(freeGamesNumber){
        if (this.previousResultType == "freespins") return
        this.ppTriggeredFS = !!this.ppResolvedThisStep;
        this.state.setBonus(true);

        await this.ui.showWonFreeGamesSign(freeGamesNumber);
        this._resetFSCounter(freeGamesNumber)
        this.ui.showFreeGamesScene()
        await this.turboDelay(1000)
        await this.ui.closeWonFreeGamesSign()
    }

    async endFreeGames(){
        const showLastSpinSign = !!this._fsLastSpin;
        this._fsLastSpin = false;

        this.state.setBonus(false)
        this._resetFSCounter(0)

        this._fsRawWin = 0;
        this._fsCredited = 0;

        this.state.commitWin();

        const win = this.state.getTotalWin();

        this.controls_bar.updateBalance(this.state.getBalance());
        this.controls_bar.updateTotalWin(win);

        if (showLastSpinSign){
            await this.ui.showLastSpinSign(20)
            await this.turboDelay(1200)
            await this.ui.closeLastSpinSign()
        }

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

        if (this.ppTriggeredFS) {
            this.ppTriggeredFS = false;
            await this.resetPP();
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
