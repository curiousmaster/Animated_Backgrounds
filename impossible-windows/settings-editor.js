"use strict";

export function mountEditor({ config, onChange = () => {} }) {
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

    const style = document.createElement("style");

    style.textContent = `
        .iw-editor, .iw-editor * { box-sizing: border-box; }
        .iw-editor {
            color: #eee;
            font: 12px system-ui, sans-serif;
        }
        .iw-editor [hidden] { display: none !important; }
        .iw-panel {
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
        .iw-panel.open { transform: translateX(0); }
        .iw-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px;
            border-bottom: 1px solid #343840;
        }
        .iw-header strong { font-size: 15px; }
        .iw-body {
            flex: 1;
            overflow-y: auto;
            padding: 0 16px 20px;
        }
        .iw-editor fieldset {
            min-width: 0;
            margin: 18px 0;
            padding: 12px;
            border: 1px solid #343840;
            border-radius: 8px;
        }
        .iw-editor legend { color: #b9b0dd; padding: 0 6px; }
        .iw-row {
            display: grid;
            grid-template-columns: 1fr 90px;
            gap: 8px;
            align-items: center;
            margin-bottom: 12px;
        }
        .iw-row:last-child { margin-bottom: 0; }
        .iw-editor input[type=range] {
            grid-column: 1 / -1;
            width: 100%;
            accent-color: #bd9cff;
        }
        .iw-editor input[type=number] {
            width: 90px;
            padding: 5px;
            color: #fff;
            background: #090b10;
            border: 1px solid #454b57;
            border-radius: 5px;
        }
        .iw-editor input[type=checkbox] {
            justify-self: end;
            accent-color: #bd9cff;
        }
        .iw-colors {
            grid-column: 1 / -1;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .iw-colors input[type=number] {
            width: 100%;
            min-width: 0;
        }
        .iw-colors input[type=color] {
            flex-shrink: 0;
            width: 40px;
            height: 30px;
            background: transparent;
            border: 1px solid #454b57;
        }
        .iw-editor button {
            padding: 8px 10px;
            color: #eee;
            background: #272d38;
            border: 1px solid #454b57;
            border-radius: 6px;
            cursor: pointer;
            font: inherit;
        }
        .iw-editor button:hover { background: #384253; }
        .iw-editor :focus-visible {
            outline: 2px solid #bd9cff;
            outline-offset: 2px;
        }
        .iw-launcher {
            position: fixed;
            top: 16px;
            right: 16px;
            z-index: 1000;
        }
        .iw-actions { display: flex; gap: 8px; }
        .iw-editor textarea {
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
        .iw-status { min-height: 20px; margin-top: 8px; }
        .iw-hint { color: #aeb8ca; line-height: 1.5; }
        @media (prefers-reduced-motion: reduce) {
            .iw-panel { transition: none; }
        }
    `;

    document.head.appendChild(style);

    const root = document.createElement("div");
    root.className = "iw-editor";
    root.setAttribute("data-background-editor", "");

    root.innerHTML = `
        <button class="iw-launcher" aria-expanded="false">
            Settings
        </button>
        <aside class="iw-panel" aria-label="Impossible Windows settings"
               inert>
            <div class="iw-header">
                <strong>Impossible Windows</strong>
                <button class="iw-close">Retract →</button>
            </div>
            <div class="iw-body">
                <div class="iw-controls"></div>
                <div class="iw-actions">
                    <button class="iw-show" aria-expanded="false">
                        Show code
                    </button>
                    <button class="iw-copy">Copy config</button>
                </div>
                <textarea readonly spellcheck="false" hidden
                    aria-label="Current configuration"></textarea>
                <div class="iw-status" role="status"></div>
                <p class="iw-hint">
                    Overlaps combine time offsets, gravity rotation,
                    and magnification. Two reversing windows restore
                    forward time.
                </p>
                <p class="iw-hint">
                    RGB fields are R, G, B. Copy your configuration
                    before disabling the pane. Save panel.enabled
                    as false to skip loading the editor.
                </p>
            </div>
        </aside>
    `;

    document.body.appendChild(root);

    root.querySelectorAll("button").forEach(button => {
        button.type = "button";
    });

    const find = selector => root.querySelector(selector);
    const panel = find(".iw-panel");
    const launcher = find(".iw-launcher");
    const close = find(".iw-close");
    const controls = find(".iw-controls");
    const show = find(".iw-show");
    const code = find("textarea");
    const status = find(".iw-status");

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

    find(".iw-copy").onclick = async () => {
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

    function keydown(event) {
        if (event.key === "Escape" && panel.classList.contains("open")) {
            setOpen(false);
        }
    }

    document.addEventListener("keydown", keydown);

    const groups = [
        ["Shared world", [
            ["world.particleCount", "Particle count", 0, 400, 1],
            ["world.particleRadius", "Particle radius", 0, 6, 0.1],
            ["world.speed", "Gravity speed", -100, 100, 1],
            ["world.sway", "Sideways sway", 0, 120, 1],
            ["world.color", "World color", "color"],
            ["world.opacity", "Particle opacity", 0, 1, 0.01],
            ["world.gridSpacing", "Grid spacing", 25, 150, 1],
            ["world.gridOpacity", "Grid opacity", 0, 1, 0.01]
        ]],
        ["Windows", [
            ["windows.count", "Window count", 0, 5, 1],
            ["windows.radius", "Radius", 40, 350, 1],
            ["windows.movementSpeed", "Movement speed", -1, 1, 0.01],
            ["windows.spread", "Spread", 0, 1, 0.01],
            ["windows.timeOffset", "Time offset", -20, 20, 0.1],
            ["windows.reverseTime", "Reverse time", "boolean"],
            ["windows.gravityRotation", "Gravity rotation", -180, 180, 1],
            ["windows.magnification", "Magnification", 0.5, 2, 0.01],
            ["windows.borderWidth", "Border width", 0, 5, 0.1],
            ["windows.borderOpacity", "Border opacity", 0, 1, 0.01],
            ["windows.color", "Border color", "color"]
        ]],
        ["Mouse", [
            ["mouse.enabled", "Enabled", "boolean"],
            ["mouse.radius", "Attraction radius", 50, 700, 1],
            ["mouse.attraction", "Attraction", 0, 0.9, 0.01],
            ["mouse.smoothing", "Response speed", 1, 20, 0.5]
        ]],
        ["Glow", [
            ["glow.enabled", "Enabled", "boolean"],
            ["glow.intensity", "Intensity", 0, 1, 0.01],
            ["glow.blur", "Blur", 0, 50, 1]
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
            row.className = "iw-row";

            const label = document.createElement("label");
            const id = `iw-control-${index++}`;
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
            } else if (type === "color") {
                const wrapper = document.createElement("div");
                wrapper.className = "iw-colors";

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