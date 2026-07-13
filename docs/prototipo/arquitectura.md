# Arquitectura

Visión general de la arquitectura del prototipo base de slot machine.

---

## Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                         GameController                          │
│                    (Orquestador Principal)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  GameState   │  │    Model     │  │   ReelsController    │  │
│  │ (Estado)     │  │ (Datos/API)  │  │   (Animaciones)      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│         │                  │                     │              │
│         └──────────────────┼─────────────────────┘              │
│                            ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                         UIView                            │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │   │
│  │  │ UIControls │  │ StatsPanel  │  │  ReelView[]     │   │   │
│  │  │    Bar      │  │             │  │  (5-6 reels)    │   │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Flujo de Datos

### Spin Flow

```
Usuario hace click en Spin
        │
        ▼
UIControlsBar._onSpinClick()
        │
        ▼
GameController.startSpin()
        │
        ├─► chargeBalance() ─► GameState.chargeBet()
        │                         │
        │                    ¿Balance suficiente?
        │                    ├─ No  ─► enableControls() y return
        │                    └─ Sí  ─► continua
        │
        ▼
_prepareUI() ─► disableControls(), reset win displays
        │
        ▼
Model.getSpin() ◄── Pide Jugada a la API/JSON
        │
        ▼
spinResponse() ─► _prepareForSpin() ─► _animateReels()
        │                                    │
        │                              ┌────┴────┐
        │                              ▼         ▼
        │                        reels giran  stop visible
        │                              │         │
        │                              └────┬────┘
        │                                   ▼
        │                            _resolveResult()
        │                                   │
        │                              ┌────┴────┐
        │                              ▼         ▼
        │                         hay cascade  no cascade
        │                              │         │
        │                              ▼         │
        │                        handleSpinEnd  │
        │                        spinResponse() │ recursion
        │                              │         │
        │                              └────┬────┘
        │                                   ▼
        │                            spinFinished()
        │                            enableControls()
        │
        ▼
handleSpinEnd() ─► ¿Nuevo spin step?
        │
        ├─ Sí ─► spinResponse() (recursión)
        │
        └─ No ─► spinFinished()
                   enableControls()
```

---

## Componentes Principales

### GameController (`src/game/GameController.js`)

Orquestador principal del juego. Maneja:
- Flujo de spin completo
- Comunicación entre componentes
- Estado global del juego
- Eventos de UI

**Métodos clave:**
- `startSpin()` - Inicia un nuevo spin
- `spinResponse()` - Procesa respuesta del modelo
- `handleSpinEnd()` - Maneja fin de spin y cascadas
- `enableControls()` - Reactiva controles después de spin

### GameState (`src/game/GameState.js`)

Estado global del juego (no Phaser state, estado lógico):
- Balance actual
- Apuesta actual (bet)
- Ganancias
- Free spins activos
- Auto play
- Turbo mode
- Side bets

### Model (`src/core/Model.js`)

Maneja datos y comunicación con backend:
- Selecciona jugadas del JSON o API
- Normaliza resultados
- Maneja API de spins

### UIView (`src/ui/UIView.js`)

Capa visual principal:
- Background
- Grid de símbolos (reels)
- Overlays de ganar
- Partículas

### UIControlsBar (`src/ui/UIControlsBar.js`)

Botonera principal del juego:
- Spin/Stop button
- Bet selector
- Auto play panel
- Bonus buy panel
- Turbo button
- Stats button

---

## Estados del Juego

| Estado | Descripción |
|--------|-------------|
| `idle` | Esperando input del jugador |
| `spinning` | Animación de reels en curso |
| `resolving` | Evaluando ganancias |
| `freeSpins` | Modo free spins activo |
| `bonus` | Modo bonus activo |
| `autoPlay` | Auto spin ejecutándose |

---

## Eventos del Sistema

### UIControlsBar → GameController

| Evento | Payload | Descripción |
|--------|---------|-------------|
| `spin` | - | Usuario presionó spin |
| `stop` | - | Usuario presionó stop |
| `changeBet` | `{value}` | Cambió apuesta |
| `setSideBet` | `{isSideBet, sideBet}` | Activó/desactivó side bet |
| `setAutoPlay` | `{rounds}` | Inició auto play |
| `stopAutoPlay` | - | Detuvo auto play |
| `setTurbo` | `{isTurbo}` | Toggle turbo |
| `bonusBuy` | `{bonusInfo}` | Compró bonus |

### GameController → Componentes

| Evento | Descripción |
|--------|-------------|
| `updateBalance` | Actualiza balance en UI |
| `updateWin` | Actualiza ganancias |
| `showFreeSpins` | Muestra overlay de free spins |
| `showBonus` | Muestra overlay de bonus |
| `bigWin` | Trigger animación big win |
