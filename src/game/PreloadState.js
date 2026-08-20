export default class PreloadState extends Phaser.Scene {
    preload() {
        // css
        this.loadCSS()
        this.loadPlays()
        this.loadGraphics()
        this.loadIcons()
        this.loadDomElements()
        this.loadSounds()

        this.load.bitmapFont(
            'slotFont',
            'assets/images/ui/fonts/slotFont.png',
            'assets/images/ui/fonts/slotFont.xml'
        );
    }
    
    // ==============================
    // Styles
    // ==============================

    loadCSS() {
        this.load.css('css', 'assets/styles/main.css');
    }

    // ==============================
    // PLAYS
    // ==============================

    loadPlays() {
        //plays regular
        this.load.json('baseGamePlays', 'assets/data/plays_gral.json');
        this.load.json('freeSpinsGamePlays', 'assets/data/fgs.json');

        // plays sidebet
        this.load.json('baseGamePlaysSB', 'assets/data/plays_gral.json');
        this.load.json('freeSpinsGamePlaysSB', 'assets/data/fgs.json');

        // plays Bonus Buy
        this.load.json('bonusBuyGamePlays', 'assets/data/fgs_BB.json');
        this.load.json('singlePlay', 'assets/data/single_play.json');
    }

    // ==============================
    // GRAPHICS
    // ==============================
    
    loadGraphics() {
        this.loadSymbols()
        this.loadUI()
        this.loadBackgrounds()
        this.loadReels()
        this.loadFX()
    }

    loadSymbols() {
        this.load.atlas(
            'symbols',
            'assets/images/symbols/symbols.png',
            'assets/images/symbols/symbols.json',
            Phaser.Loader.TEXTURE_ATLAS_JSON_HASH
        );
    }

    loadUI() {
        this.load.atlas(
            'ui',
            'assets/images/ui/screens/ui-buttons1.png',
            'assets/images/ui/screens/ui-buttons1.json',
            Phaser.Loader.TEXTURE_ATLAS_JSON_HASH
        );
    }

    loadBackgrounds() {
        const config = require('../config/config').config;
        if (config.background?.key) {
            this.load.image(config.background.key, config.background.path);
        }
        this.load.image('bg_fs', 'assets/images/ui/backgrounds/fs-bg.png');
    }

    loadReels(){
        this.load.image('reelsBG', 'assets/images/ui/reels/bg.png');
        this.load.image('reelsFrame', 'assets/images/ui/reels/frame.png');
    }

    loadFX() {
        this.load.image('spark', 'assets/images/ui/particles/spark2.png');
        this.load.image('flare', 'assets/images/ui/particles/flare.png');
    }

    // ==============================
    // DOM
    // ==============================

    loadDomElements() {
        this.load.html('force_play_form', 'assets/dom/force-play.html');
        this.load.html('debug-panel', 'assets/dom/debug-panel.html');
        this.load.html('dev-panel', 'assets/dom/dev-panel.html');
        this.load.html('stats-panel', 'assets/dom/stats-panel.html');
    }

    // ==============================
    // AUDIO
    // ==============================

    loadSounds() {
        this.load.audio('clickDown', 'assets/sound/clickDown.mp3');
        this.load.audio('bonusWon', 'assets/sound/bonusWon.mp3');
        this.load.audio('bonusEnd', 'assets/sound/bonusEnd.mp3');
        this.load.audio('won', 'assets/sound/won.mp3');
        this.load.audio('gameBGM', 'assets/sound/bgm.mp3');
    }

    // ==============================
    // ICONS
    // ==============================

    loadIcons() {
        this.load.svg('spinSVG', 'assets/images/ui/control_icons/spin-ui.svg');
        this.load.svg('stopSVG', 'assets/images/ui/control_icons/stop-ui.svg');
        this.load.svg('closeSVG', 'assets/images/ui/control_icons/close-ui.svg');
        this.load.svg('infoSVG', 'assets/images/ui/control_icons/info-ui.svg');
        this.load.svg('fullScreenSVG_inactive', 'assets/images/ui/control_icons/full-screen-ui.svg');
        this.load.svg('fullScreenSVG_active', 'assets/images/ui/control_icons/full-screen-out-ui.svg');
        this.load.svg('soundSVG', 'assets/images/ui/control_icons/sound-ui.svg');
        this.load.svg('muteSoundSVG', 'assets/images/ui/control_icons/mute-sound-ui.svg');
        this.load.svg('autoPlaySVG', 'assets/images/ui/control_icons/autoplay-ui.svg');
        this.load.svg('turboPlaySVG', 'assets/images/ui/control_icons/turbo-play-ui.svg');
        this.load.svg('configSVG', 'assets/images/ui/control_icons/config-ui.svg');
    }

    // ==============================
    // CREATE
    // ==============================


    async create() {
        try {
            await document.fonts.ready;
            await document.fonts.load('16px Inter');
            await document.fonts.load('bold 16px Inter');
            
        } catch (e) {
            console.warn('Font loading warning:', e);
        }

        this.game.scene.start('GameController');
    }
}