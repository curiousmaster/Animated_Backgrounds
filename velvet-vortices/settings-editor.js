export function createSettingsEditor({
  config,
  onChange = () => {},
  onReset = () => {}
}) {
  const limits = {
    "strokes.count": [200, 10000, 100],
    "strokes.length": [2, 35, 0.5],
    "strokes.width": [0.3, 4, 0.1],
    "strokes.opacity": [0, 1, 0.01],
    "strokes.softness": [0, 12, 0.5],
    "strokes.lengthVariation": [0, 0.9, 0.01],

    "flow.vortexCount": [0, 12, 1],
    "flow.vortexRadius": [50, 700, 1],
    "flow.vortexStrength": [0, 8, 0.1],
    "flow.speed": [0, 2, 0.01],
    "flow.wandering": [0, 0.5, 0.01],
    "flow.baseDirection": [-180, 180, 1],
    "flow.rippleStrength": [0, 2, 0.01],
    "flow.response": [0.2, 12, 0.1],

    "mouse.radius": [30, 400, 1],
    "mouse.strength": [0, 2, 0.01],
    "mouse.persistence": [0.2, 15, 0.1],
    "mouse.smoothing": [0.5, 20, 0.1],

    "appearance.sheen": [0, 1, 0.01],
    "appearance.lightDirection": [-180, 180, 1],

    "animation.speed": [0, 3, 0.05]
  };

  const style = document.createElement("style");

  style.textContent = `
    .velvet-editor {
      position: fixed;
      inset: 0;
      z-index: 10000;
      pointer-events: none;
      color: #e9e5f4;
      font: 13px/1.5 system-ui, sans-serif;
      color-scheme: dark;
    }

    .velvet-editor * {
      box-sizing: border-box;
    }

    .velvet-editor button,
    .velvet-editor input,
    .velvet-editor textarea {
      font: inherit;
    }

    .velvet-editor button {
      padding: 8px 11px;
      border: 1px solid #ffffff26;
      border-radius: 7px;
      background: #30283e;
      color: inherit;
      cursor: pointer;
    }

    .velvet-editor button:hover {
      background: #463854;
    }

    .velvet-editor :focus-visible {
      outline: 2px solid #c4afe6;
      outline-offset: 3px;
    }

    .velvet-toggle {
      position: absolute;
      top: 16px;
      right: 16px;
      pointer-events: auto;
    }

    .velvet-panel {
      position: absolute;
      top: 0;
      right: 0;
      width: min(350px, 100vw);
      height: 100%;
      padding: 22px;
      overflow: auto;
      border-left: 1px solid #ffffff20;
      background: rgba(17, 13, 27, 0.94);
      backdrop-filter: blur(16px);
      pointer-events: auto;
      transform: translateX(100%);
      transition: transform 220ms ease;
    }

    .velvet-panel.open {
      transform: translateX(0);
    }

    .velvet-heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 8px;
    }

    .velvet-heading h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }

    .velvet-description,
    .velvet-status {
      color: #b5a9c3;
      font-size: 12px;
    }

    .velvet-description {
      margin: 0 0 20px;
    }

    .velvet-panel fieldset {
      min-width: 0;
      margin: 0 0 12px;
      padding: 15px 0 8px;
      border: 0;
      border-top: 1px solid #ffffff18;
    }

    .velvet-panel legend {
      padding-right: 7px;
      color: #ccbae6;
      font-weight: 600;
    }

    .velvet-control {
      margin-bottom: 13px;
    }

    .velvet-control-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 6px;
    }

    .velvet-panel input[type="range"] {
      width: 100%;
      accent-color: #baa2d8;
    }

    .velvet-panel input[type="number"] {
      width: 76px;
      padding: 4px 6px;
      border: 1px solid #ffffff24;
      border-radius: 5px;
      background: #ffffff08;
      color: inherit;
    }

    .velvet-panel input[type="checkbox"] {
      accent-color: #baa2d8;
    }

    .velvet-colors {
      display: flex;
      align-items: center;
      gap: 7px;
    }

    .velvet-panel input[type="color"] {
      width: 42px;
      height: 30px;
      padding: 2px;
      border: 1px solid #ffffff24;
      border-radius: 5px;
      background: transparent;
    }

    .velvet-colors input[type="number"] {
      width: 65px;
      min-width: 0;
    }

    .velvet-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
    }

    .velvet-code {
      width: 100%;
      min-height: 260px;
      margin-top: 14px;
      padding: 12px;
      resize: vertical;
      border: 1px solid #ffffff24;
      border-radius: 7px;
      background: #0b0813;
      color: #d9cce9;
      font: 11px/1.6 ui-monospace, monospace !important;
    }

    .velvet-status {
      min-height: 20px;
      margin-top: 10px;
    }

    @media (prefers-reduced-motion: reduce) {
      .velvet-panel {
        transition: none;
      }
    }
  `;

  document.head.append(style);

  const root = document.createElement("div");
  root.className = "velvet-editor";
  root.dataset.backgroundEditor = "";

  root.innerHTML = `
    <button
      class="velvet-toggle"
      type="button"
      aria-expanded="false"
      aria-controls="velvet-settings-panel"
    >Settings</button>

    <aside
      id="velvet-settings-panel"
      class="velvet-panel"
      aria-label="Velvet Vortices settings"
      inert
    >
      <div class="velvet-heading">
        <h2>Velvet Vortices</h2>
        <button class="velvet-close" type="button">Retract</button>
      </div>

      <p class="velvet-description">
        Brush the background with your pointer.
        Copy your configuration before disabling the editor.
      </p>

      <div class="velvet-controls"></div>

      <div class="velvet-actions">
        <button class="velvet-show" type="button">Show code</button>
        <button class="velvet-copy" type="button">Copy config</button>
        <button class="velvet-reset" type="button">New weave</button>
      </div>

      <textarea
        class="velvet-code"
        aria-label="Configuration code"
        spellcheck="false"
        readonly
        hidden
      ></textarea>

      <div
        class="velvet-status"
        role="status"
        aria-live="polite"
      ></div>
    </aside>
  `;

  document.body.append(root);

  const toggle = root.querySelector(".velvet-toggle");
  const panel = root.querySelector(".velvet-panel");
  const close = root.querySelector(".velvet-close");
  const controls = root.querySelector(".velvet-controls");
  const code = root.querySelector(".velvet-code");
  const show = root.querySelector(".velvet-show");
  const status = root.querySelector(".velvet-status");

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
      const container = element("div", "velvet-control");
      const heading = element("div", "velvet-control-title");
      const label = element("label");
      const id = `velvet-${groupName}-${key}`;

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
        const row = element("div", "velvet-colors");
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

  root.querySelector(".velvet-copy").addEventListener("click", async () => {
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

  root.querySelector(".velvet-reset").addEventListener("click", () => {
    onReset();
    status.textContent = "A new weave has been generated.";
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