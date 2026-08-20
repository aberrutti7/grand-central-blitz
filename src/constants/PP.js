export const PP_SCATTER_ID = 9;

export const PP_SCATTER_SYMBOL_ID = 9;

export const PP_LEVEL_THRESHOLDS = [0, 1, 2, 4, 6];

export const PP_LEVEL_SCALES = [1, 1.10, 1.16, 1.25, 1.35];

export const PP_MAX_LEVEL = PP_LEVEL_THRESHOLDS.length - 1;
export const PP_NATURAL_MAX_LEVEL = Math.max(0, PP_MAX_LEVEL - 1);

export const PP_SCATTER_DROP = {
    /** Espera entre la explosión del PP (nivel máximo) y la lluvia de PP_scatter. */
    delayAfterExplosion: 250,
    /** Espera antes del primer PP_scatter. */
    delayBeforeDrop: 150,
    /** Uno atrás del otro (true) o todos juntos escalonados (false). */
    sequential: false,
    /** Espera entre un PP_scatter y el siguiente. */
    delayBetweenDrops: 50,
    /** Suman al PPCounter en silencio (no emiten partícula ni animan el tren). */
    countTowardsCounter: true,
    /** Duración del vuelo desde arriba de pantalla hasta el slot. */
    flyDuration: 520,
    flyEase: 'Back.easeIn',
    /** Altura extra por encima del slot desde donde arranca la caída (px). */
    startOffsetY: 900,
    /** Escala inicial relativa a la final (entra un poco más grande). */
    startScale: 1,
    /** Rotación inicial en grados (se endereza al aterrizar). */
    startAngle: -25,
    /** Squash al impactar. */
    impactSquash: 0.22,
    impactDuration: 110,
    depth: 2,
    /**
     * true  => al aterrizar se reemplaza el símbolo del reel por el id custom
     *          (queda integrado a la grilla: cascadas, borders, búsquedas por id).
     * false => el sprite queda flotando por encima, sin tocar la grilla.
     */
    replaceReelSymbol: true,
};

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

/**
 * Nivel que corresponde al contador. Nunca devuelve PP_MAX_LEVEL:
 * ese nivel sólo se alcanza forzado por PP_scatter.
 */
export function getPPLevelForCounter(counter) {
    let level = 0;

    for (let i = 0; i < PP_LEVEL_THRESHOLDS.length; i++) {
        if (counter >= PP_LEVEL_THRESHOLDS[i]) level = i;
        else break;
    }

    return Math.min(level, PP_NATURAL_MAX_LEVEL);
}
