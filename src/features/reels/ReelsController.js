import { Model, ResponsiveManager } from "../../core"
import { DebugPanel } from "../../utils";
import { drawBounds } from "../../utils/drawBounds";
import { generateLineColors } from "../../utils/generateLinesColors";
import { SymbolView } from "../symbols";
import ReelView from "./ReelView"

export default class ReelsController {
    constructor({ scene, model }) {
        /** @type {Phaser.Scene} */
        this.scene = scene
        /** @type {Model} */
        this.model = model

        this.isPlayingWin = false;

        this.reelsContainer = this.scene.add.container(0, 0).applyResponsive('reels');

        /** @type {ReelView[]} */
        this.reels = []

        this._createReels()

        this._createStickiesContainer()

        this._createLinesContainer()

        this._drawMask()
    }

    _getResponsiveConfig() {
        return ResponsiveManager.getForScene(this.scene)?.get('reels') || {};
    }

    getContainersToShowBorder() {
        const result = [this.reelsContainer];

        this.reels.forEach(reel => {
            result.push(reel.container);
        });

        return result;
    }

    _getSymbol({ position, reel }) {
        return this.reels[reel].symbols[position];
    }

    _drawMask(){
        let fillAlpha = this.model.getDebugMode() ? .1 : 0;
        this.maskShape = this.scene.add.graphics();
        this.maskShape.fillStyle(0xFF0000, fillAlpha);

        const x = this.reelsContainer.x;
        const y = this.reelsContainer.y;
        const scale = this.reelsContainer.scaleX;
        const symbolSize = this.model.getSymbolSize();
        const reelsConfig = this._getResponsiveConfig();
        const gap = reelsConfig.gapBetweenRows ?? this.model.getReelsConfig().gapBetweenRows ?? 0;

        for (let i = 0; i < this.model.getGrid().length; i++){
            const rows = this.model.getGrid()[i];
            const xx = x + symbolSize * i * scale;
            const yy = y + this.model.getReelsY()[i] * scale;
            const width = symbolSize * scale;
            const height = (symbolSize * rows + gap * (rows - 1)) * scale;
            this.maskShape.fillRect(xx, yy, width, height);
        }

        const mask = this.maskShape.createGeometryMask();
        this.reelsContainer.setMask(mask);
    }

    _createReels() {
        const initialX = 0
        const reelsConfig = this._getResponsiveConfig();
        const gapBetweenReels = reelsConfig.gapBetweenReels ?? this.model.getGapBetweenReels();

        this.reelsBG = this.scene.add.sprite(0,0,'reelsBG').setOrigin(0.2).setScale(0.8);
        this.reelsContainer.add(this.reelsBG);

        for (let i = 0; i < this.model.getGrid().length; i++) {
            const reelView = this._createReelView(i)
            const reelSpacing = this.model.getSymbolSize() + gapBetweenReels;
            reelView.setPosition(
                initialX + (i * reelSpacing),
                0
            );
            const reelViewContainer = reelView.getContainer()
            this.reelsContainer.add(reelViewContainer)

            this.reels.push(reelView)
        }

        this.reelsFrame = this.scene.add.sprite(this.reelsContainer.x-45, this.reelsContainer.y - 75, 'reelsFrame')
            .setOrigin(0)
            .setScale(0.65, 0.75)
            .setDepth(1).setVisible(true)
    }

    _createReelView(index) {
        const reelHeight = this.model.getGrid()[index]
        const strip = this.model.getReelById(index)

        const reelView = new ReelView({
            scene: this.scene,
            initialHeight: reelHeight,
            model: this.model,
            index,
            strip,
            spinCount: 3+index
        });
        

        return reelView
    }

    _createLinesContainer(){
        const {x, y, scaleX, scaleY} = this.reelsContainer

        this.linesContainer = this.scene.add.container(0, 0).setScale(scaleX, scaleY).setDepth(1)
    }

    _createStickiesContainer(){
        const {x, y, scaleX, scaleY} = this.reelsContainer

        this.stickiesContainer = this.scene.add.container(x, y).setScale(scaleX, scaleY)

        /** @type {(SymbolView | null)[][]} */
        this.stickies = [];
        this.stickies = this.model.getGrid().map(rows =>
            Array(rows).fill(null)
        );
    }

    stopSpin(){
        this.reels.forEach(reelView => {
            reelView.symbols.forEach((symbolView) => {
                symbolView?.stopSpin();
            });
        });
    }

    resetQuickStop(){
        this.reels.forEach(reelView => {
            reelView.symbols.forEach((symbolView) => {
                if (symbolView) symbolView.isQuickStop = false
            });
        });
    }

    async addNewSymbols({ strip, heights }) {
        const promises = this.reels.map((reelView, i) =>
            reelView.addNewSymbolsAboveTheScreen({
                strip: strip[i],
                height: heights[i]
            })
        );
        await Promise.all(promises);
    }

    async showNewSymbols({steps}){
        const fallFromAbovePromises = []
        for (let i = 0; i < this.reels.length; i++) {
            const reelView = this.reels[i];
            const delay = 50 * i
            fallFromAbovePromises.push(reelView.fallSymbolsFromAboveScreen(delay, steps))
        }
                
        await Promise.all(fallFromAbovePromises);
    }

    async destroyClusterSymbols(){
        const destroyPromises = []
        for (let cluster of this.deleteCascadeSymbols ?? []) {
            const reel = this.reels[cluster.reel]
            destroyPromises.push(reel.animateDestroySymbol(cluster.row));
        }
        await Promise.all(destroyPromises)
    }

    async applyGravityToSymbols(){
        const fallPromises = this.reels.map(reel => reel.animateFallSymbols());
        await Promise.all(fallPromises)
    }

    async dropCascadeSymbols({strip}){
        const cascadePromises = this.reels.map((reel, i) => 
            reel.addCascadeSymbols(strip[i])
        );
        await Promise.all(cascadePromises);
    }

    async showLines({prizes = []}) {
        this.deleteCascadeSymbols = [];

        if (!prizes?.length) return;

        this.scene.sound.play('won', {volume: 0.04});

        const symbolRefs = prizes.flatMap(prize => prize.symbols ?? prize);

        const animationPromises = symbolRefs.map(sym => {
            this.deleteCascadeSymbols.push({ reel: sym.reel, row: sym.position, reelset: 'main' });
            return this.reels[sym.reel].showWinnerSymbols(sym.position);
        });

        await Promise.all(animationPromises);
    }

    async makeSymbolsFallFromScreen(){
        const symbolsFallFromScreen = this.reels.map(async (reelView, i) => {
            let delay = 50 * i;
            const response = reelView.makeSymbolsFallFromScreen({
                delay
            });
            return response
        });
        await Promise.all(symbolsFallFromScreen)
    }

    /**
     * 
     * @param {[][]} strip 
     * @param {number} delayBetweenReels Unidad: ms
     */
    async animateSpin(strip, delayBetweenReels = 50, speedMultiplier = 1){
        const animationPromises = this.reels.map(async (reelView, i) => {
            const reelStrip = strip[i];
            if (!reelStrip) return; 
            const response = reelView.animateSpin({
                delay: i * delayBetweenReels,
                steps: strip[i].length * reelView.spinCount,
                speedMultiplier
            });
            await response
            reelView.clearExtraSymbols(strip[i].length)
            return response
        });

        await Promise.all(animationPromises);
    }

    async playLinesAnimation({ wonPrizes = [], effects = [], duration = 600, delayBetweenLines = 500 }) {
        this.isPlayingWin = true;
        const lineColors = generateLineColors(wonPrizes.length);

        if (!this._lineGraphics) {
            this._lineGraphics = this.scene.add.graphics();
            this.linesContainer.add(this._lineGraphics)
        }

        const delay = (ms) => new Promise(res => {
            this._activeTimeout = setTimeout(res, ms);
        });

        while (this.isPlayingWin) {
            for (let [index, group] of wonPrizes.entries()) {
                if (!this.isPlayingWin) return;

                const symbols = group.symbols.map(p => this._getSymbol(p));

                this._drawLine(group, lineColors[index], this._lineGraphics);

                if (effects.length > 0) {
                    await Promise.all(
                        effects.map(effect => effect(symbols, duration, delay))
                    );
                } else {
                    await delay(duration); // <- espera aunque no haya effects
                }

                this._lineGraphics.clear();
                await delay(delayBetweenLines);
            }
        }
    }

    _drawLine(group, color) {
        this._lineGraphics.clear();

        const points = group.symbols
            .sort((a, b) => a.reel - b.reel)
            .map(p => this._getSymbolWorldPosition(p));

        this._lineGraphics.lineStyle(10, color, 1);
        this._lineGraphics.beginPath();
        this._lineGraphics.moveTo(points[0].x, points[0].y);
        points.slice(1).forEach(p => this._lineGraphics.lineTo(p.x, p.y));
        this._lineGraphics.strokePath();
    }

    _getSymbolWorldPosition({ reel, position }) {
        const symbol = this._getSymbol({ reel, position });
        const matrix = symbol.container.getWorldTransformMatrix();

        // offset to center of the sprite
        const halfWidth = symbol.view.displayWidth / 2;
        const halfHeight = symbol.view.displayHeight / 2;

        return { 
            x: matrix.tx + halfWidth, 
            y: matrix.ty + halfHeight 
        };
    }

    async playWaysAnimation({ wonPrizes, effects = [], duration, delayBetweenWays = 0}) {
        this.isPlayingWin = true;

        if (effects.length == 0) return

        this.scene.sound.play('won', { volume: 0.1 });


        const delay = (ms) => new Promise(res => {
            this._activeTimeout = setTimeout(res, ms);
        });
        
        while (this.isPlayingWin) {
            for (let group of wonPrizes) {
                if (!this.isPlayingWin) return;

                const symbols = group.symbols.map(p => this._getSymbol(p));

                await Promise.all(
                    effects.map(effect => effect(symbols, duration, delay))
                );

                await delay(delayBetweenWays);
            }
        }
    }

    addStickies({stickiesIDs = [], stickiesValues = []}){
        const symbolsID = new Set(stickiesIDs)

        const tempPoint = new Phaser.Math.Vector2();
        for (let reel = 0; reel < this.reels.length; reel++) {
            const reelView = this.reels[reel];
            for (let row = 0; row < reelView.symbols.length; row++) {
                const symbolView = reelView.symbols[row]
                if (!symbolView) continue
                const id = symbolView.getId()
                if (symbolsID.has(id) && !this.stickies[reel][row]){
                    const x = reelView.container.x
                    const y = symbolView.getPosition().y

                    const sticky = new SymbolView({scene: this.scene, model: this.model, index: row, id,})

                    sticky.setPosition(x, y)
                    this.stickiesContainer.add([sticky.container])
                    this.stickies[reel][row] = sticky;
                }
            }
        }
    }

    async resetWinAnimations(){
        this.isPlayingWin = false;
        clearTimeout(this._activeTimeout);
        this._activeTimeout = null;

        this.clearLines()

        const promises = this.reels.flatMap(reel => {
            reel.clearTweens();
            return reel.symbols.map(sym => sym?.resetVisual());
        });

        await Promise.all(promises);
    }

    showAllBorders(wonPrizes) {
        const symbols = wonPrizes
            .flatMap(prize => prize.symbols)
            .map(p => this._getSymbol(p));
        
        symbols.forEach(s => s.showBorder());
    }

    dimNonWinning(wonPrizes) {
        const winning = new Set();

        wonPrizes.forEach(group => {
            group.symbols.forEach(p => {
                winning.add(this._getSymbol(p));
            });
        });

        this.reels.forEach(reel => {
            reel.symbols.forEach(sym => {
                if (sym && !winning.has(sym)) {
                    sym.dim();
                }
            });
        });
    }

    async pulseWinningSymbols(wonPrizes) {
        this.isPlayingWin = true;

        while (this.isPlayingWin) {
            for (let group of wonPrizes) {

                const symbols = group.symbols.map(p => this._getSymbol(p));

                await Promise.all(symbols.map(sym => sym.playPulse()));

                await this._delay(500);
            }
        }
    }

    async borderWinningSymbols(wonPrizes, showAll = false) {
        this.isPlayingWin = true;

        if (showAll) {
            this._showAllBorders(wonPrizes);
        } else {
            this.playWaysBorderLoop(wonPrizes);
        }
    }

    _showAllBorders(wonPrizes) {
        const winning = new Set();

        wonPrizes.forEach(group => {
            group.forEach(p => {
                const sym = this._getSymbol(p);
                winning.add(sym);
            });
        });

        winning.forEach(sym => sym.showBorder());
    }

    async playWaysBorderLoop(wonPrizes){
        while (this.isPlayingWin) {
            for (let group of wonPrizes) {
                const symbols = group.map(p => this._getSymbol(p));

                // prender bordes
                symbols.forEach(sym => sym.showBorder());

                await this._delay(1100);

                // apagar bordes
                symbols.forEach(sym => sym.stopBorder());
            }
        }
    }

    _delay(ms) {
        return new Promise(resolve => {
            this.scene.time.delayedCall(ms, resolve, null, this);
        });
    }
    
    resetReels(){
        this.clearStickies();
    }

    clearLines() {
        this.linesContainer.removeAll(true)
        this._lineGraphics = null;
        this.isPlayingWin = false;
    }

    clearStickies() {
        this.stickiesContainer.removeAll(true);
        this.stickies = this.stickies.map(row => row.map(() => null));
    }
}
