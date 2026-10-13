export function createSettingsEditor({
  config,
  onChange = () => {},
  onReset = () => {}
}) {
  const limits = {
    "ribbons.points": [2, 40, 1],
    "ribbons.speed": [5, 180, 1],
    "ribbons.stepsPerSecond": [30, 600, 10],
    "ribbons.lineWidth": [0.2, 4, 0.1],
    "ribbons.opacity": [0.001, 0.08, 0.001],
    "ribbons.curvature": [0, 2, 0.01],

    "colors.hue": [0, 360, 1],
    "colors.hueSpread": [0, 360, 1],
    "colors.saturation": [0, 100, 1],
    "colors.lightness": [10, 90, 1],
    "colors.hueDrift": [0, 20, 0.1],

    "canvas.trailLifetime": [0, 30, 0.5],
    "canvas.maxSteps": [0, 30000, 100],
    "canvas.restartDelay": [0, 30, 0.5],
    "canvas.pixelRatio": [1, 2, 0.5],

    "mouse.radius": [40, 500, 1],
    "mouse.attraction": [-200, 300, 1],
    "mouse.swirl": [-300, 300, 1],
    "mouse.ribbonBend": [0, 250, 1],
    "mouse.flowInfluence": [0, 4, 0.05],
    "mouse.dragStrength": [0, 2, 0.05],
    "mouse.holdMultiplier": [1, 4, 0.1],
    "mouse.smoothing": [0.5, 20, 0.1],

    "animation.speed": [0, 3, 0.05]
  };

  const help = {
    ribbons:
      "Low opacity builds color gradually. More drawing steps " +
      "produce denser ribbons without changing movement speed.",

    colors:
      "Disable Randomize on reset to use the base hue. " +
      "Additive blending brightens overlapping strands.",

    canvas:
      "Trail lifetime is a fade half-life; 0 preserves all marks. " +
      "Max steps 0 keeps the flow interactive indefinitely. " +
      "Existing marks remain where they were drawn.",

    mouse:
      "Ribbon bend deforms nearby connections. Flow influence redirects " +
      "their endpoints. Drag strength transfers your pointer movement " +
      "into the flow. Hold the mouse button for a stronger effect."
  };

  const style = document.createElement("style");

  style.textContent = `
    .ribbon-editor {
      position:fixed; inset:0; z-index:10000;
      pointer-events:none; color:#e8eaf4;
      font:13px/1.5 system-ui,sans-serif; color-scheme:dark;
    }
    .ribbon-editor * { box-sizing:border-box; }
    .ribbon-editor button,
    .ribbon-editor input,
    .ribbon-editor textarea { font:inherit; }
    .ribbon-editor button {
      min-height:44px; padding:8px 11px;
      border:1px solid #ffffff26; border-radius:7px;
      background:#2c3148; color:inherit; cursor:pointer;
    }
    .ribbon-editor button:hover { background:#404760; }
    .ribbon-editor :focus-visible {
      outline:2px solid #b2cdea; outline-offset:3px;
    }
    .ribbon-toggle {
      position:absolute; top:16px; right:16px; pointer-events:auto;
    }
    .ribbon-panel {
      position:absolute; top:0; right:0;
      width:min(350px,100vw); height:100%; padding:22px;
      overflow:auto; overscroll-behavior:contain;
      border-left:1px solid #ffffff20;
      background:rgba(12,17,29,.94); backdrop-filter:blur(16px);
      pointer-events:auto; transform:translateX(100%);
      transition:transform 220ms ease;
    }
    .ribbon-panel.open { transform:translateX(0); }
    .ribbon-heading {
      display:flex; align-items:center; justify-content:space-between;
      gap:12px; margin-bottom:8px;
    }
    .ribbon-heading h2 { margin:0; font-size:18px; }
    .ribbon-description,
    .ribbon-help,
    .ribbon-status { color:#adb9ce; font-size:12px; }
    .ribbon-description { margin:0 0 20px; }
    .ribbon-help { margin:0 0 14px; line-height:1.6; }
    .ribbon-panel fieldset {
      min-width:0; margin:0 0 12px; padding:15px 0 8px;
      border:0; border-top:1px solid #ffffff18;
    }
    .ribbon-panel legend {
      padding-right:7px; color:#b9d3e9; font-weight:600;
    }
    .ribbon-control { margin-bottom:13px; }
    .ribbon-control-title {
      display:flex; align-items:center; justify-content:space-between;
      gap:12px; margin-bottom:6px;
    }
    .ribbon-panel input[type="range"] {
      width:100%; accent-color:#a8c5df;
    }
    .ribbon-panel input[type="number"] {
      width:80px; padding:5px 6px;
      border:1px solid #ffffff24; border-radius:5px;
      background:#ffffff08; color:inherit;
    }
    .ribbon-panel input[type="checkbox"] { accent-color:#a8c5df; }
    .ribbon-colors { display:flex; align-items:center; gap:7px; }
    .ribbon-panel input[type="color"] {
      width:42px; height:32px; padding:2px;
      border:1px solid #ffffff24; border-radius:5px;
      background:transparent;
    }
    .ribbon-colors input[type="number"] { width:65px; min-width:0; }
    .ribbon-actions {
      display:flex; flex-wrap:wrap; gap:8px; margin-top:10px;
    }
    .ribbon-code {
      width:100%; min-height:260px; margin-top:14px; padding:12px;
      resize:vertical; border:1px solid #ffffff24; border-radius:7px;
      background:#060b16; color:#cddded;
      font:11px/1.6 ui-monospace,monospace !important;
    }
    .ribbon-status { min-height:20px; margin-top:10px; }
    @media(prefers-reduced-motion:reduce) {
      .ribbon-panel { transition:none; }
    }
  `;

  document.head.append(style);

  const root = document.createElement("div");
  root.className = "ribbon-editor";
  root.dataset.backgroundEditor = "";

  root.innerHTML = `
    <button class="ribbon-toggle" type="button"
      aria-expanded="false" aria-controls="ribbon-settings-panel">
      Settings
    </button>

    <aside id="ribbon-settings-panel" class="ribbon-panel"
      aria-label="Chromatic Ribbons settings" inert>
      <div class="ribbon-heading">
        <h2>Chromatic Ribbons</h2>
        <button class="ribbon-close" type="button">Retract</button>
      </div>

      <p class="ribbon-description">
        Move to pull and swirl the ribbons. Hold for a stronger effect.
        Double-click or double-tap for a new composition.
        Copy your settings before disabling the editor.
      </p>

      <div class="ribbon-controls"></div>

      <div class="ribbon-actions">
        <button class="ribbon-show" type="button">Show code</button>
        <button class="ribbon-copy" type="button">Copy config</button>
        <button class="ribbon-reset" type="button">New composition</button>
      </div>

      <textarea class="ribbon-code" aria-label="Configuration code"
        spellcheck="false" readonly hidden></textarea>

      <div class="ribbon-status" role="status" aria-live="polite"></div>
    </aside>
  `;

  document.body.append(root);

  const toggle = root.querySelector(".ribbon-toggle");
  const panel = root.querySelector(".ribbon-panel");
  const close = root.querySelector(".ribbon-close");
  const controls = root.querySelector(".ribbon-controls");
  const code = root.querySelector(".ribbon-code");
  const show = root.querySelector(".ribbon-show");
  const status = root.querySelector(".ribbon-status");

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

    if (help[groupName]) {
      const paragraph = element("p", "ribbon-help");
      paragraph.textContent = help[groupName];
      fieldset.append(paragraph);
    }

    for (const [key, value] of Object.entries(group)) {
      const path = `${groupName}.${key}`;
      const container = element("div", "ribbon-control");
      const heading = element("div", "ribbon-control-title");
      const label = element("label");
      const id = `ribbon-${groupName}-${key}`;

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
        const row = element("div", "ribbon-colors");
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

  root.querySelector(".ribbon-copy").addEventListener("click", async () => {
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

  root.querySelector(".ribbon-reset").addEventListener("click", () => {
    onReset();
    status.textContent = "A new composition has started.";
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