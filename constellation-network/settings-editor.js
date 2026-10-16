"use strict";

export function mountEditor({
    config,
    onChange = () => {},
    onReset = () => {}
}) {
    const clamp = (value, min, max) =>
        Math.max(min, Math.min(max, value));

    const style = document.createElement("style");

    style.textContent = `
        .const-editor,
        .const-editor * {
            box-sizing: border-box;
        }

        .const-editor {
            color: #eee;
            font-family: system-ui, sans-serif;
            color-scheme: dark;
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
            background: rgba(18, 20, 25, .96);
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
            padding: 0 16px 20px;
            scrollbar-width: thin;
        }

        .const-section {
            margin: 16px 0 0;
            border: 1px solid #343840;
            border-radius: 8px;
        }

        .const-section > summary {
            padding: 11px 12px;
            color: #aeb8ca;
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

        .const-editor input[type="number"] {
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
            line-height: 1.5;
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

    const uniqueId = "const-" + Math.random()
        .toString(36)
        .slice(2);

    root.innerHTML = `
        <button class="const-launcher"
                type="button"
                aria-expanded="false"
                aria-controls="${uniqueId}-panel">
            Settings
        </button>

        <aside class="const-panel"
               id="${uniqueId}-panel"
               aria-label="Constellation settings"
               inert>
            <div class="const-header">
                <strong>Constellation · WebGL</strong>

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
                </div>

                <textarea readonly
                          spellcheck="false"
                          hidden
                          aria-label="Current configuration code"></textarea>

                <div class="const-status" role="status"></div>

                <p class="const-hint">
                    All settings update immediately.
                    Click a section heading to fold it.
                    Hover over a setting for help.
                </p>

                <p class="const-hint">
                    RGB fields are ordered R, G, B.
                    Copy the configuration into index.html
                    to keep your settings.
                </p>

                <p class="const-hint">
                    Higher point counts and connection distances
                    increase the workload. Large glow values
                    increase the number of pixels being rendered.
                </p>

                <p class="const-hint">
                    Copy your settings before disabling the pane.
                    Set panel.enabled to false in index.html
                    to prevent the editor from loading.
                </p>
            </div>
        </aside>

        <div class="const-tooltip"
             id="${uniqueId}-help"
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
    const copy = find(".const-copy");
    const reset = find(".const-reset");
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

    function refreshCode() {
        code.value = getCode();
        status.textContent = "";
    }

    // --------------------------------------------------
    // Tooltip positioning
    // --------------------------------------------------

    function hideHelp() {
        tooltip.hidden = true;
        activeHelpRow = null;
    }

    function positionHelp() {
        if (!activeHelpRow || tooltip.hidden) return;

        const rowRect = activeHelpRow.getBoundingClientRect();
        const panelRect = panel.getBoundingClientRect();

        const leftSpace = panelRect.left - 24;

        if (leftSpace >= 180) {
            // Desktop: help appears to the left of the pane.
            tooltip.style.width = Math.min(
                250,
                leftSpace
            ) + "px";

            tooltip.style.left = Math.max(
                8,
                panelRect.left - tooltip.offsetWidth - 12
            ) + "px";
        } else {
            // Narrow screen: keep the help within the viewport.
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

        if (leftSpace < 180) {
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
    // Panel behavior
    // --------------------------------------------------

    function setOpen(open) {
        open = Boolean(open && config.panel.enabled);

        hideHelp();

        panel.classList.toggle("open", open);
        panel.inert = !open;

        launcher.hidden = open || !config.panel.enabled;
        launcher.setAttribute("aria-expanded", String(open));

        if (open) {
            close.focus();
        } else if (config.panel.enabled) {
            launcher.focus();
        }
    }

    function changed(path) {
        onChange(path);
        refreshCode();

        if (path === "panel.enabled") {
            if (!config.panel.enabled) {
                setOpen(false);
            }

            root.hidden = !config.panel.enabled;
        }
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
        refreshCode();
        setCodeVisible(code.hidden);
    });

    copy.addEventListener("click", async () => {
        refreshCode();

        try {
            await navigator.clipboard.writeText(getCode());
            status.textContent = "Configuration copied.";
        } catch {
            setCodeVisible(true);
            code.focus();
            code.select();

            status.textContent =
                "Code selected. Press Ctrl+C or ⌘C to copy.";
        }
    });

    reset.addEventListener("click", () => {
        onReset();
        status.textContent = "Points reset.";
    });

    // --------------------------------------------------
    // Settings definitions
    // --------------------------------------------------

    const groups = [
        ["Points", [
            ["points.count", "Point count", 0, 5000, 1],
            ["points.radius", "Point radius", 0, 6, 0.1],
            ["points.speed", "Drift speed", 0, 100, 1],
            ["points.opacity", "Opacity", 0, 1, 0.01],
            ["points.color", "Point color", "color"]
        ]],

        ["Connections", [
            ["connections.distance", "Connection distance", 0, 400, 1],
            ["connections.lineWidth", "Line width", 0, 4, 0.1],
            ["connections.opacity", "Opacity", 0, 1, 0.01],
            ["connections.color", "Line color", "color"]
        ]],

        ["Mouse", [
            ["mouse.enabled", "Enabled", "boolean"],
            ["mouse.radius", "Connection radius", 0, 600, 1],
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
        "points.count":
            "Number of moving points. Increasing this creates " +
            "more possible connections and increases CPU and GPU work.",

        "points.radius":
            "Radius of each point in CSS pixels. Zero hides the " +
            "points while leaving their connections visible.",

        "points.speed":
            "Base movement speed in CSS pixels per second. Each " +
            "point has its own speed multiplier. Zero freezes movement.",

        "points.opacity":
            "Opacity of the points. Zero makes them invisible; " +
            "one makes their centers fully opaque.",

        "points.color":
            "Base color of the points. Points near the cursor blend " +
            "toward the mouse color.",

        "connections.distance":
            "Maximum distance in CSS pixels between connected points. " +
            "Connections fade with distance. Zero disables them.",

        "connections.lineWidth":
            "Thickness of regular connections in CSS pixels. " +
            "WebGL draws these as shaded quads, supporting fractional widths.",

        "connections.opacity":
            "Maximum opacity of regular connections. Actual opacity " +
            "decreases as the distance between the points increases.",

        "connections.color":
            "Color of the connections between moving points.",

        "mouse.enabled":
            "Enables cursor connections and nearby point recoloring. " +
            "The interaction fades away when the pointer leaves.",

        "mouse.radius":
            "Maximum distance from the cursor for connections and " +
            "point recoloring. Zero disables this influence.",

        "mouse.lineWidth":
            "Thickness of connections between the cursor and points, " +
            "in CSS pixels.",

        "mouse.opacity":
            "Maximum opacity of cursor connections and the cursor node. " +
            "Connections fade with distance and mouse influence.",

        "mouse.showPoint":
            "Displays a visible node at the smoothed cursor position.",

        "mouse.pointRadius":
            "Radius of the cursor node in CSS pixels.",

        "mouse.smoothing":
            "How quickly the cursor node follows the pointer and " +
            "its influence fades in or out. Higher values respond faster.",

        "mouse.color":
            "Color of the cursor node and its connections. Nearby " +
            "points also blend toward this color.",

        "glow.enabled":
            "Enables a soft shader-generated halo around points " +
            "and connections.",

        "glow.intensity":
            "Strength of the glow. Zero removes the glow while " +
            "keeping the crisp points and lines.",

        "glow.blur":
            "Spread of the shader glow in CSS pixels. Larger values " +
            "create wider halos and increase GPU pixel work. This " +
            "approximates the previous Canvas shadow effect.",

        "panel.enabled":
            "Hides the editor when disabled. Copy your configuration " +
            "first. Reload the page to return to the saved settings."
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
        const fieldContainer = document.createElement("div");

        section.className = "const-section";
        section.open = true;

        summary.textContent = title;
        fieldContainer.className = "const-fields";

        section.append(summary, fieldContainer);

        section.addEventListener("toggle", hideHelp);

        for (
            const [path, labelText, typeOrMin, max, step]
            of fields
        ) {
            const row = document.createElement("div");
            const label = document.createElement("label");

            const id =
                `${uniqueId}-control-${controlIndex++}`;

            row.className = "const-control";
            label.textContent = labelText;
            label.htmlFor = id;
            row.appendChild(label);

            const description = help[path] || labelText;

            const helpText = document.createElement("span");
            helpText.id = `${id}-description`;
            helpText.hidden = true;
            helpText.textContent = description;

            row.appendChild(helpText);

            row.addEventListener("pointerenter", () => {
                showHelp(row, description);
            });

            row.addEventListener("pointerleave", () => {
                hideHelp();
            });

            row.addEventListener("focusin", () => {
                showHelp(row, description);
            });

            row.addEventListener("focusout", event => {
                if (!row.contains(event.relatedTarget)) {
                    hideHelp();
                }
            });

            if (typeOrMin === "boolean") {
                const input = document.createElement("input");

                input.id = id;
                input.type = "checkbox";
                input.checked = getValue(path);

                input.addEventListener("change", () => {
                    setValue(path, input.checked);
                    changed(path);
                });

                row.appendChild(input);
            } else if (typeOrMin === "color") {
                const wrapper = document.createElement("div");
                const picker = document.createElement("input");
                const rgbWrapper = document.createElement("div");

                wrapper.className = "const-colors";
                rgbWrapper.className = "const-rgb";

                picker.id = id;
                picker.type = "color";
                picker.value = toHex(getValue(path));

                const inputs = ["R", "G", "B"].map(
                    (channel, index) => {
                        const input = document.createElement("input");

                        input.type = "number";
                        input.min = 0;
                        input.max = 255;
                        input.step = 1;
                        input.value = getValue(path)[index];

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

                        rgbWrapper.appendChild(input);
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

                wrapper.append(picker, rgbWrapper);
                row.appendChild(wrapper);
            } else {
                const number = document.createElement("input");
                const range = document.createElement("input");

                number.id = id;
                number.type = "number";
                range.type = "range";

                range.setAttribute("aria-label", labelText);

                // Preserve an existing saved value even if it
                // exceeds the normal editor range.
                const initial = Number(getValue(path));
                const maximum = Math.max(
                    max,
                    Number.isFinite(initial) ? initial : max
                );

                for (const input of [number, range]) {
                    input.min = typeOrMin;
                    input.max = maximum;
                    input.step = step;
                    input.value = getValue(path);
                }

                function update(source, target) {
                    let value = source.valueAsNumber;

                    if (!Number.isFinite(value)) return;

                    value = clamp(
                        value,
                        typeOrMin,
                        maximum
                    );

                    if (step === 1) {
                        value = Math.round(value);
                    }

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

                row.append(number, range);
            }

            for (const input of row.querySelectorAll("input")) {
                input.setAttribute(
                    "aria-describedby",
                    helpText.id
                );
            }

            fieldContainer.appendChild(row);
        }

        controls.appendChild(section);
    }

    refreshCode();
    root.hidden = !config.panel.enabled;

    return {
        destroy() {
            document.removeEventListener("keydown", onKeydown);
            window.removeEventListener("resize", hideHelp);
            body.removeEventListener("scroll", hideHelp);
            root.remove();
            style.remove();
        }
    };
}
