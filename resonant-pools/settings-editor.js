export function createSettingsEditor({
  config,
  onChange = () => {},
  onReset = () => {}
}) {
  const limits = {
    "pools.count": [1, 10, 1],
    "pools.strength": [0, 2, 0.05],
    "pools.drift": [0, 150, 1],
    "pools.driftSpeed": [0, 1, 0.01],

    "waves.wavelength": [30, 250, 1],
    "waves.speed": [0, 150, 1],
    "waves.damping": [0, 4, 0.05],
    "waves.contrast": [0.5, 4, 0.05],
    "waves.brightness": [0, 1, 0.01],
    "waves.resolution": [2, 10, 1],

    "mouse.strength": [0, 3, 0.05],
    "mouse.smoothing": [0.5, 20, 0.1],

    "appearance.sourceSize": [0.5, 8, 0.5],
    "animation.speed": [0, 3, 0.05]
  };

  const style = document.createElement("style");

  style.textContent = `
    .pool-editor {
      position: fixed;
      inset: 0;
      z-index: 10000;
      pointer-events: none;
      color: #e5edf5;
      font: 13px/1.5 system-ui, sans-serif;
      color-scheme: dark;
    }

    .pool-editor * { box-sizing: border-box; }

    .pool-editor button,
    .pool-editor input,
    .pool-editor textarea { font: inherit; }

    .pool-editor button {
      padding: 8px 11px;
      border: 1px solid #ffffff26;
      border-radius: 7px;
      background: #25364a;
      color: inherit;
      cursor: pointer;
    }

    .pool-editor button:hover { background: #374e66; }

    .pool-editor :focus-visible {
      outline: 2px solid #a8d5e8;
      outline-offset: 3px;
    }

    .pool-toggle {
      position: absolute;
      top: 16px;
      right: 16px;
      pointer-events: auto;
    }

    .pool-panel {
      position: absolute;
      top: 0;
      right: 0;
      width: min(350px, 100vw);
      height: 100%;
      padding: 22px;
      overflow: auto;
      border-left: 1px solid #ffffff20;
      background: rgba(9, 18, 31, 0.94);
      backdrop-filter: blur(16px);
      pointer-events: auto;
      transform: translateX(100%);
      transition: transform 220ms ease;
    }

    .pool-panel.open { transform: translateX(0); }

    .pool-heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 8px;
    }

    .pool-heading h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }

    .pool-description,
    .pool-status {
      color: #a6b9cc;
      font-size: 12px;
    }

    .pool-description { margin: 0 0 20px; }

    .pool-panel fieldset {
      min-width: 0;
      margin: 0 0 12px;
      padding: 15px 0 8px;
      border: 0;
      border-top: 1px solid #ffffff18;
    }

    .pool-panel legend {
      padding-right: 7px;
      color: #b3d7e9;
      font-weight: 600;
    }

    .pool-control { margin-bottom: 13px; }

    .pool-control-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 6px;
    }

    .pool-panel input[type="range"] {
      width: 100%;
      accent-color: #a1cadd;
    }

    .pool-panel input[type="number"] {
      width: 76px;
      padding: 4px 6px;
      border: 1px solid #ffffff24;
      border-radius: 5px;
      background: #ffffff08;
      color: inherit;
    }

    .pool-panel input[type="checkbox"] { accent-color: #a1cadd; }

    .pool-colors {
      display: flex;
      align-items: center;
      gap: 7px;
    }

    .pool-panel input[type="color"] {
      width: 42px;
      height: 30px;
      padding: 2px;
      border: 1px solid #ffffff24;
      border-radius: 5px;
      background: transparent;
    }

    .pool-colors input[type="number"] {
      width: 65px;
      min-width: 0;
    }

    .pool-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
    }

    .pool-code {
      width: 100%;
      min-height: 260px;
      margin-top: 14px;
      padding: 12px;
      resize: vertical;
      border: 1px solid #ffffff24;
      border-radius: 7px;
      background: #050d18;
      color: #c8dfee;
      font: 11px/1.6 ui-monospace, monospace !important;
    }

    .pool-status {
      min-height: 20px;
      margin-top: 10px;
    }

    @media (prefers-reduced-motion: reduce) {
      .pool-panel { transition: none; }
    }
  `;

  document.head.append(style);

  const root = document.createElement("div");
  root.className = "pool-editor";
  root.dataset.backgroundEditor = "";

  root.innerHTML = `
    <button
      class="pool-toggle"
      type="button"
      aria-expanded="false"
      aria-controls="pool-settings-panel"
    >Settings</button>

    <aside
      id="pool-settings-panel"
      class="pool-panel"
      aria-label="Resonant Pools settings"
      inert
    >
      <div class="pool-heading">
        <h2>Resonant Pools</h2>
        <button class="pool-close" type="button">Retract</button>
      </div>

      <p class="pool-description">
        Move your pointer to add a ripple source.
        Higher resolution values improve performance.
        Copy your configuration before disabling the editor.
      </p>

      <div class="pool-controls"></div>

      <div class="pool-actions">
        <button class="pool-show" type="button">Show code</button>
        <button class="pool-copy" type="button">Copy config</button>
        <button class="pool-reset" type="button">New pools</button>
      </div>

      <textarea
        class="pool-code"
        aria-label="Configuration code"
        spellcheck="false"
        readonly
        hidden
      ></textarea>

      <div class="pool-status" role="status" aria-live="polite"></div>
    </aside>
  `;

  document.body.append(root);

  const toggle = root.querySelector(".pool-toggle");
  const panel = root.querySelector(".pool-panel");
  const close = root.querySelector(".pool-close");
  const controls = root.querySelector(".pool-controls");
  const code = root.querySelector(".pool-code");
  const show = root.querySelector(".pool-show");
  const status = root.querySelector(".pool-status");

  function title(value) {
    return value
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, letter => letter.toUpperCase());
  }

  function exportCode() {
    return `const config = ${JSON.stringify(config, null, 2)};`;
  }

  function changed() {
    code.value = exportCode();
    onChange();

    if (!config.panel.enabled) {
      setOpen(false);
      root.hidden = true;
    }
  }

  function setOpen(open) {
    toggle.hidden = false;

    if (!open && panel.contains(document.activeElement)) toggle.focus();

    panel.classList.toggle("open", open);
    panel.inert = !open;
    toggle.hidden = open;
    toggle.setAttribute("aria-expanded", String(open));

    if (open) close.focus();
  }

  function element(tag, className) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }

  function toHex(color) {
    return "#" + color.map(value =>
      Math.round(value).toString(16).padStart(2, "0")
    ).join("");
  }

  for (const [groupName, group] of Object.entries(config)) {
    const fieldset = element("fieldset");
    const legend = element("legend");
    legend.textContent = title(groupName);
    fieldset.append(legend);

    for (const [key, value] of Object.entries(group)) {
      const path = `${groupName}.${key}`;
      const container = element("div", "pool-control");
      const heading = element("div", "pool-control-title");
      const label = element("label");
      const id = `pool-${groupName}-${key}`;

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
        const row = element("div", "pool-colors");
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
          const stepped = min + Math.round((clamped - min) / step) * step;

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

  root.querySelector(".pool-copy").addEventListener("click", async () => {
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

  root.querySelector(".pool-reset").addEventListener("click", () => {
    onReset();
    status.textContent = "A new pool arrangement has been generated.";
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