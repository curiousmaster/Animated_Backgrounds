export function createSettingsEditor({
  config,
  onChange = () => {},
  onReset = () => {}
}) {
  const limits = {
    "embers.count": [10, 350, 1],
    "embers.size": [0.5, 4, 0.1],
    "embers.speed": [10, 150, 1],
    "embers.trailLength": [0, 4, 0.1],
    "embers.opacity": [0, 1, 0.01],
    "embers.glow": [0, 20, 0.5],

    "flock.neighborRadius": [30, 180, 1],
    "flock.separationDistance": [5, 50, 1],
    "flock.cohesion": [0, 2, 0.05],
    "flock.alignment": [0, 3, 0.05],
    "flock.separation": [0, 3, 0.05],
    "flock.formationStrength": [0, 2, 0.05],

    "mouse.radius": [40, 500, 1],
    "mouse.beaconStrength": [0, 300, 1],
    "mouse.smoothing": [0.5, 20, 0.1],

    "cooling.scattering": [0, 400, 1],
    "cooling.waveSpeed": [50, 600, 1],
    "cooling.waveWidth": [20, 180, 1],
    "cooling.waveLifetime": [0.5, 5, 0.1],
    "cooling.coolingTime": [0.5, 10, 0.1],

    "animation.speed": [0, 3, 0.05]
  };

  const style = document.createElement("style");

  style.textContent = `
    .ember-editor {
      position:fixed; inset:0; z-index:10000;
      pointer-events:none; color:#f0e7e7;
      font:13px/1.5 system-ui,sans-serif; color-scheme:dark;
    }
    .ember-editor * { box-sizing:border-box; }
    .ember-editor button,
    .ember-editor input,
    .ember-editor textarea { font:inherit; }
    .ember-editor button {
      min-height:44px; padding:8px 11px;
      border:1px solid #ffffff26; border-radius:7px;
      background:#3c2934; color:inherit; cursor:pointer;
    }
    .ember-editor button:hover { background:#573b47; }
    .ember-editor :focus-visible {
      outline:2px solid #e4b38b; outline-offset:3px;
    }
    .ember-toggle {
      position:absolute; top:16px; right:16px; pointer-events:auto;
    }
    .ember-panel {
      position:absolute; top:0; right:0;
      width:min(350px,100vw); height:100%; padding:22px;
      overflow:auto; overscroll-behavior:contain;
      border-left:1px solid #ffffff20;
      background:rgba(25,14,22,.94); backdrop-filter:blur(16px);
      pointer-events:auto; transform:translateX(100%);
      transition:transform 220ms ease;
    }
    .ember-panel.open { transform:translateX(0); }
    .ember-heading {
      display:flex; align-items:center; justify-content:space-between;
      gap:12px; margin-bottom:8px;
    }
    .ember-heading h2 { margin:0; font-size:18px; }
    .ember-description,
    .ember-status { color:#c3aeb7; font-size:12px; }
    .ember-description { margin:0 0 20px; }
    .ember-panel fieldset {
      min-width:0; margin:0 0 12px; padding:15px 0 8px;
      border:0; border-top:1px solid #ffffff18;
    }
    .ember-panel legend {
      padding-right:7px; color:#e2bf9c; font-weight:600;
    }
    .ember-control { margin-bottom:13px; }
    .ember-control-title {
      display:flex; align-items:center; justify-content:space-between;
      gap:12px; margin-bottom:6px;
    }
    .ember-panel input[type="range"] {
      width:100%; accent-color:#d3a780;
    }
    .ember-panel input[type="number"] {
      width:76px; padding:5px 6px; border:1px solid #ffffff24;
      border-radius:5px; background:#ffffff08; color:inherit;
    }
    .ember-panel input[type="checkbox"] { accent-color:#d3a780; }
    .ember-colors { display:flex; align-items:center; gap:7px; }
    .ember-panel input[type="color"] {
      width:42px; height:32px; padding:2px;
      border:1px solid #ffffff24; border-radius:5px;
      background:transparent;
    }
    .ember-colors input[type="number"] { width:65px; min-width:0; }
    .ember-actions {
      display:flex; flex-wrap:wrap; gap:8px; margin-top:10px;
    }
    .ember-code {
      width:100%; min-height:260px; margin-top:14px; padding:12px;
      resize:vertical; border:1px solid #ffffff24; border-radius:7px;
      background:#110911; color:#e8d0c7;
      font:11px/1.6 ui-monospace,monospace !important;
    }
    .ember-status { min-height:20px; margin-top:10px; }
    @media(prefers-reduced-motion:reduce) {
      .ember-panel { transition:none; }
    }
  `;

  document.head.append(style);

  const root = document.createElement("div");
  root.className = "ember-editor";
  root.dataset.backgroundEditor = "";

  root.innerHTML = `
    <button class="ember-toggle" type="button"
      aria-expanded="false" aria-controls="ember-settings-panel">
      Settings
    </button>

    <aside id="ember-settings-panel" class="ember-panel"
      aria-label="Ember Migration settings" inert>
      <div class="ember-heading">
        <h2>Ember Migration</h2>
        <button class="ember-close" type="button">Retract</button>
      </div>

      <p class="ember-description">
        Move to attract the embers. Click or tap to scatter and cool them.
        Cooling time controls how quickly they recover their warmth.
        Copy your configuration before disabling the editor.
      </p>

      <div class="ember-controls"></div>

      <div class="ember-actions">
        <button class="ember-show" type="button">Show code</button>
        <button class="ember-copy" type="button">Copy config</button>
        <button class="ember-reset" type="button">New flock</button>
      </div>

      <textarea class="ember-code" aria-label="Configuration code"
        spellcheck="false" readonly hidden></textarea>

      <div class="ember-status" role="status" aria-live="polite"></div>
    </aside>
  `;

  document.body.append(root);

  const toggle = root.querySelector(".ember-toggle");
  const panel = root.querySelector(".ember-panel");
  const close = root.querySelector(".ember-close");
  const controls = root.querySelector(".ember-controls");
  const code = root.querySelector(".ember-code");
  const show = root.querySelector(".ember-show");
  const status = root.querySelector(".ember-status");

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
      const container = element("div", "ember-control");
      const heading = element("div", "ember-control-title");
      const label = element("label");
      const id = `ember-${groupName}-${key}`;

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
        const row = element("div", "ember-colors");
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

  root.querySelector(".ember-copy").addEventListener("click", async () => {
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

  root.querySelector(".ember-reset").addEventListener("click", () => {
    onReset();
    status.textContent = "A new ember flock has been generated.";
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