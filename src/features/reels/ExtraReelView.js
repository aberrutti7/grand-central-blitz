import { ResponsiveManager } from "../../core";
import MultView from "../symbols/MultView";

// POSSIBLE MULTIPLIERS se usa para la strip random
const POSSIBLE_MULTIPLIERS = [1, 2, 3, 5, 10, 15, 20, 25, 50, 100];

export default class ExtraReelView {
    constructor({ scene, model, maskKey = 'extraReelMask', maskConfigKey = 'extraReelMask' }) {
        this.scene = scene;
        this.model = model;
        this.maskKey = maskKey;           // key de la textura
        this.maskConfigKey = maskConfigKey; // key del config responsive

        // config responsive
        const cfg = ResponsiveManager.getForScene(this.scene)?.get('extraReelSlots') || {};

        this.slotWidth = cfg.slotWidth ?? 195;
        this.slotHeight = cfg.slotHeight ?? 195;
        this.length = 3;

        this.container = this.scene.add.container(0, 0)
            .setPosition(cfg.x ?? 930, cfg.y ?? 190)
            .setScale(cfg.scaleX ?? 1, cfg.scaleY ?? 1)
            .setDepth(1);

        this._createView();
    }

    _createView() {
        this.stripContainer = this.scene.add.container(0, 0);
        this.container.add(this.stripContainer);

        /** @type {MultView[]} */
        this.slots = [];
        for (let i = 0; i < this.length; i++) {
            const slot = this._createSlot(1, i);
            this.stripContainer.add(slot.getContainer());
            this.slots.push(slot);
        }

        this._drawMask();
    }

    _createSlot(id, index) {
        const slot = new MultView({
            scene: this.scene,
            id,
            width: this.slotWidth,
            height: this.slotHeight,
        });

        slot.setPosition(0, index * this.slotHeight);
        return slot;
    }

    _drawMask() {
        if (!this.scene.textures.exists(this.maskKey)) {
            console.warn(`[ExtraReelView] textura "${this.maskKey}" no existe → sin máscara`);
            return;
        }

        // add:false → no entra al display list, pero igual acepta applyResponsive
        this.maskImage = this.scene.make.image({ key: this.maskKey, add: false })
            .applyResponsive(this.maskConfigKey);

        this.mask = this.maskImage.createBitmapMask();
        this.container.setMask(this.mask);

        if (this.model.getDebugMode()) this._drawMaskDebug();
    }

    _drawMaskDebug() {
        // copia visible del sprite para ver dónde cae el recorte
        this.maskDebug = this.scene.add.image(0, 0, this.maskKey)
            .applyResponsive(this.maskConfigKey)
            .setAlpha(0.4)
            .setTint(0xFF0000)
            .setDepth(999);
    }

    destroy() {
        this.container.clearMask(true);
        this.maskDebug?.destroy();
        this.maskImage?.destroy();
        this.maskDebug = null;
        this.maskImage = null;
        this.mask = null;
    }

    getContainer() {
        return this.container;
    }

    getSlots() {
        return this.slots;
    }

    // -------------------
    // SPIN
    // -------------------

    //animacion reel
    async animateSpin({ delay = 0, steps, extraReel }) {
        this._addSlotsAbove(steps, extraReel);

        const spinCount = steps / this.length;
        const duration = 200 + (spinCount * 150);
        const lift = 25;
        const overshoot = 50;
        const startY = this.stripContainer.y;
        this._finalY = startY + this.slotHeight * steps;

        return new Promise(resolve => {
            this.spinTween = this.scene.tweens.chain({
                targets: this.stripContainer,
                delay,
                tweens: [
                    {
                        y: this.stripContainer.y - lift,
                        duration: 180,
                        ease: 'Power2.InOut'
                    },
                    {
                        y: this._finalY + overshoot,
                        duration,
                        ease: 'Sine.InOut'
                    },
                    {
                        y: this._finalY,
                        duration: 120,
                        ease: 'Sine.Out'
                    }
                ],
                onComplete: () => {
                    this._finishSpin(extraReel);
                    resolve();
                }
            });
        });
    }

    _addSlotsAbove(steps, extraReel) {
        const newSlots = [];
        for (let i = 0; i < steps; i++) {
            let id;
            // los últimos slots agregados (los más arriba) son los visibles al final
            const isFinalSlot = i >= steps - this.length;
            if (isFinalSlot) {
                const finalIndex = (steps - 1) - i; // da vuelta el index del extra reel
                id = extraReel[finalIndex];
            } else {
                id = Phaser.Utils.Array.GetRandom(POSSIBLE_MULTIPLIERS);
            }

            const slot = this._createSlot(id, -(i + 1));
            this.stripContainer.add(slot.getContainer());
            newSlots.push(slot);
        }
        this.slots = [...newSlots.reverse(), ...this.slots];
    }

    _finishSpin(extraReel) {
        const keep = this.slots.slice(0, this.length);
        const discard = this.slots.slice(this.length);

        discard.forEach(slot => slot.destroy());
        this.slots = keep;

        // reposiciona en coordenadas locales limpias
        this.slots.forEach((slot, i) => {
            slot.setValue(extraReel[i]);
            slot.setPosition(0, i * this.slotHeight);
        });
        this.stripContainer.y = 0;

        this._finalY = null;
        this.spinTween = null;
    }

    // -------------------
    // MIN MULTIPLIER
    // -------------------


    applyMinMultiplier(min = 1) {
        this.slots.forEach(slot => {
            slot.setDimmed(slot.getId() < min);
        });
    }

    async pulseSlotWithValue(value) {
        const slot = this.slots.find(s => s.getId() === value);
        if (slot) await slot.pulse();
    }

    reset() {
        this.applyMinMultiplier(1);
    }
}