export function createSettingsEditor({
  config,
  onChange = () => {},
  onReset = () => {}
}) {
  const limits = {
    "ribbons.count": [5, 180, 1],
    "ribbons.speed": [10, 150, 1],
    "ribbons.strokeWidth": [0.2, 4, 0.1],
    "ribbons.trailLifetime": [0.3, 10, 0.1],
    "ribbons.opacity": [0, 1, 0.01],
    "ribbons.glow": [0, 20, 0.5],

    "gravity.wells": [0, 10, 1],
    "gravity.strength": [0, 200, 1],
    "gravity.radius": [40, 600, 1],
    "gravity.swirl": [-200, 200, 1],
    "gravity.wandering": [0, 250, 1],
    "gravity.wanderingSpeed": [0, 1, 0.01],

    "mouse.radius": [40, 500, 1],
    "mouse.attraction": [0, 350, 1],
    "mouse.swirl": [-200, 200, 1],
    "mouse.smoothing": [0.5, 20, 0.1],

    "pulse.strength": [0, 400, 1],
    "pulse.swirl": [-250, 250, 1],
    "pulse.speed": [50, 600, 1],
    "pulse.width": [20, 200, 1],
    "pulse.lifetime": [0.5, 6, 0.1],

    "animation.speed": [0, 3, 0.05]
  };

  const style = document.createElement("style");
  style.textContent = `
    .calligraphy-editor {
      position:fixed; inset:0; z-index:10000;
      pointer-events:none; color:#e6eaf4;
      font:13px/1.5 system-ui,sans-serif; color-scheme:dark;
    }
    .calligraphy-editor * { box-sizing:border-box; }
    .calligraphy-editor button,
    .calligraphy-editor input,
    .calligraphy-editor textarea { font:inherit; }
    .calligraphy-editor button {
      min-height:44px; padding:8px 11px;
      border:1px solid #ffffff26; border-radius:7px;
      background:#293248; color:inherit; cursor:pointer;
    }
    .calligraphy-editor button:hover { background:#3b4761; }
    .calligraphy-editor :focus-visible {
      outline:2px solid #a8d7e8; outline-offset:3px;
    }
    .calligraphy-toggle {
      position:absolute; top:16px; right:16px; pointer-events:auto;
    }
    .calligraphy-panel {
      position:absolute; top:0; right:0;
      width:min(350px,100vw); height:100%; padding:22px;
      overflow:auto; overscroll-behavior:contain;
      border-left:1px solid #ffffff20;
      background:rgba(11,17,31,.94); backdrop-filter:blur(16px);
      pointer-events:auto; transform:translateX(100%);
      transition:transform 220ms ease;
    }
    .calligraphy-panel.open { transform:translateX(0); }
    .calligraphy-heading {
      display:flex; align-items:center; justify-content:space-between;
      gap:12px; margin-bottom:8px;
    }
    .calligraphy-heading h2 { margin:0; font-size:18px; }
    .calligraphy-description,
    .calligraphy-status { color:#a9b8cb; font-size:12px; }
    .calligraphy-description { margin:0 0 20px; }
    .calligraphy-panel fieldset {
      min-width:0; margin:0 0 12px; padding:15px 0 8px;
      border:0; border-top:1px solid #ffffff18;
    }
    .calligraphy-panel legend {
      padding-right:7px; color:#b4d8e8; font-weight:600;
    }
    .calligraphy-control { margin-bottom:13px; }
    .calligraphy-control-title {
      display:flex; align-items:center; justify-content:space-between;
      gap:12px; margin-bottom:6px;
    }
    .calligraphy-panel input[type="range"] {
      width:100%; accent-color:#a0cddd;
    }
    .calligraphy-panel input[type="number"] {
      width:76px; padding:5px 6px; border:1px solid #ffffff24;
      border-radius:5px; background:#ffffff08; color:inherit;
    }
    .calligraphy-panel input[type="checkbox"] {
      accent-color:#a0cddd;
    }
    .calligraphy-colors { display:flex; align-items:center; gap:7px; }
    .calligraphy-panel input[type="color"] {
      width:42px; height:32px; padding:2px;
      border:1px solid #ffffff24; border-radius:5px;
      background:transparent;
    }
    .calligraphy-colors input[type="number"] {
      width:65px; min-width:0;
    }
    .calligraphy-actions {
      display:flex; flex-wrap:wrap; gap:8px; margin-top:10px;
    }
    .calligraphy-code {
      width:100%; min-height:260px; margin-top:14px; padding:12px;
      resize:vertical; border:1px solid #ffffff24; border-radius:7px;
      background:#060c17; color:#cbddeb;
      font:11px/1.6 ui-monospace,monospace !important;
    }
    .calligraphy-status { min-height:20px; margin-top:10px; }
    @media(prefers-reduced-motion:reduce) {
      .calligraphy-panel { transition:none; }
    }
  `;
  document.head.append(style);

  const root = document.createElement("div");
  root.className = "calligraphy-editor";
  root.dataset.backgroundEditor = "";

  root.innerHTML = `
    <button class="calligraphy-toggle" type="button"
      aria-expanded="false" aria-controls="calligraphy-panel">
      Settings
    </button>
    <aside id="calligraphy-panel" class="calligraphy-panel"
      aria-label="Gravity Calligraphy settings" inert>
      <div class="calligraphy-heading">
        <h2>Gravity Calligraphy</h2>
        <button class="calligraphy-close" type="button">Retract</button>
      </div>
      <p class="calligraphy-description">
        Move to attract the ribbons. Click or tap to release a pulse.
        Copy your configuration before disabling the editor.
      </p>
      <div class="calligraphy-controls"></div>
      <div class="calligraphy-actions">
        <button class="calligraphy-show" type="button">Show code</button>
        <button class="calligraphy-copy" type="button">Copy config</button>
        <button class="calligraphy-reset" type="button">New ribbons</button>
      </div>
      <textarea class="calligraphy-code" aria-label="Configuration code"
        spellcheck="false" readonly hidden></textarea>
      <div class="calligraphy-status" role="status" aria-live="polite"></div>
    </aside>
  `;
  document.body.append(root);

  const toggle = root.querySelector(".calligraphy-toggle");
  const panel = root.querySelector(".calligraphy-panel");
  const close = root.querySelector(".calligraphy-close");
  const controls = root.querySelector(".calligraphy-controls");
  const code = root.querySelector(".calligraphy-code");
  const show = root.querySelector(".calligraphy-show");
  const status = root.querySelector(".calligraphy-status");

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
      const container = element("div", "calligraphy-control");
      const heading = element("div", "calligraphy-control-title");
      const label = element("label");
      const id = `calligraphy-${groupName}-${key}`;

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
        const row = element("div", "calligraphy-colors");
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

  root.querySelector(".calligraphy-copy").addEventListener("click", async () => {
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

  root.querySelector(".calligraphy-reset").addEventListener("click", () => {
    onReset();
    status.textContent = "New ribbons and gravity wells generated.";
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