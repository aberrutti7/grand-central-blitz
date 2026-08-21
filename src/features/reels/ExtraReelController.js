import ExtraReelView from "./ExtraReelView";
import MultiplierBarView from "./MultiplierBarView";

export default class ExtraReelController {
    constructor({ scene, model, maskKey = 'extraReelMask', multiplierBarKey = 'multiplierBar' }) {
        this.scene = scene;
        this.model = model;
        this.maskKey = maskKey;
        this.multiplierBarKey = multiplierBarKey;

        this._createExtraReelView();
        this._createMultiplierBar();
    }

    _createExtraReelView() {
        this.extraReelView = new ExtraReelView({
            scene: this.scene,
            model: this.model,
            maskKey: this.maskKey,
        });
    }

    _createMultiplierBar() {
        this.multiplierBar = new MultiplierBarView({
            scene: this.scene,
            model: this.model,
            responsiveKey: this.multiplierBarKey,
        });
    }

    async playStep(extraReel = [], delay = 0) {
        const hasData = Array.isArray(extraReel) && extraReel.length > 0;

        if (!hasData) {
            await this.setActive(false);
            return false;
        }

        await this.setActive(true, { duration: 150 });
        await this.spinMultipliersTo(extraReel, delay);
        return true;
    }

    async setActive(active, opts) {
        await this.extraReelView.setDimmed(!active, opts);
    }

    isActive() {
        return !this.extraReelView.isDim();
    }

    async spinMultipliersTo(extraReel = [], delay = 0) {
        const spinCount = 5; // vueltas completas antes de frenar
        const steps = this.extraReelView.slots.length * spinCount;
        await this.extraReelView.animateSpin({ delay, steps, extraReel });
    }

    applyResponsive(key) {
        this.multiplierBar?.applyResponsive(key);
    }

    setBaseMinMultiplier(min = 1) {
        this.multiplierBar?.setBaseMinMultiplier(min);
    }

    async strikeMultipliers(count = 0) {
        if (count <= 0 || !this.multiplierBar) return;

        await this.updateMinMultiplier(this.multiplierBar.getMinAfterStrikes(count));
    }

    getCurrentMinMultiplier() {
        return this.multiplierBar?.getCurrentMin() ?? 1;
    }

    async updateMinMultiplier(min = 1) {
        this.extraReelView.applyMinMultiplier(min);
        await this.multiplierBar?.updateMinMultiplier(min);
    }

    async resetMinMultiplier() {
        await this.multiplierBar?.resetToBase();
    }

    async pulseMinMultiplier(min = 1) {
        await this.multiplierBar?.pulseRow(min);
    }

    async pulseMultiplier(value) {
        await this.extraReelView.pulseSlotWithValue(value);
    }

    reset() {
        this.extraReelView.reset();
        this.multiplierBar?.reset();
    }
}