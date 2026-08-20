import { COLORS_LIST } from "../../constants/COLORS";

export default class SideBetButton {
    /** @type {Phaser.Scene} */
    scene;
    /** @type {Function} */
    onToggle;
    /** @type {boolean} */
    sideBet = false;
    /** @type {Array<Object>} */
    sideBets = [];
    /** @type {number} */
    currentIndex = -1;
    /** @type {boolean} */
    hasSideBet;

    container;
    sideBetBtn;
    glow;
    text;
    label;

    constructor({ scene, onToggle, sideBets = [], config = {}, isMobile = false }) {
        this.scene = scene;
        this.onToggle = onToggle;
        this.isMobile = isMobile;

        this.radius = config.radius ?? (isMobile ? 55 : 34);
        this.hideLabel = config.hideLabel ?? false;
        this.labelY = config.labelY ?? (this.radius + (isMobile ? 25 : 21));
        this.maxTextScale = config.textScale ?? (isMobile ? 0.8 : 0.5);
        this.maxLabelScale = config.labelScale ?? (isMobile ? 0.8 : 0.6);

        this.sideBets = (sideBets || []).map((s, i) => (
            typeof s === 'object' && s !== null
                ? s
                : { id: `sidebet_${i}`, name: `${s}x`, multiplier: s }
        ));
        this.hasSideBet = this.sideBets.length > 0;
        this.container = this._create();
    }

    _create() {
        const container = this.scene.add.container(0, 0);

        if (!this.hasSideBet) {
            container.setVisible(false);
            return container;
        }

        const radius = this.radius;

        this.glow = this.scene.add.circle(0, 0, radius, COLORS_LIST.accent, 0.6)
            .setOrigin(0.5)
            .setAlpha(0);

        const bg = this.scene.add.circle(0, 0, radius, COLORS_LIST.bg_black)
            .setOrigin(0.5)
            .setName("sidebet_bg")
            .setInteractive({ cursor: "pointer" });

        this.sideBetBtn = bg;

        this.text = this.scene.add.text(0, 0, "$", {
            fontFamily: "Inter",
            fontSize: 80,
            fill: COLORS_LIST.text_white,
            align: "center",
            lineSpacing: -4,
        }).setOrigin(0.5);

        this.label = this.scene.add.text(1, this.labelY, "SIDE BET", {
            fontFamily: "Inter",
            fontSize: 32,
            fill: COLORS_LIST.text_white,
            align: "center",
            lineSpacing: -4,
        }).setOrigin(0.5).setVisible(!this.hideLabel);

        this._fitTexts();

        container.add([this.glow, bg, this.text, this.label]);

        bg.on('pointerup', () => {
            this.toggle();
        });
        bg.on('pointerover', () => {
            this.scene.tweens.add({
                targets: [bg],
                scale: 0.96,
                ease: 'SineInOut',
                duration: 50,
            });
        });
        bg.on('pointerout', () => {
            this.scene.tweens.add({
                targets: [bg],
                scale: 1,
                ease: 'SineInOut',
                duration: 50,
            });
        });

        return container;
    }

    _fitTexts() {
        this._fitText(this.text, this.radius * 1.55, this.maxTextScale);
        this._fitText(this.label, this.radius * 2.6, this.maxLabelScale);
    }

    _fitText(textObj, maxWidth, maxScale) {
        const width = textObj.width || 1;
        textObj.setScale(Math.min(maxScale, maxWidth / width));
    }

    toggle() {
        if (!this.hasSideBet) return;

        this.currentIndex = this.currentIndex + 1;
        if (this.currentIndex >= this.sideBets.length) this.currentIndex = -1;
        this.sideBet = this.currentIndex >= 0;

        this._updateVisuals();
        this.onToggle(this.sideBet, this.getCurrentSideBet());
    }

    _updateVisuals() {
        const current = this.getCurrentSideBet();

        if (current) {
            this.text.setText(`x${current.multiplier}`);
            this.text.setColor(COLORS_LIST.accentHex);
            this.label.setText(current.name);
            this.label.setColor(COLORS_LIST.accentHex);
        } else {
            this.text.setText("$");
            this.text.setColor(COLORS_LIST.text_white);
            this.label.setText("SIDE BET");
            this.label.setColor(COLORS_LIST.text_white);
        }

        this._fitTexts();

        this.scene.tweens.add({
            targets: this.glow,
            alpha: current ? 1 : 0,
            ease: 'Sine.InOut',
            duration: 100,
        });
    }

    getContainer() {
        return this.container;
    }

    enable() {
        if (!this.hasSideBet) return;
        this.sideBetBtn.setInteractive({ cursor: "pointer" });
    }

    disable() {
        if (!this.hasSideBet) return;
        this.sideBetBtn.disableInteractive();
    }

    setActive(value) {
        if (!this.hasSideBet) return;
        this.currentIndex = value ? 0 : -1;
        this.sideBet = this.currentIndex >= 0;
        this._updateVisuals();
    }

    reset() {
        if (!this.hasSideBet) return;
        this.currentIndex = -1;
        this.sideBet = false;
        this._updateVisuals();
    }

    getCurrentSideBet() {
        if (this.currentIndex < 0) return null;
        return this.sideBets[this.currentIndex] || null;
    }
}
