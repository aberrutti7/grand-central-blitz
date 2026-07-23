/**
 * LightningBeamShader.js
 * Haz de rayo (lightning) que conecta dos puntos A y B.
 *
 * Uso rápido:
 *   import LightningBeam from "../features/effects/LightningBeamShader";
 *
 *   this.beam = new LightningBeam(this, { depth: 3 });      // ámbar por defecto
 *   this.beam.connect(this.electro1, this.electro2);        // sigue dos sprites
 *   // o puntos fijos (coords de mundo / pantalla del juego):
 *   this.beam.setEndpoints(200, 400, 900, 400);
 *
 * Parametrizable
 *   this.beam.setThickness(2.2).setAmplitude(14).setSpeed(4);
 *   this.beam.setColors(LightningBeam.PALETTES.cyan);
 *   this.beam.setNode(0.7);   // posición del nodo pulsante (0..1)
 *   this.beam.setGain(0);     // apagado; tweenear a 1 para "encender"
 *
 * Notas:
 *   - Requiere renderer WebGL.
 *   - Blend ADD por defecto: el fondo negro del quad no oscurece la escena.
 * 
 */

const FRAG = /* glsl */ `
precision highp float;

varying vec2 fragCoord;      // pixel local del objeto Shader (0..w, 0..h)

uniform float uTime;
uniform vec2  uA;            // extremo A en coords locales del shader
uniform vec2  uB;            // extremo B
uniform float uThick;        // grosor del núcleo (px)
uniform float uAmp;          // amplitud del zigzag (px)
uniform float uFreq;         // frecuencia del ruido (1/px)
uniform float uSpeed;        // velocidad de animación
uniform float uNode;         // posición del nodo pulsante (0..1)
uniform float uGain;         // brillo global (0 = apagado)
uniform vec3  uHot;          // color del núcleo incandescente
uniform vec3  uMid;          // color medio (amarillo/naranja)
uniform vec3  uGlow;         // color del bloom externo

float hash(float n){ return fract(sin(n)*43758.5453123); }
float vnoise(vec2 x){
  vec2 i = floor(x), f = fract(x);
  f = f*f*(3.0-2.0*f);
  float n = i.x + i.y*57.0;
  return mix(mix(hash(n),      hash(n+1.0),  f.x),
             mix(hash(n+57.0), hash(n+58.0), f.x), f.y);
}
float fbm(vec2 p){
  float v=0.0, a=0.5;
  for(int k=0;k<4;k++){ v += a*vnoise(p); p = p*2.03 + 7.1; a *= 0.5; }
  return v;
}

// desplazamiento perpendicular de la línea central en la distancia "x"
float disp(float x, float env){
  float t = uTime * uSpeed;
  float d  = (fbm(vec2(x*uFreq,     t))     - 0.5) * 2.0;
        d += (fbm(vec2(x*uFreq*2.7, t*1.9)) - 0.5) * 0.5;
  return d * uAmp * env;
}

void main(){
  vec2  P   = fragCoord;
  vec2  AB  = uB - uA;
  float len = max(length(AB), 1.0);
  vec2  dir = AB / len;
  vec2  nor = vec2(-dir.y, dir.x);

  vec2  rel = P - uA;
  float x   = dot(rel, dir);     // a lo largo del haz
  float y   = dot(rel, nor);     // perpendicular
  float tt  = clamp(x/len, 0.0, 1.0);
  float env = pow(sin(3.14159265*tt), 0.6);   // ancla A y B, más lleno al medio

  float dc   = y - disp(x, env);
  float dist = abs(dc);
  if(x < 0.0) dist = length(vec2(x,     dc));  // recorta fuera del segmento
  if(x > len) dist = length(vec2(x-len, dc));

  float t     = uTime;
  float flick = 0.72 + 0.28*fbm(vec2(x*0.03, t*3.0));
  float core  = uThick / (dist + 0.75);
  float halo  = uThick / (dist*0.35 + 2.0);

  vec3 col = vec3(0.0);
  col += uHot  * pow(core, 2.2) * 1.2;   // filamento blanco incandescente
  col += uMid  * pow(core, 1.1) * 0.9;   // amarillo/naranja
  col += uGlow * halo * 0.7;             // bloom
  col *= flick;

  // nodo pulsante a lo largo del haz
  float xn    = uNode * len;
  float envN  = pow(sin(3.14159265*clamp(uNode,0.0,1.0)), 0.6);
  float yn    = disp(xn, envN);
  float dn    = length(vec2(x - xn, y - yn));
  float pulse = 0.6 + 0.4*sin(t*6.0);
  float orb   = (uThick*4.0) / (dn + 3.0);
  col += uMid              * pow(orb,1.6) * 0.55 * pulse;
  col += vec3(1.0,0.9,0.6) * orb          * 0.35 * pulse;

  // anclas brillantes en los extremos
  float da  = length(P - uA), db = length(P - uB);
  vec3  cap = mix(uHot, uMid, 0.4);
  col += cap * (uThick*3.0/(da+3.0)) * 0.5;
  col += cap * (uThick*3.0/(db+3.0)) * 0.5;

  col *= uGain;

  // Alpha por luminancia -> fuera del rayo es transparente y deja ver la escena.
  // Premultiplicado: funciona igual con blend ADD o NORMAL (no pinta negro opaco).
  float a = clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0);
  gl_FragColor = vec4(col * a, a);
}
`;

const toVec3 = (c) => Array.isArray(c) ? { x: c[0], y: c[1], z: c[2] } : c;

const DEFAULTS = {
  thickness: 1.6,
  amplitude: 9.0,
  frequency: 0.02,
  speed:     3.0,
  node:      0.55,
  gain:      1.0,
  colors:    { hot: [1.0, 0.98, 0.90], mid: [1.0, 0.62, 0.16], glow: [1.0, 0.35, 0.06] },
  flipY:     true,
};

export default class LightningBeam extends Phaser.GameObjects.Shader {
  /**
   * @param {Phaser.Scene} scene
   * @param {object} [cfg]
   * @param {number} [cfg.x] @param {number} [cfg.y]        centro del quad (default: centro de la escena)
   * @param {number} [cfg.width] @param {number} [cfg.height] tamaño del quad (default: tamaño de la escena)
   * @param {number} [cfg.depth]
   * @param {number} [cfg.thickness] @param {number} [cfg.amplitude] @param {number} [cfg.frequency]
   * @param {number} [cfg.speed] @param {number} [cfg.node] @param {number} [cfg.gain]
   * @param {{hot:number[],mid:number[],glow:number[]}} [cfg.colors]
   * @param {boolean} [cfg.flipY]
   */
  constructor(scene, cfg = {}) {
    const o = { ...DEFAULTS, ...cfg, colors: { ...DEFAULTS.colors, ...(cfg.colors || {}) } };
    const width  = cfg.width  ?? scene.scale.width;
    const height = cfg.height ?? scene.scale.height;
    const x = cfg.x ?? width  / 2;
    const y = cfg.y ?? height / 2;

    const base = new Phaser.Display.BaseShader('LightningBeam', FRAG, undefined, {
      uTime:  { type: '1f', value: 0 },
      uA:     { type: '2f', value: { x: width * 0.1, y: height * 0.5 } },
      uB:     { type: '2f', value: { x: width * 0.9, y: height * 0.5 } },
      uThick: { type: '1f', value: o.thickness },
      uAmp:   { type: '1f', value: o.amplitude },
      uFreq:  { type: '1f', value: o.frequency },
      uSpeed: { type: '1f', value: o.speed },
      uNode:  { type: '1f', value: o.node },
      uGain:  { type: '1f', value: o.gain },
      uHot:   { type: '3f', value: toVec3(o.colors.hot)  },
      uMid:   { type: '3f', value: toVec3(o.colors.mid)  },
      uGlow:  { type: '3f', value: toVec3(o.colors.glow) },
    });

    super(scene, base, x, y, width, height);

    this.flipY   = o.flipY;
    this._follow = null;
    this._elapsed = 0;

    this.setBlendMode(cfg.blendMode ?? Phaser.BlendModes.ADD); // ADD = glow
    if (cfg.depth != null) this.setDepth(cfg.depth);
    scene.add.existing(this);

    scene.events.on(Phaser.Scenes.Events.UPDATE, this._onSceneUpdate, this);
    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      scene.events.off(Phaser.Scenes.Events.UPDATE, this._onSceneUpdate, this);
    });
  }

  _onSceneUpdate(_time, delta) {
    this._elapsed += delta / 1000;
    this.setUniform('uTime.value', this._elapsed);
    if (this._follow) this._applyFollow();
  }

  // --- geometría: mundo -> espacio local del shader ---
  _toLocal(worldX, worldY) {
    const left = this.x - this.width  * this.originX;
    const top  = this.y - this.height * this.originY;
    const lx = worldX - left;
    let   ly = worldY - top;
    if (this.flipY) ly = this.height - ly;
    return { x: lx, y: ly };
  }

  /** Fija los dos extremos en coords de mundo/pantalla del juego. */
  setEndpoints(ax, ay, bx, by) {
    this.setUniform('uA.value', this._toLocal(ax, ay));
    this.setUniform('uB.value', this._toLocal(bx, by));
    return this;
  }

  /** Conecta y sigue dos objetos (o puntos {x,y}) cada frame. */
  connect(a, b) { this._follow = { a, b }; this._applyFollow(); return this; }
  disconnect()  { this._follow = null; return this; }
  _applyFollow() { const { a, b } = this._follow; this.setEndpoints(a.x, a.y, b.x, b.y); }

  // --- parámetros (encadenables) ---
  setThickness(v) { this.setUniform('uThick.value', v); return this; }
  setAmplitude(v) { this.setUniform('uAmp.value',   v); return this; }
  setFrequency(v) { this.setUniform('uFreq.value',  v); return this; }
  setSpeed(v)     { this.setUniform('uSpeed.value', v); return this; }
  setNode(v)      { this.setUniform('uNode.value',  v); return this; } // 0..1
  setGain(v)      { this.setUniform('uGain.value',  v); return this; } // 0 = apagado
  setColors({ hot, mid, glow } = {}) {
    if (hot)  this.setUniform('uHot.value',  toVec3(hot));
    if (mid)  this.setUniform('uMid.value',  toVec3(mid));
    if (glow) this.setUniform('uGlow.value', toVec3(glow));
    return this;
  }

  /** Enciende con un pequeño fade de brillo. */
  flashIn(duration = 250, gain = 1.0) {
    this.setVisible(true);
    this.scene.tweens.add({ targets: this, _gainProxy: { from: 0, to: gain }, duration,
      onUpdate: (tw, t) => this.setGain(t._gainProxy) });
    return this;
  }
  flashOut(duration = 250) {
    this.scene.tweens.add({ targets: this, _gainProxy: { from: 1, to: 0 }, duration,
      onUpdate: (tw, t) => this.setGain(t._gainProxy),
      onComplete: () => this.setVisible(false) });
    return this;
  }

  /** Llamalo en el resize responsivo si el quad cubre toda la pantalla. */
  resizeToGame() { this.setSize(this.scene.scale.width, this.scene.scale.height); return this; }
}

// Paletas listas para setColors(...)
LightningBeam.PALETTES = {
  amber:   { hot: [1.0, 0.98, 0.90], mid: [1.0, 0.62, 0.16], glow: [1.0, 0.35, 0.06] },
  cyan:    { hot: [0.90, 1.0, 1.0],  mid: [0.25, 0.75, 1.0], glow: [0.10, 0.45, 1.0] },
  plasma:  { hot: [0.90, 1.0, 0.90], mid: [0.45, 1.0, 0.45], glow: [0.10, 0.90, 0.35] },
  magenta: { hot: [1.0, 0.92, 1.0],  mid: [1.0, 0.35, 0.85], glow: [0.85, 0.10, 0.70] },
};