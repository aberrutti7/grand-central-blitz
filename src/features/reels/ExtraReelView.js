import { ResponsiveManager } from "../../core";
import MultView from "../symbols/MultView";

// POSSIBLE MULTIPLIERS se usa para la strip random
const POSSIBLE_MULTIPLIERS = [1, 2, 3, 4, 5, 10, 15, 20, 25, 25, 50, 100]; //aded 4, 25, 15*

// DIM (cuando el step no trae extraReel)
const DIM_COLOR = 0x000000;
const DIM_ALPHA = 0.55;
const DIM_DURATION = 220;

const FADE_DURATION = 200;
const FADE_OUT_DURATION = 300;

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

        this.isDimmed = false;
        this.isVisible = false;
        this._pendingMin = 1;

        this.container = this.scene.add.container(0, 0)
            .setPosition(cfg.x ?? 930, cfg.y ?? 190)
            .setScale(cfg.scaleX ?? 1, cfg.scaleY ?? 1)
            .setDepth(1)
            .setAlpha(0)
            .setVisible(false);

        this._visibilityTargets = [this.container];

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

        this._createDimOverlay(); // despues del strip -> queda por encima de los slots
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

    //DIM EXTRA REEL
    _createDimOverlay() {
        const w = this.slotWidth * 3;
        const h = this.slotHeight * (this.length + 4);
        const cy = ((this.length - 1) * this.slotHeight) / 2;

        this.dimOverlay = this.scene.add.rectangle(0, cy, w, h, DIM_COLOR, 1)
            .setOrigin(0.5)
            .setAlpha(0);

        this.container.add(this.dimOverlay);
    }

    _drawMask() {
        if (!this.scene.textures.exists(this.maskKey)) {
            console.warn(`[ExtraReelView] textura "${this.maskKey}" no existe -> sin mascara`);
            return;
        }

        this.maskImage = this.scene.make.image({ key: this.maskKey, add: false })
            .applyResponsive(this.maskConfigKey);

        this.mask = this.maskImage.createBitmapMask();
        this.container.setMask(this.mask);

        if (this.model.getDebugMode()) this._drawMaskDebug();
    }

    _drawMaskDebug() {
        // copia visible del sprite para ver donde cae el recorte
        this.maskDebug = this.scene.add.image(0, 0, this.maskKey)
            .applyResponsive(this.maskConfigKey)
            .setAlpha(0.4)
            .setTint(0xFF0000)
            .setDepth(999);
    }

    destroy() {
        if (this.dimOverlay) {
            this.scene.tweens.killTweensOf(this.dimOverlay);
            this.dimOverlay.destroy();
            this.dimOverlay = null;
        }

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

    //extra reel inactivo
    isDim() {
        return this.isDimmed;
    }

    addVisibilityTargets(...objects) {
        objects.filter(Boolean).forEach(obj => {
            obj.setAlpha(this.isVisible ? 1 : 0).setVisible(this.isVisible);
            this._visibilityTargets.push(obj);
        });
    }

    setVisible(visible, { duration = FADE_DURATION } = {}) {
        if (this.isVisible === visible) return Promise.resolve();

        this.isVisible = visible;
        this.scene.tweens.killTweensOf(this._visibilityTargets);

        if (duration <= 0) {
            this._visibilityTargets.forEach(obj => obj.setAlpha(visible ? 1 : 0).setVisible(visible));
            return Promise.resolve();
        }

        if (visible) this._visibilityTargets.forEach(obj => obj.setVisible(true));

        return new Promise(resolve => {
            this.scene.tweens.add({
                targets: this._visibilityTargets,
                alpha: visible ? 1 : 0,
                duration,
                ease: 'Sine.InOut',
                onComplete: () => {
                    this._visibilityTargets.forEach(obj => obj.setVisible(visible));
                    resolve();
                },
            });
        });
    }

    setDimmed(dimmed, { duration = DIM_DURATION } = {}) {
        if (!this.dimOverlay || this.isDimmed === dimmed) return Promise.resolve();

        this.isDimmed = dimmed;
        this.scene.tweens.killTweensOf(this.dimOverlay);

        const alpha = dimmed ? DIM_ALPHA : 0;

        if (duration <= 0) {
            this.dimOverlay.setAlpha(alpha);
            if (!dimmed) this.applyMinMultiplier(this._pendingMin);
            return Promise.resolve();
        }

        return new Promise(resolve => {
            this.scene.tweens.add({
                targets: this.dimOverlay,
                alpha,
                duration,
                ease: 'Sine.InOut',
                onComplete: () => {
                    if (!dimmed) this.applyMinMultiplier(this._pendingMin);
                    resolve();
                },
            });
        });
    }

    // -------------------
    // SPIN
    // -------------------

    //animacion reel
    async animateSpin({ delay = 0, steps, extraReel }) {
        if (!Array.isArray(extraReel) || extraReel.length === 0) return;

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
            // los ultimos slots agregados (los mas arriba) son los visibles al final
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
        this._pendingMin = min;

        if (this.isDimmed) return;

        this.slots.forEach(slot => {
            slot.setDimmed(slot.getId() < min);
        });
    }

    async pulseSlotWithValue(value) {
        if (this.isDimmed) return;
        const slot = this.slots.find(s => s.getId() === value);
        if (slot) await slot.pulse();
    }

    reset() {
        this.setVisible(false, { duration: FADE_OUT_DURATION }).then(() => {
            if (this.isVisible) return;

            this.setDimmed(false, { duration: 0 });
            this.applyMinMultiplier(1);
        });
    }
}