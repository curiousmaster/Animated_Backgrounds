export function createSettingsEditor({
  config,
  onChange = () => {},
  onReset = () => {},
  onNebula = () => {},
  onNextStar = () => {},
  onResetRotation = () => {}
}) {
  const limits = {
    "stars.count": [20, 2000, 1],
    "stars.initialSpeed": [0, 60, 1],
    "stars.radius": [1, 6, 0.1],
    "stars.maxCount": [350, 650, 1],
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

    "appearance.glow": [0, 40, 1],
    "animation.speed": [0, 3, 0.05]
  };

  const labels = {
    threeD: "3D simulation",
    sizeSlowdown: "Size-based slowdown",
    rotationSpeedX: "X rotation speed",
    rotationSpeedY: "Y rotation speed",
    rotationSpeedZ: "Z rotation speed"
  };

  const descriptions = {
    "stars.count":
      "Number of stars created when starting a new field. Changing this " +
      "restarts the simulation. Merging and explosions change the population afterward.",

    "stars.initialSpeed":
      "Starting movement speed of newly created stars, in simulation units " +
      "per second. Gravity changes their velocity after initialization.",

    "stars.radius":
      "Base physical radius of a mass-1 star. Larger values make stars " +
      "look bigger and increase their collision size. Radius grows with the cube root of mass.",

    "stars.maxCount":
      "Maximum population allowed when explosions create fragments. " +
      "A giant waits if there is insufficient room for at least two fragments. " +
      "Lowering this limit merges excess stars while preserving mass.",

    "stars.opacity":
      "Base visibility of star cores. 0 hides the cores; 1 makes them " +
      "fully opaque before distance fading. Halos and trails have their own rendering.",

    "stars.trails":
      "Length of the velocity trail in seconds of movement. " +
      "0 disables trails. These are short lines based on current velocity, " +
      "rather than a stored history of the star's path.",

    "stars.sizeSlowdown":
      "Slows stars as they merge and lowers the maximum speed of large stars. " +
      "0 disables size-based braking. Higher values create slower giants. " +
      "This is an artistic effect and does not conserve momentum during merges.",

    "gravity.strength":
      "Strength of the attraction between stars. Higher values make stars " +
      "gather faster. Each star's mass increases the gravitational pull it exerts.",

    "gravity.range":
      "Maximum simulation-space distance over which two stars attract " +
      "one another. Shorter ranges favor local clusters; longer ranges connect distant groups.",

    "gravity.softening":
      "Softens gravity at close distances to prevent extreme acceleration. " +
      "Higher values make encounters gentler and reduce attraction near star centers.",

    "gravity.maxSpeed":
      "Base maximum physical speed. Large stars receive a lower limit " +
      "when Size-based slowdown is enabled. This also limits explosion fragments.",

    "gravity.mergeDistance":
      "Collision multiplier applied to the sum of two stars' radii. " +
      "Higher values allow merging from farther apart. Stars on cooldown cannot merge.",

    "explosions.enabled":
      "Allows sufficiently massive stars to explode after their delay. " +
      "When disabled, stars can continue merging into larger giants.",

    "explosions.glowMass":
      "Mass at which a star begins developing a stronger, warmer halo. " +
      "This is a visual threshold and does not itself trigger an explosion.",

    "explosions.criticalMass":
      "Mass a star must reach before its explosion countdown starts. " +
      "Higher values generally produce fewer explosions and larger giants.",

    "explosions.delay":
      "Base waiting time after reaching critical mass, in simulation seconds. " +
      "The waiting time is assigned when each star is created; change this before " +
      "starting a new field to apply it to all stars.",

    "explosions.delayVariation":
      "Maximum extra random waiting time added to the base explosion delay. " +
      "Assigned when stars are created. Larger values make burst timing less uniform.",

    "explosions.fragments":
      "Requested number of stars produced by an explosion. The available " +
      "population budget may reduce this number. The parent's mass is divided equally.",

    "explosions.speed":
      "Outward ejection speed of fragments, added to the parent's movement. " +
      "Higher values scatter fragments farther. Maximum speed and size-based limits still apply.",

    "explosions.cooldown":
      "Time after an explosion during which fragments cannot merge. " +
      "This prevents immediate recombination. Gravity continues to act during cooldown.",

    "explosions.shockwaveStrength":
      "Additional push from a giant's expanding explosion wave. " +
      "0 disables this force without disabling the visual ring or fragmentation.",

    "space.threeD":
      "Simulates depth as well as horizontal and vertical motion. " +
      "Gravity and collisions use three-dimensional distances. Changing this restarts the field.",

    "space.sphereBoundary":
      "Keeps stars inside a sphere in 3D, or a disk in 2D. " +
      "When disabled, stars wrap across the edges of a box. Changing this restarts the field.",

    "space.radius":
      "Radius of the simulation boundary. Larger values spread the same " +
      "number of stars over more space, making encounters less frequent. " +
      "Changing this restarts the field.",

    "space.boundaryBounce":
      "How much outward velocity remains after hitting the spherical boundary. " +
      "1 is a fully elastic bounce; lower values reduce the normal component of movement.",

    "camera.distance":
      "External camera distance from the center of the star field. " +
      "Smaller distances create stronger perspective. This setting is not used " +
      "for positioning the camera in Flight mode.",

    "camera.zoom":
      "Magnification of the view. Higher values enlarge the scene " +
      "without changing physical positions, gravity, or collision distances.",

    "camera.rotationX":
      "Starting rotation around the X axis, in degrees. " +
      "Tilts the external view vertically. Animated X rotation is added to this angle.",

    "camera.rotationY":
      "Starting rotation around the Y axis, in degrees. " +
      "Turns the external view horizontally. Animated Y rotation is added to this angle.",

    "camera.rotationZ":
      "Starting rotation around the Z axis, in degrees. " +
      "Rotates the external view in the screen plane.",

    "camera.rotationSpeedX":
      "Animated X rotation in degrees per simulation second. " +
      "0 stops rotation; negative values reverse its direction. " +
      "Animation speed also scales this motion.",

    "camera.rotationSpeedY":
      "Animated Y rotation in degrees per simulation second. " +
      "0 stops rotation; negative values reverse its direction. " +
      "These rotations affect the external view, not the movement-facing flight view.",

    "camera.rotationSpeedZ":
      "Animated Z rotation in degrees per simulation second. " +
      "0 stops rotation; negative values reverse its direction. " +
      "Use Reset rotation to return the accumulated angles to zero.",

    "camera.showBoundary":
      "Draws three faint great circles showing the spherical boundary. " +
      "Useful for inspecting the 3D space. Only shown when Sphere boundary is enabled.",

    "flight.enabled":
      "Places the camera on a star and points it along that star's movement. " +
      "The followed star is hidden. Its successor is followed after a merge or explosion.",

    "flight.followDistance":
      "Distance behind the followed star, in simulation units. " +
      "0 places the camera at its position. Larger values give a trailing viewpoint.",

    "flight.heightOffset":
      "Vertical offset from the followed star in simulation-space Y. " +
      "Positive and negative values place the camera on opposite sides of the star.",

    "flight.fieldOfView":
      "Vertical viewing angle for Flight mode, in degrees. " +
      "Higher values show more surroundings; lower values create a tighter view.",

    "flight.positionSmoothing":
      "How quickly the camera catches up with the star's position. " +
      "Higher values track more tightly. 0 follows immediately without smoothing.",

    "flight.directionSmoothing":
      "How quickly the camera turns toward the star's movement direction. " +
      "Higher values react faster. 0 follows its direction immediately.",

    "flight.nearClip":
      "Minimum forward distance at which objects are rendered in Flight mode. " +
      "Higher values hide objects very close to the camera and reduce large foreground shapes.",

    "flight.showStatus":
      "Shows the followed star's identifier, mass, speed, and the current " +
      "population in the lower-left corner.",

    "mouse.enabled":
      "Enables pointer attraction and click-generated shockwaves. " +
      "Stars continue their normal gravitational simulation when disabled.",

    "mouse.radius":
      "Pointer attraction radius in screen pixels. It remains a screen-space " +
      "interaction even when the stars are simulated in 3D.",

    "mouse.strength":
      "Strength of the pointer's attraction. Higher values bend star paths " +
      "more strongly toward the cursor. The camera's followed star is excluded " +
      "from this attraction in Flight mode.",

    "mouse.holdMultiplier":
      "Multiplier applied to pointer attraction while holding the primary " +
      "mouse button or touching the background.",

    "mouse.shockwave":
      "Strength of the expanding scattering wave created by clicking or tapping. " +
      "0 removes the push while retaining the ring.",

    "mouse.smoothing":
      "How quickly the attraction point follows your pointer. " +
      "Higher values feel more immediate; lower values create a softer trailing response.",

    "nebula.enabled":
      "Shows or hides the cached colorful nebula artwork. " +
      "Nebulas have no gravity and do not move with the simulation or camera.",

    "nebula.clouds":
      "Number of decorative cloud groups. Changing this rebuilds the static " +
      "nebula image without restarting the stars.",

    "nebula.opacity":
      "Visibility of the entire nebula layer. 0 hides it; higher values " +
      "make the background clouds more prominent.",

    "nebula.size":
      "Cloud size relative to the viewport. Larger values create broader, " +
      "more overlapping clouds. Changing this rebuilds the nebula artwork.",

    "nebula.colorA":
      "First color used by alternating nebula cloud groups. " +
      "Choose a color or edit its red, green, and blue channels.",

    "nebula.colorB":
      "Second color used by alternating nebula cloud groups. " +
      "The artwork blends overlapping clouds using screen compositing.",

    "nebula.colorC":
      "Third color used by alternating nebula cloud groups. " +
      "Changing it recolors the static artwork without affecting star physics.",

    "appearance.backgroundColor":
      "Solid color beneath the stars and nebulas. " +
      "Darker colors make luminous stars and halos stand out more clearly.",

    "appearance.starColor":
      "Base color of small stars. Their appearance also fades with camera distance.",

    "appearance.giantColor":
      "Warmer color approached as a star grows from the glow threshold " +
      "toward critical mass.",

    "appearance.hotColor":
      "Color approached during the explosion countdown. " +
      "Also used for shockwave and explosion rings.",

    "appearance.glow":
      "Additional halo size around stars. Larger values create broader glows. " +
      "Mass and perspective also affect the visible halo.",

    "animation.speed":
      "Global simulation speed. Scales star motion, explosion timers, " +
      "camera rotation, and flight smoothing. 0 freezes simulation time.",

    "animation.paused":
      "Freezes physics, explosion timers, and animated rotation. " +
      "Settings can still be edited while the scene is paused.",

    "animation.respectReducedMotion":
      "Pauses the simulation when the operating system or browser requests " +
      "reduced motion. Disable only if you deliberately want continuous animation.",

    "panel.enabled":
      "Controls whether the settings editor is enabled. Turning this off " +
      "hides the editor immediately. Copy your configuration first. " +
      "Save enabled: false in index.html to prevent the editor from being imported."
  };

  const sectionHelp = {
    stars:
      "Size-based slowdown reduces speed as stars grow. " +
      "Changing initial count restarts the field.",

    gravity:
      "Tune how stars attract and merge.",

    explosions:
      "Higher critical mass and longer delays produce fewer explosions.",

    space:
      "Space changes restart the field.",

    camera:
      "Rotation speeds are degrees per simulation second. " +
      "0 stops an axis; negative values reverse it.",

    flight:
      "Ride a star while looking along its movement.",

    nebula:
      "Static decorative clouds, independent of the simulation."
  };

  const initiallyOpen = new Set(["stars", "camera", "flight"]);
  const sections = [];
  const bindings = [];

  const style = document.createElement("style");

  style.textContent = `
    .stellar-editor {
      position:fixed; inset:0; z-index:10000; pointer-events:none;
      color:#e6eaf5; font:13px/1.5 system-ui,sans-serif;
      color-scheme:dark;
    }

    .stellar-editor * { box-sizing:border-box; }

    .stellar-editor button,
    .stellar-editor input,
    .stellar-editor textarea { font:inherit; }

    .stellar-editor button {
      min-height:44px; padding:8px 11px;
      border:1px solid #ffffff26; border-radius:7px;
      background:#293047; color:inherit; cursor:pointer;
      touch-action:manipulation;
    }

    .stellar-editor button:hover { background:#3b4560; }

    .stellar-editor :focus-visible {
      outline:2px solid #b6c9ee; outline-offset:3px;
    }

    .stellar-toggle {
      position:absolute;
      top:max(16px,env(safe-area-inset-top));
      right:max(16px,env(safe-area-inset-right));
      pointer-events:auto;
    }

    .stellar-panel {
      position:absolute; top:0; right:0;
      width:min(370px,100vw); height:100%; padding:22px;
      padding-top:max(22px,env(safe-area-inset-top));
      padding-bottom:max(22px,env(safe-area-inset-bottom));
      overflow:auto; overscroll-behavior:contain;
      border-left:1px solid #ffffff20;
      background:rgba(10,14,28,.95); backdrop-filter:blur(16px);
      pointer-events:auto; transform:translateX(100%);
      transition:transform 220ms ease;
      scrollbar-width:thin; scrollbar-color:#ffffff30 transparent;
    }

    .stellar-panel.open { transform:translateX(0); }

    .stellar-heading {
      display:flex; align-items:center;
      justify-content:space-between; gap:12px;
    }

    .stellar-heading h2 { margin:0; font-size:18px; }

    .stellar-help,.stellar-status {
      color:#acb8ce; font-size:12px; line-height:1.65;
    }

    .stellar-help { margin:0 0 14px; }
    .stellar-introduction { margin:12px 0 16px; }

    .stellar-section-actions {
      display:flex; gap:8px; margin-bottom:14px;
    }

    .stellar-section-actions button {
      flex:1; font-size:12px; background:#ffffff06;
    }

    .stellar-section {
      margin-top:12px; border:1px solid #ffffff18;
      border-radius:9px; background:#ffffff03;
    }

    .stellar-summary {
      display:flex; align-items:center;
      justify-content:space-between; gap:12px;
      min-height:46px; padding:11px 13px;
      color:#bdceeb; font-weight:600; cursor:pointer;
      list-style:none; user-select:none;
      touch-action:manipulation; border-radius:9px;
    }

    .stellar-summary::-webkit-details-marker { display:none; }

    .stellar-summary::after {
      content:"+"; color:#92a9cb; font-size:18px; font-weight:400;
    }

    .stellar-section[open] > .stellar-summary::after { content:"−"; }
    .stellar-summary:hover { background:#ffffff06; }

    .stellar-section[open] > .stellar-summary {
      border-bottom:1px solid #ffffff12;
      border-bottom-left-radius:0;
      border-bottom-right-radius:0;
    }

    .stellar-section-content { padding:12px 13px 2px; }

    .stellar-control {
      margin:0 -5px 9px; padding:5px;
      border-radius:6px;
    }

    .stellar-control:hover,
    .stellar-control:focus-within {
      background:#ffffff05;
    }

    .stellar-row {
      display:flex; align-items:center;
      justify-content:space-between; gap:8px; margin-bottom:5px;
    }

    .stellar-label-wrap {
      display:flex; align-items:center; gap:6px;
      flex:1; min-width:0;
    }

    .stellar-label-wrap label { min-width:0; }

    .stellar-editor .stellar-help-button {
      min-height:28px; height:28px; width:28px;
      flex:0 0 28px; padding:0;
      border:1px solid #ffffff20; border-radius:50%;
      background:transparent; color:#9eb8dc;
      font-size:12px; line-height:1;
    }

    .stellar-help-button[aria-expanded="true"] {
      background:#a9bfe320;
      border-color:#a9bfe360;
    }

    .stellar-panel input[type=range] {
      width:100%; accent-color:#a9bfe3;
    }

    .stellar-panel input[type=number] {
      width:78px; padding:5px; color:inherit;
      background:#ffffff08; border:1px solid #ffffff24;
      border-radius:5px;
    }

    .stellar-row input[type=number] { flex:0 0 78px; }

    .stellar-panel input[type=checkbox] {
      width:18px; height:18px; accent-color:#a9bfe3;
      flex-shrink:0;
    }

    .stellar-colors { display:flex; gap:6px; align-items:center; }

    .stellar-panel input[type=color] {
      width:38px; height:32px; padding:2px;
      background:transparent; border:1px solid #ffffff24;
      border-radius:5px; flex-shrink:0;
    }

    .stellar-colors input[type=number] {
      width:0; min-width:0; flex:1;
    }

    .stellar-actions {
      display:flex; flex-wrap:wrap; gap:8px; margin-top:18px;
    }

    .stellar-code {
      width:100%; min-height:260px; margin-top:14px; padding:12px;
      background:#050a15; color:#cddbf0;
      border:1px solid #ffffff24; border-radius:7px;
      resize:vertical;
      font:11px/1.6 ui-monospace,monospace !important;
    }

    .stellar-status { min-height:20px; margin-bottom:0; }

    /* Outside the scrollable pane so the popup cannot be clipped. */
    .stellar-tooltip {
      position:fixed; z-index:2;
      width:280px; max-height:calc(100dvh - 24px);
      padding:16px 18px; overflow:auto;
      border:1px solid #a9bfe340; border-radius:12px;
      background:rgba(9,15,30,.97);
      box-shadow:0 12px 40px #00000050;
      color:#d0dded; font-size:13px; line-height:1.7;
      pointer-events:auto;
    }

    .stellar-tooltip strong {
      display:block; margin-bottom:7px;
      color:#eff4fc; font-size:14px;
    }

    .stellar-tooltip p { margin:0; }

    .stellar-inline-help {
      margin-top:8px; padding:10px 12px;
      border-left:2px solid #91afd5;
      border-radius:0 6px 6px 0;
      background:#a9bfe30b; color:#c2d0e4;
      font-size:12px; line-height:1.65;
    }

    .stellar-editor [hidden] { display:none !important; }

    @media(prefers-reduced-motion:reduce) {
      .stellar-panel { transition:none; }
    }
  `;

  document.head.append(style);

  const root = document.createElement("div");
  root.className = "stellar-editor";
  root.dataset.backgroundEditor = "";

  root.innerHTML = `
    <button class="stellar-toggle" type="button"
      aria-expanded="false" aria-controls="stellar-panel">
      Settings
    </button>

    <aside id="stellar-panel" class="stellar-panel"
      aria-label="Stellar Bloom settings" inert>
      <div class="stellar-heading">
        <h2>Stellar Bloom</h2>
        <button class="stellar-close" type="button">Retract</button>
      </div>

      <p class="stellar-help stellar-introduction">
        Hover over a setting or focus its control for help.
        On phones, tap its ? button.
        Copy your settings before disabling the editor.
      </p>

      <div class="stellar-section-actions">
        <button class="stellar-expand" type="button">Expand all</button>
        <button class="stellar-collapse" type="button">Collapse all</button>
      </div>

      <div class="stellar-controls"></div>

      <div class="stellar-actions">
        <button class="stellar-show" type="button">Show code</button>
        <button class="stellar-copy" type="button">Copy config</button>
        <button class="stellar-next" type="button">Next star</button>
        <button class="stellar-rotation" type="button">Reset rotation</button>
        <button class="stellar-reset" type="button">New star field</button>
        <button class="stellar-nebula" type="button">New nebulas</button>
      </div>

      <textarea class="stellar-code" aria-label="Configuration code"
        spellcheck="false" readonly hidden></textarea>

      <p class="stellar-status" role="status" aria-live="polite"></p>
    </aside>

    <div class="stellar-tooltip" role="tooltip" hidden>
      <strong></strong>
      <p></p>
    </div>
  `;

  document.body.append(root);

  const toggle = root.querySelector(".stellar-toggle");
  const panel = root.querySelector(".stellar-panel");
  const close = root.querySelector(".stellar-close");
  const controls = root.querySelector(".stellar-controls");
  const code = root.querySelector(".stellar-code");
  const show = root.querySelector(".stellar-show");
  const status = root.querySelector(".stellar-status");
  const tooltip = root.querySelector(".stellar-tooltip");
  const tooltipTitle = tooltip.querySelector("strong");
  const tooltipText = tooltip.querySelector("p");

  let hoveredHelp = null;
  let focusedHelp = null;
  let pinnedHelp = null;
  let tooltipHovered = false;
  let hideTimer = null;
  let destroyed = false;

  const title = key => labels[key] ||
    key.replace(/([A-Z])/g, " $1")
      .replace(/^./, character => character.toUpperCase());

  const exportCode = () =>
    `const config = ${JSON.stringify(config, null, 2)};`;

  const toHex = color => "#" + color.map(value =>
    Math.round(value).toString(16).padStart(2, "0")
  ).join("");

  function element(tag, className) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }

  function activeHelp() {
    return pinnedHelp || hoveredHelp || focusedHelp;
  }

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
      !item.box.closest("details").open
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

    // Narrow viewport: help expands beneath the setting instead.
    if (availableWidth < 220) {
      tooltip.hidden = true;
      item.inline.hidden = false;
      return;
    }

    tooltipTitle.textContent = item.name;
    tooltipText.textContent = item.description;

    tooltip.style.width = `${Math.min(280, availableWidth)}px`;
    tooltip.style.maxHeight = `${Math.max(80, innerHeight - 24)}px`;
    tooltip.hidden = false;

    const popupRect = tooltip.getBoundingClientRect();
    const desiredTop =
      itemRect.top + itemRect.height / 2 - popupRect.height / 2;

    tooltip.style.left =
      `${paneRect.left - popupRect.width - gap}px`;

    tooltip.style.top =
      `${Math.max(12, Math.min(
        desiredTop,
        innerHeight - popupRect.height - 12
      ))}px`;
  }

  function scheduleHelpHide() {
    clearTimeout(hideTimer);

    hideTimer = setTimeout(() => {
      if (!tooltipHovered) positionHelp();
    }, 140);
  }

  const helpItems = [];

  function addHelp(box, labelWrap, path, name) {
    const description = descriptions[path] ||
      `Adjust ${name.toLowerCase()} for this scene.`;

    const inline = element("div", "stellar-inline-help");
    inline.id = `stellar-help-${path.replaceAll(".", "-")}`;
    inline.textContent = description;
    inline.hidden = true;

    const button = element("button", "stellar-help-button");
    button.type = "button";
    button.textContent = "?";
    button.setAttribute("aria-label", `Help for ${name}`);
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-controls", inline.id);

    labelWrap.append(button);
    box.append(inline);

    const item = { box, button, inline, name, description };
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

  function open(value) {
    toggle.hidden = false;

    if (!value) {
      clearHelp();
      if (panel.contains(document.activeElement)) toggle.focus();
    }

    panel.classList.toggle("open", value);
    panel.inert = !value;
    toggle.hidden = value;
    toggle.setAttribute("aria-expanded", String(value));

    if (value) close.focus();
  }

  function changed() {
    code.value = exportCode();
    onChange();

    if (!config.panel.enabled) {
      open(false);
      root.hidden = true;
    }
  }

  function refreshControls() {
    for (const update of bindings) update();
    code.value = exportCode();
  }

  function setSectionsOpen(value) {
    clearHelp();
    for (const section of sections) section.open = value;
  }

  for (const [groupName, group] of Object.entries(config)) {
    const section = element("details", "stellar-section");
    section.open = initiallyOpen.has(groupName);

    const summary = element("summary", "stellar-summary");
    summary.textContent = title(groupName);

    const content = element("div", "stellar-section-content");
    section.append(summary, content);
    sections.push(section);

    section.addEventListener("toggle", () => {
      const item = activeHelp();

      if (item && section.contains(item.box) && !section.open) {
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

    for (const [key, value] of Object.entries(group)) {
      const path = `${groupName}.${key}`;
      const box = element("div", "stellar-control");
      const row = element("div", "stellar-row");
      const labelWrap = element("div", "stellar-label-wrap");
      const label = element("label");
      const id = `stellar-${groupName}-${key}`;

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

      if (typeof value === "boolean") {
        const input = element("input");
        input.id = id;
        input.type = "checkbox";
        input.checked = value;
        input.setAttribute("aria-describedby", descriptionId);

        input.addEventListener("change", () => {
          group[key] = input.checked;
          changed();
        });

        bindings.push(() => {
          input.checked = group[key];
        });

        row.append(input);

      } else if (Array.isArray(value)) {
        const colors = element("div", "stellar-colors");
        const picker = element("input");

        picker.id = id;
        picker.type = "color";
        picker.value = toHex(value);
        picker.setAttribute("aria-describedby", descriptionId);
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
          input.setAttribute("aria-describedby", descriptionId);

          input.addEventListener("input", () => {
            if (input.value === "") return;

            const number = Number(input.value);
            if (!Number.isFinite(number)) return;

            group[key][index] = Math.max(
              0, Math.min(255, Math.round(number))
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

        // Keep inline help below the actual controls.
        box.insertBefore(colors, box.lastElementChild);

      } else if (typeof value === "number") {
        const [min, max, step] = limits[path] || [0, 100, 1];
        const number = element("input");
        const range = element("input");

        number.id = id;
        number.type = "number";
        range.type = "range";
        range.setAttribute("aria-label", title(key));

        function normalize(raw) {
          const bounded = Math.max(min, Math.min(max, raw));
          const stepped =
            min + Math.round((bounded - min) / step) * step;

          return Number(
            Math.max(min, Math.min(max, stepped)).toFixed(6)
          );
        }

        for (const input of [number, range]) {
          input.min = min;
          input.max = max;
          input.step = step;
          input.value = value;
          input.setAttribute("aria-describedby", descriptionId);

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

        row.append(number);
        box.insertBefore(range, box.lastElementChild);
      }

      content.append(box);
    }

    controls.append(section);
  }

  toggle.addEventListener("click", () => open(true));
  close.addEventListener("click", () => open(false));

  root.querySelector(".stellar-expand").addEventListener("click", () => {
    setSectionsOpen(true);
  });

  root.querySelector(".stellar-collapse").addEventListener("click", () => {
    setSectionsOpen(false);
  });

  show.addEventListener("click", () => {
    code.hidden = !code.hidden;
    code.value = exportCode();
    show.textContent = code.hidden ? "Show code" : "Hide code";
  });

  root.querySelector(".stellar-copy").addEventListener("click", async () => {
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

  root.querySelector(".stellar-next").addEventListener("click", () => {
    onNextStar();
    status.textContent = "Selected the next star for flight mode.";
  });

  root.querySelector(".stellar-rotation").addEventListener("click", () => {
    onResetRotation();
    status.textContent = "Animated rotation returned to its starting angles.";
  });

  root.querySelector(".stellar-reset").addEventListener("click", () => {
    onReset();
    status.textContent = "A new star field has been created.";
  });

  root.querySelector(".stellar-nebula").addEventListener("click", () => {
    onNebula();
    status.textContent = "New static nebulas have been created.";
  });

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
  document.addEventListener("pointerdown", outsidePointer);
  panel.addEventListener("scroll", onPanelScroll, { passive: true });
  window.addEventListener("resize", positionHelp);

  code.value = exportCode();

  return {
    refresh: refreshControls,

    destroy() {
      destroyed = true;
      clearTimeout(hideTimer);
      document.removeEventListener("keydown", keydown);
      document.removeEventListener("pointerdown", outsidePointer);
      panel.removeEventListener("scroll", onPanelScroll);
      window.removeEventListener("resize", positionHelp);
      root.remove();
      style.remove();
    }
  };
}
