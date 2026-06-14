(function () {
  const CURSOR_DEFAULTS = {
    classPrefix: "aiw",
    assetUrl: "../assets/ai-cursor.svg",
    width: 133,
    height: 131,
    hotspotX: 50,
    hotspotY: 37
  };

  const TRIGGER_DEFAULTS = {
    cursor: null,
    shakeThreshold: 2,
    shakeWindow: 820,
    minShakeDistance: 14,
    minShakeSpeed: 180,
    horizontalDominance: 1.2,
    activeDuration: 2600,
    cooldown: 700,
    autoHide: true,
    onActivate: null,
    onDismiss: null
  };

  const CHIP_DEFAULTS = {
    classPrefix: "aiw",
    assetUrl: "",
    text: "Make this more human",
    offsetX: -28,
    offsetY: -70,
    width: 365,
    height: 198
  };

  const VOICE_DEFAULTS = {
    classPrefix: "aiw",
    text: "按住说话",
    listeningText: "正在聆听...",
    unsupportedText: "当前浏览器不支持语音识别",
    lang: "zh-CN",
    continuous: false,
    interimResults: true,
    typeInterval: 90,
    cursorAssetUrl: "../assets/ai-cursor.svg",
    cursorWidth: 133,
    cursorHeight: 131,
    cursorHotspotX: 50,
    cursorHotspotY: 37,
    bubbleOffsetX: 82,
    bubbleOffsetY: 56,
    width: 349,
    height: 198,
    onTranscript: null,
    onStart: null,
    onEnd: null,
    onError: null
  };

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  class AICursor {
    constructor(options = {}) {
      this.options = { ...CURSOR_DEFAULTS, ...options };
      this.visible = false;
      this.lastPoint = {
        x: window.innerWidth * 0.5,
        y: window.innerHeight * 0.5
      };

      this.layer = document.createElement("div");
      this.layer.className = `${this.options.classPrefix}-cursor-layer`;
      this.layer.innerHTML = `
        <img
          class="${this.options.classPrefix}-cursor-asset"
          src="${this.options.assetUrl}"
          width="${this.options.width}"
          height="${this.options.height}"
          alt=""
          aria-hidden="true"
        />
      `;

      document.body.append(this.layer);
      this.moveTo(this.lastPoint.x, this.lastPoint.y);
    }

    moveTo(x, y) {
      const safeX = clamp(x, 0, window.innerWidth);
      const safeY = clamp(y, 0, window.innerHeight);
      this.lastPoint = { x: safeX, y: safeY };
      this.layer.style.setProperty("--aiw-cursor-x", `${safeX}px`);
      this.layer.style.setProperty("--aiw-cursor-y", `${safeY}px`);
      this.layer.style.setProperty("--aiw-cursor-hotspot-x", `${this.options.hotspotX}px`);
      this.layer.style.setProperty("--aiw-cursor-hotspot-y", `${this.options.hotspotY}px`);
    }

    show(point) {
      if (point) this.moveTo(point.x, point.y);
      this.visible = true;
      this.layer.classList.add("is-visible");
      document.documentElement.classList.add("aiw-hide-native-cursor");
    }

    hide() {
      this.visible = false;
      this.layer.classList.remove("is-visible");
      document.documentElement.classList.remove("aiw-hide-native-cursor");
    }

    destroy() {
      this.hide();
      this.layer.remove();
    }
  }

  class CursorTrigger {
    constructor(options = {}) {
      this.options = { ...TRIGGER_DEFAULTS, ...options };
      this.cursor = this.options.cursor || new AICursor(this.options.cursorOptions);
      this.lastMove = null;
      this.lastDirection = 0;
      this.shakes = [];
      this.active = false;
      this.cooldownUntil = 0;
      this.hideTimer = 0;

      this.onPointerMove = this.onPointerMove.bind(this);
      window.addEventListener("pointermove", this.onPointerMove, { passive: true });
    }

    onPointerMove(event) {
      const now = performance.now();
      const point = { x: event.clientX, y: event.clientY, time: now };

      if (this.active) {
        this.cursor.moveTo(point.x, point.y);
      }

      if (!this.lastMove) {
        this.lastMove = point;
        return;
      }

      const dx = point.x - this.lastMove.x;
      const dy = point.y - this.lastMove.y;
      const dt = Math.max(16, point.time - this.lastMove.time);
      const distance = Math.hypot(dx, dy);
      const speed = (distance / dt) * 1000;
      const isHorizontalShake = Math.abs(dx) >= Math.abs(dy) * this.options.horizontalDominance;
      const direction = isHorizontalShake ? Math.sign(dx) : 0;
      const reversed = direction && this.lastDirection && direction !== this.lastDirection;

      if (
        !this.active &&
        now > this.cooldownUntil &&
        reversed &&
        distance >= this.options.minShakeDistance &&
        speed >= this.options.minShakeSpeed
      ) {
        this.shakes.push(now);
        this.shakes = this.shakes.filter(time => now - time <= this.options.shakeWindow);

        if (this.shakes.length >= this.options.shakeThreshold) {
          this.activate(point);
        }
      }

      if (direction) this.lastDirection = direction;
      this.lastMove = point;
    }

    activate(point) {
      window.clearTimeout(this.hideTimer);
      this.active = true;
      this.shakes = [];
      this.cursor.show(point);
      if (typeof this.options.onActivate === "function") {
        this.options.onActivate({ cursor: this.cursor, point });
      }

      if (this.options.autoHide) {
        this.hideTimer = window.setTimeout(() => {
          this.dismiss();
        }, this.options.activeDuration);
      }
    }

    dismiss() {
      if (!this.active) return;
      this.active = false;
      this.cooldownUntil = performance.now() + this.options.cooldown;
      this.cursor.hide();
      if (typeof this.options.onDismiss === "function") {
        this.options.onDismiss({ cursor: this.cursor });
      }
    }

    destroy() {
      window.clearTimeout(this.hideTimer);
      window.removeEventListener("pointermove", this.onPointerMove);
      this.cursor.destroy();
    }
  }

  class AICommandChip {
    constructor(options = {}) {
      this.options = { ...CHIP_DEFAULTS, ...options };
      this.visible = false;
      this.lastPoint = {
        x: window.innerWidth * 0.5,
        y: window.innerHeight * 0.5
      };

      this.layer = document.createElement("div");
      this.layer.className = `${this.options.classPrefix}-chip-layer`;
      this.layer.innerHTML = this.options.assetUrl
        ? `
        <img
          class="${this.options.classPrefix}-command-chip-asset"
          src="${this.options.assetUrl}"
          width="${this.options.width}"
          height="${this.options.height}"
          alt=""
          aria-hidden="true"
        />
      `
        : `
        <div class="${this.options.classPrefix}-command-chip" role="status" aria-live="polite">
          <span class="${this.options.classPrefix}-command-icon" aria-hidden="true">
            <span></span><span></span><span></span>
          </span>
          <span class="${this.options.classPrefix}-command-label"></span>
        </div>
      `;

      document.body.append(this.layer);
      this.label = this.layer.querySelector(`.${this.options.classPrefix}-command-label`);
      if (this.label) this.setText(this.options.text);
      this.moveTo(this.lastPoint.x, this.lastPoint.y);
    }

    setText(text) {
      this.options.text = text;
      if (this.label) this.label.textContent = text;
    }

    moveTo(x, y) {
      const chipX = clamp(x + this.options.offsetX, 16, window.innerWidth - this.options.width - 16);
      const chipY = clamp(y + this.options.offsetY, 16, window.innerHeight - this.options.height - 16);
      this.lastPoint = { x, y };
      this.layer.style.setProperty("--aiw-chip-x", `${chipX}px`);
      this.layer.style.setProperty("--aiw-chip-y", `${chipY}px`);
    }

    show(point, text) {
      if (text) this.setText(text);
      if (point) this.moveTo(point.x, point.y);
      this.visible = true;
      this.layer.classList.add("is-visible");
    }

    hide() {
      this.visible = false;
      this.layer.classList.remove("is-visible");
    }

    destroy() {
      this.layer.remove();
    }
  }

  class VoiceInputBubble {
    constructor(options = {}) {
      this.options = { ...VOICE_DEFAULTS, ...options };
      this.visible = false;
      this.listening = false;
      this.recognition = null;
      this.typingTimer = 0;
      this.lastPoint = {
        x: window.innerWidth * 0.5,
        y: window.innerHeight * 0.5
      };

      this.layer = document.createElement("div");
      this.layer.className = `${this.options.classPrefix}-voice-layer`;
      this.layer.innerHTML = `
        <div class="${this.options.classPrefix}-voice-composite">
          <img
            class="${this.options.classPrefix}-voice-cursor-asset"
            src="${this.options.cursorAssetUrl}"
            width="${this.options.cursorWidth}"
            height="${this.options.cursorHeight}"
            alt=""
            aria-hidden="true"
          />
          <div class="${this.options.classPrefix}-voice-bubble" role="status" aria-live="polite">
            <span class="${this.options.classPrefix}-voice-bars" aria-hidden="true">
              <span></span><span></span><span></span><span></span>
            </span>
            <span class="${this.options.classPrefix}-voice-text"></span>
          </div>
        </div>
      `;

      document.body.append(this.layer);
      this.text = this.layer.querySelector(`.${this.options.classPrefix}-voice-text`);
      this.setTranscript(this.options.text);
      this.moveTo(this.lastPoint.x, this.lastPoint.y);
    }

    moveTo(x, y) {
      const bubbleX = clamp(x - this.options.cursorHotspotX, 16, window.innerWidth - this.options.width - 16);
      const bubbleY = clamp(y - this.options.cursorHotspotY, 16, window.innerHeight - this.options.height - 16);
      this.lastPoint = { x, y };
      this.layer.style.setProperty("--aiw-voice-x", `${bubbleX}px`);
      this.layer.style.setProperty("--aiw-voice-y", `${bubbleY}px`);
      this.layer.style.setProperty("--aiw-voice-bubble-x", `${this.options.bubbleOffsetX}px`);
      this.layer.style.setProperty("--aiw-voice-bubble-y", `${this.options.bubbleOffsetY}px`);
    }

    setTranscript(text) {
      this.stopTyping();
      this.options.text = text;
      this.text.textContent = text;
    }

    stopTyping() {
      window.clearTimeout(this.typingTimer);
      this.typingTimer = 0;
      this.layer.classList.remove("is-typing");
    }

    typeTranscript(text, options = {}) {
      this.stopTyping();
      const content = String(text || "");
      const interval = options.interval || this.options.typeInterval;
      let index = 0;

      this.options.text = content;
      this.text.textContent = "";
      this.layer.classList.add("is-typing");

      const tick = () => {
        index += 1;
        this.text.textContent = content.slice(0, index);

        if (index < content.length) {
          this.typingTimer = window.setTimeout(tick, interval);
          return;
        }

        this.stopTyping();
        if (typeof options.onComplete === "function") {
          options.onComplete(content);
        }
      };

      this.typingTimer = window.setTimeout(tick, interval);
    }

    show(point, text) {
      if (text) this.setTranscript(text);
      if (point) this.moveTo(point.x, point.y);
      this.visible = true;
      this.layer.classList.add("is-visible");
    }

    hide() {
      this.visible = false;
      this.stopTyping();
      this.stopListening();
      this.layer.classList.remove("is-visible");
    }

    getSpeechRecognition() {
      return window.SpeechRecognition || window.webkitSpeechRecognition || null;
    }

    startListening(point) {
      if (point) this.moveTo(point.x, point.y);
      this.show(point, this.options.listeningText);

      const SpeechRecognition = this.getSpeechRecognition();
      if (!SpeechRecognition) {
        this.setTranscript(this.options.unsupportedText);
        if (typeof this.options.onError === "function") {
          this.options.onError({ type: "unsupported" });
        }
        return false;
      }

      this.stopListening();
      this.recognition = new SpeechRecognition();
      this.recognition.lang = this.options.lang;
      this.recognition.continuous = this.options.continuous;
      this.recognition.interimResults = this.options.interimResults;

      this.recognition.onstart = () => {
        this.listening = true;
        this.layer.classList.add("is-listening");
        if (typeof this.options.onStart === "function") {
          this.options.onStart();
        }
      };

      this.recognition.onresult = event => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          transcript += event.results[i][0].transcript;
        }
        const clean = transcript.trim();
        if (clean) {
          this.setTranscript(clean);
          if (typeof this.options.onTranscript === "function") {
            this.options.onTranscript(clean);
          }
        }
      };

      this.recognition.onerror = event => {
        this.listening = false;
        this.layer.classList.remove("is-listening");
        if (typeof this.options.onError === "function") {
          this.options.onError(event);
        }
      };

      this.recognition.onend = () => {
        this.listening = false;
        this.layer.classList.remove("is-listening");
        if (typeof this.options.onEnd === "function") {
          this.options.onEnd();
        }
      };

      this.recognition.start();
      return true;
    }

    stopListening() {
      if (this.recognition) {
        this.recognition.stop();
        this.recognition = null;
      }
      this.listening = false;
      this.layer.classList.remove("is-listening");
    }

    destroy() {
      this.stopListening();
      this.layer.remove();
    }
  }

  window.AIWater = window.AIWater || {};
  window.AIWater.AICursor = AICursor;
  window.AIWater.CursorTrigger = CursorTrigger;
  window.AIWater.AICommandChip = AICommandChip;
  window.AIWater.VoiceInputBubble = VoiceInputBubble;
  window.AIWater.createCursor = function createCursor(options) {
    return new AICursor(options);
  };
  window.AIWater.createCursorTrigger = function createCursorTrigger(options) {
    return new CursorTrigger(options);
  };
  window.AIWater.createCommandChip = function createCommandChip(options) {
    return new AICommandChip(options);
  };
  window.AIWater.createVoiceInputBubble = function createVoiceInputBubble(options) {
    return new VoiceInputBubble(options);
  };
})();
