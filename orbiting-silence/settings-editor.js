export function createSettingsEditor({
  config,
  onChange = () => {},
  onReset = () => {}
}) {
  const limits = {
    "arcs.count": [5, 200, 1],
    "arcs.centers": [1, 12, 1],
    "arcs.orbitRadius": [20, 300, 1],
    "arcs.radiusVariation": [0, 0.9, 0.01],
    "arcs.length": [5, 300, 1],
    "arcs.speed": [0, 1.5, 0.01],
    "arcs.width": [0.2, 3, 0.1],
    "arcs.opacity": [0, 1, 0.01],
    "arcs.fading": [0, 1, 0.01],

    "alignment.frequency": [0, 0.5, 0.005],
    "alignment.strength": [0, 1, 0.01],
    "alignment.duration": [0.05, 1, 0.01],
    "alignment.response": [0.1, 10, 0.1],

    "drift.distance": [0, 200, 1],
    "drift.speed": [0, 1, 0.01],
    "drift.ellipticity": [0.2, 1, 0.01],

    "mouse.radius": [40, 500, 1],
    "mouse.captureStrength": [0, 1, 0.01],
    "mouse.orbitRadius": [15, 250, 1],
    "mouse.smoothing": [0.5, 20, 0.1],
    "mouse.release": [0.1, 10, 0.1],

    "appearance.glow": [0, 20, 0.5],

    "animation.speed": [0, 3, 0.05]
  };

  const style = document.createElement("style");

  style.textContent = `
    .orbit-editor {
      position: fixed;
      inset: 0;
      z-index: 10000;
      pointer-events: none;
      color: #e6eaf4;
      font: 13px/1.5 system-ui, sans-serif;
      color-scheme: dark;
    }

    .orbit-editor * {
      box-sizing: border-box;
    }

    .orbit-editor button,
    .orbit-editor input,
    .orbit-editor textarea {
      font: inherit;
    }

    .orbit-editor button {
      padding: 8px 11px;
      border: 1px solid #ffffff26;
      border-radius: 7px;
      background: #293047;
      color: inherit;
      cursor: pointer;
    }

    .orbit-editor button:hover {
      background: #3b435d;
    }

    .orbit-editor :focus-visible {
      outline: 2px solid #bfc9e8;
      outline-offset: 3px;
    }

    .orbit-toggle {
      position: absolute;
      top: 16px;
      right: 16px;
      pointer-events: auto;
    }

    .orbit-panel {
      position: absolute;
      top: 0;
      right: 0;
      width: min(350px, 100vw);
      height: 100%;
      padding: 22px;
      overflow: auto;
      border-left: 1px solid #ffffff20;
      background: rgba(12, 16, 30, 0.94);
      backdrop-filter: blur(16px);
      pointer-events: auto;
      transform: translateX(100%);
      transition: transform 220ms ease;
    }

    .orbit-panel.open {
      transform: translateX(0);
    }

    .orbit-heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 8px;
    }

    .orbit-heading h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }

    .orbit-description,
    .orbit-status {
      color: #aab4ca;
      font-size: 12px;
    }

    .orbit-description {
      margin: 0 0 20px;
    }

    .orbit-panel fieldset {
      min-width: 0;
      margin: 0 0 12px;
      padding: 15px 0 8px;
      border: 0;
      border-top: 1px solid #ffffff18;
    }

    .orbit-panel legend {
      padding-right: 7px;
      color: #c0cbe5;
      font-weight: 600;
    }

    .orbit-control {
      margin-bottom: 13px;
    }

    .orbit-control-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 6px;
    }

    .orbit-panel input[type="range"] {
      width: 100%;
      accent-color: #b3bddc;
    }

    .orbit-panel input[type="number"] {
      width: 76px;
      padding: 4px 6px;
      border: 1px solid #ffffff24;
      border-radius: 5px;
      background: #ffffff08;
      color: inherit;
    }

    .orbit-panel input[type="checkbox"] {
      accent-color: #b3bddc;
    }

    .orbit-colors {
      display: flex;
      align-items: center;
      gap: 7px;
    }

    .orbit-panel input[type="color"] {
      width: 42px;
      height: 30px;
      padding: 2px;
      border: 1px solid #ffffff24;
      border-radius: 5px;
      background: transparent;
    }

    .orbit-colors input[type="number"] {
      width: 65px;
      min-width: 0;
    }

    .orbit-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
    }

    .orbit-code {
      width: 100%;
      min-height: 260px;
      margin-top: 14px;
      padding: 12px;
      resize: vertical;
      border: 1px solid #ffffff24;
      border-radius: 7px;
      background: #070b15;
      color: #ccd5eb;
      font: 11px/1.6 ui-monospace, monospace !important;
    }

    .orbit-status {
      min-height: 20px;
      margin-top: 10px;
    }

    @media (prefers-reduced-motion: reduce) {
      .orbit-panel {
        transition: none;
      }
    }
  `;

  document.head.append(style);

  const root = document.createElement("div");
  root.className = "orbit-editor";
  root.dataset.backgroundEditor = "";

  root.innerHTML = `
    <button
      class="orbit-toggle"
      type="button"
      aria-expanded="false"
      aria-controls="orbit-settings-panel"
    >Settings</button>

    <aside
      id="orbit-settings-panel"
      class="orbit-panel"
      aria-label="Orbiting Silence settings"
      inert
    >
      <div class="orbit-heading">
        <h2>Orbiting Silence</h2>
        <button class="orbit-close" type="button">Retract</button>
      </div>

      <p class="orbit-description">
        Move your pointer to attract nearby arcs.
        Copy your configuration before disabling the editor.
      </p>

      <div class="orbit-controls"></div>

      <div class="orbit-actions">
        <button class="orbit-show" type="button">Show code</button>
        <button class="orbit-copy" type="button">Copy config</button>
        <button class="orbit-reset" type="button">New orbits</button>
      </div>

      <textarea
        class="orbit-code"
        aria-label="Configuration code"
        spellcheck="false"
        readonly
        hidden
      ></textarea>

      <div
        class="orbit-status"
        role="status"
        aria-live="polite"
      ></div>
    </aside>
  `;

  document.body.append(root);

  const toggle = root.querySelector(".orbit-toggle");
  const panel = root.querySelector(".orbit-panel");
  const close = root.querySelector(".orbit-close");
  const controls = root.querySelector(".orbit-controls");
  const code = root.querySelector(".orbit-code");
  const show = root.querySelector(".orbit-show");
  const status = root.querySelector(".orbit-status");

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
      const container = element("div", "orbit-control");
      const heading = element("div", "orbit-control-title");
      const label = element("label");
      const id = `orbit-${groupName}-${key}`;

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
        const row = element("div", "orbit-colors");
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

  root.querySelector(".orbit-copy").addEventListener("click", async () => {
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

  root.querySelector(".orbit-reset").addEventListener("click", () => {
    onReset();
    status.textContent = "A new orbital arrangement has been generated.";
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