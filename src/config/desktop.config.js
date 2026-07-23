// Desktop values - base positions used in the game
// Mobile config overrides these per-game

export default {
    reels: {
        x: 500,
        y: 190,
        scaleX: 1.3,
        scaleY: 1.3,
        gapBetweenReels: 0,
        gapBetweenRows: 0,
        symbolSize: 150
    },

    extraReel: {
        x: 885,
        y: 140,
        scale: 1.40,
        origin: 0,
    },

    extraReelSlots:{
        x:1238,
        y: 290,
        origin: 0,
    },

    // Forma de recorte del extra reel (bitmap mask).
    
    extraReelMask: {
        x: 1237,
        y: 490,
        scale: 1,
        scaleX: 1.2,
        scaleY: 1.36,
        origin: 0.5,
    },

    electro1: {
        x: 1100,
        y: 265,
        origin:0.5,
        scale: 0.145,
    },
    electro2: {
        x: 1100,
        y: 710,
        origin:0.5,
        scale: 0.145,
    },

    train: {
        x: 1600,
        y: 800,
        scale: 0.5
    },


    controls: {
        background: {
            x: 0,
            y: 950,
            width: 1920,
            height: 130
        },
        stats: { x: 33, y: 1015 },
        spin: { x: 960, y: 990, stopIconSize: 90},
        controlsContainer: { x: 568, y: 950 },
        betSelector: { panelOffsetX: -88, panelOffsetY: -347 },
        bonusBuy: { x: 405, y: 1015 },
        sideBet: { x: 320, y: 1000 },
        turbo: { x: 210, y: 1000 },
        controls: { x: 90, y: 985 },
        autoPlay: { x: 1135, y: 978 },
        forcedPlay: { x: 1365, y: 980 },
        values: { x: 1725, y: 990 },
        balance: { x: 1807, y: 995 },
        win: { x: 1828, y: 1035 }
    },

    ui: {
        gameName: {
            x: 32,
            y: 32
        },
        background: {
            x: 0,
            y: 0
        },
        fsLeft: {
            x: 1535,
            y: 510,
        },
        version: {
            x: 1860,
            y: 32
        },
    }
};
