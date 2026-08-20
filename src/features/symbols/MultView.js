
const MULT_ATLAS = 'mult';
const FALLBACK_FRAME = 'mult';



export default class MultView {
    constructor({ scene, id, width, height }) {
        /** @type {Phaser.Scene} */
        this.scene = scene;
        this.id = id;          // valor del multi
        this.width = width;
        this.height = height;

        this.container = this.scene.add.container(0, 0);
        this._createView();
    }

    // -------------------
    // GETTERS & SETTERS
    // -------------------

    getId() {
        return this.id;
    }

    getContainer() {
        return this.container;
    }

    setPosition(x, y) {
        this.container.setX(x);
        this.container.setY(y);
    }

    // -------------------
    // CREATE ELEMENTS
    // -------------------

    _createView() {
        this.view = this.scene.add.sprite(0, 0, MULT_ATLAS, 'mult_'+String(this.id));
        this.view.setScale(0.70);

        this.viewLabel = this.scene.add.text(
            // 0,
            // 0,
            // `x${this.id}`,
            // {
            //     fontFamily: 'Lilita One',
            //     fontSize: '80px',
            //     color: '#e30a0a',
            //     align: 'center',
            //     stroke: '#facd17',
            //     strokeThickness:10,  
            // }
        ).setOrigin(0.5);

        this.container.add([this.view, this.viewLabel]);
    }

    // -------------------
    // APPEARANCE
    // -------------------

    setValue(newId) {
        // this.id = newId;
        // this.view.setText(`x${newId}`);
    }

    setDimmed(dimmed) {
        this.view.setAlpha(dimmed ? 0.35 : 1);
    }

    pulse() {
        return new Promise(resolve => {
            this.scene.tweens.killTweensOf(this.container);
            this.scene.tweens.chain({
                targets: this.container,
                tweens: [
                    { scaleX: 1.25, scaleY: 1.25, duration: 140, ease: 'Back.Out' },
                    { scaleX: 1.25, scaleY: 1.25, duration: 180, ease: 'Linear' },
                    { scaleX: 1,    scaleY: 1,    duration: 160, ease: 'Sine.InOut' },
                ],
                onComplete: resolve,
            });
        });
    }

    // -------------------
    // DESTROY
    // -------------------

    destroy() {
        if (this.view) {
            this.container.remove(this.view);
            this.view.destroy();
            this.view = null;
        }
        this.container.destroy();
    }
}