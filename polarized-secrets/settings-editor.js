export function createSettingsEditor({
  config,
  onChange = () => {},
  onReset = () => {}
}) {
  const limits = {
    "patterns.spacing": [30, 150, 1],
    "patterns.layers": [1, 5, 1],
    "patterns.size": [5, 50, 1],
    "patterns.lineWidth": [0.2, 3, 0.1],
    "patterns.rotationSpeed": [0, 0.5, 0.01],

    "polarization.angle": [0, 180, 1],
    "polarization.layerSeparation": [10, 90, 1],
    "polarization.contrast": [0.5, 6, 0.1],
    "polarization.concealedOpacity": [0, 0.2, 0.005],

    "lens.radius": [40, 400, 1],
    "lens.softness": [0.05, 1, 0.01],
    "lens.strength": [0, 1, 0.01],
    "lens.smoothing": [0.5, 20, 0.1],
    "lens.scrollSensitivity": [0.01, 0.3, 0.01],

    "appearance.glow": [0, 20, 0.5],

    "animation.speed": [0, 3, 0.05]
  };

  const bindings = [];

  const style = document.createElement("style");
  style.textContent = `
    .polar-editor {
      position:fixed; inset:0; z-index:10000;
      pointer-events:none; color:#e6eaf4;
      font:13px/1.5 system-ui,sans-serif; color-scheme:dark;
    }
    .polar-editor * { box-sizing:border-box; }
    .polar-editor button,
    .polar-editor input,
    .polar-editor textarea { font:inherit; }
    .polar-editor button {
      min-height:44px; padding:8px 11px;
      border:1px solid #ffffff26; border-radius:7px;
      background:#293447; color:inherit; cursor:pointer;
    }
    .polar-editor button:hover { background:#3c4a61; }
    .polar-editor :focus-visible {
      outline:2px solid #acd6e5; outline-offset:3px;
    }
    .polar-toggle {
      position:absolute; top:16px; right:16px; pointer-events:auto;
    }
    .polar-panel {
      position:absolute; top:0; right:0;
      width:min(350px,100vw); height:100%; padding:22px;
      overflow:auto; overscroll-behavior:contain;
      border-left:1px solid #ffffff20;
      background:rgba(11,18,30,.94); backdrop-filter:blur(16px);
      pointer-events:auto; transform:translateX(100%);
      transition:transform 220ms ease;
    }
    .polar-panel.open { transform:translateX(0); }
    .polar-heading {
      display:flex; align-items:center; justify-content:space-between;
      gap:12px; margin-bottom:8px;
    }
    .polar-heading h2 { margin:0; font-size:18px; }
    .polar-description,
    .polar-status { color:#aab8cb; font-size:12px; }
    .polar-description { margin:0 0 20px; }
    .polar-panel fieldset {
      min-width:0; margin:0 0 12px; padding:15px 0 8px;
      border:0; border-top:1px solid #ffffff18;
    }
    .polar-panel legend {
      padding-right:7px; color:#b5d7e5; font-weight:600;
    }
    .polar-control { margin-bottom:13px; }
    .polar-control-title {
      display:flex; align-items:center; justify-content:space-between;
      gap:12px; margin-bottom:6px;
    }
    .polar-panel input[type="range"] {
      width:100%; accent-color:#a4cddd;
    }
    .polar-panel input[type="number"] {
      width:76px; padding:5px 6px; border:1px solid #ffffff24;
      border-radius:5px; background:#ffffff08; color:inherit;
    }
    .polar-panel input[type="checkbox"] { accent-color:#a4cddd; }
    .polar-colors { display:flex; align-items:center; gap:7px; }
    .polar-panel input[type="color"] {
      width:42px; height:32px; padding:2px;
      border:1px solid #ffffff24; border-radius:5px;
      background:transparent;
    }
    .polar-colors input[type="number"] { width:65px; min-width:0; }
    .polar-actions {
      display:flex; flex-wrap:wrap; gap:8px; margin-top:10px;
    }
    .polar-code {
      width:100%; min-height:260px; margin-top:14px; padding:12px;
      resize:vertical; border:1px solid #ffffff24; border-radius:7px;
      background:#060c16; color:#ccdeeb;
      font:11px/1.6 ui-monospace,monospace !important;
    }
    .polar-status { min-height:20px; margin-top:10px; }
    @media(prefers-reduced-motion:reduce) {
      .polar-panel { transition:none; }
    }
  `;
  document.head.append(style);

  const root = document.createElement("div");
  root.className = "polar-editor";
  root.dataset.backgroundEditor = "";

  root.innerHTML = `
    <button class="polar-toggle" type="button"
      aria-expanded="false" aria-controls="polar-settings-panel">
      Settings
    </button>

    <aside id="polar-settings-panel" class="polar-panel"
      aria-label="Polarized Secrets settings" inert>
      <div class="polar-heading">
        <h2>Polarized Secrets</h2>
        <button class="polar-close" type="button">Retract</button>
      </div>

      <p class="polar-description">
        Move to reveal patterns. Scroll over the background to rotate
        the lens, or adjust its angle here.
        Copy your configuration before disabling the editor.
      </p>

      <div class="polar-controls"></div>

      <div class="polar-actions">
        <button class="polar-show" type="button">Show code</button>
        <button class="polar-copy" type="button">Copy config</button>
        <button class="polar-reset" type="button">Reset lens</button>
      </div>

      <textarea class="polar-code" aria-label="Configuration code"
        spellcheck="false" readonly hidden></textarea>

      <div class="polar-status" role="status" aria-live="polite"></div>
    </aside>
  `;
  document.body.append(root);

  const toggle = root.querySelector(".polar-toggle");
  const panel = root.querySelector(".polar-panel");
  const close = root.querySelector(".polar-close");
  const controls = root.querySelector(".polar-controls");
  const code = root.querySelector(".polar-code");
  const show = root.querySelector(".polar-show");
  const status = root.querySelector(".polar-status");

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

  function refresh() {
    for (const update of bindings) update();
    code.value = exportCode();
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
      const container = element("div", "polar-control");
      const heading = element("div", "polar-control-title");
      const label = element("label");
      const id = `polar-${groupName}-${key}`;

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

        bindings.push(() => input.checked = group[key]);
        heading.append(input);

      } else if (Array.isArray(value)) {
        const row = element("div", "polar-colors");
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

        bindings.push(() => {
          picker.value = toHex(group[key]);
          channels.forEach((input, index) => {
            input.value = group[key][index];
          });
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

        bindings.push(() => {
          number.value = group[key];
          range.value = group[key];
        });

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

  root.querySelector(".polar-copy").addEventListener("click", async () => {
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

  root.querySelector(".polar-reset").addEventListener("click", () => {
    onReset();
    refresh();
    status.textContent = "Lens angle and animation time reset.";
  });

  function onKeyDown(event) {
    if (event.key === "Escape" && panel.classList.contains("open")) {
      setOpen(false);
    }
  }

  document.addEventListener("keydown", onKeyDown);
  code.value = exportCode();

  return {
    refresh,
    destroy() {
      document.removeEventListener("keydown", onKeyDown);
      root.remove();
      style.remove();
    }
  };
}