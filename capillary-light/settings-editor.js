export function createSettingsEditor({
  config,
  onChange = () => {},
  onReset = () => {}
}) {
  const limits = {
    "channels.spacing": [25, 100, 1],
    "channels.branching": [0, 1, 0.01],
    "channels.irregularity": [0, 1, 0.01],
    "channels.width": [0.3, 4, 0.1],
    "channels.opacity": [0, 0.5, 0.01],

    "ink.propagationSpeed": [0.1, 10, 0.1],
    "ink.diffusion": [0, 1, 0.01],
    "ink.sourceLifetime": [0.5, 20, 0.5],
    "ink.sourceInterval": [0, 15, 0.5],
    "ink.decay": [0.01, 1, 0.01],
    "ink.intensity": [0, 1, 0.01],
    "ink.glow": [0, 25, 0.5],

    "mouse.radius": [30, 300, 1],
    "mouse.strength": [0, 5, 0.1],
    "mouse.smoothing": [0.5, 20, 0.1],
    "mouse.colorCycleSpeed": [0, 2, 0.01],

    "animation.speed": [0, 3, 0.05]
  };

  const style = document.createElement("style");

  style.textContent = `
    .capillary-editor {
      position: fixed;
      inset: 0;
      z-index: 10000;
      pointer-events: none;
      color: #e5ecf1;
      font: 13px/1.5 system-ui, sans-serif;
      color-scheme: dark;
    }

    .capillary-editor * {
      box-sizing: border-box;
    }

    .capillary-editor button,
    .capillary-editor input,
    .capillary-editor textarea {
      font: inherit;
    }

    .capillary-editor button {
      padding: 8px 11px;
      border: 1px solid #ffffff26;
      border-radius: 7px;
      background: #23343e;
      color: inherit;
      cursor: pointer;
    }

    .capillary-editor button:hover {
      background: #354b57;
    }

    .capillary-editor :focus-visible {
      outline: 2px solid #a2d8df;
      outline-offset: 3px;
    }

    .capillary-toggle {
      position: absolute;
      top: 16px;
      right: 16px;
      pointer-events: auto;
    }

    .capillary-panel {
      position: absolute;
      top: 0;
      right: 0;
      width: min(350px, 100vw);
      height: 100%;
      padding: 22px;
      overflow: auto;
      border-left: 1px solid #ffffff20;
      background: rgba(10, 18, 28, 0.94);
      backdrop-filter: blur(16px);
      pointer-events: auto;
      transform: translateX(100%);
      transition: transform 220ms ease;
    }

    .capillary-panel.open {
      transform: translateX(0);
    }

    .capillary-heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 8px;
    }

    .capillary-heading h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }

    .capillary-description,
    .capillary-status {
      color: #a5b6c3;
      font-size: 12px;
    }

    .capillary-description {
      margin: 0 0 20px;
    }

    .capillary-panel fieldset {
      min-width: 0;
      margin: 0 0 12px;
      padding: 15px 0 8px;
      border: 0;
      border-top: 1px solid #ffffff18;
    }

    .capillary-panel legend {
      padding-right: 7px;
      color: #acd8df;
      font-weight: 600;
    }

    .capillary-control {
      margin-bottom: 13px;
    }

    .capillary-control-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 6px;
    }

    .capillary-panel input[type="range"] {
      width: 100%;
      accent-color: #9acbd5;
    }

    .capillary-panel input[type="number"] {
      width: 76px;
      padding: 4px 6px;
      border: 1px solid #ffffff24;
      border-radius: 5px;
      background: #ffffff08;
      color: inherit;
    }

    .capillary-panel input[type="checkbox"] {
      accent-color: #9acbd5;
    }

    .capillary-colors {
      display: flex;
      align-items: center;
      gap: 7px;
    }

    .capillary-panel input[type="color"] {
      width: 42px;
      height: 30px;
      padding: 2px;
      border: 1px solid #ffffff24;
      border-radius: 5px;
      background: transparent;
    }

    .capillary-colors input[type="number"] {
      width: 65px;
      min-width: 0;
    }

    .capillary-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
    }

    .capillary-code {
      width: 100%;
      min-height: 260px;
      margin-top: 14px;
      padding: 12px;
      resize: vertical;
      border: 1px solid #ffffff24;
      border-radius: 7px;
      background: #060c15;
      color: #c6dde9;
      font: 11px/1.6 ui-monospace, monospace !important;
    }

    .capillary-status {
      min-height: 20px;
      margin-top: 10px;
    }

    @media (prefers-reduced-motion: reduce) {
      .capillary-panel {
        transition: none;
      }
    }
  `;

  document.head.append(style);

  const root = document.createElement("div");
  root.className = "capillary-editor";
  root.dataset.backgroundEditor = "";

  root.innerHTML = `
    <button
      class="capillary-toggle"
      type="button"
      aria-expanded="false"
      aria-controls="capillary-settings-panel"
    >Settings</button>

    <aside
      id="capillary-settings-panel"
      class="capillary-panel"
      aria-label="Capillary Light settings"
      inert
    >
      <div class="capillary-heading">
        <h2>Capillary Light</h2>
        <button class="capillary-close" type="button">Retract</button>
      </div>

      <p class="capillary-description">
        Move your pointer to feed color into the channels.
        Source interval 0 disables new automatic sources.
        Copy your configuration before disabling the editor.
      </p>

      <div class="capillary-controls"></div>

      <div class="capillary-actions">
        <button class="capillary-show" type="button">Show code</button>
        <button class="capillary-copy" type="button">Copy config</button>
        <button class="capillary-reset" type="button">New channels</button>
      </div>

      <textarea
        class="capillary-code"
        aria-label="Configuration code"
        spellcheck="false"
        readonly
        hidden
      ></textarea>

      <div
        class="capillary-status"
        role="status"
        aria-live="polite"
      ></div>
    </aside>
  `;

  document.body.append(root);

  const toggle = root.querySelector(".capillary-toggle");
  const panel = root.querySelector(".capillary-panel");
  const close = root.querySelector(".capillary-close");
  const controls = root.querySelector(".capillary-controls");
  const code = root.querySelector(".capillary-code");
  const show = root.querySelector(".capillary-show");
  const status = root.querySelector(".capillary-status");

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
      const container = element("div", "capillary-control");
      const heading = element("div", "capillary-control-title");
      const label = element("label");
      const id = `capillary-${groupName}-${key}`;

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
        const row = element("div", "capillary-colors");
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

  root.querySelector(".capillary-copy").addEventListener("click", async () => {
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

  root.querySelector(".capillary-reset").addEventListener("click", () => {
    onReset();
    status.textContent = "A new channel network has been generated.";
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