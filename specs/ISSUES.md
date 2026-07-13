# Issues encontrados - Template Proto-Base

## Issues de Arquitectura (Alta Prioridad)

### 1. God Classes - Clases demasiado grandes
**Archivos:**
- `src/ui/UIControlsBar.js` - **1442 líneas**
- `src/game/LoadingScreen.js` - 398 líneas
- `src/game/GameController.js` - 444 líneas

**Problema:** Cada clase hace demasiadas cosas. Dificulta mantenimiento y testing.

**Recomendación:** Extraer componentes más pequeños:
- `UIControlsBar` → `SpinButton`, `BetSelector`, `AutoPlayPanel`, `BonusBuyPanel`
- `GameController` → `SpinOrchestrator`, `WinAnimationController`, `AudioManager`

---

### 2. Acoplamiento fuerte - Dependencias directas
**Problema:**
```javascript
// En cada componente
constructor({ scene, model }) {
    this.scene = scene;
    this.model = model;
}
```
Cada componente tiene dependencia directa de `scene` y `model`. No hay inyección de dependencias.

**Recomendación:** Crear un sistema de dependencias o contexto compartido.

---

### 3. Config global mutable
**Archivo:** `src/config/config.js`

**Problema:** El config es un singleton que se importa y modifica en múltiples lugares. No hay validación ni schema.

**Recomendación:** 
- Usar getters con valores por defecto
- Validar schema al iniciar
- Considerar separar en múltiples archivos de config

---

## Issues de Responsive (Media Prioridad)

### 4. Escala de símbolos inconsistente
**Archivos:** `ReelsController.js`, `SymbolView.js`

**Problema:**
- `ReelsController`: container scale desde config (ej: 0.5)
- `SymbolView`: `initialScale = 0.6` hardcoded

Dos sistemas de escala diferentes que pueden entrar en conflicto.

**Estado:** ⚠️ Pendiente de resolver

---

### 5. SymbolView no usa responsive
**Archivo:** `src/features/symbols/SymbolView.js`

**Problema:** SymbolView no tiene forma de aplicarse responsive. Solo hereda la escala del container padre.

**Recomendación:** Agregar opción para que SymbolView pueda usar valores responsive.

---

### 6. Config duplicado
**Problema:**
- `config.js` tiene `reelsConfig: { scaleX: 0.5, scaleY: 0.5 }`
- `desktop.config.js` tiene `reels: { scaleX: 1, scaleY: 1 }`

Valores duplicados en dos lugares.

**Recomendación:** Dejar `desktop.config.js` como source of truth para valores base, usar `config.js` solo como fallback legacy.

---

## Issues de Calidad de Código (Media Prioridad)

### 7. Magic Numbers dispersos
**Ejemplos:**
```javascript
// ReelView.js
lift = 15;              // Animación
overshoot = 20;          // Animación
initialScale = 0.6;     // Símbolo
displayWidth * 0.5;      // Posicionamiento

// SymbolView.js
displayWidth * 0.5;     // Centering

// ReelsController.js
setScale(1, 0.93);      // Frame
```

**Recomendación:** Crear constants para valores repetidos:
- `src/constants/ANIMATIONS.js` - durations, lifts, overshoots
- `src/constants/DIMENSIONS.js` - scales default

---

### 8. Duplicación de código
**Patrones repetidos:**
- `delay()` implementado 4 veces (ReelView, SymbolView, GameController, ReelsController)
- `getGapBetweenReels()` / `getGapBetweenRows()` en Model

**Recomendación:** Extraer a servicios:
```javascript
// src/services/DelayService.js
export const delay = (scene, ms) => 
    new Promise(resolve => scene.time.delayedCall(ms, resolve));
```

---

### 9. Inconsistencia en naming
**Ejemplos:**
```javascript
// Mix de convenciones
this.reelsBG           // camelCase
this.reelsFrame        // camelCase
this.ui_background     // underscore en medio
this._barFill          // underscore prefix
_createReels()         // underscore prefix
createInitialSymbols() // PascalCase
```

**Recomendación:** Definir convención y usar ESLint para enforce.

---

### 10. Error handling ausente
**Problema:**
```javascript
// Model.js - no try-catch
async getSpin({ type = 'basegame' }) {
    this.lastResult = await this.apiService.getSpin(...);
}

// ApiService.js - errores silenciosos
if (!this.session) {
    throw new Error('No active session'); // Solo throw, no handling
}
```

**Recomendación:** Agregar try-catch y manejo de errores en API calls y operaciones async.

---

## Issues de Estructura (Baja Prioridad)

### 11. Sin tests
**Estado:** No hay archivos de test.

**Recomendación:** Empezar con tests de unidades para:
- `SpinResult.js` - transformación de datos
- `ResponsiveManager.js` - cálculos de coordenadas
- `generateLineColors.js` - funciones puras

---

### 12. Sin linting
**Estado:** No hay ESLint/Prettier configurado.

**Recomendación:** Agregar configuración básica para mejorar consistencia.

---

### 13. Credenciales en código
**Archivo:** `src/config/config.js:84-89`
```javascript
api: {
    username: 'landing',
    password: 'landing',
    secretId: '...',
}
```

**Problema:** Credenciales hardcodeadas en el source.

**Recomendación:** Usar environment variables.

---

## Issues de Reels/Symbols (Resueltos)

### 14. ✅ _repositionSymbols no usaba gaps
**Archivo:** `src/features/reels/ReelView.js`

**Problema:** Después del spin, `_repositionSymbols()` recalculaba posiciones SIN usar `gapBetweenRows`.

**Solución:** Ahora usa gaps del responsive config.

---

### 15. ✅ animateSpin no usaba gaps
**Archivo:** `src/features/reels/ReelView.js`

**Problema:** `this._finalY = startY + this.model.getSymbolSize() * steps;` no consideraba gaps.

**Solución:** Ahora calcula `rowSpacing = symbolSize + gapBetweenSymbols`.

---

### 16. ✅ symbolSize agregado a responsive configs
**Archivos:** `desktop.config.js`, `mobile.config.js`

**Problema:** No había forma de configurar symbolSize por view.

**Solución:** Agregado `symbolSize` a la estructura de reels en ambos configs.

---

## Issues Pendientes de Revisión

### 17. reelsConfig en config.js vs responsive
**Estado:** ⚠️ Pendiente decisión

`config.js` todavía tiene `reelsConfig` con valores legacy. Se usa como fallback.

**Opciones:**
1. Mantener como fallback (actual)
2. Eliminar y mover todos los valores a `desktop.config.js`
3. Mover completamente a responsive system

---

### 18. TrackerReels y TrackerScaleY sin uso claro
**Archivos:** `Model.js:119-125`

```javascript
getTrackerReels(){
    return this.config.trackerReels;
}

getTrackerScaleY(){
    return this.config.trackerScaleY;
}
```

**Problema:** No está claro dónde se usan这些 getters.

**Recomendación:** Investigar uso o eliminar si no se usan.

---

## Roadmap Sugerido

### Fase 1: Responsive
- [x] Crear ResponsiveManager
- [x] Crear desktop/mobile configs
- [x] Aplicar a ReelsController
- [ ] Aplicar a UIControlsBar (componentes extraídos)
- [ ] Aplicar a UIView
- [ ] Limpiar configs duplicados

### Fase 2: Calidad de Código
- [ ] Extraer DelayService (reutilizable)
- [ ] Crear constants para magic numbers
- [ ] Agregar ESLint
- [ ] Agregar basic tests

### Fase 3: Arquitectura
- [x] Extraer componentes de UIControlsBar
- [ ] Reducir GameController
- [ ] Implementar dependency injection light

### Fase 4: Testing
- [ ] Setup Jest
- [ ] Tests para SpinResult
- [ ] Tests para ResponsiveManager
- [ ] Tests para servicios

---

## Componentes Extraídos de UIControlsBar

### ✅ Completado (2026-07-10)

**Nuevos archivos en `src/ui/components/`:**
- `SpinButton.js` - Spin y Stop buttons
- `StatsButton.js` - Botón de stats
- `TurboButton.js` - Toggle turbo
- `SideBetButton.js` - Side bet toggle
- `ControlsGroup.js` - Info, fullscreen, sound
- `ValuesDisplay.js` - Balance y Win display
- `BetSelector.js` - Selector de apuesta con panel
- `AutoPlayPanel.js` - Auto spin con opciones
- `BonusBuyPanel.js` - Tienda de bonus buy
- `ForcedPlaySelector.js` - Dropdown de force play
- `index.js` - Exports

**UIControlsBar refactorizado:**
- De 1442 líneas → ~300 líneas
- Ahora es un coordinator, no un god class
- Cada componente es independiente y reutilizable

---

*Última actualización: 2026-07-10*
