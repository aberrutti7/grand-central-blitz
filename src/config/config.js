// @ts-check

/** @type {import('./types').GameConfig} */
export const config = {
    gameName: "Grand Central Blitz",
    slotType: "WAYS",
    emojiFavicon: "🚂",
    version: "v0",
    info: false,
    availableBets: [
        10, 20, 40, 60, 80, 100,
        200, 300, 400, 500, 600,
        800, 1000, 2000, 3000,
        4000, 5000, 10000
    ],
    balance: 100000,
    bet: 10,
    sidebets: [
        { id: '1', name: 'SB x2', multiplier: 2 },
        { id: '2', name: 'Super SB 4x', multiplier: 4 },
    ],
    bigWins: [
        { type: 'BIG WIN', multiplier: 20 },
        { type: 'HUGE WIN', multiplier: 40 },
        { type: 'EPIC WIN', multiplier: 60 },
        { type: 'SENSATIONAL WIN', multiplier: 100 },
    ],
    forcedPlays: [
        {
            label: 'Random game',
            spinType: 'basegame',
            visibleInForcedPlay: true,
        },
        {
            label: 'Base Multi',
            spinType: 'basegame_multi',
            visibleInForcedPlay: true,
        },
        {
            label: 'FREESPINS',
            spinType: 'fs_play',
            visibleInForcedPlay: true,
        },
        {
            label: 'PP FS',
            spinType: 'pp_fs_play',
            visibleInForcedPlay: true,
        },
        {
            label: 'Single Play',
            spinType: 'file-singlePlay',
            visibleInForcedPlay: false,
        },

        {
            label: 'multi 25',
            spinType: 'fs_multi-25',
            visibleInForcedPlay: false,
        },
    ],
    bonusBuy: [
        {
            title: "Free Spins",
            description: "Enter to Free Spins",
            price: 100,
            type: "BB",
            priceType: "multiplier",
            texture: `sym_1`
        },
    ],
    paytable: [
        { id: 0, name: "WILD",    texture: "sym_0_h3", tier: "special", payouts: {}, special: "Substitutes for any symbol, Removes minimum multiplier" },
        { id: 9, name: "Scatter", texture: "sym_9", tier: "special", payouts: {}, special: "+3 Scatters trigger Free Spins" },
        { id: 1, name: "High 1", texture: "sym_1_h3", tier: "high", payouts: { 3: 10 } },
        { id: 2, name: "High 2", texture: "sym_2_h3", tier: "high", payouts: { 3: 6  } },
        { id: 3, name: "High 3", texture: "sym_3_h3", tier: "high", payouts: { 3: 5  } },
        { id: 4, name: "High 4", texture: "sym_4_h3", tier: "high", payouts: { 3: 4  } },
        { id: 5, name: "Low 1",  texture: "sym_5_h3", tier: "low",  payouts: { 3: 3  } },
        { id: 6, name: "Low 2",  texture: "sym_6_h3", tier: "low",  payouts: { 3: 2  } },
        { id: 7, name: "Low 3",  texture: "sym_7_h3", tier: "low",  payouts: { 3: 1  } },
        { id: 8, name: "Low 4",  texture: "sym_8_h3", tier: "low",  payouts: { 3: 0.5   } },
    ],
    waysWinningAnimation: {
        border: {
            visible: false,
            groupBySymbol: false
        },
        effects: [],
        duration: 1000,
        delayBetweenWays: 200,
    },
    linesWinningAnimation: {
        effects: ["pulse"],
        duration: 1000,
        delayBetweenLines: 200,
    },
    jackpots: [],
    grid: [3,3,3],
    reels: { 
        r0: [3, 9, 5],
        r1: [1, 1, 8],
        r2: [4, 4, 7],
    },
    extraReel: [3, 1, 10],
    ///
// 0
// : 
// (6) [1, 1, 1, 2, 8, 2]
// 1
// : 
// (3) [7, 5, 6]
// 2
// : 
// (6) [8, 3, 8, 8, 4, 9]
    reelsY: [0,0,0,0,0,0],
    reelsConfig: {
        x: 512,
        y: 190,
        scaleX: 1,
        scaleY: 1,
        gapBetweenReels: 0,
        gapBetweenRows: 0,
    },
    symbolSize:150,
    debug: false,
    background: {
        key: 'bg_base',
        path: 'assets/images/ui/backgrounds/new-bg.png',
    },
    loadingScreen: {
        test: false,
        show: true,
        showLogo: false,
    },
    api: {
        baseUrl: 'https://api.playcasinoslots.xyz/api',
        //baseUrl: 'https://147.15.17.61/api',
        username: 'JAK',
        password: 'JAK',
        //secretId: '5b52ccb6-0359-4be4-85da-ca3c94ebb3d2',
        secretId: '863fe1bc-afa3-4451-9301-90ccdee6c9e7', //prod
        gameName: 'GrandCentralBlitz',
    }
}

export default config;