export function createSettingsEditor({
  config,
  onChange = () => {},
  onReset = () => {}
}) {
  const limits = {
    "lanterns.count": [1, 100, 1],
    "lanterns.size": [10, 100, 1],
    "lanterns.sizeVariation": [0, 0.9, 0.01],
    "lanterns.driftSpeed": [0, 50, 0.5],
    "lanterns.morphSpeed": [0, 2, 0.01],
    "lanterns.sides": [3, 10, 1],
    "lanterns.polygonStrength": [0, 1, 0.01],
    "lanterns.interruption": [0, 0.8, 0.01],

    "synchronization.radius": [40, 500, 1],
    "synchronization.strength": [0, 3, 0.05],
    "synchronization.phaseDrift": [0, 0.9, 0.01],

    "mouse.radius": [40, 500, 1],
    "mouse.strength": [0, 6, 0.1],
    "mouse.smoothing": [0.5, 20, 0.1],

    "appearance.opacity": [0, 1, 0.01],
    "appearance.lineWidth": [0.2, 3, 0.1],
    "appearance.glow": [0, 30, 0.5],

    "animation.speed": [0, 3, 0.05]
  };

  const style = document.createElement("style");

  style.textContent = `
    .phase-editor {
      position: fixed; inset: 0; z-index: 10000;
      pointer-events: none; color: #eae7f3;
      font: 13px/1.5 system-ui, sans-serif; color-scheme: dark;
    }
    .phase-editor * { box-sizing: border-box; }
    .phase-editor button, .phase-editor input, .phase-editor textarea {
      font: inherit;
    }
    .phase-editor button {
      padding: 8px 11px; border: 1px solid #ffffff26;
      border-radius: 7px; background: #302c43;
      color: inherit; cursor: pointer;
    }
    .phase-editor button:hover { background: #463f5c; }
    .phase-editor :focus-visible {
      outline: 2px solid #ccbce9; outline-offset: 3px;
    }
    .phase-toggle {
      position: absolute; top: 16px; right: 16px; pointer-events: auto;
    }
    .phase-panel {
      position: absolute; top: 0; right: 0;
      width: min(350px, 100vw); height: 100%; padding: 22px;
      overflow: auto; border-left: 1px solid #ffffff20;
      background: rgba(16, 14, 29, 0.94); backdrop-filter: blur(16px);
      pointer-events: auto; transform: translateX(100%);
      transition: transform 220ms ease;
    }
    .phase-panel.open { transform: translateX(0); }
    .phase-heading {
      display: flex; align-items: center; justify-content: space-between;
      gap: 12px; margin-bottom: 8px;
    }
    .phase-heading h2 { margin: 0; font-size: 18px; font-weight: 600; }
    .phase-description, .phase-status {
      color: #b5acc7; font-size: 12px;
    }
    .phase-description { margin: 0 0 20px; }
    .phase-panel fieldset {
      min-width: 0; margin: 0 0 12px; padding: 15px 0 8px;
      border: 0; border-top: 1px solid #ffffff18;
    }
    .phase-panel legend {
      padding-right: 7px; color: #cdbfe8; font-weight: 600;
    }
    .phase-control { margin-bottom: 13px; }
    .phase-control-title {
      display: flex; align-items: center; justify-content: space-between;
      gap: 12px; margin-bottom: 6px;
    }
    .phase-panel input[type="range"] {
      width: 100%; accent-color: #bda9db;
    }
    .phase-panel input[type="number"] {
      width: 76px; padding: 4px 6px; border: 1px solid #ffffff24;
      border-radius: 5px; background: #ffffff08; color: inherit;
    }
    .phase-panel input[type="checkbox"] { accent-color: #bda9db; }
    .phase-colors { display: flex; align-items: center; gap: 7px; }
    .phase-panel input[type="color"] {
      width: 42px; height: 30px; padding: 2px;
      border: 1px solid #ffffff24; border-radius: 5px;
      background: transparent;
    }
    .phase-colors input[type="number"] { width: 65px; min-width: 0; }
    .phase-actions {
      display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px;
    }
    .phase-code {
      width: 100%; min-height: 260px; margin-top: 14px; padding: 12px;
      resize: vertical; border: 1px solid #ffffff24; border-radius: 7px;
      background: #0a0814; color: #d9cdeb;
      font: 11px/1.6 ui-monospace, monospace !important;
    }
    .phase-status { min-height: 20px; margin-top: 10px; }
    @media (prefers-reduced-motion: reduce) {
      .phase-panel { transition: none; }
    }
  `;

  document.head.append(style);

  const root = document.createElement("div");
  root.className = "phase-editor";
  root.dataset.backgroundEditor = "";

  root.innerHTML = `
    <button class="phase-toggle" type="button"
      aria-expanded="false" aria-controls="phase-settings-panel">
      Settings
    </button>

    <aside id="phase-settings-panel" class="phase-panel"
      aria-label="Phase Lanterns settings" inert>
      <div class="phase-heading">
        <h2>Phase Lanterns</h2>
        <button class="phase-close" type="button">Retract</button>
      </div>

      <p class="phase-description">
        Move your pointer to synchronize nearby lanterns.
        Higher phase drift makes synchronization harder.
        Copy your configuration before disabling the editor.
      </p>

      <div class="phase-controls"></div>

      <div class="phase-actions">
        <button class="phase-show" type="button">Show code</button>
        <button class="phase-copy" type="button">Copy config</button>
        <button class="phase-reset" type="button">New lanterns</button>
      </div>

      <textarea class="phase-code" aria-label="Configuration code"
        spellcheck="false" readonly hidden></textarea>

      <div class="phase-status" role="status" aria-live="polite"></div>
    </aside>
  `;

  document.body.append(root);

  const toggle = root.querySelector(".phase-toggle");
  const panel = root.querySelector(".phase-panel");
  const close = root.querySelector(".phase-close");
  const controls = root.querySelector(".phase-controls");
  const code = root.querySelector(".phase-code");
  const show = root.querySelector(".phase-show");
  const status = root.querySelector(".phase-status");

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
      const container = element("div", "phase-control");
      const heading = element("div", "phase-control-title");
      const label = element("label");
      const id = `phase-${groupName}-${key}`;

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
        const row = element("div", "phase-colors");
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

  root.querySelector(".phase-copy").addEventListener("click", async () => {
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

  root.querySelector(".phase-reset").addEventListener("click", () => {
    onReset();
    status.textContent = "A new lantern arrangement has been generated.";
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