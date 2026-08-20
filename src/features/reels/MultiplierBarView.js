import { ResponsiveManager } from "../../core";

const POSSIBLE_MULTIPLIERS = [1, 2, 3,4, 5, 10,15, 20,25, 50, 100]; //4,15,25

export default class MultiplierBarView {
    constructor({ scene, model, multipliers = POSSIBLE_MULTIPLIERS, responsiveKey = 'multiplierBar' }) {
        this.scene = scene;
        this.model = model;
        this.responsiveKey = responsiveKey;

        this.cfg = ResponsiveManager.getForScene(this.scene)?.get(responsiveKey) || {};

        this.orientation = this.cfg.orientation ?? 'vertical';
        this.isHorizontal = this.orientation === 'horizontal';

        this.multipliers = [...multipliers].sort((a, b) => (this.isHorizontal ? a - b : b - a));

        this.rowWidth = this.cfg.rowWidth ?? 90;
        this.rowHeight = this.cfg.rowHeight ?? 44;
        this.gap = this.cfg.gap ?? 12;
        this.step = (this.isHorizontal ? this.rowWidth : this.rowHeight) + this.gap;
        this.span = (this.multipliers.length - 1) * this.step;

        this.anchor = this.cfg.anchor ?? 'start';
        this.startOffset = this.anchor === 'center' ? -this.span / 2 : 0;

        this.fontFamily = this.cfg.fontFamily ?? 'Metropolis-Black';
        this.fontSize = this.cfg.fontSize ?? 34;
        this.labelPrefix = this.cfg.labelPrefix ?? '';
        this.color = this.cfg.color ?? '#ffffff';
        this.strokeColor = this.cfg.strokeColor ?? '#000000';
        this.strokeThickness = this.cfg.strokeThickness ?? 6;

        this.strikeColor = this.cfg.strikeColor ?? 0xff2d2d;
        this.strikeWidth = this.cfg.strikeWidth ?? 4;
        this.strikePadX = this.cfg.strikePadX ?? 4;
        this.strikeInsetY = this.cfg.strikeInsetY ?? 6;

        this.dimAlpha = this.cfg.dimAlpha ?? 0.3;
        this.stepDelay = this.cfg.stepDelay ?? 90;
        this.stepDuration = this.cfg.stepDuration ?? 140;

        this.container = this.scene.add.container(0, 0).setDepth(this.cfg.depth ?? 2.6);

        this.rows = new Map();
        this.baseMin = 1;
        this.currentMin = 1;
        this._timers = [];

        this._createView();
        this.applyResponsive();
    }

    applyResponsive(key = this.responsiveKey) {
        this.responsiveKey = key;
        this.container.applyResponsive(key);
        return this;
    }

    _createView() {
        if (this.cfg.title) {
            const titleX = this.isHorizontal ? this.startOffset + this.span / 2 : 0;

            this.titleText = this.scene.add.text(titleX, -(this.rowHeight + this.gap), this.cfg.title, {
                fontFamily: this.cfg.titleFontFamily ?? 'Metropolis-Bold',
                fontSize: this.cfg.titleFontSize ?? 26,
                color: this.color,
                stroke: this.strokeColor,
                strokeThickness: Math.round(this.strokeThickness / 2),
                align: 'center',
            }).setOrigin(0.5);

            this.container.add(this.titleText);
        }

        this.multipliers.forEach((mult, i) => {
            const row = this._createRow(mult, this.startOffset + i * this.step);
            this.container.add(row.container);
            this.rows.set(mult, row);
        });
    }

    _createRow(mult, offset) {
        const rowContainer = this.isHorizontal
            ? this.scene.add.container(offset, 0)
            : this.scene.add.container(0, offset);

        const label = this.scene.add.text(0, 0, `${this.labelPrefix}${mult}`, {
            fontFamily: this.fontFamily,
            fontSize: this.fontSize,
            color: this.color,
            stroke: this.strokeColor,
            strokeThickness: this.strokeThickness,
            align: 'center',
        }).setOrigin(0.5);

        const strike = this._createStrike(label);

        rowContainer.add([label, strike]);

        return { container: rowContainer, label, strike, dimmed: false };
    }

    _createStrike(label) {
        const halfWidth = Math.max(label.width / 2 + this.strikePadX, this.strikeWidth);
        const halfHeight = Math.max(label.height / 2 - this.strikeInsetY, this.strikeWidth);

        const strike = this.scene.add.graphics();
        strike.lineStyle(this.strikeWidth, this.strikeColor, 1);
        strike.beginPath();
        strike.moveTo(-halfWidth, halfHeight);
        strike.lineTo(halfWidth, -halfHeight);
        strike.strokePath();
        strike.setAlpha(0);

        return strike;
    }

    async updateMinMultiplier(min = 1, { animate = true } = {}) {
        const target = Number(min) || 1;
        if (target === this.currentMin) return;

        const previous = this.currentMin;
        this.currentMin = target;

        const isDimming = target > previous;

        const changed = this.multipliers
            .filter(mult => (mult < target) !== (mult < previous))
            .sort((a, b) => (isDimming ? a - b : b - a));

        for (const mult of changed) {
            this._setRowState(this.rows.get(mult), mult < target, animate);
            if (animate && this.stepDelay > 0) await this._wait(this.stepDelay);
        }
    }

    setBaseMinMultiplier(min = 1) {
        this.baseMin = Number(min) || 1;
    }

    async resetToBase({ animate = true } = {}) {
        await this.updateMinMultiplier(this.baseMin, { animate });
    }

    _setRowState(row, dimmed, animate = true) {
        if (!row || row.dimmed === dimmed) return;
        row.dimmed = dimmed;

        const labelAlpha = dimmed ? this.dimAlpha : 1;
        const strikeAlpha = dimmed ? 1 : 0;

        this.scene.tweens.killTweensOf([row.label, row.strike]);

        if (!animate) {
            row.label.setAlpha(labelAlpha);
            row.strike.setAlpha(strikeAlpha);
            return;
        }

        this.scene.tweens.add({
            targets: [row.label],
            alpha: labelAlpha,
            duration: this.stepDuration,
            ease: 'Sine.Out',
        });

        this.scene.tweens.add({
            targets: [row.strike],
            alpha: strikeAlpha,
            duration: this.stepDuration,
            ease: 'Sine.Out',
        });

        if (!dimmed) return;

        this.scene.tweens.killTweensOf(row.container);
        this.scene.tweens.chain({
            targets: row.container,
            tweens: [
                { scaleX: 1.18, scaleY: 1.18, duration: 90, ease: 'Back.Out' },
                { scaleX: 1, scaleY: 1, duration: 130, ease: 'Sine.InOut' },
            ],
        });
    }

    pulseRow(mult) {
        return new Promise(resolve => {
            const row = this.rows.get(mult);
            if (!row) {
                resolve();
                return;
            }

            this.scene.tweens.killTweensOf(row.container);
            this.scene.tweens.chain({
                targets: row.container,
                tweens: [
                    { scaleX: 1.25, scaleY: 1.25, duration: 140, ease: 'Back.Out' },
                    { scaleX: 1.25, scaleY: 1.25, duration: 180, ease: 'Linear' },
                    { scaleX: 1, scaleY: 1, duration: 160, ease: 'Sine.InOut' },
                ],
                onComplete: resolve,
            });
        });
    }

    _wait(ms) {
        return new Promise(resolve => {
            const timer = this.scene.time.delayedCall(ms, () => {
                this._timers = this._timers.filter(t => t !== timer);
                resolve();
            });
            this._timers.push(timer);
        });
    }

    _clearTimers() {
        this._timers.forEach(timer => timer.remove(false));
        this._timers = [];
    }

    getContainer() {
        return this.container;
    }

    getCurrentMin() {
        return this.currentMin;
    }

    getSpan() {
        return this.span;
    }

    reset() {
        this._clearTimers();
        this.setBaseMinMultiplier(1);
        this.updateMinMultiplier(1, { animate: false });
    }

    destroy() {
        this._clearTimers();
        this.rows.forEach(row => {
            this.scene.tweens.killTweensOf([row.container, row.label, row.strike]);
        });
        this.rows.clear();
        this.container.destroy();
    }
}