export function createSettingsEditor({
  config,
  onChange = () => {},
  onReset = () => {}
}) {
  const limits = {
    "garden.count": [1, 60, 1],
    "garden.height": [60, 500, 1],
    "garden.spread": [0, 1.5, 0.01],
    "garden.growthTime": [1, 30, 0.5],
    "garden.bloomTime": [1, 60, 0.5],
    "garden.retractTime": [1, 30, 0.5],
    "garden.restTime": [0, 20, 0.5],

    "gears.radius": [5, 45, 1],
    "gears.teeth": [6, 24, 1],
    "gears.rotationSpeed": [0, 2, 0.01],
    "gears.coupling": [0, 1, 0.01],

    "flowers.petals": [3, 16, 1],
    "flowers.petalLength": [5, 70, 1],
    "flowers.opening": [0, 1.5, 0.01],
    "flowers.breathing": [0, 0.5, 0.01],

    "mouse.radius": [40, 500, 1],
    "mouse.acceleration": [0, 8, 0.1],
    "mouse.bloomStrength": [0, 1.5, 0.01],
    "mouse.smoothing": [0.5, 20, 0.1],

    "appearance.opacity": [0, 1, 0.01],
    "appearance.lineWidth": [0.2, 3, 0.1],
    "appearance.glow": [0, 30, 0.5],

    "animation.speed": [0, 3, 0.05]
  };

  const style = document.createElement("style");

  style.textContent = `
    .garden-editor {
      position: fixed;
      inset: 0;
      z-index: 10000;
      pointer-events: none;
      color: #e6ebe5;
      font: 13px/1.5 system-ui, sans-serif;
      color-scheme: dark;
    }

    .garden-editor * {
      box-sizing: border-box;
    }

    .garden-editor button,
    .garden-editor input,
    .garden-editor textarea {
      font: inherit;
    }

    .garden-editor button {
      padding: 8px 11px;
      border: 1px solid #ffffff26;
      border-radius: 7px;
      background: #29342d;
      color: inherit;
      cursor: pointer;
    }

    .garden-editor button:hover {
      background: #3c4b3f;
    }

    .garden-editor :focus-visible {
      outline: 2px solid #d2bd83;
      outline-offset: 3px;
    }

    .garden-toggle {
      position: absolute;
      top: 16px;
      right: 16px;
      pointer-events: auto;
    }

    .garden-panel {
      position: absolute;
      top: 0;
      right: 0;
      width: min(350px, 100vw);
      height: 100%;
      padding: 22px;
      overflow: auto;
      border-left: 1px solid #ffffff20;
      background: rgba(12, 21, 20, 0.94);
      backdrop-filter: blur(16px);
      pointer-events: auto;
      transform: translateX(100%);
      transition: transform 220ms ease;
    }

    .garden-panel.open {
      transform: translateX(0);
    }

    .garden-heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 8px;
    }

    .garden-heading h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }

    .garden-description,
    .garden-status {
      color: #a7b5ac;
      font-size: 12px;
    }

    .garden-description {
      margin: 0 0 20px;
    }

    .garden-panel fieldset {
      min-width: 0;
      margin: 0 0 12px;
      padding: 15px 0 8px;
      border: 0;
      border-top: 1px solid #ffffff18;
    }

    .garden-panel legend {
      padding-right: 7px;
      color: #d2c398;
      font-weight: 600;
    }

    .garden-control {
      margin-bottom: 13px;
    }

    .garden-control-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 6px;
    }

    .garden-panel input[type="range"] {
      width: 100%;
      accent-color: #c6b680;
    }

    .garden-panel input[type="number"] {
      width: 76px;
      padding: 4px 6px;
      border: 1px solid #ffffff24;
      border-radius: 5px;
      background: #ffffff08;
      color: inherit;
    }

    .garden-panel input[type="checkbox"] {
      accent-color: #c6b680;
    }

    .garden-colors {
      display: flex;
      align-items: center;
      gap: 7px;
    }

    .garden-panel input[type="color"] {
      width: 42px;
      height: 30px;
      padding: 2px;
      border: 1px solid #ffffff24;
      border-radius: 5px;
      background: transparent;
    }

    .garden-colors input[type="number"] {
      width: 65px;
      min-width: 0;
    }

    .garden-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
    }

    .garden-code {
      width: 100%;
      min-height: 260px;
      margin-top: 14px;
      padding: 12px;
      resize: vertical;
      border: 1px solid #ffffff24;
      border-radius: 7px;
      background: #070e0d;
      color: #d2dcc7;
      font: 11px/1.6 ui-monospace, monospace !important;
    }

    .garden-status {
      min-height: 20px;
      margin-top: 10px;
    }

    @media (prefers-reduced-motion: reduce) {
      .garden-panel {
        transition: none;
      }
    }
  `;

  document.head.append(style);

  const root = document.createElement("div");
  root.className = "garden-editor";
  root.dataset.backgroundEditor = "";

  root.innerHTML = `
    <button
      class="garden-toggle"
      type="button"
      aria-expanded="false"
      aria-controls="garden-settings-panel"
    >Settings</button>

    <aside
      id="garden-settings-panel"
      class="garden-panel"
      aria-label="Clockwork Garden settings"
      inert
    >
      <div class="garden-heading">
        <h2>Clockwork Garden</h2>
        <button class="garden-close" type="button">Retract</button>
      </div>

      <p class="garden-description">
        Adjust growth, gears, and flowers.
        Copy your configuration before disabling the editor.
      </p>

      <div class="garden-controls"></div>

      <div class="garden-actions">
        <button class="garden-show" type="button">Show code</button>
        <button class="garden-copy" type="button">Copy config</button>
        <button class="garden-reset" type="button">New garden</button>
      </div>

      <textarea
        class="garden-code"
        aria-label="Configuration code"
        spellcheck="false"
        readonly
        hidden
      ></textarea>

      <div
        class="garden-status"
        role="status"
        aria-live="polite"
      ></div>
    </aside>
  `;

  document.body.append(root);

  const toggle = root.querySelector(".garden-toggle");
  const panel = root.querySelector(".garden-panel");
  const close = root.querySelector(".garden-close");
  const controls = root.querySelector(".garden-controls");
  const code = root.querySelector(".garden-code");
  const show = root.querySelector(".garden-show");
  const status = root.querySelector(".garden-status");

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
      const container = element("div", "garden-control");
      const heading = element("div", "garden-control-title");
      const label = element("label");
      const id = `garden-${groupName}-${key}`;

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
        const row = element("div", "garden-colors");
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

  root.querySelector(".garden-copy").addEventListener("click", async () => {
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

  root.querySelector(".garden-reset").addEventListener("click", () => {
    onReset();
    status.textContent = "A new garden has been generated.";
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