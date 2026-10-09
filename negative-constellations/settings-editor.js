export function createSettingsEditor({
  config,
  onChange = () => {},
  onReset = () => {}
}) {
  const limits = {
    "holes.count": [1, 100, 1],
    "holes.radius": [8, 100, 1],
    "holes.sizeVariation": [0, 0.9, 0.01],
    "holes.softness": [0, 1, 0.01],
    "holes.opacity": [0, 1, 0.01],
    "holes.driftSpeed": [0, 60, 0.5],
    "holes.breathing": [0, 0.4, 0.01],

    "connections.distance": [30, 500, 1],
    "connections.width": [0.2, 5, 0.1],
    "connections.opacity": [0, 1, 0.01],

    "field.brightness": [0, 1, 0.01],
    "field.movement": [0, 2, 0.01],
    "field.grainOpacity": [0, 0.2, 0.005],

    "mouse.radius": [40, 500, 1],
    "mouse.pushStrength": [0, 350, 1],
    "mouse.lightStrength": [0, 1, 0.01],
    "mouse.smoothing": [0.5, 20, 0.1],
    "mouse.returnSpeed": [0.1, 10, 0.1],

    "appearance.rimOpacity": [0, 0.5, 0.01],

    "animation.speed": [0, 3, 0.05]
  };

  const style = document.createElement("style");

  style.textContent = `
    .negative-editor {
      position: fixed;
      inset: 0;
      z-index: 10000;
      pointer-events: none;
      color: #e5eaf4;
      font: 13px/1.5 system-ui, sans-serif;
      color-scheme: dark;
    }

    .negative-editor * {
      box-sizing: border-box;
    }

    .negative-editor button,
    .negative-editor input,
    .negative-editor textarea {
      font: inherit;
    }

    .negative-editor button {
      padding: 8px 11px;
      border: 1px solid #ffffff26;
      border-radius: 7px;
      background: #253044;
      color: inherit;
      cursor: pointer;
    }

    .negative-editor button:hover {
      background: #36455e;
    }

    .negative-editor :focus-visible {
      outline: 2px solid #a7d9df;
      outline-offset: 3px;
    }

    .negative-toggle {
      position: absolute;
      top: 16px;
      right: 16px;
      pointer-events: auto;
    }

    .negative-panel {
      position: absolute;
      top: 0;
      right: 0;
      width: min(350px, 100vw);
      height: 100%;
      padding: 22px;
      overflow: auto;
      border-left: 1px solid #ffffff20;
      background: rgba(10, 17, 30, 0.94);
      backdrop-filter: blur(16px);
      pointer-events: auto;
      transform: translateX(100%);
      transition: transform 220ms ease;
    }

    .negative-panel.open {
      transform: translateX(0);
    }

    .negative-heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 8px;
    }

    .negative-heading h2 {
      margin: 0;
      font-size: 17px;
      font-weight: 600;
    }

    .negative-description,
    .negative-status {
      color: #a7b3c7;
      font-size: 12px;
    }

    .negative-description {
      margin: 0 0 20px;
    }

    .negative-panel fieldset {
      min-width: 0;
      margin: 0 0 12px;
      padding: 15px 0 8px;
      border: 0;
      border-top: 1px solid #ffffff18;
    }

    .negative-panel legend {
      padding-right: 7px;
      color: #b6d7df;
      font-weight: 600;
    }

    .negative-control {
      margin-bottom: 13px;
    }

    .negative-control-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 6px;
    }

    .negative-panel input[type="range"] {
      width: 100%;
      accent-color: #a4c9d8;
    }

    .negative-panel input[type="number"] {
      width: 76px;
      padding: 4px 6px;
      border: 1px solid #ffffff24;
      border-radius: 5px;
      background: #ffffff08;
      color: inherit;
    }

    .negative-panel input[type="checkbox"] {
      accent-color: #a4c9d8;
    }

    .negative-colors {
      display: flex;
      align-items: center;
      gap: 7px;
    }

    .negative-panel input[type="color"] {
      width: 42px;
      height: 30px;
      padding: 2px;
      border: 1px solid #ffffff24;
      border-radius: 5px;
      background: transparent;
    }

    .negative-colors input[type="number"] {
      width: 65px;
      min-width: 0;
    }

    .negative-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
    }

    .negative-code {
      width: 100%;
      min-height: 260px;
      margin-top: 14px;
      padding: 12px;
      resize: vertical;
      border: 1px solid #ffffff24;
      border-radius: 7px;
      background: #050a14;
      color: #c8dbe9;
      font: 11px/1.6 ui-monospace, monospace !important;
    }

    .negative-status {
      min-height: 20px;
      margin-top: 10px;
    }

    @media (prefers-reduced-motion: reduce) {
      .negative-panel {
        transition: none;
      }
    }
  `;

  document.head.append(style);

  const root = document.createElement("div");
  root.className = "negative-editor";
  root.dataset.backgroundEditor = "";

  root.innerHTML = `
    <button
      class="negative-toggle"
      type="button"
      aria-expanded="false"
      aria-controls="negative-settings-panel"
    >Settings</button>

    <aside
      id="negative-settings-panel"
      class="negative-panel"
      aria-label="Negative Constellations settings"
      inert
    >
      <div class="negative-heading">
        <h2>Negative Constellations</h2>
        <button class="negative-close" type="button">Retract</button>
      </div>

      <p class="negative-description">
        Shape the shadows and the light between them.
        Copy your configuration before disabling the editor.
      </p>

      <div class="negative-controls"></div>

      <div class="negative-actions">
        <button class="negative-show" type="button">Show code</button>
        <button class="negative-copy" type="button">Copy config</button>
        <button class="negative-reset" type="button">New constellation</button>
      </div>

      <textarea
        class="negative-code"
        aria-label="Configuration code"
        spellcheck="false"
        readonly
        hidden
      ></textarea>

      <div
        class="negative-status"
        role="status"
        aria-live="polite"
      ></div>
    </aside>
  `;

  document.body.append(root);

  const toggle = root.querySelector(".negative-toggle");
  const panel = root.querySelector(".negative-panel");
  const close = root.querySelector(".negative-close");
  const controls = root.querySelector(".negative-controls");
  const code = root.querySelector(".negative-code");
  const show = root.querySelector(".negative-show");
  const status = root.querySelector(".negative-status");

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
      const container = element("div", "negative-control");
      const heading = element("div", "negative-control-title");
      const label = element("label");
      const id = `negative-${groupName}-${key}`;

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
        const row = element("div", "negative-colors");
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

  root.querySelector(".negative-copy").addEventListener("click", async () => {
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

  root.querySelector(".negative-reset").addEventListener("click", () => {
    onReset();
    status.textContent = "A new constellation has been generated.";
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