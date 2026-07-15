import ExtraReelView from "./ExtraReelView";

export default class ExtraReelController {
    constructor({ scene, model }) {
        this.scene = scene;
        this.model = model;

        this._createExtraReelView();
    }

    _createExtraReelView() {
        this.extraReelView = new ExtraReelView({
            scene: this.scene,
            model: this.model,
        });
    }

    /**
     * Gira el extra reel hasta mostrar los valores de la play.
     * @param {number[]} extraReel
     * @param {number} delay - delay opcional para sincronizar con los reels
     */
    async spinMultipliersTo(extraReel = [], delay = 0) {
        const spinCount = 5; // vueltas completas antes de frenar
        const steps = this.extraReelView.slots.length * spinCount;
        await this.extraReelView.animateSpin({ delay, steps, extraReel });
    }

    updateMinMultiplier(min = 1) {
        this.extraReelView.applyMinMultiplier(min);
    }

    async pulseMultiplier(value) {
        await this.extraReelView.pulseSlotWithValue(value);
    }

    reset() {
        this.extraReelView.reset();
    }
}