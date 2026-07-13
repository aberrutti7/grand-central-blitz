---
sidebar_position: 3
---

# Flujo del Spin

El flujo estándar que sigue el juego en cada spin.

---

## Diagrama de Flujo

```
Usuario → Spin/Stop Button
    │
    ▼
UIControlsBar._onSpinClick()
    │
    ▼
GameController.startSpin()
    │
    ├─► chargeBalance() → ¿Balance suficiente?
    │       ├─ No → enableControls() y return
    │       └─ Sí → Continua
    │
    ▼
_prepareUI() → disableControls(), reset wins
    │
    ▼
Model.getSpin() → Obtiene jugada (API/JSON)
    │
    ▼
spinResponse()
    │
    ├─► _updateAutoPlay() → Decrementa rondas
    ├─► _prepareForSpin() → Prepara UI
    ├─► _animateReels() → Animación
    └─► _resolveResult() → Evalúa ganancias
            │
            ▼
        handleSpinEnd()
            │
            ├─► ¿Cascada/Respin? → spinResponse() [recursión]
            │
            └─► spinFinished() → enableControls()
```

---

## Métodos Principales

### `startSpin()`

Ubicación: `GameController.js`

```javascript
async startSpin({isBonusBuy = true, type}) {
    // 1. Cobra el balance
    if (!this.chargeBalance(isBonusBuy)) {
        this.controls_bar.enableControls();
        return;
    }

    // 2. Prepara UI (deshabilita controles)
    this._prepareUI();

    // 3. Obtiene spin del modelo
    const newPlay = await this.model.getSpin({...});

    // 4. Procesa respuesta
    await this.spinResponse(newPlay);
}
```

### `spinResponse()`

Ubicación: `GameController.js`

```javascript
async spinResponse(result) {
    try {
        this._updateAutoPlay();
        await this._prepareForSpin(result);
        await this._animateReels();
        await this._resolveResult();
    } catch (error) {
        console.error('Spin error:', error);
        this.controls_bar.enableControls();
    }
}
```

### `_prepareForSpin()`

```javascript
async _prepareForSpin(result) {
    await this.resetWinAnimations();
    this.controls_bar.enableStopButton();

    this.state.resetValues();
    this.lastResult = new SpinResult(result);

    // Agrega free spins si hay
    this.state.addFreeSpins(this.lastResult.freeGames);

    // Actualiza reels con nuevos símbolos
    this.reelsController.addNewSymbols(this.lastResult.reelsSlices);
}
```

---

## Estados de Controles

### Durante Spin

```javascript
// UIControlsBar
isSpinning = true;
spinButton.hideSpin();
spinButton.showStop();
betSelector.disable();
autoPlayPanel.disable();
// ...
```

### Después de Spin

```javascript
// UIControlsBar.enableControls()
isSpinning = false;
spinButton.showSpin();
spinButton.hideStop();
spinButton.enableSpin();
betSelector.enable();
// ...
```

---

## Cascadas y Respins

Cuando `handleSpinEnd()` detecta una nueva respuesta de cascada/respin, llama recursivamente a `spinResponse()`:

```javascript
async handleSpinEnd() {
    const response = this.model.spinNextStep();

    if (!response) {
        this.spinFinished();
        return;
    }

    await this.spinResponse(response); // Recursión
}
```

---

## Free Spins

El flujo de free spins es manejado por:

1. **`GameState.addFreeSpins(n)`** - Agrega free spins
2. **`GameState.consumeFreeSpin()`** - Consume un free spin
3. **`GameState.isBonusActive()`** - Verifica si está activo

El estado `bonusActive` se mantiene durante toda la sesión de free spins.
