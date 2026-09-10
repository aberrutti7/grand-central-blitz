// Mobile overrides - only add values that change from desktop
// If a key is not defined here, desktop.config value is used

export default {
    reels: {
        x: 89,
        y: 640,
        scaleX: 1.4,
        scaleY: 1.4,
        gapBetweenReels: 0,
        gapBetweenRows: 0,
        symbolSize: 150
    },

    extraReel: {
        x: 489,
        y: 587,
        scaleX: 1.53,
        scaleY:1.49,
        origin: 0,
    },

    extraReelSlots: {
        x: 874,
        y: 765,
        origin: 0,
    },


    multiplierBar: {
        orientation: 'horizontal',
        x: 95,
        y: 530,
        scale: 1,
        rowWidth: 82,
        rowHeight: 60,
        color: '#fede5d',
        strokeColor: '#980000',
        gap: 5,
        fontSize: 30,
        labelPrefix: 'x',
        strokeThickness: 5,
        strikeWidth: 3,
    },

    // Forma de recorte del extra reel (bitmap mask).
    extraReelMask: {
        x: 871,
        y: 960,
        scaleX: 1.5,
        scaleY: 1.43,
        origin: 0.5,
    },

    square: {
        x: 873,
        y: 957,
        scale: 0.75,
    },

    squareBG:{
        x:873,
        y: 957,
        scale: 0.7,
        
    },

    electro1: {
        x: 737,
        y: 695,
        origin: 0.5,
        scale: 0.145,
    },
    electro2: {
        x: 737,
        y: 1210,
        origin: 0.5,
        scale: 0.145,
    },

    train: {
        x: 550,
        y: 280,
        scale: 0.5,
    },

    controls: {
        background: {
            x: 0,
            y: 1540,
            width: 1080,
            height: 380,
            originY: 0
        },
        stats: { x: 1019, y: 1760 },
        spin: { x: 534, y: 1603, radius: 120, iconSize: 180, stopIconSize: 120 },
        decreaseBet: { x: 296, y: 1602, width: 90, height: 90, fontSize: 130 },
        increaseBet: { x: 687, y: 1602, width: 90, height: 90, fontSize: 130 },
        bonusBuy: { x: 674, y: 1438 },
        sideBet: { x: 100, y: 1745, radius: 55 },
        turbo: { x: 406, y: 1440, hideLabel: true, radius: 50, iconSize: 50 },
        controls: { x: 762, y: 1760 },
        betSelector: { x: 67, y: 1601, scale: 1.4, panelStartY: 1920, mobileOpenY: 775 },
        forcedPlay: { x: 385, y: 1736 },
        autoPlay: { x: 808, y: 1568, hideLabel: true },
        balance: { x: 275, y: 1870 },
        win: { x: 936, y: 1869 }
    },

    buttonOff: {
        x: 873,
        y: 1920/2,
        scale: 0.69,
        // scaleX: 1,
        // scaleY: 1,
        origin: 0.5,
    },

    ui: {
        gameName: {
            x: 38,
            y: 38
        },
        background: {
            x: 1080/2,
            y: 1920/2,
            origin:0.5,
            angle: 0,
            scale: 0.6,
        },
        fsLeft: {
            x: 880,
            y: 350,
        },
        version: {
            x: 1010,
            y: 38,
        }
    }
};