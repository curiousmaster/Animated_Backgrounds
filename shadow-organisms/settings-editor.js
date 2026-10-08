"use strict";

export function mountEditor({
    config,
    onChange = () => {},
    onReset = () => {}
}) {
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

    const style = document.createElement("style");

    style.textContent = `
        .shadow-editor, .shadow-editor * { box-sizing: border-box; }
        .shadow-editor {
            color: #eee;
            font: 12px system-ui, sans-serif;
        }
        .shadow-editor [hidden] { display: none !important; }
        .shadow-panel {
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
        .shadow-panel.open { transform: translateX(0); }
        .shadow-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px;
            border-bottom: 1px solid #343840;
        }
        .shadow-header strong { font-size: 15px; }
        .shadow-body {
            flex: 1;
            overflow-y: auto;
            padding: 0 16px 20px;
        }
        .shadow-editor fieldset {
            min-width: 0;
            margin: 18px 0;
            padding: 12px;
            border: 1px solid #343840;
            border-radius: 8px;
        }
        .shadow-editor legend { color: #b9b0dd; padding: 0 6px; }
        .shadow-row {
            display: grid;
            grid-template-columns: 1fr 90px;
            gap: 8px;
            align-items: center;
            margin-bottom: 12px;
        }
        .shadow-row:last-child { margin-bottom: 0; }
        .shadow-editor input[type=range] {
            grid-column: 1 / -1;
            width: 100%;
            accent-color: #bd9cff;
        }
        .shadow-editor input[type=number] {
            width: 90px;
            padding: 5px;
            color: #fff;
            background: #090b10;
            border: 1px solid #454b57;
            border-radius: 5px;
        }
        .shadow-editor input[type=checkbox] {
            justify-self: end;
            accent-color: #bd9cff;
        }
        .shadow-colors {
            grid-column: 1 / -1;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .shadow-colors input[type=number] {
            width: 100%;
            min-width: 0;
        }
        .shadow-colors input[type=color] {
            flex-shrink: 0;
            width: 40px;
            height: 30px;
            background: transparent;
            border: 1px solid #454b57;
        }
        .shadow-editor button {
            padding: 8px 10px;
            color: #eee;
            background: #272d38;
            border: 1px solid #454b57;
            border-radius: 6px;
            cursor: pointer;
            font: inherit;
        }
        .shadow-editor button:hover { background: #384253; }
        .shadow-editor :focus-visible {
            outline: 2px solid #bd9cff;
            outline-offset: 2px;
        }
        .shadow-launcher {
            position: fixed;
            top: 16px;
            right: 16px;
            z-index: 1000;
        }
        .shadow-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        .shadow-editor textarea {
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
        .shadow-status { min-height: 20px; margin-top: 8px; }
        .shadow-hint { color: #aeb8ca; line-height: 1.5; }
        @media (prefers-reduced-motion: reduce) {
            .shadow-panel { transition: none; }
        }
    `;

    document.head.appendChild(style);

    const root = document.createElement("div");
    root.className = "shadow-editor";
    root.setAttribute("data-background-editor", "");

    root.innerHTML = `
        <button class="shadow-launcher" aria-expanded="false">
            Settings
        </button>
        <aside class="shadow-panel"
               aria-label="Shadow Organisms settings" inert>
            <div class="shadow-header">
                <strong>Shadow Organisms</strong>
                <button class="shadow-close">Retract →</button>
            </div>
            <div class="shadow-body">
                <div class="shadow-controls"></div>
                <div class="shadow-actions">
                    <button class="shadow-show" aria-expanded="false">
                        Show code
                    </button>
                    <button class="shadow-copy">Copy config</button>
                    <button class="shadow-reset">Reset organisms</button>
                </div>
                <textarea readonly spellcheck="false" hidden
                    aria-label="Current configuration"></textarea>
                <div class="shadow-status" role="status"></div>
                <p class="shadow-hint">
                    The cursor is a light source.
                    Organisms flee from it and stretch away from it.
                    Set split interval to zero to disable splitting.
                </p>
                <p class="shadow-hint">
                    Cohesion gathers organisms.
                    Separation keeps them from crowding.
                    Changing initial count resets the population.
                    RGB fields are R, G, B.
                </p>
                <p class="shadow-hint">
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
    const panel = find(".shadow-panel");
    const launcher = find(".shadow-launcher");
    const close = find(".shadow-close");
    const controls = find(".shadow-controls");
    const show = find(".shadow-show");
    const code = find("textarea");
    const status = find(".shadow-status");

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

    find(".shadow-copy").onclick = async () => {
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

    find(".shadow-reset").onclick = () => {
        onReset();
        status.textContent = "Organisms reset.";
    };

    function keydown(event) {
        if (event.key === "Escape" && panel.classList.contains("open")) {
            setOpen(false);
        }
    }

    document.addEventListener("keydown", keydown);

    const groups = [
        ["Organisms", [
            ["organisms.count", "Initial count", 0, 40, 1],
            ["organisms.radius", "Radius", 20, 150, 1],
            ["organisms.speed", "Drift speed", 0, 80, 1],
            ["organisms.deformation", "Deformation", 0, 0.6, 0.01],
            ["organisms.pulseSpeed", "Pulse speed", 0, 3, 0.05],
            ["organisms.opacity", "Opacity", 0, 1, 0.01],
            ["organisms.color", "Shadow color", "color"],
            ["organisms.softness", "Softness", 0, 40, 1],
            ["organisms.splitInterval", "Split interval", 0, 40, 1],
            ["organisms.maxCount", "Maximum count", 1, 50, 1]
        ]],
        ["Behavior", [
            ["behavior.cohesion", "Cohesion", 0, 0.5, 0.01],
            ["behavior.separation", "Separation", 0, 2, 0.05],
            ["behavior.friction", "Friction", 0.1, 5, 0.1],
            ["behavior.fleeStrength", "Flee strength", 0, 500, 1],
            ["behavior.stretch", "Light stretch", 0, 3, 0.05]
        ]],
        ["Background", [
            ["background.color", "Base color", "color"],
            ["background.ambientColor", "Ambient color", "color"],
            ["background.ambientIntensity", "Ambient intensity", 0, 1, 0.01]
        ]],
        ["Mouse light", [
            ["mouse.enabled", "Enabled", "boolean"],
            ["mouse.radius", "Light radius", 50, 700, 1],
            ["mouse.intensity", "Intensity", 0, 1, 0.01],
            ["mouse.smoothing", "Response speed", 1, 20, 0.5],
            ["mouse.color", "Light color", "color"]
        ]],
        ["Rendering", [
            ["rendering.shapePoints", "Shape detail", 16, 64, 1]
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
            row.className = "shadow-row";

            const label = document.createElement("label");
            const id = `shadow-control-${index++}`;
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
                wrapper.className = "shadow-colors";

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