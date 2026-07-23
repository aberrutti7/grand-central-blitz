export const PP_SCATTER_ID = 9;

export const PP_LEVEL_THRESHOLDS = [0, 1, 3, 6, 10];

export const PP_LEVEL_SCALES = [1, 1.08, 1.16, 1.25, 1.35];

export const PP_MAX_LEVEL = PP_LEVEL_THRESHOLDS.length - 1;

export const PP_CONFIG = {
    delayBetweenParticles: 100,
    sequential: true,
    highlightSymbol: true,
    bounce: {
        hop: 14,
        squash: 0.12,
        duration: 90
    },
    levelUp: {
        overshoot: 0.12,
        duration: 260,
        ease: 'Back.Out'
    },
    reset: {
        duration: 300,
        ease: 'Sine.InOut'
    }
};

export function getPPLevelForCounter(counter) {
    let level = 0;

    for (let i = 0; i < PP_LEVEL_THRESHOLDS.length; i++) {
        if (counter >= PP_LEVEL_THRESHOLDS[i]) level = i;
        else break;
    }

    return level;
}
