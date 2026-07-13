# Responsive Slot Prototype Specification

## Overview

A responsive view system for the Phaser 3 slot machine prototype that automatically adapts UI layouts based on screen dimensions. Desktop (landscape) and Mobile (portrait) receive optimized, distinctly different layouts rather than simple scaling.

---

## Resolution System

### Viewport Configurations

| View       | Resolution  | Orientation | Base Dimensions |
|------------|-------------|-------------|------------------|
| desktop  | 1920 x 1080 | Landscape   | width: 1920, height: 1080 |
| mobile   | 1080 x 1920 | Portrait    | width: 1080, height: 1920 |

### Detection Logic

- **Portrait**: window.innerHeight > window.innerWidth - Mobile view
- **Landscape**: window.innerWidth >= window.innerHeight - Desktop view

---

## Architecture

### New Files

`
src/
├── config/
│   ├── config.js              # Existing game config
│   ├── responsive.config.js    # NEW: Responsive view definitions
│   └── types.d.ts             # Existing types
├── core/
│   └── ResponsiveManager.js    # NEW: Handles view switching & coordinate transforms
├── views/                      # NEW: View-specific layouts
│   ├── desktop/
│   │   └── DesktopView.js     # Desktop-specific UI layout
│   └── mobile/
│       └── MobileView.js       # Mobile-specific UI layout
`

### Existing Files Modified

- src/main.js - Integrate ResponsiveManager, pass view type to scenes
- src/ui/UIControlsBar.js - Abstract positioning to use responsive coordinates
- src/ui/UIView.js - View-specific background/window positioning
- src/config/config.js - Add esponsive section reference

---

## Configuration Schema (responsive.config.js)

`javascript
export const responsiveConfig = {
  views: {
    desktop: {
      priority: 1,
      detect: () => window.innerWidth >= window.innerHeight,
      baseWidth: 1920,
      baseHeight: 1080,
      settings: {
        reels: {
          x: 360,
          y: 140,
          scale: 1.0,
          gapBetweenReels: 10,
          gapBetweenRows: 10
        },
        controls: {
          y: 900,
          buttonSize: 80,
          spacing: 20
        },
        ui: {
          balanceX: 100,
          balanceY: 50,
          betDisplayY: 50
        }
      }
    },
    mobile: {
      priority: 2,
      detect: () => window.innerHeight > window.innerWidth,
      baseWidth: 1080,
      baseHeight: 1920,
      settings: {
        reels: {
          x: 540,
          y: 400,
          scale: 0.65,
          gapBetweenReels: 6,
          gapBetweenRows: 6
        },
        controls: {
          y: 1600,
          buttonSize: 100,
          spacing: 30
        },
        ui: {
          balanceX: 540,
          balanceY: 80,
          betDisplayY: 150
        }
      }
    }
  },

  coordinateMap: {
    'reels.x':         'settings.reels.x',
    'reels.y':         'settings.reels.y',
    'reels.scale':     'settings.reels.scale',
    'controls.y':      'settings.controls.y',
    'controls.button': 'settings.controls.buttonSize',
    'controls.spacing':'settings.controls.spacing',
    'ui.balance.x':    'settings.ui.balanceX',
    'ui.balance.y':    'settings.ui.balanceY',
    'ui.bet.y':        'settings.ui.betDisplayY'
  }
};
`

---

## ResponsiveManager

### Responsibilities

1. **View Detection** - Determine current view based on config rules
2. **View Switching** - Trigger callbacks when view changes
3. **Coordinate Resolution** - Transform logical positions to screen positions
4. **Layout Application** - Notify components to update positions

### API

`javascript
class ResponsiveManager extends Phaser.Events.EventEmitter {
  constructor(scene, config)

  getCurrentView(): 'desktop' | 'mobile'
  get(key: string): number
  onViewChange(callback: (newView, oldView) => void): this
  isView(viewName: string): boolean
}
`

---

## View Layouts

### Desktop Layout (1920 x 1080)

`
+----------------------------------------------------------+
|  Balance: 10000                              Bet: 20     |
|                                                          |
|                    +-+-+-+-+-+-+                          |
|                    | | | | | | |                          |
|                    +-+-+-+-+-+-+-+  <- Reels (4 rows)     |
|                    | | | | | | |                          |
|                    +-+-+-+-+-+-+-+                         |
|                    | | | | | | |                          |
|                    +-+-+-+-+-+-+                          |
|                                                          |
|      [Auto]  [Spin]  [Bet]  [Turbo]  [Buy]                |
+----------------------------------------------------------+
`

### Mobile Layout (1080 x 1920)

`
+------------------------+
|      Balance: 10000    |
|         Bet: 20        |
|                        |
|      +-+-+-+-+-+       |
|      | | | | | |       |
|      +-+-+-+-+-+-+     |
|      | | | | | |       |
|      +-+-+-+-+-+-+     |
|      | | | | | |       |
|      +-+-+-+-+-+-+     |
|                        |
|                        |
|                        |
|    +---------------+   |
|    |     Spin      |   |
|    +---------------+   |
|   [Auto] [Bet] [Tur]   |
+------------------------+
`

Key differences:
- Reels scaled to 65% and repositioned
- Single prominent spin button
- Controls stacked vertically for thumb accessibility
- Balance/Bet repositioned to top-center

---

## Integration Points

### ReelsController

`javascript
// Before (hardcoded)
this.x = 360;
this.y = 140;

// After (responsive)
this.x = responsiveManager.get('reels.x');
this.y = responsiveManager.get('reels.y');
this.setScale(responsiveManager.get('reels.scale'));
`

### UIControlsBar

`javascript
// Before (hardcoded)
this.y = 900;

// After (responsive)
this.y = responsiveManager.get('controls.y');
`

### UIView

`javascript
// Before (hardcoded)
background.setPosition(960, 540);

// After (responsive)
const centerX = responsiveManager.get('ui.balance.x');
background.setPosition(centerX, 540);
`

---

## Usage Pattern

`javascript
// In BootScene or GameController
import { ResponsiveManager } from '../core/ResponsiveManager';
import { responsiveConfig } from '../config/responsive.config';

class GameController {
  init(data) {
    this.responsive = new ResponsiveManager(this, responsiveConfig);

    this.responsive.onViewChange((newView, oldView) => {
      this.onViewChanged(newView);
    });

    this.applyResponsiveSettings();
  }

  applyResponsiveSettings() {
    const reelsY = this.responsive.get('reels.y');
    const controlsY = this.responsive.get('controls.y');
  }

  onViewChanged(view) {
    this.reelsController.applyResponsiveLayout();
    this.uiControlsBar.applyResponsiveLayout();
    this.uiView.applyResponsiveLayout();
  }
}
`

---

## Implementation Order

1. Create src/config/responsive.config.js with view definitions
2. Create src/core/ResponsiveManager.js with detection and coordinate resolution
3. Update src/main.js to instantiate ResponsiveManager early
4. Update src/features/reels/ReelsController.js to use responsive coordinates
5. Update src/ui/UIControlsBar.js to use responsive coordinates
6. Update src/ui/UIView.js to use responsive coordinates
7. Create mobile and desktop view layout classes if deep customization needed

---

## Benefits

- **Single source of truth**: All positioning logic in responsive.config.js
- **Minimal code changes**: Components query manager instead of hardcoded values
- **Easy to add new views**: Just add a new view config entry
- **Preview support**: Can force a specific view for testing
- **No runtime scaling artifacts**: True responsive layouts, not just CSS scaling
