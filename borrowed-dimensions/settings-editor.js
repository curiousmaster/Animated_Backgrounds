"use strict";

export function mountEditor({
    config,
    onChange = () => {},
    onReset = () => {}
}) {
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

    const style = document.createElement("style");

    style.textContent = `
        .dimension-editor, .dimension-editor * {
            box-sizing: border-box;
        }
        .dimension-editor {
            color: #eee;
            font: 12px system-ui, sans-serif;
        }
        .dimension-editor [hidden] { display: none !important; }
        .dimension-panel {
            position: fixed;
            inset: 0 0 0 auto;
            width: min(350px, 100vw);
            z-index: 1001;
            display: flex;
            flex-direction: column;
            background: rgba(18,20,25,.97);
            border-left: 1px solid #343840;
            transform: translateX(100%);
            transition: transform .22s ease;
        }
        .dimension-panel.open { transform: translateX(0); }
        .dimension-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px;
            border-bottom: 1px solid #343840;
        }
        .dimension-header strong { font-size: 15px; }
        .dimension-body {
            flex: 1;
            overflow-y: auto;
            padding: 0 16px 20px;
        }
        .dimension-editor fieldset {
            min-width: 0;
            margin: 18px 0;
            padding: 12px;
            border: 1px solid #343840;
            border-radius: 8px;
        }
        .dimension-editor legend {
            color: #b9b0dd;
            padding: 0 6px;
        }
        .dimension-row {
            display: grid;
            grid-template-columns: 1fr 100px;
            gap: 8px;
            align-items: center;
            margin-bottom: 12px;
        }
        .dimension-row:last-child { margin-bottom: 0; }
        .dimension-editor input[type=range] {
            grid-column: 1 / -1;
            width: 100%;
            accent-color: #bd9cff;
        }
        .dimension-editor input[type=number],
        .dimension-editor select {
            width: 100px;
            padding: 5px;
            color: #fff;
            background: #090b10;
            border: 1px solid #454b57;
            border-radius: 5px;
        }
        .dimension-editor input[type=checkbox] {
            justify-self: end;
            accent-color: #bd9cff;
        }
        .dimension-colors {
            grid-column: 1 / -1;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .dimension-colors input[type=number] {
            width: 100%;
            min-width: 0;
        }
        .dimension-colors input[type=color] {
            flex-shrink: 0;
            width: 40px;
            height: 30px;
            background: transparent;
            border: 1px solid #454b57;
        }
        .dimension-editor button {
            padding: 8px 10px;
            color: #eee;
            background: #272d38;
            border: 1px solid #454b57;
            border-radius: 6px;
            cursor: pointer;
            font: inherit;
        }
        .dimension-editor button:hover { background: #384253; }
        .dimension-editor :focus-visible {
            outline: 2px solid #bd9cff;
            outline-offset: 2px;
        }
        .dimension-launcher {
            position: fixed;
            top: 16px;
            right: 16px;
            z-index: 1000;
        }
        .dimension-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        .dimension-editor textarea {
            width: 100%;
            height: 330px;
            margin-top: 12px;
            padding: 10px;
            color: #d2c3ff;
            background: #090b10;
            border: 1px solid #454b57;
            border-radius: 6px;
            font: 11px/1.5 monospace;
            white-space: pre;
        }
        .dimension-status { min-height: 20px; margin-top: 8px; }
        .dimension-hint { color: #aeb8ca; line-height: 1.5; }
        @media (prefers-reduced-motion: reduce) {
            .dimension-panel { transition: none; }
        }
    `;

    document.head.appendChild(style);

    const root = document.createElement("div");
    root.className = "dimension-editor";
    root.setAttribute("data-background-editor", "");

    root.innerHTML = `
        <button class="dimension-launcher" aria-expanded="false">
            Settings
        </button>
        <aside class="dimension-panel"
               aria-label="Borrowed Dimensions settings" inert>
            <div class="dimension-header">
                <strong>Borrowed Dimensions</strong>
                <button class="dimension-close">Retract →</button>
            </div>
            <div class="dimension-body">
                <div class="dimension-controls"></div>
                <div class="dimension-actions">
                    <button class="dimension-show" aria-expanded="false">
                        Show code
                    </button>
                    <button class="dimension-copy">Copy config</button>
                    <button class="dimension-reset">Reset fragments</button>
                </div>
                <textarea readonly spellcheck="false" hidden
                    aria-label="Current configuration"></textarea>
                <div class="dimension-status" role="status"></div>
                <p class="dimension-hint">
                    Fragments transform from points to polygons to solids.
                    The mouse holds nearby fragments in the selected state.
                    Full hold strength locks the inner cursor region.
                </p>
                <p class="dimension-hint">
                    Shape sides controls polygon and prism complexity.
                    Smaller wavelengths create tighter transformation waves.
                    RGB fields are R, G, B.
                </p>
                <p class="dimension-hint">
                    Copy your configuration before disabling the pane.
                    Save panel.enabled as false to skip the editor.
                </p>
            </div>
        </aside>
    `;

    document.body.appendChild(root);

    root.querySelectorAll("button").forEach(button => {
        button.type = "button";
    });

    const find = selector => root.querySelector(selector);
    const panel = find(".dimension-panel");
    const launcher = find(".dimension-launcher");
    const close = find(".dimension-close");
    const controls = find(".dimension-controls");
    const show = find(".dimension-show");
    const code = find("textarea");
    const status = find(".dimension-status");

    function get(path) {
        return path.split(".").reduce((o, k) => o[k], config);
    }

    function set(path, value) {
        const keys = path.split(".");
        const last = keys.pop();
        const object = keys.reduce((o, k) => o[k], config);
        object[last] = value;
    }

    function exportCode() {
        return "const config = " +
            JSON.stringify(config, null, 4) + ";";
    }

    function refresh() {
        code.value = exportCode();
        status.textContent = "";
    }

    function setOpen(open) {
        open = Boolean(open && config.panel.enabled);
        panel.classList.toggle("open", open);
        panel.inert = !open;
        launcher.hidden = open || !config.panel.enabled;
        launcher.setAttribute("aria-expanded", String(open));

        if (open) close.focus();
        else if (config.panel.enabled) launcher.focus();
    }

    function changed(path) {
        onChange(path);
        refresh();

        if (path === "panel.enabled") {
            if (!config.panel.enabled) setOpen(false);
            root.hidden = !config.panel.enabled;
        }
    }

    function showCode(visible) {
        code.hidden = !visible;
        show.textContent = visible ? "Hide code" : "Show code";
        show.setAttribute("aria-expanded", String(visible));
    }

    launcher.onclick = () => setOpen(true);
    close.onclick = () => setOpen(false);

    show.onclick = () => {
        refresh();
        showCode(code.hidden);
    };

    find(".dimension-copy").onclick = async () => {
        refresh();

        try {
            await navigator.clipboard.writeText(exportCode());
            status.textContent = "Configuration copied.";
        } catch {
            showCode(true);
            code.focus();
            code.select();
            status.textContent = "Press Ctrl+C or ⌘C to copy.";
        }
    };

    find(".dimension-reset").onclick = () => {
        onReset();
        status.textContent = "Fragments reset.";
    };

    function keydown(event) {
        if (event.key === "Escape" && panel.classList.contains("open")) {
            setOpen(false);
        }
    }

    document.addEventListener("keydown", keydown);

    const groups = [
        ["Fragments", [
            ["fragments.count", "Fragment count", 0, 200, 1],
            ["fragments.size", "Size", 8, 70, 1],
            ["fragments.sides", "Shape sides", 3, 10, 1],
            ["fragments.depth", "Solid depth", 0, 100, 1],
            ["fragments.driftSpeed", "Drift speed", 0, 60, 1],
            ["fragments.rotationSpeed", "Rotation speed", -2, 2, 0.01],
            ["fragments.colorA", "First color", "color"],
            ["fragments.colorB", "Second color", "color"]
        ]],
        ["Transformation", [
            ["transformation.speed", "Transformation speed", -2, 2, 0.01],
            ["transformation.wavelength", "Wave spacing", 100, 1000, 10],
            ["transformation.variation", "Phase variation", 0, 1, 0.01]
        ]],
        ["Appearance", [
            ["appearance.lineWidth", "Line width", 0, 4, 0.1],
            ["appearance.opacity", "Edge opacity", 0, 1, 0.01],
            ["appearance.faceOpacity", "Face opacity", 0, 0.5, 0.01],
            ["appearance.pointRadius", "Point radius", 0, 6, 0.1]
        ]],
        ["Perspective", [
            ["perspective.distance", "Camera distance", 200, 1500, 10],
            ["perspective.tiltX", "Tilt X", -90, 90, 1],
            ["perspective.tiltY", "Tilt Y", -90, 90, 1]
        ]],
        ["Mouse", [
            ["mouse.enabled", "Enabled", "boolean"],
            ["mouse.radius", "Hold radius", 40, 500, 1],
            ["mouse.state", "Held state", "select", [
                [0, "Point"],
                [1, "Polygon"],
                [2, "Solid"]
            ]],
            ["mouse.holdStrength", "Hold strength", 0, 1, 0.01],
            ["mouse.smoothing", "Response speed", 1, 20, 0.5],
            ["mouse.color", "Held color", "color"]
        ]],
        ["Glow", [
            ["glow.enabled", "Enabled", "boolean"],
            ["glow.intensity", "Intensity", 0, 1, 0.01],
            ["glow.blur", "Blur", 0, 30, 1]
        ]],
        ["Editor", [
            ["panel.enabled", "Enable pane", "boolean"]
        ]]
    ];

    function hex(color) {
        return "#" + color.map(v =>
            Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0")
        ).join("");
    }

    let index = 0;

    for (const [title, fields] of groups) {
        const fieldset = document.createElement("fieldset");
        const legend = document.createElement("legend");
        legend.textContent = title;
        fieldset.append(legend);

        for (const [path, title, type, max, step] of fields) {
            const row = document.createElement("div");
            row.className = "dimension-row";

            const label = document.createElement("label");
            const id = `dimension-control-${index++}`;
            label.textContent = title;
            label.htmlFor = id;
            row.append(label);

            if (type === "boolean") {
                const input = document.createElement("input");
                input.id = id;
                input.type = "checkbox";
                input.checked = get(path);

                input.onchange = () => {
                    set(path, input.checked);
                    changed(path);
                };

                row.append(input);
            } else if (type === "select") {
                const select = document.createElement("select");
                select.id = id;

                for (const [value, text] of max) {
                    const option = document.createElement("option");
                    option.value = value;
                    option.textContent = text;
                    select.append(option);
                }

                select.value = get(path);

                select.onchange = () => {
                    set(path, Number(select.value));
                    changed(path);
                };

                row.append(select);
            } else if (type === "color") {
                const wrapper = document.createElement("div");
                wrapper.className = "dimension-colors";

                const picker = document.createElement("input");
                picker.id = id;
                picker.type = "color";
                picker.value = hex(get(path));

                wrapper.append(picker);

                const inputs = ["R", "G", "B"].map((channel, i) => {
                    const input = document.createElement("input");
                    input.type = "number";
                    input.min = 0;
                    input.max = 255;
                    input.step = 1;
                    input.value = get(path)[i];
                    input.setAttribute("aria-label", `${title} ${channel}`);

                    input.oninput = () => {
                        const value = input.valueAsNumber;
                        if (!Number.isFinite(value)) return;

                        const color = [...get(path)];
                        color[i] = Math.round(clamp(value, 0, 255));
                        set(path, color);
                        picker.value = hex(color);
                        changed(path);
                    };

                    input.onchange = () => {
                        input.value = get(path)[i];
                    };

                    wrapper.append(input);
                    return input;
                });

                picker.oninput = () => {
                    const color = [1, 3, 5].map(i =>
                        parseInt(picker.value.slice(i, i + 2), 16)
                    );

                    set(path, color);
                    inputs.forEach((input, i) => input.value = color[i]);
                    changed(path);
                };

                row.append(wrapper);
            } else {
                const number = document.createElement("input");
                const range = document.createElement("input");

                number.id = id;
                number.type = "number";
                range.type = "range";
                range.setAttribute("aria-label", title);

                for (const input of [number, range]) {
                    input.min = type;
                    input.max = max;
                    input.step = step;
                    input.value = get(path);
                }

                function update(source, target) {
                    let value = source.valueAsNumber;
                    if (!Number.isFinite(value)) return;

                    value = clamp(value, type, max);
                    if (step === 1) value = Math.round(value);

                    set(path, value);
                    target.value = value;
                    changed(path);
                }

                number.oninput = () => update(number, range);
                range.oninput = () => update(range, number);
                number.onchange = () => number.value = get(path);

                row.append(number, range);
            }

            fieldset.append(row);
        }

        controls.append(fieldset);
    }

    refresh();
    root.hidden = !config.panel.enabled;

    return {
        destroy() {
            document.removeEventListener("keydown", keydown);
            root.remove();
            style.remove();
        }
    };
}