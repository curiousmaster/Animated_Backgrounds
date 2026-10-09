export function createSettingsEditor({
  config,
  onChange = () => {},
  onReset = () => {}
}) {
  const limits = {
    "signals.count": [1, 120, 1],
    "signals.width": [60, 400, 1],
    "signals.height": [15, 120, 1],
    "signals.speed": [0, 60, 0.5],
    "signals.frequency": [0.2, 4, 0.05],
    "signals.noise": [0, 2, 0.01],
    "signals.flicker": [0, 1, 0.01],
    "signals.decay": [0, 1, 0.01],

    "tuning.radius": [40, 600, 1],
    "tuning.strength": [0, 3, 0.05],
    "tuning.smoothing": [0.5, 20, 0.1],
    "tuning.release": [0.1, 10, 0.1],

    "appearance.opacity": [0, 1, 0.01],
    "appearance.lineWidth": [0.2, 3, 0.1],
    "appearance.glow": [0, 30, 0.5],
    "appearance.gridOpacity": [0, 0.3, 0.005],

    "animation.speed": [0, 3, 0.05]
  };

  const style = document.createElement("style");

  style.textContent = `
    .signal-editor {
      position: fixed;
      inset: 0;
      z-index: 10000;
      pointer-events: none;
      color: #e2efed;
      font: 13px/1.5 system-ui, sans-serif;
      color-scheme: dark;
    }

    .signal-editor *,
    .signal-editor *::before,
    .signal-editor *::after {
      box-sizing: border-box;
    }

    .signal-editor button,
    .signal-editor input,
    .signal-editor textarea {
      font: inherit;
    }

    .signal-editor button {
      border: 1px solid #ffffff26;
      border-radius: 7px;
      background: #172c32;
      color: inherit;
      padding: 8px 11px;
      cursor: pointer;
    }

    .signal-editor button:hover {
      background: #23424a;
    }

    .signal-editor :focus-visible {
      outline: 2px solid #9ce0d0;
      outline-offset: 3px;
    }

    .signal-toggle {
      position: absolute;
      top: 16px;
      right: 16px;
      pointer-events: auto;
    }

    .signal-panel {
      position: absolute;
      top: 0;
      right: 0;
      width: min(350px, 100vw);
      height: 100%;
      padding: 22px;
      overflow: auto;
      background: rgba(7, 19, 25, 0.94);
      border-left: 1px solid #ffffff20;
      backdrop-filter: blur(16px);
      pointer-events: auto;
      transform: translateX(100%);
      transition: transform 220ms ease;
    }

    .signal-panel.open {
      transform: translateX(0);
    }

    .signal-heading {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }

    .signal-heading h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }

    .signal-description {
      margin: 0 0 20px;
      color: #a0b6b8;
      font-size: 12px;
    }

    .signal-panel fieldset {
      border: 0;
      border-top: 1px solid #ffffff18;
      padding: 15px 0 8px;
      margin: 0 0 12px;
      min-width: 0;
    }

    .signal-panel legend {
      padding: 0 7px 0 0;
      font-weight: 600;
      color: #a1ded1;
    }

    .signal-control {
      display: block;
      margin-bottom: 13px;
    }

    .signal-control-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin-bottom: 6px;
    }

    .signal-panel input[type="range"] {
      width: 100%;
      accent-color: #99d8c9;
    }

    .signal-panel input[type="number"] {
      width: 76px;
      padding: 4px 6px;
      border: 1px solid #ffffff24;
      border-radius: 5px;
      background: #ffffff08;
      color: inherit;
    }

    .signal-panel input[type="checkbox"] {
      accent-color: #99d8c9;
    }

    .signal-colors {
      display: flex;
      gap: 7px;
      align-items: center;
    }

    .signal-panel input[type="color"] {
      width: 42px;
      height: 30px;
      padding: 2px;
      border: 1px solid #ffffff24;
      border-radius: 5px;
      background: transparent;
    }

    .signal-colors input[type="number"] {
      width: 65px;
      min-width: 0;
    }

    .signal-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
    }

    .signal-code {
      width: 100%;
      min-height: 260px;
      margin-top: 14px;
      padding: 12px;
      resize: vertical;
      border: 1px solid #ffffff24;
      border-radius: 7px;
      background: #030c12;
      color: #c1e5dc;
      font: 11px/1.6 ui-monospace, monospace !important;
    }

    .signal-status {
      min-height: 20px;
      margin-top: 10px;
      color: #a0b6b8;
      font-size: 12px;
    }

    @media (prefers-reduced-motion: reduce) {
      .signal-panel {
        transition: none;
      }
    }
  `;

  document.head.append(style);

  const root = document.createElement("div");
  root.className = "signal-editor";
  root.dataset.backgroundEditor = "";

  root.innerHTML = `
    <button
      class="signal-toggle"
      type="button"
      aria-expanded="false"
      aria-controls="signal-settings-panel"
    >Settings</button>

    <aside
      id="signal-settings-panel"
      class="signal-panel"
      aria-label="Signal Archaeology settings"
      inert
    >
      <div class="signal-heading">
        <h2>Signal Archaeology</h2>
        <button class="signal-close" type="button">Retract</button>
      </div>

      <p class="signal-description">
        Tune the atmosphere in real time. Copy the configuration
        before disabling the editor.
      </p>

      <div class="signal-controls"></div>

      <div class="signal-actions">
        <button class="signal-show" type="button">Show code</button>
        <button class="signal-copy" type="button">Copy config</button>
        <button class="signal-reset" type="button">New signals</button>
      </div>

      <textarea
        class="signal-code"
        aria-label="Configuration code"
        spellcheck="false"
        readonly
        hidden
      ></textarea>

      <div class="signal-status" role="status" aria-live="polite"></div>
    </aside>
  `;

  document.body.append(root);

  const toggle = root.querySelector(".signal-toggle");
  const panel = root.querySelector(".signal-panel");
  const close = root.querySelector(".signal-close");
  const controls = root.querySelector(".signal-controls");
  const code = root.querySelector(".signal-code");
  const show = root.querySelector(".signal-show");
  const status = root.querySelector(".signal-status");

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
      root.hidden = true;
    }
  }

  function setOpen(open) {
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
      const container = makeElement("div", "signal-control");
      const heading = makeElement("div", "signal-control-title");
      const label = makeElement("label");
      const id = `signal-${groupName}-${key}`;

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
        const row = makeElement("div", "signal-colors");
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

            group[key][index] = Math.max(
              0,
              Math.min(255, Math.round(Number(input.value)))
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

        for (const input of [number, range]) {
          input.min = min;
          input.max = max;
          input.step = step;
          input.value = value;

          input.addEventListener("input", () => {
            if (input.value === "") return;

            const parsed = Number(input.value);
            if (!Number.isFinite(parsed)) return;

            group[key] = Math.max(min, Math.min(max, parsed));

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

  root.querySelector(".signal-copy").addEventListener("click", async () => {
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

  root.querySelector(".signal-reset").addEventListener("click", () => {
    onReset();
    status.textContent = "A new set of signals has been generated.";
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