export function createSettingsEditor({
  config,
  onChange = () => {},
  onReset = () => {},
  onNebula = () => {},
  onNextStar = () => {},
  onResetRotation = () => {}
}) {
  const limits = {
    "stars.count": [20, 2000, 1],
    "stars.initialSpeed": [0, 60, 1],
    "stars.radius": [1, 6, 0.1],
    "stars.maxCount": [350, 650, 1],
    "stars.opacity": [0, 1, 0.01],
    "stars.trails": [0, 1, 0.01],

    "gravity.strength": [0, 3000, 10],
    "gravity.range": [50, 800, 10],
    "gravity.softening": [5, 100, 1],
    "gravity.maxSpeed": [20, 200, 1],
    "gravity.mergeDistance": [0.5, 4, 0.05],

    "explosions.glowMass": [1, 30, 1],
    "explosions.criticalMass": [3, 60, 1],
    "explosions.delay": [0, 60, 1],
    "explosions.delayVariation": [0, 30, 1],
    "explosions.fragments": [2, 30, 1],
    "explosions.speed": [10, 150, 1],
    "explosions.cooldown": [0.5, 15, 0.5],
    "explosions.shockwaveStrength": [0, 100, 1],

    "space.radius": [200, 1200, 10],
    "space.boundaryBounce": [0.1, 1, 0.05],

    "camera.distance": [1300, 3500, 10],
    "camera.zoom": [0.3, 3, 0.05],
    "camera.rotationX": [-180, 180, 1],
    "camera.rotationY": [-180, 180, 1],
    "camera.rotationZ": [-180, 180, 1],
    "camera.rotationSpeedX": [-30, 30, 0.1],
    "camera.rotationSpeedY": [-30, 30, 0.1],
    "camera.rotationSpeedZ": [-30, 30, 0.1],

    "flight.followDistance": [0, 200, 1],
    "flight.heightOffset": [-100, 100, 1],
    "flight.fieldOfView": [30, 120, 1],
    "flight.positionSmoothing": [0, 30, 0.5],
    "flight.directionSmoothing": [0, 20, 0.5],
    "flight.nearClip": [0.5, 20, 0.5],

    "mouse.radius": [40, 500, 1],
    "mouse.strength": [0, 150, 1],
    "mouse.holdMultiplier": [1, 5, 0.1],
    "mouse.shockwave": [0, 200, 1],
    "mouse.smoothing": [0.5, 20, 0.1],

    "nebula.clouds": [1, 15, 1],
    "nebula.opacity": [0, 0.8, 0.01],
    "nebula.size": [0.1, 1, 0.05],

    "appearance.glow": [0, 40, 1],
    "animation.speed": [0, 3, 0.05]
  };

  const labels = {
    threeD: "3D simulation",
    rotationSpeedX: "X rotation speed",
    rotationSpeedY: "Y rotation speed",
    rotationSpeedZ: "Z rotation speed"
  };

  const help = {
    stars:
      "Initial count changes restart the field. Mass is preserved " +
      "through merging and fragmentation.",

    gravity:
      "Stronger gravity and larger merge distance accelerate gathering. " +
      "Softening limits close-range forces.",

    explosions:
      "Higher critical mass and longer delays produce fewer explosions.",

    space:
      "Space changes restart the field. Sphere boundary confines the stars; " +
      "disabling it uses a wrapping box.",

    camera:
      "Rotation speeds are degrees per simulation second. " +
      "0 stops an axis; negative values reverse it. " +
      "These rotations control the external view. " +
      "In flight mode, the viewpoint follows the star instead.",

    flight:
      "Enable to ride a star while looking along its motion. " +
      "Follow distance 0 places the camera at the star. " +
      "Smoothing 0 follows position or direction immediately. " +
      "The followed star is hidden so it cannot obscure the view.",

    nebula:
      "Static decorative clouds, independent of star motion and camera rotation."
  };

  const style = document.createElement("style");

  style.textContent = `
    .stellar-editor {
      position:fixed; inset:0; z-index:10000; pointer-events:none;
      color:#e6eaf5; font:13px/1.5 system-ui,sans-serif;
      color-scheme:dark;
    }
    .stellar-editor * { box-sizing:border-box; }
    .stellar-editor button,
    .stellar-editor input,
    .stellar-editor textarea { font:inherit; }
    .stellar-editor button {
      min-height:44px; padding:8px 11px;
      border:1px solid #ffffff26; border-radius:7px;
      background:#293047; color:inherit; cursor:pointer;
    }
    .stellar-editor button:hover { background:#3b4560; }
    .stellar-editor :focus-visible {
      outline:2px solid #b6c9ee; outline-offset:3px;
    }
    .stellar-toggle {
      position:absolute; top:16px; right:16px; pointer-events:auto;
    }
    .stellar-panel {
      position:absolute; top:0; right:0;
      width:min(370px,100vw); height:100%; padding:22px;
      overflow:auto; overscroll-behavior:contain;
      border-left:1px solid #ffffff20;
      background:rgba(10,14,28,.95); backdrop-filter:blur(16px);
      pointer-events:auto; transform:translateX(100%);
      transition:transform 220ms ease;
    }
    .stellar-panel.open { transform:translateX(0); }
    .stellar-heading {
      display:flex; align-items:center;
      justify-content:space-between; gap:12px;
    }
    .stellar-heading h2 { margin:0; font-size:18px; }
    .stellar-help,.stellar-status {
      color:#acb8ce; font-size:12px;
    }
    .stellar-panel fieldset {
      min-width:0; margin:18px 0 0; padding:12px 0 0;
      border:0; border-top:1px solid #ffffff18;
    }
    .stellar-panel legend {
      color:#bdceeb; font-weight:600; padding-right:8px;
    }
    .stellar-control { margin-bottom:13px; }
    .stellar-row {
      display:flex; align-items:center;
      justify-content:space-between; gap:10px; margin-bottom:5px;
    }
    .stellar-panel input[type=range] {
      width:100%; accent-color:#a9bfe3;
    }
    .stellar-panel input[type=number] {
      width:78px; padding:5px; color:inherit;
      background:#ffffff08; border:1px solid #ffffff24;
      border-radius:5px;
    }
    .stellar-panel input[type=checkbox] { accent-color:#a9bfe3; }
    .stellar-colors { display:flex; gap:7px; align-items:center; }
    .stellar-panel input[type=color] {
      width:42px; height:32px; padding:2px;
      background:transparent; border:1px solid #ffffff24;
      border-radius:5px;
    }
    .stellar-colors input[type=number] {
      width:65px; min-width:0;
    }
    .stellar-actions {
      display:flex; flex-wrap:wrap; gap:8px; margin-top:18px;
    }
    .stellar-code {
      width:100%; min-height:260px; margin-top:14px; padding:12px;
      background:#050a15; color:#cddbf0;
      border:1px solid #ffffff24; border-radius:7px;
      resize:vertical;
      font:11px/1.6 ui-monospace,monospace !important;
    }
    .stellar-status { min-height:20px; }
    @media(prefers-reduced-motion:reduce) {
      .stellar-panel { transition:none; }
    }
  `;

  document.head.append(style);

  const root = document.createElement("div");
  root.className = "stellar-editor";
  root.dataset.backgroundEditor = "";

  root.innerHTML = `
    <button class="stellar-toggle" type="button"
      aria-expanded="false" aria-controls="stellar-panel">
      Settings
    </button>

    <aside id="stellar-panel" class="stellar-panel"
      aria-label="Stellar Bloom settings" inert>
      <div class="stellar-heading">
        <h2>Stellar Bloom</h2>
        <button class="stellar-close" type="button">Retract</button>
      </div>

      <p class="stellar-help">
        Move to attract stars. Hold for stronger gravity;
        click or tap for a shockwave.
        Enable Flight to ride a star.
        Copy your settings before disabling the editor.
      </p>

      <div class="stellar-controls"></div>

      <div class="stellar-actions">
        <button class="stellar-show" type="button">Show code</button>
        <button class="stellar-copy" type="button">Copy config</button>
        <button class="stellar-next" type="button">Next star</button>
        <button class="stellar-rotation" type="button">Reset rotation</button>
        <button class="stellar-reset" type="button">New star field</button>
        <button class="stellar-nebula" type="button">New nebulas</button>
      </div>

      <textarea class="stellar-code" aria-label="Configuration code"
        spellcheck="false" readonly hidden></textarea>

      <p class="stellar-status" role="status" aria-live="polite"></p>
    </aside>
  `;

  document.body.append(root);

  const toggle = root.querySelector(".stellar-toggle");
  const panel = root.querySelector(".stellar-panel");
  const close = root.querySelector(".stellar-close");
  const controls = root.querySelector(".stellar-controls");
  const code = root.querySelector(".stellar-code");
  const show = root.querySelector(".stellar-show");
  const status = root.querySelector(".stellar-status");

  const title = key => labels[key] ||
    key.replace(/([A-Z])/g, " $1")
      .replace(/^./, character => character.toUpperCase());

  const exportCode = () =>
    `const config = ${JSON.stringify(config, null, 2)};`;

  const toHex = color => "#" + color.map(value =>
    Math.round(value).toString(16).padStart(2, "0")
  ).join("");

  function element(tag, className) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }

  function open(value) {
    toggle.hidden = false;

    if (!value && panel.contains(document.activeElement)) {
      toggle.focus();
    }

    panel.classList.toggle("open", value);
    panel.inert = !value;
    toggle.hidden = value;
    toggle.setAttribute("aria-expanded", String(value));

    if (value) close.focus();
  }

  function changed() {
    code.value = exportCode();
    onChange();

    if (!config.panel.enabled) {
      open(false);
      root.hidden = true;
    }
  }

  for (const [groupName, group] of Object.entries(config)) {
    const fieldset = element("fieldset");
    const legend = element("legend");
    legend.textContent = title(groupName);
    fieldset.append(legend);

    if (help[groupName]) {
      const paragraph = element("p", "stellar-help");
      paragraph.textContent = help[groupName];
      fieldset.append(paragraph);
    }

    for (const [key, value] of Object.entries(group)) {
      const path = `${groupName}.${key}`;
      const box = element("div", "stellar-control");
      const row = element("div", "stellar-row");
      const label = element("label");
      const id = `stellar-${groupName}-${key}`;

      label.textContent = title(key);
      label.htmlFor = id;

      row.append(label);
      box.append(row);

      if (typeof value === "boolean") {
        const input = element("input");
        input.id = id;
        input.type = "checkbox";
        input.checked = value;

        input.addEventListener("change", () => {
          group[key] = input.checked;
          changed();
        });

        row.append(input);

      } else if (Array.isArray(value)) {
        const colors = element("div", "stellar-colors");
        const picker = element("input");

        picker.id = id;
        picker.type = "color";
        picker.value = toHex(value);
        colors.append(picker);

        const channels = value.map((channel, index) => {
          const input = element("input");
          input.type = "number";
          input.min = 0;
          input.max = 255;
          input.step = 1;
          input.value = channel;

          input.setAttribute(
            "aria-label",
            `${title(key)} ${["red", "green", "blue"][index]}`
          );

          input.addEventListener("input", () => {
            if (input.value === "") return;

            const number = Number(input.value);
            if (!Number.isFinite(number)) return;

            group[key][index] = Math.max(
              0, Math.min(255, Math.round(number))
            );

            picker.value = toHex(group[key]);
            changed();
          });

          input.addEventListener("change", () => {
            input.value = group[key][index];
          });

          colors.append(input);
          return input;
        });

        picker.addEventListener("input", () => {
          group[key] = [1, 3, 5].map(offset =>
            parseInt(picker.value.slice(offset, offset + 2), 16)
          );

          channels.forEach((input, index) => {
            input.value = group[key][index];
          });

          changed();
        });

        box.append(colors);

      } else if (typeof value === "number") {
        const [min, max, step] = limits[path] || [0, 100, 1];
        const number = element("input");
        const range = element("input");

        number.id = id;
        number.type = "number";
        range.type = "range";
        range.setAttribute("aria-label", title(key));

        for (const input of [number, range]) {
          input.min = min;
          input.max = max;
          input.step = step;
          input.value = value;

          input.addEventListener("input", () => {
            if (input.value === "") return;

            const parsed = Number(input.value);
            if (!Number.isFinite(parsed)) return;

            const bounded = Math.max(min, Math.min(max, parsed));
            const stepped =
              min + Math.round((bounded - min) / step) * step;

            group[key] = Number(
              Math.max(min, Math.min(max, stepped)).toFixed(6)
            );

            if (input === number) range.value = group[key];
            else number.value = group[key];

            changed();
          });

          input.addEventListener("change", () => {
            input.value = group[key];
          });
        }

        row.append(number);
        box.append(range);
      }

      fieldset.append(box);
    }

    controls.append(fieldset);
  }

  toggle.addEventListener("click", () => open(true));
  close.addEventListener("click", () => open(false));

  show.addEventListener("click", () => {
    code.hidden = !code.hidden;
    code.value = exportCode();
    show.textContent = code.hidden ? "Show code" : "Hide code";
  });

  root.querySelector(".stellar-copy").addEventListener("click", async () => {
    code.value = exportCode();

    try {
      await navigator.clipboard.writeText(code.value);
      status.textContent = "Configuration copied.";
    } catch {
      code.hidden = false;
      show.textContent = "Hide code";
      code.focus();
      code.select();
      status.textContent = "Press Ctrl+C or ⌘C to copy.";
    }
  });

  root.querySelector(".stellar-next").addEventListener("click", () => {
    onNextStar();
    status.textContent = "Selected the next star for flight mode.";
  });

  root.querySelector(".stellar-rotation").addEventListener("click", () => {
    onResetRotation();
    status.textContent = "Animated rotation returned to its starting angles.";
  });

  root.querySelector(".stellar-reset").addEventListener("click", () => {
    onReset();
    status.textContent = "A new star field has been created.";
  });

  root.querySelector(".stellar-nebula").addEventListener("click", () => {
    onNebula();
    status.textContent = "New static nebulas have been created.";
  });

  function keydown(event) {
    if (event.key === "Escape" && panel.classList.contains("open")) {
      open(false);
    }
  }

  document.addEventListener("keydown", keydown);
  code.value = exportCode();

  return {
    destroy() {
      document.removeEventListener("keydown", keydown);
      root.remove();
      style.remove();
    }
  };
}