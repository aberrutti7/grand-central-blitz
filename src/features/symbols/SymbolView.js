import { SYMBOLS_TO_GROW, SYMBOLS_TO_SHAKE } from "../../constants/IDs";
import { Model } from "../../core";
import { DebugPanel } from "../../utils";
import { drawBounds } from "../../utils/drawBounds";

const SPEED_TIME_SCALE = 5

export default class SymbolView extends Phaser.Events.EventEmitter {

    constructor({scene, model, index, id, enterAnim = false, horizonalPos = false, symbolsPerReel, reelHeight = 3, rowHeight}) {
        super();

        /** @type {Phaser.Scene} */
        this.scene = scene;
        /** @type {Model} */
        this.model = model;
        this.index = index;
        this.id = id;
        this.symbolsPerReel = symbolsPerReel;
        this.container = this.scene.add.container(0,0);
        this.reelHeight = reelHeight
        this.rowHeight = rowHeight ?? model.getSymbolSize()
        this._createWinBorder()
        this.createView();
    }

    updateYPos(index){
        this.container.y = this.rowHeight * index
    }

    forcePosY() {
        this.container.y = this.rowHeight * this.index;
    }

    // -------------------
    // GETTERS & SETTERS
    // -------------------
     
    getId(){
        return this.id
    }

    getPosition(){
        return {x: this.container.x, y: this.container.y}
    }

    getContainer(){
        return this.container
    }

    setPosition(x, y){
        this.container.setX(x)
        this.container.setY(y)
    }

    // -------------------
    // CREATE ELEMENTS
    // -------------------

    createView() {
        
        let symName = `sym_${this.id}_h${this.reelHeight}`;        
        this.view = this.scene.add.sprite(0, 0, 'symbols', symName);

        this.initialScale = this.model.getSymbolSize() / this.view.width;

        this.view.scale = this.initialScale * 0.92
        this.view.x += this.view.displayWidth * 0.5;
        this.view.y += this.view.displayHeight * 0.5;
        this.view.setOrigin(0.5);
        
        this.container.add(this.view);
        
        if (this.model.getDebugMode()) {
            this.debug = this.scene.add.text(0, 0, this.id, { font: "bold 60pt Arial", fill: "#F00" });
            this.container.add(this.debug);
        }
    }

    _createWinBorder() {
        this.winBorder = this.scene.add.sprite(0, 0, 'symbols', 'border')
            .setOrigin(0)
            .setAlpha(0);

        this.container.add(this.winBorder);
    }
    
    // -------------------
    // APPEARANCE
    // -------------------

    addValueLabel(value){
        if (!value) return
        if (!this.valueLabel){
            this.valueLabel = this.scene.add.text(75,78, value, { font: "bold 34px Arial", fill: "#fff",stroke:"#000",strokeThickness:5, align: 'center'});
        }
        this.valueLabel.setOrigin(0.5);
        this.container.add(this.valueLabel);
    }

    changeValueLabel(value){
        if (!value || !this.valueLabel) return
        this.valueLabel.setText(value)
    }

    destroyValuelabel(){
        if (this.valueLabel){
            this.valueLabel?.destroy()
            this.valueLabel = null
        }
    }

    changeView(newId){
    this.scene.tweens.killTweensOf(this.view);

    this.view.setFrame(`sym_${newId}_h${this.reelHeight}`);

    this.initialScale = this.model.getSymbolSize() / this.view.width;
    this.view.setScale(this.initialScale * 0.92);
    this.view.setPosition(this.view.displayWidth * 0.5, this.view.displayHeight * 0.5);

    this.id = newId;
}

    // -------------------
    // ANIMATIONS
    // -------------------
    
    growAnimation(delay, scale = 0.25){
        this.scene.tweens.add({
            targets: this.view,
            delay,
            scale: `+=${scale}`,
            ease: 'Sine.InOut',
            duration: 250,
            yoyo: true,
        })
    }

    shakeAnimation(delay = 0, strength = 10){
        this.scene.tweens.add({
            targets: this.view,
            delay,
            angle: -(strength),
            duration: 90,
            ease: 'Sine.Out',
            yoyo: true,
            repeat: 1
        });
    }

     /**
     * @param {Number} delay 
     * Anima los simbolos para que caigan de la pantalla
     */
    fallFromScreen(delay) {
        const currentY = this.container.y;
        const separationFactor = (this.index / this.symbolsPerReel) * 50;
        const targetY = currentY + (this.rowHeight * (this.symbolsPerReel + 1)) + (this.index * separationFactor);

        const timeScale = this.isQuickStop ? SPEED_TIME_SCALE : 1;

        return new Promise((resolve) => {
            this.fallingSymbolTween = this.scene.tweens.add({
                targets: this.container,
                persist: true,
                y: targetY,
                duration: 450,
                ease: 'Cubic.In',
                delay: delay,
                onComplete: () => {
                    this.fallingSymbolTween = null
                    resolve();
                }
            });
            this.fallingSymbolTween.setTimeScale(timeScale)
        });
    }

    fallCascade(index) {
        this.index = index;
        
        const currentY = this.container.y;
        const targetY = this.rowHeight * this.index;
        const distance = Math.abs(targetY - currentY);
        
        const timeScale = this.isQuickStop ? SPEED_TIME_SCALE : 1;

        const duration = 300 + (distance / this.rowHeight) * 80;
        
        return new Promise((resolve)=>{
            this.fallCascadeTween = this.scene.tweens.add({ 
                targets: this.container,
                y: targetY + 15,
                ease: 'Cubic.In',
                duration: duration * 0.85,
                onComplete: () => {
                    this.scene.tweens.add({
                        targets: this.container,
                        y: targetY,
                        ease: 'Back.Out',
                        duration: duration * 0.55,
                        onComplete: () => {
                            this.fallCascadeTween = null
                            this.isQuickStop = false
                            resolve()
                        }
                    });
                }
            });
            this.fallCascadeTween.setTimeScale(timeScale)                  
        })
    }

    animateDestroy() {
        return new Promise((resolve) => {
            let resolved = false;
            const safeResolve = () => {
                if (resolved) return;
                resolved = true;
                this.destroy();
                resolve();
            };

            this.tween = this.scene.tweens.add({
                targets: this.view,
                alpha: 0,
                scaleX: 1.3,
                scaleY: 1.3,
                ease: 'Expo.Out',
                duration: 300,
                onComplete: safeResolve
            });

            this.tween.once('stop', safeResolve);
            this.tween.once('destroy', safeResolve);

            this.scene.time.delayedCall(1000, safeResolve);
        });
    }
    
    makeWinner() {
        // const border = new Phaser.GameObjects.Sprite(this.scene, 0, 0, 'symbols', 'border');
        // border.x = this.view.displayWidth * 0.5;
        // border.y = this.view.displayHeight * 0.5;
        // this.container.add(border);

        // return new Promise(resolve => {
        //     this.scene.tweens.add({
        //         targets: border,
        //         alpha: { from: 0, to: 1 },
        //         duration: 250,
        //         ease: 'Sine.InOut',
        //         repeat: 3,
        //         yoyo: true,
        //         onComplete: () => {
        //             resolve();
        //             border.destroy();
        //         }
        //     });
        // });
    }

    stopSpin(){
        this.isQuickStop = true
        if (this.fallTween) {
            this.fallTween.setTimeScale(SPEED_TIME_SCALE);
        }
        if (this.fallCascadeTween) {
            this.fallCascadeTween.setTimeScale(SPEED_TIME_SCALE)
        }
        if (this.fallingSymbolTween) {
            this.fallingSymbolTween.setTimeScale(SPEED_TIME_SCALE)
        }
    }

    fallFromAbove(delay, steps, cascade){
        return new Promise(resolve => {
            const shakeSymbols = new Set(SYMBOLS_TO_SHAKE);
            const growSymbols = new Set(SYMBOLS_TO_GROW);
            
            let spinCount = steps / this.symbolsPerReel;
            const currentY = this.container.y;
            let targetY = this.index * this.rowHeight;
            
            const baseDuration = 500 + (spinCount * this.index);
            const overshoot = 15;

            const timeScale = this.isQuickStop ? SPEED_TIME_SCALE : 1;
                        
            if (shakeSymbols.has(this.id)) {
                this.shakeAnimation({
                    delay: baseDuration,
                    strength: 10
                });
            }

            if (growSymbols.has(this.id)) {
                this.growAnimation(baseDuration, 0.20);
            }

            this.fallTween = this.scene.tweens.chain({
                targets: this.container,
                tweens: [
                    {
                        y: targetY + overshoot,
                        duration: baseDuration * 0.85,
                        ease: 'Cubic.In'
                    },
                    {
                        y: targetY,
                        duration: baseDuration * 0.55,
                        ease: 'Back.Out',
                        easeParams: [0.5]
                    }
                ],
                delay: delay,
                onComplete: () => {
                    this.fallTween = null
                    this.isQuickStop = false
                    resolve()
                }
            });  

            this.fallTween.setTimeScale(timeScale)
        })      
    }
    
    playPulse(duration = 300) {
        this.view.setAlpha(1);
        this.view.clearTint();
        return new Promise(resolve => {
            this.winTween = this.scene.tweens.add({
                targets: this.view,
                scale: this.initialScale + 0.1,
                yoyo: true,
                duration: duration / 2,
                ease: 'Sine.InOut',
                onComplete: resolve
            });
        });
    }

    async resetVisual(){
        await this.stopDim()
        await this.stopPulse();
        this.stopBorder();
    }

    stopPulse(dim = false) {
        if (!this.winTween) return
        
        this.winTween.stop();
        this.winTween = null;
        
        if (dim){
            this.view.setAlpha(0.6);
            this.view.setTint(0x898989);
        }

        return new Promise(resolve => {
            this.scene.tweens.add({
                targets: this.view,
                scale: this.initialScale,
                duration: 250,
                ease: 'Sine.InOut',
                onComplete: resolve
            });
        });
    }

    _delay(ms) {
        return new Promise(resolve => {
            this.scene.time.delayedCall(ms, resolve, null, this);
        });
    }

    showBorder() {
        this.view.setAlpha(1);
        this.view.clearTint();
        this.winBorder.setAlpha(1);
    }

    stopBorder(dim = false) {
        if (dim){
            this.view.setAlpha(0.6);
            this.view.setTint(0x898989);
        }
        this.winBorder.setAlpha(0);
    }

    dim() {
        this.dimTween = this.scene.tweens.add({
            targets: this.view,
            alpha: 0.6,
            duration: 150
        });

        this.view.setTint(0x898989);
    }

    stopDim(){
        if (!this.dimTween) return
        this.dimTween.stop();
        this.dimTween = null;
        
        this.view.clearTint();
        return new Promise(resolve => {
            this.scene.tweens.add({
                targets: this.view,
                alpha: 1,
                duration: 250,
                ease: 'Sine.InOut',
                onComplete: () => {
                    resolve()
                }
            });
        });
    }

    animBlink(){
        this.tween = this.scene.tweens.add( {targets: this.container, alpha: 0 , ease: 'Linear', duration: 150, yoyo:true,repeat:2 });
    }

    // -------------------
    // DESTROY
    // -------------------

    destroy() {
        this.resetVisual()
        if (this.tween) {
            this.tween.stop();
            this.tween = null
        }
        if (this.valueLabel) this.valueLabel.destroy();
        this.container.remove(this.view);
        this.view.destroy();
        this.container.destroy();
    }
}