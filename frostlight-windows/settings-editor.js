export function createSettingsEditor({
  config,
  onChange = () => {},
  onReset = () => {}
}) {
  const limits = {
    "frost.crystals": [5, 70, 1],
    "frost.size": [30, 250, 1],
    "frost.branching": [1, 3, 1],
    "frost.branchAngle": [15, 65, 1],
    "frost.growthSpeed": [0, 1, 0.01],
    "frost.irregularity": [0, 1, 0.01],

    "melting.radius": [30, 350, 1],
    "melting.strength": [0.5, 15, 0.1],
    "melting.refreezeDelay": [0, 10, 0.1],
    "melting.refreezeSpeed": [0.1, 3, 0.1],
    "melting.smoothing": [0.5, 20, 0.1],

    "appearance.opacity": [0, 1, 0.01],
    "appearance.lineWidth": [0.2, 3, 0.1],
    "appearance.glow": [0, 15, 0.5],
    "appearance.shimmer": [0, 1, 0.01],

    "animation.speed": [0, 3, 0.05]
  };

  const style = document.createElement("style");

  style.textContent = `
    .frost-editor {
      position:fixed; inset:0; z-index:10000;
      pointer-events:none; color:#e5edf5;
      font:13px/1.5 system-ui,sans-serif; color-scheme:dark;
    }
    .frost-editor * { box-sizing:border-box; }
    .frost-editor button,
    .frost-editor input,
    .frost-editor textarea { font:inherit; }
    .frost-editor button {
      min-height:44px; padding:8px 11px;
      border:1px solid #ffffff26; border-radius:7px;
      background:#26384b; color:inherit; cursor:pointer;
    }
    .frost-editor button:hover { background:#384f66; }
    .frost-editor :focus-visible {
      outline:2px solid #b1dced; outline-offset:3px;
    }
    .frost-toggle {
      position:absolute; top:16px; right:16px; pointer-events:auto;
    }
    .frost-panel {
      position:absolute; top:0; right:0;
      width:min(350px,100vw); height:100%; padding:22px;
      overflow:auto; overscroll-behavior:contain;
      border-left:1px solid #ffffff20;
      background:rgba(10,20,32,.94); backdrop-filter:blur(16px);
      pointer-events:auto; transform:translateX(100%);
      transition:transform 220ms ease;
    }
    .frost-panel.open { transform:translateX(0); }
    .frost-heading {
      display:flex; align-items:center; justify-content:space-between;
      gap:12px; margin-bottom:8px;
    }
    .frost-heading h2 { margin:0; font-size:18px; }
    .frost-description,
    .frost-status { color:#a9bdcf; font-size:12px; }
    .frost-description { margin:0 0 20px; }
    .frost-panel fieldset {
      min-width:0; margin:0 0 12px; padding:15px 0 8px;
      border:0; border-top:1px solid #ffffff18;
    }
    .frost-panel legend {
      padding-right:7px; color:#b7dceb; font-weight:600;
    }
    .frost-control { margin-bottom:13px; }
    .frost-control-title {
      display:flex; align-items:center; justify-content:space-between;
      gap:12px; margin-bottom:6px;
    }
    .frost-panel input[type="range"] {
      width:100%; accent-color:#a8d0e2;
    }
    .frost-panel input[type="number"] {
      width:76px; padding:5px 6px; border:1px solid #ffffff24;
      border-radius:5px; background:#ffffff08; color:inherit;
    }
    .frost-panel input[type="checkbox"] { accent-color:#a8d0e2; }
    .frost-colors { display:flex; align-items:center; gap:7px; }
    .frost-panel input[type="color"] {
      width:42px; height:32px; padding:2px;
      border:1px solid #ffffff24; border-radius:5px;
      background:transparent;
    }
    .frost-colors input[type="number"] { width:65px; min-width:0; }
    .frost-actions {
      display:flex; flex-wrap:wrap; gap:8px; margin-top:10px;
    }
    .frost-code {
      width:100%; min-height:260px; margin-top:14px; padding:12px;
      resize:vertical; border:1px solid #ffffff24; border-radius:7px;
      background:#060e19; color:#ccdfed;
      font:11px/1.6 ui-monospace,monospace !important;
    }
    .frost-status { min-height:20px; margin-top:10px; }
    @media(prefers-reduced-motion:reduce) {
      .frost-panel { transition:none; }
    }
  `;

  document.head.append(style);

  const root = document.createElement("div");
  root.className = "frost-editor";
  root.dataset.backgroundEditor = "";

  root.innerHTML = `
    <button class="frost-toggle" type="button"
      aria-expanded="false" aria-controls="frost-settings-panel">
      Settings
    </button>

    <aside id="frost-settings-panel" class="frost-panel"
      aria-label="Frostlight Windows settings" inert>
      <div class="frost-heading">
        <h2>Frostlight Windows</h2>
        <button class="frost-close" type="button">Retract</button>
      </div>

      <p class="frost-description">
        Move your pointer to melt the frost.
        Copy your configuration before disabling the editor.
      </p>

      <div class="frost-controls"></div>

      <div class="frost-actions">
        <button class="frost-show" type="button">Show code</button>
        <button class="frost-copy" type="button">Copy config</button>
        <button class="frost-reset" type="button">New frost</button>
      </div>

      <textarea class="frost-code" aria-label="Configuration code"
        spellcheck="false" readonly hidden></textarea>

      <div class="frost-status" role="status" aria-live="polite"></div>
    </aside>
  `;

  document.body.append(root);

  const toggle = root.querySelector(".frost-toggle");
  const panel = root.querySelector(".frost-panel");
  const close = root.querySelector(".frost-close");
  const controls = root.querySelector(".frost-controls");
  const code = root.querySelector(".frost-code");
  const show = root.querySelector(".frost-show");
  const status = root.querySelector(".frost-status");

  const title = value => value
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, letter => letter.toUpperCase());

  const exportCode = () =>
    `const config = ${JSON.stringify(config, null, 2)};`;

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
      const container = element("div", "frost-control");
      const heading = element("div", "frost-control-title");
      const label = element("label");
      const id = `frost-${groupName}-${key}`;

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
        const row = element("div", "frost-colors");
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

  root.querySelector(".frost-copy").addEventListener("click", async () => {
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

  root.querySelector(".frost-reset").addEventListener("click", () => {
    onReset();
    status.textContent = "A new frost pattern has been generated.";
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