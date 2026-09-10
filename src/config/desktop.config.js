// Desktop values - base positions used in the game
// Mobile config overrides these per-game

export default {
    reels: {
        x: 509,
        y: 190,
        scaleX: 1.4,
        scaleY: 1.4,
        gapBetweenReels: 0,
        gapBetweenRows: 0,
        symbolSize: 150
    },

    extraReel: {
        x: 909,
        y: 141,
        scaleX: 1.53,
        scaleY: 1.48,
        origin: 0,
    },

    extraReelSlots: {
        x: 1294,
        y: 315,
        origin: 0,
    },


    multiplierBar: {
        orientation: 'vertical',
        x: 400,
        y: 200,
        scale: 1,
        rowWidth: 90,
        rowHeight: 44,
        gap: 15,
        fontFamily: 'Metropolis-Black',
        fontSize: 34,
        labelPrefix: 'x',
        color: '#fede5d',
        strokeColor: '#980000',
        strokeThickness: 6,
        strikeColor: 0xff2d2d,
        strikeWidth: 3,
        dimAlpha: 0.3,
        stepDelay: 90,
        stepDuration: 140,
        depth: 2.6,
    },

    // Forma de recorte del extra reel (bitmap mask).
    extraReelMask: {
        x: 1293,
        y: 510,
        scale: 1,
        scaleX: 1.4,
        scaleY: 1.44,
        origin: 0.5,
    },

    buttonOff: {
        x: 1293,
        y: 510,
        scale: 0.69,
        // scaleX: 1,
        // scaleY: 1,
        origin: 0.5,
    },

    square: {
        x: 1293,
        y: 508,
        scale: 0.75,
    },

    squareBG: {
        x: 1293,
        y: 507,
        scale: 0.7,
    },

    electro1: {
        x: 1159,
        y: 265,
        origin: 0.5,
        scale: 0.145,
    },

    electro2: {
        x: 1159,
        y: 760,
        origin: 0.5,
        scale: 0.145,
    },

    train: {
        x: 1600,
        y: 200,
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
        spin: { x: 960, y: 990, stopIconSize: 90 },
        controlsContainer: { x: 568, y: 950 },
        betSelector: { panelOffsetX: -88, panelOffsetY: -277 },
        bonusBuy: { x: 435, y: 1015 },
        sideBet: { x: 320, y: 1000, radius: 34 },
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
            x: 1920 / 2,
            y: 1080 / 2,
            origin: 0.5,
            scale: 0.7
        },

        // Jackpot panel
        // grand_jackpot: {
        //     x: 276,
        //     y: 155,
        //     origin: 0.5,
        //     scale: 0.74
        // },

        // mega_jackpot: {
        //     x: 276,
        //     y: 255,
        //     origin: 0.5,
        //     scale: 0.74
        // },

        // major_jackpot: {
        //     x: 276,
        //     y: 355,
        //     origin: 0.5,
        //     scale: 0.74
        // },

        // minor_jackpot: {
        //     x: 276,
        //     y: 455,
        //     origin: 0.5,
        //     scale: 0.74
        // },

        // mini_jackpot: {
        //     x: 276,
        //     y: 555,
        //     origin: 0.5,
        //     scale: 0.74
        // },
        
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