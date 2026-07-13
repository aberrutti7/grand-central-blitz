import { SYMBOLS_TO_GROW, SYMBOLS_TO_SHAKE } from "../../constants/IDs";
import { Model } from "../../core";
import { DebugPanel } from "../../utils";
import { drawBounds } from "../../utils/drawBounds";

export default class SymbolView extends Phaser.Events.EventEmitter {

    constructor({scene, model, index, id, enterAnim = false, horizonalPos = false}) {
        super();

        /** @type {Phaser.Scene} */
        this.scene = scene;
        /** @type {Model} */
        this.model = model;
        this.index = index;
        this.id = id;
        this.container = this.scene.add.container(0,0);
        this._createWinBorder()
        this.createView();
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
        this.initialScale = 0.6
        let symName = 'sym_' + this.id;
        this.view = this.scene.add.sprite(0, 0, 'symbols', symName);
        this.view.scale = this.initialScale
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
        this.view.setFrame("sym_"+newId);
        this.debug?.setText(newId)
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