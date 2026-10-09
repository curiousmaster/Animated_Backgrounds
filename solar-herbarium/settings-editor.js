export function createSettingsEditor({
  config,
  onChange = () => {},
  onReset = () => {}
}) {
  const limits = {
    "plants.count": [1, 60, 1],
    "plants.height": [80, 600, 1],
    "plants.leaves": [2, 14, 1],
    "plants.leafLength": [20, 150, 1],
    "plants.leafWidth": [5, 60, 1],
    "plants.leafShape": [0, 1, 0.01],
    "plants.unfurlSpeed": [0, 1, 0.01],
    "plants.sway": [0, 50, 1],

    "veins.detail": [2, 15, 1],
    "veins.opacity": [0, 1, 0.01],
    "veins.width": [0.2, 2, 0.1],

    "light.direction": [-180, 180, 1],
    "light.bandWidth": [30, 400, 1],
    "light.spacing": [100, 1000, 1],
    "light.speed": [0, 100, 1],
    "light.strength": [0, 1, 0.01],

    "mouse.radius": [40, 400, 1],
    "mouse.strength": [0, 2, 0.01],
    "mouse.smoothing": [0.5, 20, 0.1],

    "appearance.translucency": [0, 0.8, 0.01],
    "appearance.edgeOpacity": [0, 1, 0.01],
    "appearance.stemOpacity": [0, 1, 0.01],

    "animation.speed": [0, 3, 0.05]
  };

  const style = document.createElement("style");
  style.textContent = `
    .herb-editor {
      position: fixed; inset: 0; z-index: 10000;
      pointer-events: none; color: #e5eee5;
      font: 13px/1.5 system-ui, sans-serif; color-scheme: dark;
    }
    .herb-editor * { box-sizing: border-box; }
    .herb-editor button, .herb-editor input, .herb-editor textarea {
      font: inherit;
    }
    .herb-editor button {
      padding: 8px 11px; border: 1px solid #ffffff26;
      border-radius: 7px; background: #29392e;
      color: inherit; cursor: pointer;
    }
    .herb-editor button:hover { background: #3c5140; }
    .herb-editor :focus-visible {
      outline: 2px solid #bfd5a0; outline-offset: 3px;
    }
    .herb-toggle {
      position: absolute; top: 16px; right: 16px; pointer-events: auto;
    }
    .herb-panel {
      position: absolute; top: 0; right: 0;
      width: min(350px, 100vw); height: 100%; padding: 22px;
      overflow: auto; border-left: 1px solid #ffffff20;
      background: rgba(10, 22, 17, 0.94); backdrop-filter: blur(16px);
      pointer-events: auto; transform: translateX(100%);
      transition: transform 220ms ease;
    }
    .herb-panel.open { transform: translateX(0); }
    .herb-heading {
      display: flex; align-items: center; justify-content: space-between;
      gap: 12px; margin-bottom: 8px;
    }
    .herb-heading h2 { margin: 0; font-size: 18px; font-weight: 600; }
    .herb-description, .herb-status { color: #a9bca8; font-size: 12px; }
    .herb-description { margin: 0 0 20px; }
    .herb-panel fieldset {
      min-width: 0; margin: 0 0 12px; padding: 15px 0 8px;
      border: 0; border-top: 1px solid #ffffff18;
    }
    .herb-panel legend {
      padding-right: 7px; color: #c1d4a8; font-weight: 600;
    }
    .herb-control { margin-bottom: 13px; }
    .herb-control-title {
      display: flex; align-items: center; justify-content: space-between;
      gap: 12px; margin-bottom: 6px;
    }
    .herb-panel input[type="range"] {
      width: 100%; accent-color: #b4cc97;
    }
    .herb-panel input[type="number"] {
      width: 76px; padding: 4px 6px; border: 1px solid #ffffff24;
      border-radius: 5px; background: #ffffff08; color: inherit;
    }
    .herb-panel input[type="checkbox"] { accent-color: #b4cc97; }
    .herb-colors { display: flex; align-items: center; gap: 7px; }
    .herb-panel input[type="color"] {
      width: 42px; height: 30px; padding: 2px;
      border: 1px solid #ffffff24; border-radius: 5px;
      background: transparent;
    }
    .herb-colors input[type="number"] { width: 65px; min-width: 0; }
    .herb-actions {
      display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px;
    }
    .herb-code {
      width: 100%; min-height: 260px; margin-top: 14px; padding: 12px;
      resize: vertical; border: 1px solid #ffffff24; border-radius: 7px;
      background: #060f0b; color: #d1e1c3;
      font: 11px/1.6 ui-monospace, monospace !important;
    }
    .herb-status { min-height: 20px; margin-top: 10px; }
    @media (prefers-reduced-motion: reduce) {
      .herb-panel { transition: none; }
    }
  `;
  document.head.append(style);

  const root = document.createElement("div");
  root.className = "herb-editor";
  root.dataset.backgroundEditor = "";
  root.innerHTML = `
    <button class="herb-toggle" type="button"
      aria-expanded="false" aria-controls="herb-settings-panel">
      Settings
    </button>
    <aside id="herb-settings-panel" class="herb-panel"
      aria-label="Solar Herbarium settings" inert>
      <div class="herb-heading">
        <h2>Solar Herbarium</h2>
        <button class="herb-close" type="button">Retract</button>
      </div>
      <p class="herb-description">
        Move your pointer to illuminate the foliage.
        Copy your configuration before disabling the editor.
      </p>
      <div class="herb-controls"></div>
      <div class="herb-actions">
        <button class="herb-show" type="button">Show code</button>
        <button class="herb-copy" type="button">Copy config</button>
        <button class="herb-reset" type="button">New foliage</button>
      </div>
      <textarea class="herb-code" aria-label="Configuration code"
        spellcheck="false" readonly hidden></textarea>
      <div class="herb-status" role="status" aria-live="polite"></div>
    </aside>
  `;
  document.body.append(root);

  const toggle = root.querySelector(".herb-toggle");
  const panel = root.querySelector(".herb-panel");
  const close = root.querySelector(".herb-close");
  const controls = root.querySelector(".herb-controls");
  const code = root.querySelector(".herb-code");
  const show = root.querySelector(".herb-show");
  const status = root.querySelector(".herb-status");

  const title = value => value
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, letter => letter.toUpperCase());

  const exportCode = () =>
    `const config = ${JSON.stringify(config, null, 2)};`;

  function setOpen(open) {
    toggle.hidden = false;
    if (!open && panel.contains(document.activeElement)) toggle.focus();
    panel.classList.toggle("open", open);
    panel.inert = !open;
    toggle.hidden = open;
    toggle.setAttribute("aria-expanded", String(open));
    if (open) close.focus();
  }

  function changed() {
    code.value = exportCode();
    onChange();
    if (!config.panel.enabled) {
      setOpen(false);
      root.hidden = true;
    }
  }

  function element(tag, className) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }

  const toHex = color => "#" + color.map(value =>
    Math.round(value).toString(16).padStart(2, "0")
  ).join("");

  for (const [groupName, group] of Object.entries(config)) {
    const fieldset = element("fieldset");
    const legend = element("legend");
    legend.textContent = title(groupName);
    fieldset.append(legend);

    for (const [key, value] of Object.entries(group)) {
      const path = `${groupName}.${key}`;
      const container = element("div", "herb-control");
      const heading = element("div", "herb-control-title");
      const label = element("label");
      const id = `herb-${groupName}-${key}`;
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
        const row = element("div", "herb-colors");
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
              0, Math.min(255, Math.round(parsed))
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
          const stepped = min + Math.round((clamped - min) / step) * step;
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

  root.querySelector(".herb-copy").addEventListener("click", async () => {
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

  root.querySelector(".herb-reset").addEventListener("click", () => {
    onReset();
    status.textContent = "A new arrangement of foliage has been generated.";
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