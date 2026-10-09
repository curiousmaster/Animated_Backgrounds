export function createSettingsEditor({
  config,
  onChange = () => {},
  onReset = () => {}
}) {
  const limits = {
    "stripes.spacing": [4, 30, 0.5],
    "stripes.layers": [1, 5, 1],
    "stripes.width": [0.3, 5, 0.1],
    "stripes.angle": [-180, 180, 1],
    "stripes.relativeAngle": [0, 30, 0.1],
    "stripes.spacingVariation": [0, 0.15, 0.005],
    "stripes.contrast": [0, 1, 0.01],

    "motion.driftSpeed": [0, 40, 0.5],
    "motion.rotation": [0, 15, 0.1],
    "motion.rotationSpeed": [0, 1, 0.01],
    "motion.waveAmplitude": [0, 60, 1],
    "motion.wavelength": [100, 1500, 10],
    "motion.waveSpeed": [0, 2, 0.01],

    "mouse.radius": [40, 500, 1],
    "mouse.distortion": [-100, 200, 1],
    "mouse.twist": [-1.5, 1.5, 0.01],
    "mouse.smoothing": [0.5, 20, 0.1],

    "animation.speed": [0, 3, 0.05]
  };

  const style = document.createElement("style");

  style.textContent = `
    .loom-editor {
      position: fixed;
      inset: 0;
      z-index: 10000;
      pointer-events: none;
      color: #e8e8f3;
      font: 13px/1.5 system-ui, sans-serif;
      color-scheme: dark;
    }

    .loom-editor * {
      box-sizing: border-box;
    }

    .loom-editor button,
    .loom-editor input,
    .loom-editor textarea {
      font: inherit;
    }

    .loom-editor button {
      padding: 8px 11px;
      border: 1px solid #ffffff26;
      border-radius: 7px;
      background: #2c2c43;
      color: inherit;
      cursor: pointer;
    }

    .loom-editor button:hover {
      background: #41405b;
    }

    .loom-editor :focus-visible {
      outline: 2px solid #c1b5e5;
      outline-offset: 3px;
    }

    .loom-toggle {
      position: absolute;
      top: 16px;
      right: 16px;
      pointer-events: auto;
    }

    .loom-panel {
      position: absolute;
      top: 0;
      right: 0;
      width: min(350px, 100vw);
      height: 100%;
      padding: 22px;
      overflow: auto;
      border-left: 1px solid #ffffff20;
      background: rgba(14, 15, 29, 0.94);
      backdrop-filter: blur(16px);
      pointer-events: auto;
      transform: translateX(100%);
      transition: transform 220ms ease;
    }

    .loom-panel.open {
      transform: translateX(0);
    }

    .loom-heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 8px;
    }

    .loom-heading h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }

    .loom-description,
    .loom-status {
      color: #afaec5;
      font-size: 12px;
    }

    .loom-description {
      margin: 0 0 20px;
    }

    .loom-panel fieldset {
      min-width: 0;
      margin: 0 0 12px;
      padding: 15px 0 8px;
      border: 0;
      border-top: 1px solid #ffffff18;
    }

    .loom-panel legend {
      padding-right: 7px;
      color: #c8bfe5;
      font-weight: 600;
    }

    .loom-control {
      margin-bottom: 13px;
    }

    .loom-control-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 6px;
    }

    .loom-panel input[type="range"] {
      width: 100%;
      accent-color: #b9add9;
    }

    .loom-panel input[type="number"] {
      width: 76px;
      padding: 4px 6px;
      border: 1px solid #ffffff24;
      border-radius: 5px;
      background: #ffffff08;
      color: inherit;
    }

    .loom-panel input[type="checkbox"] {
      accent-color: #b9add9;
    }

    .loom-colors {
      display: flex;
      align-items: center;
      gap: 7px;
    }

    .loom-panel input[type="color"] {
      width: 42px;
      height: 30px;
      padding: 2px;
      border: 1px solid #ffffff24;
      border-radius: 5px;
      background: transparent;
    }

    .loom-colors input[type="number"] {
      width: 65px;
      min-width: 0;
    }

    .loom-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
    }

    .loom-code {
      width: 100%;
      min-height: 260px;
      margin-top: 14px;
      padding: 12px;
      resize: vertical;
      border: 1px solid #ffffff24;
      border-radius: 7px;
      background: #080a15;
      color: #d4cdeb;
      font: 11px/1.6 ui-monospace, monospace !important;
    }

    .loom-status {
      min-height: 20px;
      margin-top: 10px;
    }

    @media (prefers-reduced-motion: reduce) {
      .loom-panel {
        transition: none;
      }
    }
  `;

  document.head.append(style);

  const root = document.createElement("div");
  root.className = "loom-editor";
  root.dataset.backgroundEditor = "";

  root.innerHTML = `
    <button
      class="loom-toggle"
      type="button"
      aria-expanded="false"
      aria-controls="loom-settings-panel"
    >Settings</button>

    <aside
      id="loom-settings-panel"
      class="loom-panel"
      aria-label="Mirage Loom settings"
      inert
    >
      <div class="loom-heading">
        <h2>Mirage Loom</h2>
        <button class="loom-close" type="button">Retract</button>
      </div>

      <p class="loom-description">
        Move your pointer to bend the weave.
        Small relative angles create broad moiré patterns.
        Copy your configuration before disabling the editor.
      </p>

      <div class="loom-controls"></div>

      <div class="loom-actions">
        <button class="loom-show" type="button">Show code</button>
        <button class="loom-copy" type="button">Copy config</button>
        <button class="loom-reset" type="button">Restart motion</button>
      </div>

      <textarea
        class="loom-code"
        aria-label="Configuration code"
        spellcheck="false"
        readonly
        hidden
      ></textarea>

      <div
        class="loom-status"
        role="status"
        aria-live="polite"
      ></div>
    </aside>
  `;

  document.body.append(root);

  const toggle = root.querySelector(".loom-toggle");
  const panel = root.querySelector(".loom-panel");
  const close = root.querySelector(".loom-close");
  const controls = root.querySelector(".loom-controls");
  const code = root.querySelector(".loom-code");
  const show = root.querySelector(".loom-show");
  const status = root.querySelector(".loom-status");

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
      const container = element("div", "loom-control");
      const heading = element("div", "loom-control-title");
      const label = element("label");
      const id = `loom-${groupName}-${key}`;

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
        const row = element("div", "loom-colors");
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

  root.querySelector(".loom-copy").addEventListener("click", async () => {
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

  root.querySelector(".loom-reset").addEventListener("click", () => {
    onReset();
    status.textContent = "The motion has restarted.";
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