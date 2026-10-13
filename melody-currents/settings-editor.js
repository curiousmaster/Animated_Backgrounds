export function createSettingsEditor({
  config,
  onChange = () => {},
  onReset = () => {}
}) {
  const limits = {
    "ribbons.count": [1, 10, 1],
    "ribbons.staffSpacing": [3, 15, 0.5],
    "ribbons.waveHeight": [0, 180, 1],
    "ribbons.waveVariation": [0, 1.5, 0.01],
    "ribbons.spacingVariation": [0, 1.5, 0.01],
    "ribbons.wavelength": [150, 1500, 10],
    "ribbons.flowSpeed": [0, 2, 0.01],
    "ribbons.curl": [0, 150, 1],
    "ribbons.lineWidth": [0.2, 3, 0.1],
    "ribbons.opacity": [0, 1, 0.01],

    "depth.waveAmplitude": [0, 400, 1],
    "depth.wavelength": [200, 2000, 10],
    "depth.speed": [0, 2, 0.01],
    "depth.separation": [0, 200, 1],
    "depth.phaseOffset": [0, 3, 0.05],

    "depthStyle.range": [100, 2000, 10],
    "depthStyle.curve": [0.3, 3, 0.05],
    "depthStyle.nearThickness": [0.1, 3, 0.05],
    "depthStyle.farThickness": [0.1, 3, 0.05],
    "depthStyle.nearOpacity": [0, 2, 0.05],
    "depthStyle.farOpacity": [0, 2, 0.05],
    "depthStyle.nearIntensity": [0, 2, 0.05],
    "depthStyle.farIntensity": [0, 2, 0.05],
    "depthStyle.nearGlow": [0, 3, 0.05],
    "depthStyle.farGlow": [0, 3, 0.05],

    "camera.x": [-1000, 1000, 10],
    "camera.y": [-800, 800, 10],
    "camera.distance": [500, 3000, 10],
    "camera.fieldOfView": [20, 100, 1],
    "camera.targetX": [-600, 600, 10],
    "camera.targetY": [-600, 600, 10],
    "camera.targetZ": [-400, 400, 10],
    "camera.roll": [-180, 180, 1],
    "camera.zoom": [0.3, 3, 0.01],

    "rotation.x": [-80, 80, 1],
    "rotation.y": [-80, 80, 1],
    "rotation.z": [-180, 180, 1],

    "notes.perRibbon": [1, 35, 1],
    "notes.size": [4, 20, 0.5],
    "notes.speed": [0, 150, 1],
    "notes.opacity": [0, 1, 0.01],
    "notes.rests": [0, 0.6, 0.01],
    "notes.glow": [0, 20, 0.5],
    "notes.strokeWidth": [0.3, 3, 0.1],
    "notes.wholeWeight": [0, 100, 1],
    "notes.halfWeight": [0, 100, 1],
    "notes.quarterWeight": [0, 100, 1],
    "notes.eighthWeight": [0, 100, 1],
    "notes.sixteenthWeight": [0, 100, 1],
    "notes.dottedWeight": [0, 100, 1],

    "mouse.radius": [40, 500, 1],
    "mouse.attraction": [0, 0.8, 0.01],
    "mouse.swirl": [-3, 3, 0.05],
    "mouse.orbitSpeed": [0, 2, 0.01],
    "mouse.depthPush": [0, 400, 1],
    "mouse.smoothing": [0.5, 20, 0.1],

    "pulse.amplitude": [0, 120, 1],
    "pulse.depthAmplitude": [0, 200, 1],
    "pulse.speed": [50, 600, 1],
    "pulse.width": [30, 250, 1],
    "pulse.lifetime": [0.5, 6, 0.1],

    "animation.speed": [0, 3, 0.05]
  };

  const labels = {
    depthStyle: "Depth appearance",
    waveVariation: "Wave variation",
    spacingVariation: "Staff spacing variation",
    wholeWeight: "Whole notes",
    halfWeight: "Half notes",
    quarterWeight: "Quarter notes",
    eighthWeight: "Eighth notes",
    sixteenthWeight: "Sixteenth notes",
    dottedWeight: "Dotted quarter notes",
    fieldOfView: "Field of view",
    targetX: "Look-at X",
    targetY: "Look-at Y",
    targetZ: "Look-at Z",
    range: "Depth transition range",
    curve: "Depth response curve",
    nearThickness: "Near thickness",
    farThickness: "Far thickness",
    nearOpacity: "Near opacity",
    farOpacity: "Far opacity",
    nearIntensity: "Near intensity",
    farIntensity: "Far intensity",
    nearGlow: "Near glow",
    farGlow: "Far glow"
  };

  const help = {
    depth:
      "Move the staves toward and away from the viewer. " +
      "Separation places ribbons at different depths.",

    depthStyle:
      "Near and far values are multipliers. " +
      "1 preserves the base setting; values below 1 reduce it. " +
      "The transition range is centered on the camera's look-at distance. " +
      "Perspective sizing remains active when these extra effects are disabled.",

    camera:
      "X and Y move the viewpoint. Look-at coordinates move its target. " +
      "Field of view and zoom control framing; roll rotates the camera.",

    rotation:
      "Rotate the entire musical scene around its center.",

    notes:
      "Note types use relative weights. 0 disables a type. " +
      "If every weight is 0, quarter notes are used."
  };

  const bindings = [];
  const style = document.createElement("style");

  style.textContent = `
    .melody-editor {
      position:fixed; inset:0; z-index:10000;
      pointer-events:none; color:#e9eaf5;
      font:13px/1.5 system-ui,sans-serif; color-scheme:dark;
    }
    .melody-editor * { box-sizing:border-box; }
    .melody-editor button,
    .melody-editor input,
    .melody-editor textarea { font:inherit; }
    .melody-editor button {
      min-height:44px; padding:8px 11px;
      border:1px solid #ffffff26; border-radius:7px;
      background:#2d314a; color:inherit; cursor:pointer;
    }
    .melody-editor button:hover { background:#424760; }
    .melody-editor :focus-visible {
      outline:2px solid #bacbe9; outline-offset:3px;
    }
    .melody-toggle {
      position:absolute; top:16px; right:16px; pointer-events:auto;
    }
    .melody-panel {
      position:absolute; top:0; right:0;
      width:min(370px,100vw); height:100%; padding:22px;
      overflow:auto; overscroll-behavior:contain;
      border-left:1px solid #ffffff20;
      background:rgba(13,17,31,.94); backdrop-filter:blur(16px);
      pointer-events:auto; transform:translateX(100%);
      transition:transform 220ms ease;
    }
    .melody-panel.open { transform:translateX(0); }
    .melody-heading {
      display:flex; align-items:center; justify-content:space-between;
      gap:12px; margin-bottom:8px;
    }
    .melody-heading h2 { margin:0; font-size:18px; }
    .melody-description,
    .melody-status,
    .melody-help { color:#b0b9ce; font-size:12px; }
    .melody-description { margin:0 0 20px; }
    .melody-help { margin:0 0 14px; line-height:1.6; }
    .melody-panel fieldset {
      min-width:0; margin:0 0 12px; padding:15px 0 8px;
      border:0; border-top:1px solid #ffffff18;
    }
    .melody-panel legend {
      padding-right:7px; color:#c1d1eb; font-weight:600;
    }
    .melody-control { margin-bottom:13px; }
    .melody-control-title {
      display:flex; align-items:center; justify-content:space-between;
      gap:12px; margin-bottom:6px;
    }
    .melody-panel input[type="range"] {
      width:100%; accent-color:#b0c3e0;
    }
    .melody-panel input[type="number"] {
      width:76px; padding:5px 6px; border:1px solid #ffffff24;
      border-radius:5px; background:#ffffff08; color:inherit;
    }
    .melody-panel input[type="checkbox"] { accent-color:#b0c3e0; }
    .melody-colors { display:flex; align-items:center; gap:7px; }
    .melody-panel input[type="color"] {
      width:42px; height:32px; padding:2px;
      border:1px solid #ffffff24; border-radius:5px;
      background:transparent;
    }
    .melody-colors input[type="number"] { width:65px; min-width:0; }
    .melody-actions {
      display:flex; flex-wrap:wrap; gap:8px; margin-top:10px;
    }
    .melody-code {
      width:100%; min-height:260px; margin-top:14px; padding:12px;
      resize:vertical; border:1px solid #ffffff24; border-radius:7px;
      background:#070c18; color:#d0ddef;
      font:11px/1.6 ui-monospace,monospace !important;
    }
    .melody-status { min-height:20px; margin-top:10px; }
    @media(prefers-reduced-motion:reduce) {
      .melody-panel { transition:none; }
    }
  `;

  document.head.append(style);

  const root = document.createElement("div");
  root.className = "melody-editor";
  root.dataset.backgroundEditor = "";

  root.innerHTML = `
    <button class="melody-toggle" type="button"
      aria-expanded="false" aria-controls="melody-settings-panel">
      Settings
    </button>

    <aside id="melody-settings-panel" class="melody-panel"
      aria-label="Melody Currents settings" inert>
      <div class="melody-heading">
        <h2>Melody Currents</h2>
        <button class="melody-close" type="button">Retract</button>
      </div>

      <p class="melody-description">
        Nearer music is thicker and brighter; distant music is finer
        and fainter. Move to swirl the staves; click or tap for a ripple.
        Copy your configuration before disabling the editor.
      </p>

      <div class="melody-controls"></div>

      <div class="melody-actions">
        <button class="melody-show" type="button">Show code</button>
        <button class="melody-copy" type="button">Copy config</button>
        <button class="melody-view" type="button">Reset view</button>
        <button class="melody-reset" type="button">New phrase</button>
      </div>

      <textarea class="melody-code" aria-label="Configuration code"
        spellcheck="false" readonly hidden></textarea>

      <div class="melody-status" role="status" aria-live="polite"></div>
    </aside>
  `;

  document.body.append(root);

  const toggle = root.querySelector(".melody-toggle");
  const panel = root.querySelector(".melody-panel");
  const close = root.querySelector(".melody-close");
  const controls = root.querySelector(".melody-controls");
  const code = root.querySelector(".melody-code");
  const show = root.querySelector(".melody-show");
  const status = root.querySelector(".melody-status");

  const title = value =>
    labels[value] ||
    value
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

  function refreshControls() {
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

    if (help[groupName]) {
      const paragraph = element("p", "melody-help");
      paragraph.textContent = help[groupName];
      fieldset.append(paragraph);
    }

    for (const [key, value] of Object.entries(group)) {
      const path = `${groupName}.${key}`;
      const container = element("div", "melody-control");
      const heading = element("div", "melody-control-title");
      const label = element("label");
      const id = `melody-${groupName}-${key}`;

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

        bindings.push(() => {
          input.checked = group[key];
        });

        heading.append(input);

      } else if (Array.isArray(value)) {
        const row = element("div", "melody-colors");
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

  root.querySelector(".melody-copy").addEventListener("click", async () => {
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

  root.querySelector(".melody-view").addEventListener("click", () => {
    Object.assign(config.camera, {
      x: 0,
      y: 0,
      distance: 1100,
      fieldOfView: 50,
      targetX: 0,
      targetY: 0,
      targetZ: 0,
      roll: 0,
      zoom: 1
    });

    Object.assign(config.rotation, {
      x: 12,
      y: -18,
      z: -8
    });

    refreshControls();
    changed();
    status.textContent = "Viewpoint and scene rotation reset.";
  });

  root.querySelector(".melody-reset").addEventListener("click", () => {
    onReset();
    status.textContent = "A new musical arrangement has been generated.";
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
    refresh: refreshControls,
    destroy() {
      document.removeEventListener("keydown", onKeyDown);
      root.remove();
      style.remove();
    }
  };
}