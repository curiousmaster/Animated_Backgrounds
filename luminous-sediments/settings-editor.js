export function createSettingsEditor({
  config,
  onChange = () => {},
  onReset = () => {}
}) {
  const limits = {
    "grains.count": [100, 6000, 100],
    "grains.size": [0.3, 4, 0.1],
    "grains.sizeVariation": [0, 0.9, 0.01],
    "grains.opacity": [0, 1, 0.01],
    "grains.glow": [0, 15, 0.5],

    "dunes.layers": [1, 10, 1],
    "dunes.height": [0, 150, 1],
    "dunes.wavelength": [100, 1000, 1],
    "dunes.thickness": [1, 100, 1],
    "dunes.movement": [0, 1, 0.01],
    "dunes.contourOpacity": [0, 0.5, 0.01],

    "physics.settlingSpeed": [5, 200, 1],
    "physics.gravity": [5, 150, 1],
    "physics.drag": [0.1, 6, 0.1],
    "physics.erosion": [0, 0.5, 0.005],
    "physics.erosionLift": [0, 200, 1],
    "physics.current": [0, 100, 1],

    "mouse.radius": [30, 400, 1],
    "mouse.liftStrength": [0, 500, 1],
    "mouse.scatterStrength": [0, 300, 1],
    "mouse.smoothing": [0.5, 20, 0.1],

    "animation.speed": [0, 3, 0.05]
  };

  const style = document.createElement("style");

  style.textContent = `
    .sediment-editor {
      position: fixed;
      inset: 0;
      z-index: 10000;
      pointer-events: none;
      color: #e5edf0;
      font: 13px/1.5 system-ui, sans-serif;
      color-scheme: dark;
    }

    .sediment-editor * {
      box-sizing: border-box;
    }

    .sediment-editor button,
    .sediment-editor input,
    .sediment-editor textarea {
      font: inherit;
    }

    .sediment-editor button {
      padding: 8px 11px;
      border: 1px solid #ffffff26;
      border-radius: 7px;
      background: #21313b;
      color: inherit;
      cursor: pointer;
    }

    .sediment-editor button:hover {
      background: #334954;
    }

    .sediment-editor :focus-visible {
      outline: 2px solid #9bd7db;
      outline-offset: 3px;
    }

    .sediment-toggle {
      position: absolute;
      top: 16px;
      right: 16px;
      pointer-events: auto;
    }

    .sediment-panel {
      position: absolute;
      top: 0;
      right: 0;
      width: min(350px, 100vw);
      height: 100%;
      padding: 22px;
      overflow: auto;
      border-left: 1px solid #ffffff20;
      background: rgba(9, 18, 27, 0.94);
      backdrop-filter: blur(16px);
      pointer-events: auto;
      transform: translateX(100%);
      transition: transform 220ms ease;
    }

    .sediment-panel.open {
      transform: translateX(0);
    }

    .sediment-heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 8px;
    }

    .sediment-heading h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }

    .sediment-description,
    .sediment-status {
      color: #a5b7c0;
      font-size: 12px;
    }

    .sediment-description {
      margin: 0 0 20px;
    }

    .sediment-panel fieldset {
      min-width: 0;
      margin: 0 0 12px;
      padding: 15px 0 8px;
      border: 0;
      border-top: 1px solid #ffffff18;
    }

    .sediment-panel legend {
      padding-right: 7px;
      color: #add5d8;
      font-weight: 600;
    }

    .sediment-control {
      margin-bottom: 13px;
    }

    .sediment-control-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 6px;
    }

    .sediment-panel input[type="range"] {
      width: 100%;
      accent-color: #97cbd1;
    }

    .sediment-panel input[type="number"] {
      width: 76px;
      padding: 4px 6px;
      border: 1px solid #ffffff24;
      border-radius: 5px;
      background: #ffffff08;
      color: inherit;
    }

    .sediment-panel input[type="checkbox"] {
      accent-color: #97cbd1;
    }

    .sediment-colors {
      display: flex;
      align-items: center;
      gap: 7px;
    }

    .sediment-panel input[type="color"] {
      width: 42px;
      height: 30px;
      padding: 2px;
      border: 1px solid #ffffff24;
      border-radius: 5px;
      background: transparent;
    }

    .sediment-colors input[type="number"] {
      width: 65px;
      min-width: 0;
    }

    .sediment-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
    }

    .sediment-code {
      width: 100%;
      min-height: 260px;
      margin-top: 14px;
      padding: 12px;
      resize: vertical;
      border: 1px solid #ffffff24;
      border-radius: 7px;
      background: #050d15;
      color: #c6dee5;
      font: 11px/1.6 ui-monospace, monospace !important;
    }

    .sediment-status {
      min-height: 20px;
      margin-top: 10px;
    }

    @media (prefers-reduced-motion: reduce) {
      .sediment-panel {
        transition: none;
      }
    }
  `;

  document.head.append(style);

  const root = document.createElement("div");
  root.className = "sediment-editor";
  root.dataset.backgroundEditor = "";

  root.innerHTML = `
    <button
      class="sediment-toggle"
      type="button"
      aria-expanded="false"
      aria-controls="sediment-settings-panel"
    >Settings</button>

    <aside
      id="sediment-settings-panel"
      class="sediment-panel"
      aria-label="Luminous Sediment settings"
      inert
    >
      <div class="sediment-heading">
        <h2>Luminous Sediment</h2>
        <button class="sediment-close" type="button">Retract</button>
      </div>

      <p class="sediment-description">
        Move your pointer to lift the grains.
        Copy your configuration before disabling the editor.
      </p>

      <div class="sediment-controls"></div>

      <div class="sediment-actions">
        <button class="sediment-show" type="button">Show code</button>
        <button class="sediment-copy" type="button">Copy config</button>
        <button class="sediment-reset" type="button">Resettle grains</button>
      </div>

      <textarea
        class="sediment-code"
        aria-label="Configuration code"
        spellcheck="false"
        readonly
        hidden
      ></textarea>

      <div
        class="sediment-status"
        role="status"
        aria-live="polite"
      ></div>
    </aside>
  `;

  document.body.append(root);

  const toggle = root.querySelector(".sediment-toggle");
  const panel = root.querySelector(".sediment-panel");
  const close = root.querySelector(".sediment-close");
  const controls = root.querySelector(".sediment-controls");
  const code = root.querySelector(".sediment-code");
  const show = root.querySelector(".sediment-show");
  const status = root.querySelector(".sediment-status");

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

    if (!open && panel.contains(document.activeElement)) {
      toggle.focus();
    }

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
      const container = element("div", "sediment-control");
      const heading = element("div", "sediment-control-title");
      const label = element("label");
      const id = `sediment-${groupName}-${key}`;

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
        const row = element("div", "sediment-colors");
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
              0,
              Math.min(255, Math.round(parsed))
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

  root.querySelector(".sediment-copy").addEventListener("click", async () => {
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

  root.querySelector(".sediment-reset").addEventListener("click", () => {
    onReset();
    status.textContent = "The grains have been resettled.";
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