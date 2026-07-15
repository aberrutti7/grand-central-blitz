import { Model, ResponsiveManager } from "../../core";
import { SymbolView } from "../symbols";
import { drawBounds } from "../../utils/drawBounds";
import { SYMBOLS_TO_GROW, SYMBOLS_TO_SHAKE, WILD_ID } from "../../constants/IDs";

export default class ReelView extends Phaser.Events.EventEmitter {

    constructor({scene, model, container, index, initialHeight, initialY, strip, spinCount}) {
        super();

        /** @type { Phaser.Scene } */
        this.scene = scene;
        /** @type { Model } */
        this.model = model;
        this.container = this.scene.add.container(0,0)
        this.index = index;
        this.initialHeight = initialHeight;
        this.setReelHeight(initialHeight);
        this.initialY = initialY;
        this.strip = strip;
        this.spinCount = spinCount; 
        this.inBonus = false;
        this.createView();
    }

    _getResponsiveConfig() {
        return ResponsiveManager.getForScene(this.scene)?.get('reels') || {};
    }

    getContainer() {
        return this.container;
    }

    createView() {
        this.createInitialSymbols();
    }

    setPosition(x, y){
        this.container.setX(x)
        this.container.setY(y)
    }

    getView() {
        return this.container;
    }

    getSymbolsCount(){
        return this.symbolsCount;
    }

    getSymbols(){
        return this.symbols;
    }
    
    createInitialSymbols() {
        /** @type { SymbolView[] } */
        this.symbols = [];

        for (let i = 0; i < this.actualHeight; i++) {
            const id = this.strip[i % this.strip.length];
            const symbolView = this._createSymbol({ id, index: i });
            this.symbols.push(symbolView);
        }
    }

    _createSymbol({ id, index }) {
        const symbolView = new SymbolView({
            scene: this.scene,
            model: this.model,
            id,
            index,
            symbolsPerReel: this.actualHeight,
            reelHeight: this.actualHeight,
            rowHeight: this.rowHeight,
        });
        symbolView.setPosition(0, index * this.rowHeight);
        this.container.add(symbolView.getContainer());
        return symbolView;
    }

    stopSpin() {
        this.symbols.forEach((symbolView)=>{
            symbolView?.stopSpin()
        })
    }

    async makeSymbolsFallFromScreen({delay}) {
        const fallPromises = this.symbols.map((symbol, i) => {
            if (!symbol) return Promise.resolve();
            const response = symbol.fallFromScreen(delay);
            return response     
        });
        await Promise.all(fallPromises);
    }

    async fallSymbolsFromAboveScreen(delay, steps){
        const animPromises = this.symbols.map((symbol) => {
            return symbol?.fallFromAbove(delay, steps, false)
        });
        await Promise.all(animPromises)
    }

    async animateDestroySymbol(row, shouldEmitParticle) {
        const symbol = this.symbols[row]
        if (symbol) {
            await symbol.animateDestroy()
        }
        this.symbols[row] = null
    }

    async animateFallSymbols() {
        const promises = []
        for (let i = this.symbols.length - 1; i >= 0; i--) {
            let symbol = this.symbols[i];
            if (symbol == null) {
                symbol = this.getNextFallingSymbol(i - 1);
                if (symbol != null) {
                    this.symbols[i] = symbol;
                    promises.push(symbol.fallCascade(i))
                }
            }
        }
        return Promise.all(promises)
    }

    async addCascadeSymbols(strip) { 
        const newSymbols = this._createMissingSymbols(strip);
        this._recalculateIndexes();
        await this._animateNewSymbols(newSymbols);
    }

    _createMissingSymbols(strip) {
        const newSymbols = [];
        let steps = 0;

        for (let i = this.symbols.length - 1; i >= 0; i--) {
            if (this.symbols[i] == null) {
                steps++;
                const symbol = this._buildSymbol(strip[i], -steps);
                symbol.container.y = -(steps - i) * this.rowHeight - this.rowHeight;
                this.container.add([symbol.container]);
                this.symbols[i] = symbol;
                newSymbols.push({ symbol, delay: i * 50, steps: steps - i });
            } else {
                this.symbols[i].index = i;
                this.symbols[i].forcePosY();
            }
        }

        return newSymbols;
    }

    _buildSymbol(id, index) {
        if (id == -1) id = WILD_ID;

        return new SymbolView({
            scene: this.scene,
            model: this.model,
            symbolsPerReel: this.actualHeight,
            reelHeight: this.actualHeight,
            rowHeight: this.rowHeight,
            id,
            index,
        });
    }

    _recalculateIndexes() {
        this.symbols.forEach((symbol, i) => {
            if (symbol != null) symbol.index = i;
        });
    }

    async _animateNewSymbols(newSymbols) {
        const promises = newSymbols
            .filter(({ symbol }) => symbol != null)
            .map(({ symbol, delay, steps }) => symbol.fallFromAbove(delay, steps, true));

        await Promise.all(promises);
    }

    getNextFallingSymbol(startingIndex) {
        for (let i = startingIndex; i >= 0; i--) {
            let symbol = this.symbols[i];
            if (symbol != null) {
                this.symbols[i] = null;
                return symbol;
            }
        }

        return null;
    }

    /**
     * @param { number[][] } strip 
     * Agregar los símbolos del strip arriba de 
     * la pantalla sin dummies.
     */
    async addNewSymbolsAboveTheScreen({ strip, height }) {
        this.clearSymbols();
        this.setReelHeight(height);
        this.symbols = [];

        for (let row = 0; row < height; row++) {
            const symbolView = this._createSymbol({ id: strip[row], index: row });
            symbolView.container.y = (row - height) * this.rowHeight;
            this.symbols.push(symbolView);
        }
    }

    async showWinnerSymbols(symbolPosition) {
        const winnerSymbol = this.symbols[symbolPosition];
        if (!winnerSymbol) return;
        await winnerSymbol.makeWinner();
    }


    async addNewSymbols({ strip }) {
        let nextIndex = -1;

        for (let spin = 0; spin < this.spinCount; spin++) {
            const isLastSpin = spin === this.spinCount - 1;

            for (let j = strip.length - 1; j >= 0; j--) {
                const id = isLastSpin
                    ? strip[j]
                    : Math.floor(Math.random() * 9) + 1;

                const symbol = this._createSymbol({
                    id,
                    index: nextIndex--,
                });

                this.symbols.unshift(symbol);
            }
        }

        this.symbols.forEach((sym, i) => {
            sym.index = i;
        });

        this.actualHeight = strip.length;
    }

    clearExtraSymbols(fixedHeight) {
        if (this.symbols.length>fixedHeight){
            while(this.symbols.length > fixedHeight){
                this.symbols.pop().destroy();
            }
        }  
    }

    async animateSpin({ delay = 0, steps, speedMultiplier = 1 }) {
        const reelsConfig = this._getResponsiveConfig();
        const symbolSize = reelsConfig.symbolSize ?? this.model.getSymbolSize();
        const gapBetweenSymbols = reelsConfig.gapBetweenRows ?? this.model.getGapBetweenRows();
        const rowSpacing = symbolSize + gapBetweenSymbols;

        const spinCount = steps / this.symbols.length;
        const duration = (500 + (spinCount * 400)) / speedMultiplier;

        const lift = 15;
        const overshoot = 20;
        const startY = this.container.y;
        this._finalY = startY + rowSpacing * steps;
        
        return new Promise(resolve => {
            this._spinResolve = resolve;

            this.spinTween = this.scene.tweens.chain({
                targets: this.container,
                delay: delay,
                tweens: [
                    {
                        y: this.container.y - lift,
                        duration: 180 / speedMultiplier,
                        ease: 'Power2.InOut'
                    },
                    {
                        y: this._finalY + overshoot,
                        duration: duration,
                        ease: 'Sine.InOut'
                    },
                    {
                        y: this._finalY,
                        duration: 120 / speedMultiplier,
                        ease: 'Sine.Out'
                    }
                ],
                onComplete: () => {
                    this._repositionSymbols();
                    this._finalY = null;
                    this._spinResolve = null;
                    resolve();
                }
            });
        });
    }

    _repositionSymbols() {
        const reelsConfig = this._getResponsiveConfig();
        const symbolSize = reelsConfig.symbolSize ?? this.model.getSymbolSize();
        const gapBetweenSymbols = reelsConfig.gapBetweenRows ?? this.model.getGapBetweenRows();
        const rowSpacing = symbolSize + gapBetweenSymbols;

        this.symbols.forEach((sym, i) => {
            sym.setPosition(0, i * rowSpacing);
        });

        this.container.y = 0;
    }

    _computeRowHeight(height) {
        return (this.model.getSymbolSize() * 3) / height; 
    }

    setReelHeight(height) {
        this.actualHeight = height;
        this.rowHeight = this._computeRowHeight(height);
    }

    delay(ms) {
        return new Promise(resolve => {
            this.scene.time.delayedCall(ms, resolve, null, this);
        });
    }

    changeSymbolView(row, new_id){
        this.symbols[row].changeView(new_id);
    }

    clearTweens(){
        if (this.spinTween){
            this.spinTween.stop();
            this.spinTween = null;
        }
    }
    
    clearSymbols(){
        for (let i=0; i< this.symbols.length; i++){
            this.symbols[i]?.destroy();
        }
    }
}
