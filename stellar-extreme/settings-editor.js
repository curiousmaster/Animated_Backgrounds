
export function createSettingsEditor({
  config,
  onChange = () => {},
  onReset = () => {},
  onNebula = () => {},
  onNextStar = () => {},
  onResetRotation = () => {}
}) {
  // ============================================================
  // SETTINGS LIMITS
  // ============================================================

  const limits = {
    "stars.count": [20, 2000, 1],
    "stars.initialSpeed": [0, 60, 1],
    "stars.radius": [1, 6, 0.1],
    "stars.maxCount": [20, 2000, 1],
    "stars.opacity": [0, 1, 0.01],
    "stars.trails": [0, 1, 0.01],
    "stars.sizeSlowdown": [0, 3, 0.05],

    "gravity.strength": [0, 3000, 10],
    "gravity.range": [50, 800, 10],
    "gravity.softening": [5, 100, 1],
    "gravity.maxSpeed": [20, 200, 1],
    "gravity.mergeDistance": [0.5, 4, 0.05],

    "explosions.glowMass": [1, 30, 1],
    "explosions.criticalMass": [3, 60, 1],
    "explosions.delay": [0, 60, 1],
    "explosions.delayVariation": [0, 30, 1],
    "explosions.fragments": [2, 30, 1],
    "explosions.speed": [10, 150, 1],
    "explosions.cooldown": [0.5, 15, 0.5],
    "explosions.shockwaveStrength": [0, 100, 1],

    "space.radius": [200, 1200, 10],
    "space.boundaryBounce": [0.1, 1, 0.05],

    "camera.distance": [1300, 3500, 10],
    "camera.zoom": [0.3, 3, 0.05],
    "camera.rotationX": [-180, 180, 1],
    "camera.rotationY": [-180, 180, 1],
    "camera.rotationZ": [-180, 180, 1],
    "camera.rotationSpeedX": [-30, 30, 0.1],
    "camera.rotationSpeedY": [-30, 30, 0.1],
    "camera.rotationSpeedZ": [-30, 30, 0.1],

    "flight.followDistance": [0, 200, 1],
    "flight.heightOffset": [-100, 100, 1],
    "flight.fieldOfView": [30, 120, 1],
    "flight.positionSmoothing": [0, 30, 0.5],
    "flight.directionSmoothing": [0, 20, 0.5],
    "flight.nearClip": [0.5, 20, 0.5],

    "mouse.radius": [40, 500, 1],
    "mouse.strength": [0, 150, 1],
    "mouse.holdMultiplier": [1, 5, 0.1],
    "mouse.shockwave": [0, 200, 1],
    "mouse.smoothing": [0.5, 20, 0.1],

    "nebula.clouds": [1, 15, 1],
    "nebula.opacity": [0, 0.8, 0.01],
    "nebula.size": [0.1, 1, 0.05],

    // Cinematic Universe — Step 1
    "cinematic.bloomStrength": [0, 3, 0.05],
    "cinematic.bloomRadius": [0.5, 12, 0.5],
    "cinematic.bloomThreshold": [0, 1, 0.01],
    "cinematic.exposure": [0.3, 3, 0.05],
    "cinematic.vignette": [0, 1, 0.01],
    "cinematic.twinkle": [0, 0.6, 0.01],

    "appearance.glow": [0, 40, 1],
    "animation.speed": [0, 3, 0.05]
  };

  // ============================================================
  // DISPLAY LABELS
  // ============================================================

  const labels = {
    threeD: "3D simulation",
    sizeSlowdown: "Size-based slowdown",
    rotationSpeedX: "X rotation speed",
    rotationSpeedY: "Y rotation speed",
    rotationSpeedZ: "Z rotation speed",
    fieldOfView: "Field of view",
    nearClip: "Near clipping distance",
    maxCount: "Maximum star count",
    glowMass: "Glow mass",
    criticalMass: "Critical mass",
    showStatus: "Show flight status",
    showBoundary: "Show boundary",
    respectReducedMotion: "Respect reduced motion",
    bloomStrength: "Bloom strength",
    bloomRadius: "Bloom radius",
    bloomThreshold: "Bloom threshold"
  };

  // ============================================================
  // HOVER HELP DESCRIPTIONS
  // ============================================================

  const descriptions = {
    "stars.count":
      "Number of stars created when starting a new field. " +
      "Changing this setting restarts the simulation.",

    "stars.initialSpeed":
      "Initial movement speed of newly created stars, " +
      "in simulation units per second.",

    "stars.radius":
      "Base physical radius of a mass-1 star. " +
      "Larger stars grow in radius with the cube root of mass.",

    "stars.maxCount":
      "Maximum population permitted when explosions create fragments. " +
      "Reducing this value can force excess stars to merge.",

    "stars.opacity":
      "Opacity of the star cores before distance fading. " +
      "Halos and trails have their own rendering.",

    "stars.trails":
      "Length of velocity trails in seconds of movement. " +
      "Set to zero to disable trails.",

    "stars.sizeSlowdown":
      "Slows stars as their mass increases through merging. " +
      "Zero disables the effect; higher values make giants slower.",

    "gravity.strength":
      "Strength of gravitational attraction between stars. " +
      "Higher values cause faster clustering and more collisions.",

    "gravity.range":
      "Maximum simulation-space distance over which " +
      "two stars attract each other.",

    "gravity.softening":
      "Reduces extreme gravitational acceleration at close distances.",

    "gravity.maxSpeed":
      "Base maximum physical speed. Large stars can receive " +
      "a lower limit when size-based slowdown is enabled.",

    "gravity.mergeDistance":
      "Collision multiplier applied to the combined radii " +
      "of two stars. Higher values cause merging from farther away.",

    "explosions.enabled":
      "Allows sufficiently massive stars to explode " +
      "after their countdown has completed.",

    "explosions.glowMass":
      "Mass at which a star begins developing " +
      "a brighter, warmer halo.",

    "explosions.criticalMass":
      "Mass required before a star begins its explosion countdown.",

    "explosions.delay":
      "Base waiting time after reaching critical mass, " +
      "measured in simulation seconds.",

    "explosions.delayVariation":
      "Maximum additional random delay before an explosion.",

    "explosions.fragments":
      "Requested number of fragments created by an explosion. " +
      "The available star population budget may reduce this number.",

    "explosions.speed":
      "Outward ejection velocity added to explosion fragments.",

    "explosions.cooldown":
      "Time after an explosion during which fragments cannot merge.",

    "explosions.shockwaveStrength":
      "Strength of the expanding force produced by a stellar explosion.",

    "space.threeD":
      "Enable full three-dimensional gravity, movement, and collisions. " +
      "Changing this restarts the simulation.",

    "space.sphereBoundary":
      "Keep stars inside a sphere in 3D, or a disk in 2D. " +
      "When disabled, stars wrap across the simulation boundary.",

    "space.radius":
      "Radius of the simulated universe. Larger values spread stars " +
      "over a greater volume and reduce encounter frequency.",

    "space.boundaryBounce":
      "Fraction of normal velocity retained when a star " +
      "bounces off the spherical boundary.",

    "camera.distance":
      "External camera distance from the center of the star field.",

    "camera.zoom":
      "Magnification of the view without changing the physics.",

    "camera.rotationX":
      "Starting rotation around the X axis, in degrees.",

    "camera.rotationY":
      "Starting rotation around the Y axis, in degrees.",

    "camera.rotationZ":
      "Starting rotation around the Z axis, in degrees.",

    "camera.rotationSpeedX":
      "Automatic X-axis rotation in degrees per simulation second.",

    "camera.rotationSpeedY":
      "Automatic Y-axis rotation in degrees per simulation second.",

    "camera.rotationSpeedZ":
      "Automatic Z-axis rotation in degrees per simulation second.",

    "camera.showBoundary":
      "Draw faint great circles showing the spherical boundary.",

    "flight.enabled":
      "Attach the camera to a moving star and look along " +
      "its direction of travel.",

    "flight.followDistance":
      "Distance behind the followed star. " +
      "Zero places the camera at the star's position.",

    "flight.heightOffset":
      "Vertical offset from the followed star in simulation space.",

    "flight.fieldOfView":
      "Vertical viewing angle in degrees for flight mode.",

    "flight.positionSmoothing":
      "How quickly the camera catches up with the followed star.",

    "flight.directionSmoothing":
      "How quickly the camera turns toward the star's movement.",

    "flight.nearClip":
      "Minimum forward distance at which objects are rendered.",

    "flight.showStatus":
      "Display the followed star's identifier, mass, speed, " +
      "and current population.",

    "mouse.enabled":
      "Enable pointer attraction and click-generated shockwaves.",

    "mouse.radius":
      "Radius of pointer attraction, measured in screen pixels.",

    "mouse.strength":
      "Strength of attraction toward the mouse pointer.",

    "mouse.holdMultiplier":
      "Additional attraction while holding the primary mouse button.",

    "mouse.shockwave":
      "Strength of the expanding scattering wave created by clicking.",

    "mouse.smoothing":
      "How quickly the attraction point follows the pointer.",

    "nebula.enabled":
      "Show or hide the decorative nebula background.",

    "nebula.clouds":
      "Number of decorative nebula cloud groups.",

    "nebula.opacity":
      "Overall visibility of the nebula layer.",

    "nebula.size":
      "Size of the nebula clouds relative to the viewport.",

    "nebula.colorA":
      "First color used by alternating nebula clouds.",

    "nebula.colorB":
      "Second color used by alternating nebula clouds.",

    "nebula.colorC":
      "Third color used by alternating nebula clouds.",

    // ----------------------------------------------------------
    // CINEMATIC UNIVERSE
    // ----------------------------------------------------------

    "cinematic.enabled":
      "Enable cinematic GPU post-processing. " +
      "When disabled, stars render without the additional bloom " +
      "and tone-mapping pipeline.",

    "cinematic.bloomStrength":
      "Controls how much soft light spreads outward from bright stars. " +
      "Higher values produce a more luminous, cinematic appearance. " +
      "Zero removes the additional bloom contribution.",

    "cinematic.bloomRadius":
      "Controls the spread of the GPU bloom blur. " +
      "Smaller values create tighter halos. " +
      "Larger values create broad, atmospheric illumination.",

    "cinematic.bloomThreshold":
      "Minimum brightness required for a pixel to contribute to bloom. " +
      "Lower values make more objects glow; higher values restrict bloom " +
      "to the brightest stars and explosions.",

    "cinematic.exposure":
      "Controls overall brightness through cinematic tone mapping. " +
      "Higher values make the universe brighter, " +
      "while lower values preserve darker space and highlights.",

    "cinematic.vignette":
      "Darkens the edges of the screen to direct attention " +
      "toward the center. Zero disables the effect.",

    "cinematic.twinkle":
      "Controls subtle changes in the brightness and apparent size " +
      "of individual stars. Zero disables twinkling.",

    // ----------------------------------------------------------

    "appearance.backgroundColor":
      "Solid color beneath stars and nebulas.",

    "appearance.starColor":
      "Base color of small stars.",

    "appearance.giantColor":
      "Warmer color approached as a star grows in mass.",

    "appearance.hotColor":
      "Color approached during the explosion countdown, " +
      "also used for explosion rings.",

    "appearance.glow":
      "Additional halo size around stars.",

    "animation.speed":
      "Global simulation speed. Affects star movement, " +
      "explosion timers, and camera rotation.",

    "animation.paused":
      "Pause physics, explosions, and animated rotation.",

    "animation.respectReducedMotion":
      "Pause animation when the operating system requests reduced motion.",

    "panel.enabled":
      "Controls whether the settings editor is visible. " +
      "Disabling it hides the panel until the page is reloaded " +
      "with this setting enabled in index.html."
  };

  // ============================================================
  // SECTION DESCRIPTIONS
  // ============================================================

  const sectionHelp = {
    stars:
      "Control star population, size, trails, and movement.",

    gravity:
      "Tune how stars attract, accelerate, and merge.",

    explosions:
      "Control stellar instability, fragmentation, and shockwaves.",

    space:
      "Configure the physical universe and its boundaries.",

    camera:
      "Control the external camera, zoom, and rotation.",

    flight:
      "Follow an individual star through the universe.",

    mouse:
      "Interact with stars using attraction and shockwaves.",

    nebula:
      "Configure decorative clouds and background colors.",

    cinematic:
      "GPU bloom, tone mapping, vignette, and star twinkling. " +
      "These effects enhance the visual presentation without " +
      "changing the gravitational simulation.",

    appearance:
      "Control the underlying star and background colors.",

    animation:
      "Control animation speed and motion preferences.",

    panel:
      "Enable or disable the settings editor."
  };

  // ============================================================
  // PERSISTENT SECTION STATES
  // ============================================================

  const storageKey = "stellar-bloom-editor-sections";

  const defaultOpen = [
    "stars",
    "camera",
    "cinematic"
  ];

  let initiallyOpen = new Set(defaultOpen);

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));

    if (Array.isArray(saved)) {
      initiallyOpen = new Set(saved);
    }
  } catch (error) {
    console.warn("Unable to restore section states:", error);
  }

  const sections = [];
  const bindings = [];
  const helpItems = [];

  // ============================================================
  // EDITOR DOM
  // ============================================================

  const root = document.createElement("div");

  root.className = "stellar-editor";
  root.dataset.backgroundEditor = "";

  root.innerHTML = `
    <button
      class="stellar-toggle"
      type="button"
      aria-expanded="false"
      aria-controls="stellar-panel">
      Settings
    </button>

    <aside
      id="stellar-panel"
      class="stellar-panel"
      aria-label="Stellar Bloom settings"
      inert>

      <div class="stellar-heading">
        <h2>Stellar Bloom</h2>
        <button class="stellar-close" type="button">
          Retract
        </button>
      </div>

      <p class="stellar-help stellar-introduction">
        Hover over a setting to see its description.
        On touchscreens, tap the ? button.
        Copy your configuration before disabling the editor.
      </p>

      <div class="stellar-section-actions">
        <button class="stellar-expand" type="button">
          Expand all
        </button>
        <button class="stellar-collapse" type="button">
          Collapse all
        </button>
      </div>

      <div class="stellar-controls"></div>

      <div class="stellar-actions">
        <button class="stellar-show" type="button">
          Show code
        </button>
        <button class="stellar-copy" type="button">
          Copy config
        </button>
        <button class="stellar-next" type="button">
          Next star
        </button>
        <button class="stellar-rotation" type="button">
          Reset rotation
        </button>
        <button class="stellar-reset" type="button">
          New star field
        </button>
        <button class="stellar-nebula" type="button">
          New nebulas
        </button>
      </div>

      <textarea
        class="stellar-code"
        aria-label="Configuration code"
        spellcheck="false"
        readonly
        hidden></textarea>

      <p
        class="stellar-status"
        role="status"
        aria-live="polite"></p>
    </aside>

    <div class="stellar-tooltip" role="tooltip" hidden>
      <strong></strong>
      <p></p>
    </div>
  `;

  document.body.append(root);

  // ============================================================
  // ELEMENT REFERENCES
  // ============================================================

  const $ = selector => root.querySelector(selector);

  const toggle = $(".stellar-toggle");
  const panel = $(".stellar-panel");
  const close = $(".stellar-close");
  const controls = $(".stellar-controls");
  const code = $(".stellar-code");
  const show = $(".stellar-show");
  const status = $(".stellar-status");

  const tooltip = $(".stellar-tooltip");
  const tooltipTitle = tooltip.querySelector("strong");
  const tooltipText = tooltip.querySelector("p");

  let hoveredHelp = null;
  let focusedHelp = null;
  let pinnedHelp = null;
  let tooltipHovered = false;
  let hideTimer = null;
  let destroyed = false;

  // ============================================================
  // HELPERS
  // ============================================================

  const title = key =>
    labels[key] ||
    key.replace(/([A-Z])/g, " $1")
      .replace(/^./, character => character.toUpperCase());

  const exportCode = () =>
    `const config = ${JSON.stringify(config, null, 2)};`;

  const clamp = (value, min, max) =>
    Math.max(min, Math.min(max, value));

  const toHex = color =>
    "#" + color.map(value =>
      clamp(Math.round(value), 0, 255)
        .toString(16)
        .padStart(2, "0")
    ).join("");

  function element(tag, className = "") {
    const node = document.createElement(tag);
    node.className = className;
    return node;
  }

  function activeHelp() {
    return pinnedHelp || hoveredHelp || focusedHelp;
  }

  function saveSectionStates() {
    try {
      const opened = sections
        .filter(section => section.open)
        .map(section => section.dataset.group);

      localStorage.setItem(
        storageKey,
        JSON.stringify(opened)
      );
    } catch (error) {
      console.warn("Unable to save section states:", error);
    }
  }

  // ============================================================
  // HOVER HELP
  // ============================================================

  function clearHelp() {
    clearTimeout(hideTimer);

    hoveredHelp = null;
    focusedHelp = null;
    pinnedHelp = null;
    tooltipHovered = false;

    tooltip.hidden = true;

    for (const item of helpItems) {
      item.inline.hidden = true;
      item.button.setAttribute("aria-expanded", "false");
    }
  }

  function positionHelp() {
    if (destroyed) return;

    const item = activeHelp();

    for (const entry of helpItems) {
      entry.inline.hidden = true;

      entry.button.setAttribute(
        "aria-expanded",
        String(entry === pinnedHelp)
      );
    }

    if (
      !item ||
      !panel.classList.contains("open") ||
      !item.box.closest("details")?.open
    ) {
      tooltip.hidden = true;
      return;
    }

    const paneRect = panel.getBoundingClientRect();
    const itemRect = item.box.getBoundingClientRect();

    if (
      itemRect.bottom <= paneRect.top ||
      itemRect.top >= paneRect.bottom
    ) {
      tooltip.hidden = true;
      return;
    }

    const gap = 14;
    const availableWidth = paneRect.left - gap - 12;

    // On narrow screens, display help beneath the control.
    if (availableWidth < 220) {
      tooltip.hidden = true;
      item.inline.hidden = false;
      return;
    }

    tooltipTitle.textContent = item.name;
    tooltipText.textContent = item.description;

    tooltip.style.width =
      `${Math.min(280, availableWidth)}px`;

    tooltip.style.maxHeight =
      `${Math.max(80, innerHeight - 24)}px`;

    tooltip.hidden = false;

    const popupRect = tooltip.getBoundingClientRect();

    const desiredTop =
      itemRect.top +
      itemRect.height / 2 -
      popupRect.height / 2;

    tooltip.style.left =
      `${paneRect.left - popupRect.width - gap}px`;

    tooltip.style.top =
      `${clamp(
        desiredTop,
        12,
        Math.max(12, innerHeight - popupRect.height - 12)
      )}px`;
  }

  function scheduleHelpHide() {
    clearTimeout(hideTimer);

    hideTimer = setTimeout(() => {
      if (!tooltipHovered) positionHelp();
    }, 140);
  }

  function addHelp(box, labelWrap, path, name) {
    const description =
      descriptions[path] ||
      `Adjust ${name.toLowerCase()} for this scene.`;

    const inline = element("div", "stellar-inline-help");

    inline.id =
      `stellar-help-${path.replaceAll(".", "-")}`;

    inline.textContent = description;
    inline.hidden = true;

    const button = element("button", "stellar-help-button");

    button.type = "button";
    button.textContent = "?";

    button.setAttribute(
      "aria-label",
      `Help for ${name}`
    );

    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-controls", inline.id);

    labelWrap.append(button);
    box.append(inline);

    const item = {
      box,
      button,
      inline,
      name,
      description
    };

    helpItems.push(item);

    box.addEventListener("pointerenter", event => {
      if (event.pointerType === "touch") return;

      clearTimeout(hideTimer);
      hoveredHelp = item;
      positionHelp();
    });

    box.addEventListener("pointerleave", () => {
      if (hoveredHelp === item) hoveredHelp = null;
      scheduleHelpHide();
    });

    box.addEventListener("focusin", () => {
      focusedHelp = item;
      positionHelp();
    });

    box.addEventListener("focusout", event => {
      if (box.contains(event.relatedTarget)) return;

      if (focusedHelp === item) focusedHelp = null;
      scheduleHelpHide();
    });

    button.addEventListener("click", () => {
      const wasPinned = pinnedHelp === item;

      pinnedHelp = wasPinned ? null : item;

      if (wasPinned) {
        hoveredHelp = null;
        focusedHelp = null;
      }

      positionHelp();
    });

    return inline.id;
  }

  tooltip.addEventListener("pointerenter", () => {
    tooltipHovered = true;
    clearTimeout(hideTimer);
  });

  tooltip.addEventListener("pointerleave", () => {
    tooltipHovered = false;
    scheduleHelpHide();
  });

  // ============================================================
  // PANEL OPEN / CLOSE
  // ============================================================

  function open(value) {
    toggle.hidden = false;

    if (!value) {
      clearHelp();

      if (panel.contains(document.activeElement)) {
        toggle.focus();
      }
    }

    panel.classList.toggle("open", value);
    panel.inert = !value;

    toggle.hidden = value;

    toggle.setAttribute(
      "aria-expanded",
      String(value)
    );

    if (value) close.focus();
  }

  // ============================================================
  // SETTINGS UPDATE
  // ============================================================

  function changed() {
    code.value = exportCode();

    onChange();

    if (!config.panel.enabled) {
      open(false);
      root.hidden = true;
    }
  }

  function refreshControls() {
    for (const update of bindings) {
      update();
    }

    code.value = exportCode();
  }

  function setSectionsOpen(value) {
    clearHelp();

    for (const section of sections) {
      section.open = value;
    }

    saveSectionStates();
  }

  // ============================================================
  // BUILD COLLAPSIBLE SETTINGS SECTIONS
  // ============================================================

  for (const [groupName, group] of Object.entries(config)) {
    const section = element("details", "stellar-section");

    section.dataset.group = groupName;
    section.open = initiallyOpen.has(groupName);

    const summary = element("summary", "stellar-summary");
    summary.textContent = title(groupName);

    const content = element(
      "div",
      "stellar-section-content"
    );

    section.append(summary, content);
    sections.push(section);

    section.addEventListener("toggle", () => {
      saveSectionStates();

      const item = activeHelp();

      if (
        item &&
        section.contains(item.box) &&
        !section.open
      ) {
        clearHelp();
      } else {
        positionHelp();
      }
    });

    if (sectionHelp[groupName]) {
      const paragraph = element("p", "stellar-help");

      paragraph.textContent = sectionHelp[groupName];
      content.append(paragraph);
    }

    // ----------------------------------------------------------
    // BUILD INDIVIDUAL CONTROLS
    // ----------------------------------------------------------

    for (const [key, value] of Object.entries(group)) {
      const path = `${groupName}.${key}`;
      const id = `stellar-${groupName}-${key}`;

      const box = element("div", "stellar-control");
      const row = element("div", "stellar-row");

      const labelWrap = element(
        "div",
        "stellar-label-wrap"
      );

      const label = element("label");

      label.textContent = title(key);
      label.htmlFor = id;

      labelWrap.append(label);
      row.append(labelWrap);
      box.append(row);

      const descriptionId = addHelp(
        box,
        labelWrap,
        path,
        title(key)
      );

      // --------------------------------------------------------
      // BOOLEAN SETTINGS
      // --------------------------------------------------------

      if (typeof value === "boolean") {
        const input = element("input");

        input.id = id;
        input.type = "checkbox";
        input.checked = value;

        input.setAttribute(
          "aria-describedby",
          descriptionId
        );

        input.addEventListener("change", () => {
          group[key] = input.checked;
          changed();
        });

        bindings.push(() => {
          input.checked = group[key];
        });

        row.append(input);

      // --------------------------------------------------------
      // RGB COLOR SETTINGS
      // --------------------------------------------------------

      } else if (Array.isArray(value)) {
        const colors = element("div", "stellar-colors");
        const picker = element("input");

        picker.id = id;
        picker.type = "color";
        picker.value = toHex(value);

        picker.setAttribute(
          "aria-describedby",
          descriptionId
        );

        colors.append(picker);

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

          input.setAttribute(
            "aria-describedby",
            descriptionId
          );

          input.addEventListener("input", () => {
            if (input.value === "") return;

            const number = Number(input.value);

            if (!Number.isFinite(number)) return;

            group[key][index] = clamp(
              Math.round(number),
              0,
              255
            );

            picker.value = toHex(group[key]);
            changed();
          });

          input.addEventListener("change", () => {
            input.value = group[key][index];
          });

          colors.append(input);

          return input;
        });

        picker.addEventListener("input", () => {
          group[key] = [1, 3, 5].map(offset =>
            parseInt(
              picker.value.slice(offset, offset + 2),
              16
            )
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

        box.insertBefore(
          colors,
          box.lastElementChild
        );

      // --------------------------------------------------------
      // NUMERIC SETTINGS
      // --------------------------------------------------------

      } else if (typeof value === "number") {
        const [min, max, step] =
          limits[path] || [0, 100, 1];

        const number = element("input");
        const range = element("input");

        number.id = id;
        number.type = "number";

        range.type = "range";
        range.setAttribute("aria-label", title(key));

        function normalize(raw) {
          const bounded = clamp(raw, min, max);

          const stepped =
            min +
            Math.round((bounded - min) / step) * step;

          return Number(
            clamp(stepped, min, max).toFixed(6)
          );
        }

        for (const input of [number, range]) {
          input.min = min;
          input.max = max;
          input.step = step;
          input.value = value;

          input.setAttribute(
            "aria-describedby",
            descriptionId
          );

          input.addEventListener("input", () => {
            if (input.value === "") return;

            const parsed = Number(input.value);

            if (!Number.isFinite(parsed)) return;

            group[key] = normalize(parsed);

            number.value = group[key];
            range.value = group[key];

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

        row.append(number);

        box.insertBefore(
          range,
          box.lastElementChild
        );
      }

      content.append(box);
    }

    controls.append(section);
  }

  // ============================================================
  // PANEL ACTIONS
  // ============================================================

  toggle.addEventListener("click", () => open(true));
  close.addEventListener("click", () => open(false));

  $(".stellar-expand").addEventListener("click", () => {
    setSectionsOpen(true);
  });

  $(".stellar-collapse").addEventListener("click", () => {
    setSectionsOpen(false);
  });

  show.addEventListener("click", () => {
    code.hidden = !code.hidden;
    code.value = exportCode();

    show.textContent =
      code.hidden ? "Show code" : "Hide code";
  });

  $(".stellar-copy").addEventListener("click", async () => {
    code.value = exportCode();

    try {
      await navigator.clipboard.writeText(code.value);

      status.textContent =
        "Configuration copied to clipboard.";
    } catch {
      code.hidden = false;
      show.textContent = "Hide code";

      code.focus();
      code.select();

      status.textContent =
        "Press Ctrl+C or Command+C to copy.";
    }
  });

  $(".stellar-next").addEventListener("click", () => {
    onNextStar();

    status.textContent =
      "Selected the next star for flight mode.";
  });

  $(".stellar-rotation").addEventListener("click", () => {
    onResetRotation();

    status.textContent =
      "Animated camera rotation reset.";
  });

  $(".stellar-reset").addEventListener("click", () => {
    onReset();

    status.textContent =
      "A new star field has been created.";
  });

  $(".stellar-nebula").addEventListener("click", () => {
    onNebula();

    status.textContent =
      "New nebulas have been generated.";
  });

  // ============================================================
  // KEYBOARD AND POINTER HANDLING
  // ============================================================

  function keydown(event) {
    if (event.key !== "Escape") return;

    if (activeHelp() || !tooltip.hidden) {
      clearHelp();
    } else if (panel.classList.contains("open")) {
      open(false);
    }
  }

  function outsidePointer(event) {
    if (
      pinnedHelp &&
      !pinnedHelp.box.contains(event.target) &&
      !tooltip.contains(event.target)
    ) {
      pinnedHelp = null;
      positionHelp();
    }
  }

  function onPanelScroll() {
    positionHelp();
  }

  document.addEventListener("keydown", keydown);

  document.addEventListener(
    "pointerdown",
    outsidePointer
  );

  panel.addEventListener(
    "scroll",
    onPanelScroll,
    { passive: true }
  );

  window.addEventListener(
    "resize",
    positionHelp
  );

  // ============================================================
  // INITIALIZATION
  // ============================================================

  code.value = exportCode();

  // ============================================================
  // PUBLIC API
  // ============================================================

  return {
    refresh: refreshControls,

    destroy() {
      destroyed = true;

      clearTimeout(hideTimer);

      document.removeEventListener(
        "keydown",
        keydown
      );

      document.removeEventListener(
        "pointerdown",
        outsidePointer
      );

      panel.removeEventListener(
        "scroll",
        onPanelScroll
      );

      window.removeEventListener(
        "resize",
        positionHelp
      );

      root.remove();
    }
  };
}
