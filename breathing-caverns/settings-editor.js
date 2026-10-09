export function createSettingsEditor({
  config,
  onChange = () => {},
  onReset = () => {}
}) {
  const limits = {
    "cavern.layers": [1, 16, 1],
    "cavern.opening": [0.05, 0.4, 0.005],
    "cavern.depth": [0.025, 0.15, 0.005],
    "cavern.irregularity": [0, 0.35, 0.005],
    "cavern.detail": [3, 20, 1],
    "cavern.rotation": [-180, 180, 1],
    "cavern.ellipticity": [0.3, 1.4, 0.01],

    "breathing.speed": [0.02, 1.5, 0.01],
    "breathing.amplitude": [0, 0.08, 0.001],
    "breathing.phaseDelay": [0, 1, 0.01],
    "breathing.drift": [0, 0.08, 0.001],

    "mouse.parallax": [0, 150, 1],
    "mouse.smoothing": [0.5, 20, 0.1],
    "mouse.lightStrength": [0, 2, 0.05],

    "appearance.edgeOpacity": [0, 1, 0.01],
    "appearance.edgeWidth": [0.2, 4, 0.1],
    "appearance.glow": [0, 40, 1],
    "appearance.ambientLight": [0, 1, 0.01],

    "animation.speed": [0, 3, 0.05]
  };

  const style = document.createElement("style");

  style.textContent = `
    .cavern-editor {
      position: fixed;
      inset: 0;
      z-index: 10000;
      pointer-events: none;
      color: #e1eaf0;
      font: 13px/1.5 system-ui, sans-serif;
      color-scheme: dark;
    }

    .cavern-editor *,
    .cavern-editor *::before,
    .cavern-editor *::after {
      box-sizing: border-box;
    }

    .cavern-editor button,
    .cavern-editor input,
    .cavern-editor textarea {
      font: inherit;
    }

    .cavern-editor button {
      padding: 8px 11px;
      border: 1px solid #ffffff26;
      border-radius: 7px;
      background: #20303d;
      color: inherit;
      cursor: pointer;
    }

    .cavern-editor button:hover {
      background: #304857;
    }

    .cavern-editor :focus-visible {
      outline: 2px solid #9bd2d4;
      outline-offset: 3px;
    }

    .cavern-toggle {
      position: absolute;
      top: 16px;
      right: 16px;
      pointer-events: auto;
    }

    .cavern-panel {
      position: absolute;
      top: 0;
      right: 0;
      width: min(350px, 100vw);
      height: 100%;
      padding: 22px;
      overflow: auto;
      border-left: 1px solid #ffffff20;
      background: rgba(9, 17, 25, 0.94);
      backdrop-filter: blur(16px);
      pointer-events: auto;
      transform: translateX(100%);
      transition: transform 220ms ease;
    }

    .cavern-panel.open {
      transform: translateX(0);
    }

    .cavern-heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 8px;
    }

    .cavern-heading h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }

    .cavern-description {
      margin: 0 0 20px;
      color: #9fb1bd;
      font-size: 12px;
    }

    .cavern-panel fieldset {
      min-width: 0;
      margin: 0 0 12px;
      padding: 15px 0 8px;
      border: 0;
      border-top: 1px solid #ffffff18;
    }

    .cavern-panel legend {
      padding: 0 7px 0 0;
      color: #a0d1d3;
      font-weight: 600;
    }

    .cavern-control {
      margin-bottom: 13px;
    }

    .cavern-control-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 6px;
    }

    .cavern-panel input[type="range"] {
      width: 100%;
      accent-color: #91c7cd;
    }

    .cavern-panel input[type="number"] {
      width: 76px;
      padding: 4px 6px;
      border: 1px solid #ffffff24;
      border-radius: 5px;
      background: #ffffff08;
      color: inherit;
    }

    .cavern-panel input[type="checkbox"] {
      accent-color: #91c7cd;
    }

    .cavern-colors {
      display: flex;
      align-items: center;
      gap: 7px;
    }

    .cavern-panel input[type="color"] {
      width: 42px;
      height: 30px;
      padding: 2px;
      border: 1px solid #ffffff24;
      border-radius: 5px;
      background: transparent;
    }

    .cavern-colors input[type="number"] {
      width: 65px;
      min-width: 0;
    }

    .cavern-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
    }

    .cavern-code {
      width: 100%;
      min-height: 260px;
      margin-top: 14px;
      padding: 12px;
      resize: vertical;
      border: 1px solid #ffffff24;
      border-radius: 7px;
      background: #050c13;
      color: #bfd7df;
      font: 11px/1.6 ui-monospace, monospace !important;
    }

    .cavern-status {
      min-height: 20px;
      margin-top: 10px;
      color: #9fb1bd;
      font-size: 12px;
    }

    @media (prefers-reduced-motion: reduce) {
      .cavern-panel {
        transition: none;
      }
    }
  `;

  document.head.append(style);

  const root = document.createElement("div");
  root.className = "cavern-editor";
  root.dataset.backgroundEditor = "";

  root.innerHTML = `
    <button
      class="cavern-toggle"
      type="button"
      aria-expanded="false"
      aria-controls="cavern-settings-panel"
    >Settings</button>

    <aside
      id="cavern-settings-panel"
      class="cavern-panel"
      aria-label="Breathing Caverns settings"
      inert
    >
      <div class="cavern-heading">
        <h2>Breathing Caverns</h2>
        <button class="cavern-close" type="button">Retract</button>
      </div>

      <p class="cavern-description">
        Adjust depth, breathing, and illumination.
        Copy your configuration before disabling the editor.
      </p>

      <div class="cavern-controls"></div>

      <div class="cavern-actions">
        <button class="cavern-show" type="button">Show code</button>
        <button class="cavern-copy" type="button">Copy config</button>
        <button class="cavern-reset" type="button">New cavern</button>
      </div>

      <textarea
        class="cavern-code"
        aria-label="Configuration code"
        spellcheck="false"
        readonly
        hidden
      ></textarea>

      <div
        class="cavern-status"
        role="status"
        aria-live="polite"
      ></div>
    </aside>
  `;

  document.body.append(root);

  const toggle = root.querySelector(".cavern-toggle");
  const panel = root.querySelector(".cavern-panel");
  const close = root.querySelector(".cavern-close");
  const controls = root.querySelector(".cavern-controls");
  const code = root.querySelector(".cavern-code");
  const show = root.querySelector(".cavern-show");
  const status = root.querySelector(".cavern-status");

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
      const container = makeElement("div", "cavern-control");
      const heading = makeElement("div", "cavern-control-title");
      const label = makeElement("label");
      const id = `cavern-${groupName}-${key}`;

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
        const row = makeElement("div", "cavern-colors");
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

  root.querySelector(".cavern-copy").addEventListener("click", async () => {
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

  root.querySelector(".cavern-reset").addEventListener("click", () => {
    onReset();
    status.textContent = "A new cavern has been generated.";
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