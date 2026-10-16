"use strict";

export function mountEditor({
    config,
    onChange = () => {},
    onReset = () => {},
    onResetView = () => {}
}) {
    const clamp = (v, min, max) =>
        Math.max(min, Math.min(max, v));

    const uid = "const-" + Math.random().toString(36).slice(2);
    const bindings = [];
    let destroyed = false;

    const style = document.createElement("style");

    style.textContent = `
        .const-editor,
        .const-editor * {
            box-sizing: border-box;
        }

        .const-editor {
            color: #eee;
            color-scheme: dark;
            font-family: system-ui, sans-serif;
        }

        .const-editor [hidden] {
            display: none !important;
        }

        .const-panel {
            position: fixed;
            inset: 0 0 0 auto;
            width: min(350px, 100vw);
            z-index: 1001;
            display: flex;
            flex-direction: column;
            background: rgba(18, 20, 25, .97);
            border-left: 1px solid #343840;
            box-shadow: -8px 0 30px #0006;
            transform: translateX(100%);
            transition: transform 220ms ease;
        }

        .const-panel.open {
            transform: translateX(0);
        }

        .const-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
            padding: 16px;
            border-bottom: 1px solid #343840;
        }

        .const-header strong {
            font-size: 15px;
        }

        .const-body {
            flex: 1;
            min-height: 0;
            overflow-y: auto;
            overscroll-behavior: contain;
            padding: 0 16px 20px;
            scrollbar-width: thin;
        }

        .const-section {
            margin-top: 16px;
            border: 1px solid #343840;
            border-radius: 8px;
        }

        .const-section > summary {
            padding: 11px 12px;
            color: #b6c5dd;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            user-select: none;
        }

        .const-section > summary:hover {
            color: #fff;
            background: #ffffff06;
        }

        .const-section[open] > summary {
            border-bottom: 1px solid #343840;
        }

        .const-fields {
            padding: 12px;
        }

        .const-control {
            display: grid;
            grid-template-columns: 1fr 100px;
            gap: 8px;
            align-items: center;
            margin-bottom: 14px;
            font-size: 12px;
        }

        .const-control:last-child {
            margin-bottom: 0;
        }

        .const-control > label {
            line-height: 1.4;
        }

        .const-editor input[type="range"] {
            grid-column: 1 / -1;
            width: 100%;
            margin: 0;
            accent-color: #80baff;
            cursor: pointer;
        }

        .const-editor input[type="number"],
        .const-editor select {
            width: 100px;
            padding: 5px 7px;
            color: #fff;
            background: #090b10;
            border: 1px solid #454b57;
            border-radius: 5px;
            font: inherit;
        }

        .const-editor input[type="checkbox"] {
            justify-self: end;
            accent-color: #80baff;
        }

        .const-colors {
            grid-column: 1 / -1;
            display: flex;
            gap: 8px;
            align-items: center;
        }

        .const-editor input[type="color"] {
            width: 42px;
            height: 30px;
            padding: 2px;
            background: transparent;
            border: 1px solid #454b57;
            border-radius: 5px;
            cursor: pointer;
        }

        .const-rgb {
            display: flex;
            flex: 1;
            gap: 6px;
            min-width: 0;
        }

        .const-rgb input[type="number"] {
            width: 100%;
            min-width: 0;
        }

        .const-editor button {
            padding: 8px 11px;
            color: #eee;
            background: #272d38;
            border: 1px solid #454b57;
            border-radius: 6px;
            cursor: pointer;
            font: 12px system-ui, sans-serif;
        }

        .const-editor button:hover {
            background: #384253;
        }

        .const-editor button:focus-visible,
        .const-editor input:focus-visible,
        .const-editor select:focus-visible,
        .const-editor textarea:focus-visible,
        .const-editor summary:focus-visible {
            outline: 2px solid #80baff;
            outline-offset: 2px;
        }

        .const-launcher {
            position: fixed;
            top: 16px;
            right: 16px;
            z-index: 1000;
        }

        .const-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 18px;
        }

        .const-editor textarea {
            width: 100%;
            height: 320px;
            margin-top: 12px;
            padding: 10px;
            resize: vertical;
            color: #bce0ff;
            background: #090b10;
            border: 1px solid #454b57;
            border-radius: 6px;
            font: 11px/1.5 monospace;
            white-space: pre;
        }

        .const-status {
            min-height: 18px;
            margin-top: 8px;
            color: #a8d6ad;
            font-size: 11px;
        }

        .const-hint {
            color: #aeb8ca;
            font-size: 11px;
            line-height: 1.6;
        }

        .const-tooltip {
            position: fixed;
            z-index: 1100;
            width: 250px;
            padding: 12px 14px;
            color: #dbe8fc;
            background: rgba(14, 19, 29, .98);
            border: 1px solid #465672;
            border-radius: 8px;
            box-shadow: 0 8px 28px #0008;
            font-size: 12px;
            line-height: 1.6;
            pointer-events: none;
            overflow-wrap: anywhere;
        }

        .const-sr {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip-path: inset(50%);
            white-space: nowrap;
            border: 0;
        }

        @media (prefers-reduced-motion: reduce) {
            .const-panel {
                transition: none;
            }
        }
    `;

    document.head.appendChild(style);

    const root = document.createElement("div");
    root.className = "const-editor";
    root.setAttribute("data-background-editor", "");

    root.innerHTML = `
        <button class="const-launcher"
                type="button"
                aria-expanded="false"
                aria-controls="${uid}-panel">
            Settings
        </button>

        <aside class="const-panel"
               id="${uid}-panel"
               aria-label="Constellation settings"
               inert>
            <div class="const-header">
                <strong>Constellation · 3D WebGL</strong>
                <button class="const-close" type="button">
                    Retract →
                </button>
            </div>

            <div class="const-body">
                <div class="const-controls"></div>

                <div class="const-actions">
                    <button class="const-show"
                            type="button"
                            aria-expanded="false">
                        Show code
                    </button>

                    <button class="const-copy" type="button">
                        Copy config
                    </button>

                    <button class="const-reset" type="button">
                        Reset points
                    </button>

                    <button class="const-reset-view" type="button">
                        Reset view
                    </button>
                </div>

                <textarea readonly
                          spellcheck="false"
                          hidden
                          aria-label="Current configuration code"></textarea>

                <div class="const-status" role="status"></div>

                <p class="const-hint">
                    Use the mouse wheel over the background to zoom.
                    Scroll here to move through the settings.
                </p>

                <p class="const-hint">
                    In 3D, connections use actual spatial distance.
                    Increasing field depth spreads points apart;
                    increase connection distance for a denser network.
                </p>

                <p class="const-hint">
                    Click section headings to fold them.
                    Hover over a setting for help.
                    RGB fields are ordered R, G, B.
                </p>

                <p class="const-hint">
                    Copy the configuration into index.html to save
                    your settings. Copy it before disabling this pane.
                </p>
            </div>
        </aside>

        <div class="const-tooltip"
             role="tooltip"
             hidden></div>
    `;

    document.body.appendChild(root);

    const find = selector => root.querySelector(selector);
    const panel = find(".const-panel");
    const launcher = find(".const-launcher");
    const close = find(".const-close");
    const controls = find(".const-controls");
    const show = find(".const-show");
    const code = find("textarea");
    const status = find(".const-status");
    const tooltip = find(".const-tooltip");
    const body = find(".const-body");

    let activeHelpRow = null;

    function getValue(path) {
        return path.split(".").reduce(
            (object, key) => object[key],
            config
        );
    }

    function setValue(path, value) {
        const keys = path.split(".");
        const last = keys.pop();

        const object = keys.reduce(
            (current, key) => current[key],
            config
        );

        object[last] = value;
    }

    function getCode() {
        return "const config = " +
            JSON.stringify(config, null, 4) +
            ";";
    }

    function refresh() {
        if (destroyed) return;

        for (const update of bindings) update();

        code.value = getCode();
    }

    function changed(path) {
        onChange(path);
        code.value = getCode();
        status.textContent = "";

        if (path === "panel.enabled") {
            if (!config.panel.enabled) setOpen(false);
            root.hidden = !config.panel.enabled;
        }
    }

    // --------------------------------------------------
    // Help
    // --------------------------------------------------

    function hideHelp() {
        tooltip.hidden = true;
        activeHelpRow = null;
    }

    function positionHelp() {
        if (!activeHelpRow || tooltip.hidden) return;

        const rowRect = activeHelpRow.getBoundingClientRect();
        const panelRect = panel.getBoundingClientRect();
        const space = panelRect.left - 24;

        if (space >= 180) {
            tooltip.style.width = Math.min(250, space) + "px";
            tooltip.style.left = Math.max(
                8,
                panelRect.left - tooltip.offsetWidth - 12
            ) + "px";
        } else {
            tooltip.style.width = Math.max(
                1,
                Math.min(280, window.innerWidth - 16)
            ) + "px";

            tooltip.style.left = Math.max(
                8,
                (window.innerWidth - tooltip.offsetWidth) / 2
            ) + "px";
        }

        const tooltipHeight = tooltip.offsetHeight;
        let top = rowRect.top +
            rowRect.height / 2 -
            tooltipHeight / 2;

        if (space < 180) {
            top = rowRect.bottom + 8;

            if (top + tooltipHeight > window.innerHeight - 8) {
                top = rowRect.top - tooltipHeight - 8;
            }
        }

        tooltip.style.top = clamp(
            top,
            8,
            Math.max(8, window.innerHeight - tooltipHeight - 8)
        ) + "px";
    }

    function showHelp(row, text) {
        activeHelpRow = row;
        tooltip.textContent = text;
        tooltip.hidden = false;
        positionHelp();
    }

    // --------------------------------------------------
    // Panel
    // --------------------------------------------------

    function setOpen(open) {
        open = Boolean(open && config.panel.enabled);

        hideHelp();
        panel.classList.toggle("open", open);
        panel.inert = !open;

        launcher.hidden = open || !config.panel.enabled;
        launcher.setAttribute("aria-expanded", String(open));

        if (open) close.focus();
        else if (config.panel.enabled) launcher.focus();
    }

    function setCodeVisible(visible) {
        code.hidden = !visible;
        show.textContent = visible ? "Hide code" : "Show code";
        show.setAttribute("aria-expanded", String(visible));
    }

    launcher.addEventListener("click", () => setOpen(true));
    close.addEventListener("click", () => setOpen(false));

    function onKeydown(event) {
        if (
            event.key === "Escape" &&
            panel.classList.contains("open")
        ) {
            setOpen(false);
        }
    }

    document.addEventListener("keydown", onKeydown);
    window.addEventListener("resize", hideHelp);
    body.addEventListener("scroll", hideHelp, { passive: true });

    show.addEventListener("click", () => {
        refresh();
        setCodeVisible(code.hidden);
    });

    find(".const-copy").addEventListener("click", async () => {
        refresh();

        try {
            await navigator.clipboard.writeText(getCode());

            if (!destroyed) {
                status.textContent = "Configuration copied.";
            }
        } catch {
            if (destroyed) return;

            setCodeVisible(true);
            code.focus();
            code.select();

            status.textContent =
                "Code selected. Press Ctrl+C or ⌘C to copy.";
        }
    });

    find(".const-reset").addEventListener("click", () => {
        onReset();
        status.textContent = "Points reset.";
    });

    find(".const-reset-view").addEventListener("click", () => {
        onResetView();
        refresh();
        status.textContent = "View reset.";
    });

    // --------------------------------------------------
    // Field definitions
    // --------------------------------------------------

    const groups = [
        ["View", [
            ["view.mode", "Mode", "select", [
                ["2d", "2D"],
                ["3d", "3D"]
            ]],
            ["view.depth", "Field depth", 0, 1200, 10],
            ["view.zoom", "Zoom", 0.35, 3, 0.01],
            ["view.wheelSensitivity", "Wheel sensitivity", 0, 3, 0.05],
            ["view.perspective", "Perspective", 0, 1, 0.01],
            ["view.parallax", "Mouse parallax", 0, 1, 0.01],
            ["view.depthFading", "Depth fading", 0, 1, 0.01]
        ]],

        ["Points", [
            ["points.count", "Point count", 0, 5000, 1],
            ["points.radius", "Point radius", 0, 6, 0.1],
            ["points.speed", "Drift speed", 0, 100, 1],
            ["points.opacity", "Opacity", 0, 1, 0.01],
            ["points.color", "Point color", "color"]
        ]],

        ["Connections", [
            ["connections.distance", "Connection distance", 0, 600, 1],
            ["connections.lineWidth", "Line width", 0, 4, 0.1],
            ["connections.opacity", "Opacity", 0, 1, 0.01],
            ["connections.color", "Line color", "color"]
        ]],

        ["Mouse", [
            ["mouse.enabled", "Enabled", "boolean"],
            ["mouse.radius", "Connection radius", 0, 800, 1],
            ["mouse.lineWidth", "Line width", 0, 4, 0.1],
            ["mouse.opacity", "Opacity", 0, 1, 0.01],
            ["mouse.showPoint", "Show cursor node", "boolean"],
            ["mouse.pointRadius", "Cursor node radius", 0, 10, 0.1],
            ["mouse.smoothing", "Response speed", 1, 25, 0.5],
            ["mouse.color", "Mouse color", "color"]
        ]],

        ["Glow", [
            ["glow.enabled", "Enabled", "boolean"],
            ["glow.intensity", "Intensity", 0, 1, 0.01],
            ["glow.blur", "Blur", 0, 30, 1]
        ]],

        ["Settings pane", [
            ["panel.enabled", "Enable pane", "boolean"]
        ]]
    ];

    const help = {
        "view.mode":
            "Switch between a flat 2D field and a perspective 3D " +
            "volume. Existing points are preserved during the transition.",

        "view.depth":
            "Thickness of the 3D volume in world units. Greater depth " +
            "spreads points apart and usually reduces the number of connections.",

        "view.zoom":
            "Camera zoom target. The mouse wheel changes this value. " +
            "Camera movement eases smoothly toward it.",

        "view.wheelSensitivity":
            "How strongly the wheel changes zoom. Zero disables wheel zoom. " +
            "The wheel continues scrolling normally over this pane.",

        "view.perspective":
            "Higher values strengthen the size difference between near " +
            "and distant points. Most visible in 3D mode.",

        "view.parallax":
            "How much the view tilts with pointer movement in 3D. " +
            "Zero keeps the camera facing straight ahead.",

        "view.depthFading":
            "How strongly distant points and their connections dim. " +
            "Zero gives all depths the same opacity.",

        "points.count":
            "Number of moving points. Higher counts increase connection " +
            "search work and rendering load.",

        "points.radius":
            "Point radius at unit scale. Perspective makes nearby points " +
            "larger and distant points smaller.",

        "points.speed":
            "Base movement speed in world units per second. " +
            "Each point has an individual speed multiplier.",

        "points.opacity":
            "Base point opacity before depth fading is applied.",

        "points.color":
            "Base point color. Points within the cursor's spatial radius " +
            "blend toward the mouse color.",

        "connections.distance":
            "Maximum spatial distance between connected points. " +
            "In 3D this includes depth; in 2D it uses X and Y only.",

        "connections.lineWidth":
            "Connection thickness at unit scale. Lines taper with depth.",

        "connections.opacity":
            "Maximum connection opacity. Connections fade with separation " +
            "and with the depth of their endpoints.",

        "connections.color":
            "Color of connections between points.",

        "mouse.enabled":
            "Enable cursor connections and nearby point recoloring. " +
            "Mouse parallax is controlled separately in the View section.",

        "mouse.radius":
            "Spatial influence radius around a cursor node on a plane " +
            "through the field center. Depth counts toward this distance.",

        "mouse.lineWidth":
            "Thickness of cursor connections at unit scale.",

        "mouse.opacity":
            "Maximum opacity of cursor connections and the cursor node.",

        "mouse.showPoint":
            "Show a node at the smoothed pointer position.",

        "mouse.pointRadius":
            "Cursor node radius at unit scale.",

        "mouse.smoothing":
            "How quickly the node follows the pointer and its influence " +
            "fades. Higher values respond faster.",

        "mouse.color":
            "Color of the cursor node, its connections, and nearby point tint.",

        "glow.enabled":
            "Enable shader-generated halos around points and connections.",

        "glow.intensity":
            "Strength of the soft halo around each shape.",

        "glow.blur":
            "Halo spread in screen pixels. Larger halos increase GPU work.",

        "panel.enabled":
            "Hide this editor. Copy your configuration first. Reload to " +
            "return to the configuration saved in index.html."
    };

    function toHex(color) {
        return "#" + color.map(value =>
            Math.round(clamp(value, 0, 255))
                .toString(16)
                .padStart(2, "0")
        ).join("");
    }

    function fromHex(hex) {
        return [1, 3, 5].map(index =>
            parseInt(hex.slice(index, index + 2), 16)
        );
    }

    let controlIndex = 0;

    for (const [title, fields] of groups) {
        const section = document.createElement("details");
        const summary = document.createElement("summary");
        const container = document.createElement("div");

        section.className = "const-section";
        section.open = true;
        summary.textContent = title;
        container.className = "const-fields";

        section.append(summary, container);
        section.addEventListener("toggle", hideHelp);

        for (const [path, labelText, type, max, step] of fields) {
            const row = document.createElement("div");
            const label = document.createElement("label");
            const description = document.createElement("span");

            const id = `${uid}-control-${controlIndex++}`;
            const text = help[path] || labelText;

            row.className = "const-control";

            label.textContent = labelText;
            label.htmlFor = id;

            description.id = `${id}-help`;
            description.className = "const-sr";
            description.textContent = text;

            row.append(label, description);

            row.addEventListener("pointerenter", () => {
                showHelp(row, text);
            });

            row.addEventListener("pointerleave", hideHelp);

            row.addEventListener("focusin", () => {
                showHelp(row, text);
            });

            row.addEventListener("focusout", event => {
                if (!row.contains(event.relatedTarget)) hideHelp();
            });

            if (type === "select") {
                const select = document.createElement("select");
                select.id = id;

                for (const [value, title] of max) {
                    const option = document.createElement("option");
                    option.value = value;
                    option.textContent = title;
                    select.appendChild(option);
                }

                select.value = getValue(path);

                select.addEventListener("change", () => {
                    setValue(path, select.value);
                    changed(path);
                });

                bindings.push(() => {
                    select.value = getValue(path);
                });

                row.appendChild(select);
            } else if (type === "boolean") {
                const input = document.createElement("input");

                input.id = id;
                input.type = "checkbox";
                input.checked = getValue(path);

                input.addEventListener("change", () => {
                    setValue(path, input.checked);
                    changed(path);
                });

                bindings.push(() => {
                    input.checked = getValue(path);
                });

                row.appendChild(input);
            } else if (type === "color") {
                const wrapper = document.createElement("div");
                const picker = document.createElement("input");
                const rgb = document.createElement("div");

                wrapper.className = "const-colors";
                rgb.className = "const-rgb";
                picker.id = id;
                picker.type = "color";

                const inputs = ["R", "G", "B"].map(
                    (channel, index) => {
                        const input = document.createElement("input");

                        input.type = "number";
                        input.min = 0;
                        input.max = 255;
                        input.step = 1;

                        input.setAttribute(
                            "aria-label",
                            `${labelText} ${channel}`
                        );

                        input.addEventListener("input", () => {
                            const value = input.valueAsNumber;
                            if (!Number.isFinite(value)) return;

                            const color = [...getValue(path)];

                            color[index] = Math.round(
                                clamp(value, 0, 255)
                            );

                            setValue(path, color);
                            picker.value = toHex(color);
                            changed(path);
                        });

                        input.addEventListener("change", () => {
                            input.value = getValue(path)[index];
                        });

                        rgb.appendChild(input);
                        return input;
                    }
                );

                picker.addEventListener("input", () => {
                    const color = fromHex(picker.value);
                    setValue(path, color);

                    inputs.forEach((input, index) => {
                        input.value = color[index];
                    });

                    changed(path);
                });

                bindings.push(() => {
                    const color = getValue(path);
                    picker.value = toHex(color);

                    inputs.forEach((input, index) => {
                        if (document.activeElement !== input) {
                            input.value = color[index];
                        }
                    });
                });

                wrapper.append(picker, rgb);
                row.appendChild(wrapper);
            } else {
                const number = document.createElement("input");
                const range = document.createElement("input");

                number.id = id;
                number.type = "number";
                range.type = "range";
                range.setAttribute("aria-label", labelText);

                const maximum = Math.max(
                    max,
                    Number(getValue(path)) || max
                );

                for (const input of [number, range]) {
                    input.min = type;
                    input.max = maximum;
                    input.step = step;
                }

                function update(source, target) {
                    let value = source.valueAsNumber;
                    if (!Number.isFinite(value)) return;

                    value = clamp(value, type, maximum);

                    if (step === 1) value = Math.round(value);

                    setValue(path, value);
                    target.value = value;
                    changed(path);
                }

                number.addEventListener("input", () => {
                    update(number, range);
                });

                number.addEventListener("change", () => {
                    number.value = getValue(path);
                });

                range.addEventListener("input", () => {
                    update(range, number);
                });

                bindings.push(() => {
                    const value = getValue(path);

                    range.value = value;

                    if (document.activeElement !== number) {
                        number.value = Number(value.toFixed(3));
                    }
                });

                row.append(number, range);
            }

            for (const input of row.querySelectorAll("input, select")) {
                input.setAttribute(
                    "aria-describedby",
                    description.id
                );
            }

            container.appendChild(row);
        }

        controls.appendChild(section);
    }

    refresh();
    root.hidden = !config.panel.enabled;

    return {
        refresh,

        destroy() {
            destroyed = true;
            document.removeEventListener("keydown", onKeydown);
            window.removeEventListener("resize", hideHelp);
            body.removeEventListener("scroll", hideHelp);
            root.remove();
            style.remove();
        }
    };
}
