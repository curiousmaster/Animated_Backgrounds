export function createSettingsEditor({
  config,
  onChange = () => {},
  onReset = () => {}
}) {
  const limits = {
    "tiles.size": [15, 80, 1],
    "tiles.spacing": [1, 25, 1],
    "tiles.sizeVariation": [0, 0.5, 0.01],
    "tiles.rotation": [0, 60, 1],
    "tiles.opacity": [0, 1, 0.01],
    "tiles.edgeOpacity": [0, 1, 0.01],
    "tiles.edgeWidth": [0.2, 3, 0.1],

    "motion.drift": [0, 80, 1],
    "motion.speed": [0, 2, 0.01],
    "motion.assemblySpeed": [0.2, 12, 0.1],
    "motion.separation": [0, 1, 0.01],
    "motion.cycleDuration": [3, 60, 1],

    "mouse.radius": [40, 400, 1],
    "mouse.displacement": [0, 250, 1],
    "mouse.rotation": [0, 180, 1],
    "mouse.smoothing": [0.5, 20, 0.1],

    "appearance.colorScale": [100, 1000, 10],
    "appearance.colorSpeed": [0, 1, 0.01],
    "appearance.sheen": [0, 1, 0.01],

    "animation.speed": [0, 3, 0.05]
  };

  const style = document.createElement("style");

  style.textContent = `
    .tessera-editor {
      position: fixed;
      inset: 0;
      z-index: 10000;
      pointer-events: none;
      color: #e7ebf3;
      font: 13px/1.5 system-ui, sans-serif;
      color-scheme: dark;
    }

    .tessera-editor * {
      box-sizing: border-box;
    }

    .tessera-editor button,
    .tessera-editor input,
    .tessera-editor textarea {
      font: inherit;
    }

    .tessera-editor button {
      padding: 8px 11px;
      border: 1px solid #ffffff26;
      border-radius: 7px;
      background: #2b3245;
      color: inherit;
      cursor: pointer;
    }

    .tessera-editor button:hover {
      background: #3d485e;
    }

    .tessera-editor :focus-visible {
      outline: 2px solid #b6d0e6;
      outline-offset: 3px;
    }

    .tessera-toggle {
      position: absolute;
      top: 16px;
      right: 16px;
      pointer-events: auto;
    }

    .tessera-panel {
      position: absolute;
      top: 0;
      right: 0;
      width: min(350px, 100vw);
      height: 100%;
      padding: 22px;
      overflow: auto;
      border-left: 1px solid #ffffff20;
      background: rgba(12, 18, 29, 0.94);
      backdrop-filter: blur(16px);
      pointer-events: auto;
      transform: translateX(100%);
      transition: transform 220ms ease;
    }

    .tessera-panel.open {
      transform: translateX(0);
    }

    .tessera-heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 8px;
    }

    .tessera-heading h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }

    .tessera-description,
    .tessera-status {
      color: #aab7ca;
      font-size: 12px;
    }

    .tessera-description {
      margin: 0 0 20px;
    }

    .tessera-panel fieldset {
      min-width: 0;
      margin: 0 0 12px;
      padding: 15px 0 8px;
      border: 0;
      border-top: 1px solid #ffffff18;
    }

    .tessera-panel legend {
      padding-right: 7px;
      color: #bad3e5;
      font-weight: 600;
    }

    .tessera-control {
      margin-bottom: 13px;
    }

    .tessera-control-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 6px;
    }

    .tessera-panel input[type="range"] {
      width: 100%;
      accent-color: #acc6dd;
    }

    .tessera-panel input[type="number"] {
      width: 76px;
      padding: 4px 6px;
      border: 1px solid #ffffff24;
      border-radius: 5px;
      background: #ffffff08;
      color: inherit;
    }

    .tessera-panel input[type="checkbox"] {
      accent-color: #acc6dd;
    }

    .tessera-colors {
      display: flex;
      align-items: center;
      gap: 7px;
    }

    .tessera-panel input[type="color"] {
      width: 42px;
      height: 30px;
      padding: 2px;
      border: 1px solid #ffffff24;
      border-radius: 5px;
      background: transparent;
    }

    .tessera-colors input[type="number"] {
      width: 65px;
      min-width: 0;
    }

    .tessera-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
    }

    .tessera-code {
      width: 100%;
      min-height: 260px;
      margin-top: 14px;
      padding: 12px;
      resize: vertical;
      border: 1px solid #ffffff24;
      border-radius: 7px;
      background: #070d16;
      color: #ccdeed;
      font: 11px/1.6 ui-monospace, monospace !important;
    }

    .tessera-status {
      min-height: 20px;
      margin-top: 10px;
    }

    @media (prefers-reduced-motion: reduce) {
      .tessera-panel {
        transition: none;
      }
    }
  `;

  document.head.append(style);

  const root = document.createElement("div");
  root.className = "tessera-editor";
  root.dataset.backgroundEditor = "";

  root.innerHTML = `
    <button
      class="tessera-toggle"
      type="button"
      aria-expanded="false"
      aria-controls="tessera-settings-panel"
    >Settings</button>

    <aside
      id="tessera-settings-panel"
      class="tessera-panel"
      aria-label="Floating Tesserae settings"
      inert
    >
      <div class="tessera-heading">
        <h2>Floating Tesserae</h2>
        <button class="tessera-close" type="button">Retract</button>
      </div>

      <p class="tessera-description">
        Move your pointer to open the mosaic.
        Copy your configuration before disabling the editor.
      </p>

      <div class="tessera-controls"></div>

      <div class="tessera-actions">
        <button class="tessera-show" type="button">Show code</button>
        <button class="tessera-copy" type="button">Copy config</button>
        <button class="tessera-reset" type="button">New mosaic</button>
      </div>

      <textarea
        class="tessera-code"
        aria-label="Configuration code"
        spellcheck="false"
        readonly
        hidden
      ></textarea>

      <div
        class="tessera-status"
        role="status"
        aria-live="polite"
      ></div>
    </aside>
  `;

  document.body.append(root);

  const toggle = root.querySelector(".tessera-toggle");
  const panel = root.querySelector(".tessera-panel");
  const close = root.querySelector(".tessera-close");
  const controls = root.querySelector(".tessera-controls");
  const code = root.querySelector(".tessera-code");
  const show = root.querySelector(".tessera-show");
  const status = root.querySelector(".tessera-status");

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
      const container = element("div", "tessera-control");
      const heading = element("div", "tessera-control-title");
      const label = element("label");
      const id = `tessera-${groupName}-${key}`;

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
        const row = element("div", "tessera-colors");
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

  root.querySelector(".tessera-copy").addEventListener("click", async () => {
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

  root.querySelector(".tessera-reset").addEventListener("click", () => {
    onReset();
    status.textContent = "A new mosaic has been generated.";
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