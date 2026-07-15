// Mobile overrides - only add values that change from desktop
// If a key is not defined here, desktop.config value is used

export default {
    reels: {
        x: 80,
        y: 640,
        scaleX: 1.3,
        scaleY: 1.3,
        gapBetweenReels: 0,
        gapBetweenRows: 0,
        symbolSize: 150
    },

    extraReel: {
        x: 600,
        y: 187,
        scale: 1,
        origin: 0,
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
        sideBet: { x: 100, y: 1745 },
        turbo: { x: 406, y: 1440, hideLabel: true, radius: 50, iconSize: 50 },
        controls: { x: 762, y: 1760 },
        betSelector: { x: 67, y: 1601, scale: 1.4, panelStartY: 1920, mobileOpenY: 605 },
        forcedPlay: { x: 385, y: 1736 },
        autoPlay: { x: 808, y: 1568, hideLabel: true },
        balance: { x: 275, y: 1870 },
        win: { x: 936, y: 1869 }
    },

    ui: {
        gameName: {
            x: 38,
            y: 38
        },
        background: {
            x: -1180,
            y: 0,
            angle: 0,
            scale: 2.5,
        },
        fsLeft: {
            x: 540,
            y: 1350,
        },
        version: {
            x: 1010,
            y: 38,
        }
    }
};
