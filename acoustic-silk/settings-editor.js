export function createSettingsEditor({
  config,
  onChange = () => {},
  onReset = () => {}
}) {
  const limits = {
    "silk.sheets": [1, 5, 1],
    "silk.width": [0.4, 1.5, 0.01],
    "silk.height": [0.15, 0.9, 0.01],
    "silk.separation": [0, 150, 1],
    "silk.rotation": [-60, 60, 1],
    "silk.folds": [1, 12, 1],
    "silk.foldDepth": [0, 70, 1],

    "waves.tension": [30, 350, 1],
    "waves.damping": [0.2, 3, 0.05],
    "waves.wavelength": [40, 300, 1],
    "waves.amplitude": [0, 80, 1],
    "waves.ambientStrength": [0, 1, 0.01],
    "waves.ambientSpeed": [0, 2, 0.01],

    "mouse.pluckStrength": [0, 2, 0.05],
    "mouse.pulseStrength": [0, 4, 0.05],
    "mouse.pluckInterval": [0.08, 1, 0.01],
    "mouse.smoothing": [0.5, 20, 0.1],

    "appearance.translucency": [0, 0.5, 0.01],
    "appearance.lineOpacity": [0, 1, 0.01],
    "appearance.lineWidth": [0.2, 3, 0.1],
    "appearance.threadSpacing": [8, 40, 1],
    "appearance.detail": [8, 40, 1],
    "appearance.glow": [0, 15, 0.5],

    "animation.speed": [0, 3, 0.05]
  };

  const style = document.createElement("style");

  style.textContent = `
    .silk-editor {
      position:fixed; inset:0; z-index:10000;
      pointer-events:none; color:#e8e9f4;
      font:13px/1.5 system-ui,sans-serif; color-scheme:dark;
    }
    .silk-editor * { box-sizing:border-box; }
    .silk-editor button,
    .silk-editor input,
    .silk-editor textarea { font:inherit; }
    .silk-editor button {
      min-height:44px; padding:8px 11px;
      border:1px solid #ffffff26; border-radius:7px;
      background:#2c3048; color:inherit; cursor:pointer;
    }
    .silk-editor button:hover { background:#40455f; }
    .silk-editor :focus-visible {
      outline:2px solid #b9c7e7; outline-offset:3px;
    }
    .silk-toggle {
      position:absolute; top:16px; right:16px; pointer-events:auto;
    }
    .silk-panel {
      position:absolute; top:0; right:0;
      width:min(350px,100vw); height:100%; padding:22px;
      overflow:auto; overscroll-behavior:contain;
      border-left:1px solid #ffffff20;
      background:rgba(14,16,30,.94); backdrop-filter:blur(16px);
      pointer-events:auto; transform:translateX(100%);
      transition:transform 220ms ease;
    }
    .silk-panel.open { transform:translateX(0); }
    .silk-heading {
      display:flex; align-items:center; justify-content:space-between;
      gap:12px; margin-bottom:8px;
    }
    .silk-heading h2 { margin:0; font-size:18px; }
    .silk-description,
    .silk-status { color:#afb6cb; font-size:12px; }
    .silk-description { margin:0 0 20px; }
    .silk-panel fieldset {
      min-width:0; margin:0 0 12px; padding:15px 0 8px;
      border:0; border-top:1px solid #ffffff18;
    }
    .silk-panel legend {
      padding-right:7px; color:#c0cee8; font-weight:600;
    }
    .silk-control { margin-bottom:13px; }
    .silk-control-title {
      display:flex; align-items:center; justify-content:space-between;
      gap:12px; margin-bottom:6px;
    }
    .silk-panel input[type="range"] {
      width:100%; accent-color:#afbfdf;
    }
    .silk-panel input[type="number"] {
      width:76px; padding:5px 6px; border:1px solid #ffffff24;
      border-radius:5px; background:#ffffff08; color:inherit;
    }
    .silk-panel input[type="checkbox"] { accent-color:#afbfdf; }
    .silk-colors { display:flex; align-items:center; gap:7px; }
    .silk-panel input[type="color"] {
      width:42px; height:32px; padding:2px;
      border:1px solid #ffffff24; border-radius:5px;
      background:transparent;
    }
    .silk-colors input[type="number"] { width:65px; min-width:0; }
    .silk-actions {
      display:flex; flex-wrap:wrap; gap:8px; margin-top:10px;
    }
    .silk-code {
      width:100%; min-height:260px; margin-top:14px; padding:12px;
      resize:vertical; border:1px solid #ffffff24; border-radius:7px;
      background:#080b17; color:#d0daed;
      font:11px/1.6 ui-monospace,monospace !important;
    }
    .silk-status { min-height:20px; margin-top:10px; }
    @media(prefers-reduced-motion:reduce) {
      .silk-panel { transition:none; }
    }
  `;

  document.head.append(style);

  const root = document.createElement("div");
  root.className = "silk-editor";
  root.dataset.backgroundEditor = "";

  root.innerHTML = `
    <button class="silk-toggle" type="button"
      aria-expanded="false" aria-controls="silk-settings-panel">
      Settings
    </button>

    <aside id="silk-settings-panel" class="silk-panel"
      aria-label="Acoustic Silk settings" inert>
      <div class="silk-heading">
        <h2>Acoustic Silk</h2>
        <button class="silk-close" type="button">Retract</button>
      </div>

      <p class="silk-description">
        Move to pluck the silk. Click or tap for a larger wave.
        Copy your configuration before disabling the editor.
      </p>

      <div class="silk-controls"></div>

      <div class="silk-actions">
        <button class="silk-show" type="button">Show code</button>
        <button class="silk-copy" type="button">Copy config</button>
        <button class="silk-reset" type="button">Calm the silk</button>
      </div>

      <textarea class="silk-code" aria-label="Configuration code"
        spellcheck="false" readonly hidden></textarea>

      <div class="silk-status" role="status" aria-live="polite"></div>
    </aside>
  `;

  document.body.append(root);

  const toggle = root.querySelector(".silk-toggle");
  const panel = root.querySelector(".silk-panel");
  const close = root.querySelector(".silk-close");
  const controls = root.querySelector(".silk-controls");
  const code = root.querySelector(".silk-code");
  const show = root.querySelector(".silk-show");
  const status = root.querySelector(".silk-status");

  const title = value => value
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, letter => letter.toUpperCase());

  const exportCode = () =>
    `const config = ${JSON.stringify(config, null, 2)};`;

  function setOpen(open) {
    toggle.hidden = false;

    if (!open && panel.contains(document.activeElement)) {
      toggle.focus();
    }

    panel.classList.toggle("open", open);
    panel.inert = !open;
    toggle.hidden = open;
    toggle.setAttribute("aria-expanded", String(open));

    if (open) close.focus();
  }

  function changed() {
    code.value = exportCode();
    onChange();

    if (!config.panel.enabled) {
      setOpen(false);
      root.hidden = true;
    }
  }

  function element(tag, className) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }

  const toHex = color => "#" + color.map(value =>
    Math.round(value).toString(16).padStart(2, "0")
  ).join("");

  for (const [groupName, group] of Object.entries(config)) {
    const fieldset = element("fieldset");
    const legend = element("legend");
    legend.textContent = title(groupName);
    fieldset.append(legend);

    for (const [key, value] of Object.entries(group)) {
      const path = `${groupName}.${key}`;
      const container = element("div", "silk-control");
      const heading = element("div", "silk-control-title");
      const label = element("label");
      const id = `silk-${groupName}-${key}`;

      label.textContent = title(key);
      label.htmlFor = id;
      heading.append(label);
      container.append(heading);

      if (typeof value === "boolean") {
        const input = element("input");
        input.id = id;
        input.type = "checkbox";
        input.checked = value;

        input.addEventListener("change", () => {
          group[key] = input.checked;
          changed();
        });

        heading.append(input);

      } else if (Array.isArray(value)) {
        const row = element("div", "silk-colors");
        const picker = element("input");
        picker.id = id;
        picker.type = "color";
        picker.value = toHex(value);
        row.append(picker);

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
            const parsed = Number(input.value);
            if (!Number.isFinite(parsed)) return;

            group[key][index] = Math.max(
              0, Math.min(255, Math.round(parsed))
            );

            picker.value = toHex(group[key]);
            changed();
          });

          input.addEventListener("change", () => {
            input.value = group[key][index];
          });

          row.append(input);
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

        container.append(row);

      } else if (typeof value === "number") {
        const [min, max, step] = limits[path] || [0, 100, 1];
        const number = element("input");
        const range = element("input");

        number.id = id;
        number.type = "number";
        range.type = "range";
        range.setAttribute("aria-label", title(key));

        function normalize(raw) {
          const clamped = Math.max(min, Math.min(max, raw));
          const stepped =
            min + Math.round((clamped - min) / step) * step;

          return Number(
            Math.max(min, Math.min(max, stepped)).toFixed(6)
          );
        }

        for (const input of [number, range]) {
          input.min = min;
          input.max = max;
          input.step = step;
          input.value = value;

          input.addEventListener("input", () => {
            if (input.value === "") return;
            const parsed = Number(input.value);
            if (!Number.isFinite(parsed)) return;

            group[key] = normalize(parsed);

            if (input === number) range.value = group[key];
            else number.value = group[key];

            changed();
          });

          input.addEventListener("change", () => {
            input.value = group[key];
          });
        }

        heading.append(number);
        container.append(range);
      }

      fieldset.append(container);
    }

    controls.append(fieldset);
  }

  toggle.addEventListener("click", () => setOpen(true));
  close.addEventListener("click", () => setOpen(false));

  show.addEventListener("click", () => {
    code.hidden = !code.hidden;
    code.value = exportCode();
    show.textContent = code.hidden ? "Show code" : "Hide code";
  });

  root.querySelector(".silk-copy").addEventListener("click", async () => {
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

  root.querySelector(".silk-reset").addEventListener("click", () => {
    onReset();
    status.textContent = "Interaction waves have been cleared.";
  });

  function onKeyDown(event) {
    if (event.key === "Escape" && panel.classList.contains("open")) {
      setOpen(false);
    }
  }

  document.addEventListener("keydown", onKeyDown);
  code.value = exportCode();

  return {
    destroy() {
      document.removeEventListener("keydown", onKeyDown);
      root.remove();
      style.remove();
    }
  };
}