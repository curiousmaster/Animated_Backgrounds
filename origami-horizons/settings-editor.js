export function createSettingsEditor({
  config,
  onChange = () => {},
  onReset = () => {}
}) {
  const limits = {
    "folds.columns": [4, 40, 1],
    "folds.rows": [4, 35, 1],
    "folds.height": [0, 220, 1],
    "folds.speed": [0, 2, 0.01],
    "folds.irregularity": [0, 0.8, 0.01],

    "perspective.tilt": [0, 75, 1],
    "perspective.distance": [500, 3000, 10],
    "perspective.scale": [0.3, 2, 0.01],
    "perspective.verticalOffset": [-300, 300, 1],

    "mouse.radius": [40, 500, 1],
    "mouse.lift": [0, 300, 1],
    "mouse.smoothing": [0.5, 20, 0.1],

    "appearance.opacity": [0, 1, 0.01],
    "appearance.edgeOpacity": [0, 1, 0.01],
    "appearance.edgeWidth": [0.2, 3, 0.1],
    "appearance.lighting": [0, 1, 0.01],
    "appearance.lightDirection": [-180, 180, 1],

    "animation.speed": [0, 3, 0.05]
  };

  const style = document.createElement("style");

  style.textContent = `
    .origami-editor {
      position: fixed;
      inset: 0;
      z-index: 10000;
      pointer-events: none;
      color: #e5eaf5;
      font: 13px/1.5 system-ui, sans-serif;
      color-scheme: dark;
    }

    .origami-editor * {
      box-sizing: border-box;
    }

    .origami-editor button,
    .origami-editor input,
    .origami-editor textarea {
      font: inherit;
    }

    .origami-editor button {
      padding: 8px 11px;
      border: 1px solid #ffffff26;
      border-radius: 7px;
      background: #293148;
      color: inherit;
      cursor: pointer;
    }

    .origami-editor button:hover {
      background: #3b4660;
    }

    .origami-editor :focus-visible {
      outline: 2px solid #b7c9ed;
      outline-offset: 3px;
    }

    .origami-toggle {
      position: absolute;
      top: 16px;
      right: 16px;
      pointer-events: auto;
    }

    .origami-panel {
      position: absolute;
      top: 0;
      right: 0;
      width: min(350px, 100vw);
      height: 100%;
      padding: 22px;
      overflow: auto;
      border-left: 1px solid #ffffff20;
      background: rgba(12, 18, 32, 0.94);
      backdrop-filter: blur(16px);
      pointer-events: auto;
      transform: translateX(100%);
      transition: transform 220ms ease;
    }

    .origami-panel.open {
      transform: translateX(0);
    }

    .origami-heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 8px;
    }

    .origami-heading h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }

    .origami-description,
    .origami-status {
      color: #a9b5ca;
      font-size: 12px;
    }

    .origami-description {
      margin: 0 0 20px;
    }

    .origami-panel fieldset {
      min-width: 0;
      margin: 0 0 12px;
      padding: 15px 0 8px;
      border: 0;
      border-top: 1px solid #ffffff18;
    }

    .origami-panel legend {
      padding-right: 7px;
      color: #bbc9e5;
      font-weight: 600;
    }

    .origami-control {
      margin-bottom: 13px;
    }

    .origami-control-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 6px;
    }

    .origami-panel input[type="range"] {
      width: 100%;
      accent-color: #aabbde;
    }

    .origami-panel input[type="number"] {
      width: 76px;
      padding: 4px 6px;
      border: 1px solid #ffffff24;
      border-radius: 5px;
      background: #ffffff08;
      color: inherit;
    }

    .origami-panel input[type="checkbox"] {
      accent-color: #aabbde;
    }

    .origami-colors {
      display: flex;
      align-items: center;
      gap: 7px;
    }

    .origami-panel input[type="color"] {
      width: 42px;
      height: 30px;
      padding: 2px;
      border: 1px solid #ffffff24;
      border-radius: 5px;
      background: transparent;
    }

    .origami-colors input[type="number"] {
      width: 65px;
      min-width: 0;
    }

    .origami-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
    }

    .origami-code {
      width: 100%;
      min-height: 260px;
      margin-top: 14px;
      padding: 12px;
      resize: vertical;
      border: 1px solid #ffffff24;
      border-radius: 7px;
      background: #070c17;
      color: #cdd9ed;
      font: 11px/1.6 ui-monospace, monospace !important;
    }

    .origami-status {
      min-height: 20px;
      margin-top: 10px;
    }

    @media (prefers-reduced-motion: reduce) {
      .origami-panel {
        transition: none;
      }
    }
  `;

  document.head.append(style);

  const root = document.createElement("div");
  root.className = "origami-editor";
  root.dataset.backgroundEditor = "";

  root.innerHTML = `
    <button
      class="origami-toggle"
      type="button"
      aria-expanded="false"
      aria-controls="origami-settings-panel"
    >Settings</button>

    <aside
      id="origami-settings-panel"
      class="origami-panel"
      aria-label="Origami Horizons settings"
      inert
    >
      <div class="origami-heading">
        <h2>Origami Horizons</h2>
        <button class="origami-close" type="button">Retract</button>
      </div>

      <p class="origami-description">
        Move your pointer to lift nearby folds.
        Copy your configuration before disabling the editor.
      </p>

      <div class="origami-controls"></div>

      <div class="origami-actions">
        <button class="origami-show" type="button">Show code</button>
        <button class="origami-copy" type="button">Copy config</button>
        <button class="origami-reset" type="button">New folds</button>
      </div>

      <textarea
        class="origami-code"
        aria-label="Configuration code"
        spellcheck="false"
        readonly
        hidden
      ></textarea>

      <div
        class="origami-status"
        role="status"
        aria-live="polite"
      ></div>
    </aside>
  `;

  document.body.append(root);

  const toggle = root.querySelector(".origami-toggle");
  const panel = root.querySelector(".origami-panel");
  const close = root.querySelector(".origami-close");
  const controls = root.querySelector(".origami-controls");
  const code = root.querySelector(".origami-code");
  const show = root.querySelector(".origami-show");
  const status = root.querySelector(".origami-status");

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
      const container = element("div", "origami-control");
      const heading = element("div", "origami-control-title");
      const label = element("label");
      const id = `origami-${groupName}-${key}`;

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
        const row = element("div", "origami-colors");
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

  root.querySelector(".origami-copy").addEventListener("click", async () => {
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

  root.querySelector(".origami-reset").addEventListener("click", () => {
    onReset();
    status.textContent = "A new fold pattern has been generated.";
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