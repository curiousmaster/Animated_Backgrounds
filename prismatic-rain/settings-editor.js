export function createSettingsEditor({
  config,
  onChange = () => {},
  onReset = () => {}
}) {
  const limits = {
    "rain.count": [1, 400, 1],
    "rain.speed": [0, 500, 1],
    "rain.direction": [-180, 180, 1],
    "rain.length": [10, 300, 1],
    "rain.width": [0.2, 4, 0.1],
    "rain.opacity": [0, 1, 0.01],
    "rain.depthVariation": [0, 0.9, 0.01],

    "prisms.bands": [0, 8, 1],
    "prisms.angle": [-180, 180, 1],
    "prisms.spacing": [40, 500, 1],
    "prisms.thickness": [10, 250, 1],
    "prisms.strength": [0, 150, 1],
    "prisms.separation": [0, 100, 1],
    "prisms.drift": [0, 150, 1],
    "prisms.bandOpacity": [0, 0.2, 0.005],

    "mouse.radius": [40, 500, 1],
    "mouse.strength": [0, 200, 1],
    "mouse.separation": [0, 150, 1],
    "mouse.smoothing": [0.5, 20, 0.1],

    "appearance.glow": [0, 30, 0.5],

    "animation.speed": [0, 3, 0.05]
  };

  const style = document.createElement("style");

  style.textContent = `
    .prism-editor {
      position: fixed;
      inset: 0;
      z-index: 10000;
      pointer-events: none;
      color: #e8e8f7;
      font: 13px/1.5 system-ui, sans-serif;
      color-scheme: dark;
    }

    .prism-editor *,
    .prism-editor *::before,
    .prism-editor *::after {
      box-sizing: border-box;
    }

    .prism-editor button,
    .prism-editor input,
    .prism-editor textarea {
      font: inherit;
    }

    .prism-editor button {
      padding: 8px 11px;
      border: 1px solid #ffffff26;
      border-radius: 7px;
      background: #242337;
      color: inherit;
      cursor: pointer;
    }

    .prism-editor button:hover {
      background: #37344e;
    }

    .prism-editor :focus-visible {
      outline: 2px solid #b9a7ff;
      outline-offset: 3px;
    }

    .prism-toggle {
      position: absolute;
      top: 16px;
      right: 16px;
      pointer-events: auto;
    }

    .prism-panel {
      position: absolute;
      top: 0;
      right: 0;
      width: min(350px, 100vw);
      height: 100%;
      padding: 22px;
      overflow: auto;
      border-left: 1px solid #ffffff20;
      background: rgba(12, 12, 24, 0.94);
      backdrop-filter: blur(16px);
      pointer-events: auto;
      transform: translateX(100%);
      transition: transform 220ms ease;
    }

    .prism-panel.open {
      transform: translateX(0);
    }

    .prism-heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 8px;
    }

    .prism-heading h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }

    .prism-description {
      margin: 0 0 20px;
      color: #aaa8c3;
      font-size: 12px;
    }

    .prism-panel fieldset {
      min-width: 0;
      margin: 0 0 12px;
      padding: 15px 0 8px;
      border: 0;
      border-top: 1px solid #ffffff18;
    }

    .prism-panel legend {
      padding: 0 7px 0 0;
      color: #c1b5f5;
      font-weight: 600;
    }

    .prism-control {
      margin-bottom: 13px;
    }

    .prism-control-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 6px;
    }

    .prism-panel input[type="range"] {
      width: 100%;
      accent-color: #b5a3ed;
    }

    .prism-panel input[type="number"] {
      width: 76px;
      padding: 4px 6px;
      border: 1px solid #ffffff24;
      border-radius: 5px;
      background: #ffffff08;
      color: inherit;
    }

    .prism-panel input[type="checkbox"] {
      accent-color: #b5a3ed;
    }

    .prism-colors {
      display: flex;
      align-items: center;
      gap: 7px;
    }

    .prism-panel input[type="color"] {
      width: 42px;
      height: 30px;
      padding: 2px;
      border: 1px solid #ffffff24;
      border-radius: 5px;
      background: transparent;
    }

    .prism-colors input[type="number"] {
      width: 65px;
      min-width: 0;
    }

    .prism-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
    }

    .prism-code {
      width: 100%;
      min-height: 260px;
      margin-top: 14px;
      padding: 12px;
      resize: vertical;
      border: 1px solid #ffffff24;
      border-radius: 7px;
      background: #070711;
      color: #d0c7ed;
      font: 11px/1.6 ui-monospace, monospace !important;
    }

    .prism-status {
      min-height: 20px;
      margin-top: 10px;
      color: #aaa8c3;
      font-size: 12px;
    }

    @media (prefers-reduced-motion: reduce) {
      .prism-panel {
        transition: none;
      }
    }
  `;

  document.head.append(style);

  const root = document.createElement("div");
  root.className = "prism-editor";
  root.dataset.backgroundEditor = "";

  root.innerHTML = `
    <button
      class="prism-toggle"
      type="button"
      aria-expanded="false"
      aria-controls="prism-settings-panel"
    >Settings</button>

    <aside
      id="prism-settings-panel"
      class="prism-panel"
      aria-label="Prismatic Rain settings"
      inert
    >
      <div class="prism-heading">
        <h2>Prismatic Rain</h2>
        <button class="prism-close" type="button">Retract</button>
      </div>

      <p class="prism-description">
        Shape the rain and its spectral separation.
        Copy your configuration before disabling the editor.
      </p>

      <div class="prism-controls"></div>

      <div class="prism-actions">
        <button class="prism-show" type="button">Show code</button>
        <button class="prism-copy" type="button">Copy config</button>
        <button class="prism-reset" type="button">New rain</button>
      </div>

      <textarea
        class="prism-code"
        aria-label="Configuration code"
        spellcheck="false"
        readonly
        hidden
      ></textarea>

      <div
        class="prism-status"
        role="status"
        aria-live="polite"
      ></div>
    </aside>
  `;

  document.body.append(root);

  const toggle = root.querySelector(".prism-toggle");
  const panel = root.querySelector(".prism-panel");
  const close = root.querySelector(".prism-close");
  const controls = root.querySelector(".prism-controls");
  const code = root.querySelector(".prism-code");
  const show = root.querySelector(".prism-show");
  const status = root.querySelector(".prism-status");

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

  function makeElement(tag, className) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    return element;
  }

  function toHex(color) {
    return "#" + color.map(value =>
      Math.round(value).toString(16).padStart(2, "0")
    ).join("");
  }

  for (const [groupName, group] of Object.entries(config)) {
    const fieldset = makeElement("fieldset");
    const legend = makeElement("legend");

    legend.textContent = title(groupName);
    fieldset.append(legend);

    for (const [key, value] of Object.entries(group)) {
      const path = `${groupName}.${key}`;
      const container = makeElement("div", "prism-control");
      const heading = makeElement("div", "prism-control-title");
      const label = makeElement("label");
      const id = `prism-${groupName}-${key}`;

      label.textContent = title(key);
      label.htmlFor = id;

      heading.append(label);
      container.append(heading);

      if (typeof value === "boolean") {
        const input = makeElement("input");

        input.id = id;
        input.type = "checkbox";
        input.checked = value;

        input.addEventListener("change", () => {
          group[key] = input.checked;
          changed();
        });

        heading.append(input);
      } else if (Array.isArray(value)) {
        const row = makeElement("div", "prism-colors");
        const picker = makeElement("input");

        picker.id = id;
        picker.type = "color";
        picker.value = toHex(value);

        row.append(picker);

        const channels = value.map((channel, index) => {
          const input = makeElement("input");

          input.type = "number";
          input.min = "0";
          input.max = "255";
          input.step = "1";
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
        const number = makeElement("input");
        const range = makeElement("input");

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

            if (input === number) {
              range.value = group[key];
            } else {
              number.value = group[key];
            }

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

  root.querySelector(".prism-copy").addEventListener("click", async () => {
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

  root.querySelector(".prism-reset").addEventListener("click", () => {
    onReset();
    status.textContent = "A new rain pattern has been generated.";
  });

  function onKeyDown(event) {
    if (
      event.key === "Escape" &&
      panel.classList.contains("open")
    ) {
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