"use strict";

export function mountEditor({
    config,
    onChange = () => {},
    onReset = () => {}
}) {
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

    const style = document.createElement("style");

    style.textContent = `
        .woven-editor, .woven-editor * { box-sizing: border-box; }
        .woven-editor {
            color: #eee;
            font: 12px system-ui, sans-serif;
        }
        .woven-editor [hidden] { display: none !important; }
        .woven-panel {
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
        .woven-panel.open { transform: translateX(0); }
        .woven-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px;
            border-bottom: 1px solid #343840;
        }
        .woven-header strong { font-size: 15px; }
        .woven-body {
            flex: 1;
            overflow-y: auto;
            padding: 0 16px 20px;
        }
        .woven-editor fieldset {
            min-width: 0;
            margin: 18px 0;
            padding: 12px;
            border: 1px solid #343840;
            border-radius: 8px;
        }
        .woven-editor legend { color: #b9b0dd; padding: 0 6px; }
        .woven-row {
            display: grid;
            grid-template-columns: 1fr 90px;
            gap: 8px;
            align-items: center;
            margin-bottom: 12px;
        }
        .woven-row:last-child { margin-bottom: 0; }
        .woven-editor input[type=range] {
            grid-column: 1 / -1;
            width: 100%;
            accent-color: #bd9cff;
        }
        .woven-editor input[type=number] {
            width: 90px;
            padding: 5px;
            color: #fff;
            background: #090b10;
            border: 1px solid #454b57;
            border-radius: 5px;
        }
        .woven-editor input[type=checkbox] {
            justify-self: end;
            accent-color: #bd9cff;
        }
        .woven-colors {
            grid-column: 1 / -1;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .woven-colors input[type=number] {
            width: 100%;
            min-width: 0;
        }
        .woven-colors input[type=color] {
            flex-shrink: 0;
            width: 40px;
            height: 30px;
            background: transparent;
            border: 1px solid #454b57;
        }
        .woven-editor button {
            padding: 8px 10px;
            color: #eee;
            background: #272d38;
            border: 1px solid #454b57;
            border-radius: 6px;
            cursor: pointer;
            font: inherit;
        }
        .woven-editor button:hover { background: #384253; }
        .woven-editor :focus-visible {
            outline: 2px solid #bd9cff;
            outline-offset: 2px;
        }
        .woven-launcher {
            position: fixed;
            top: 16px;
            right: 16px;
            z-index: 1000;
        }
        .woven-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        .woven-editor textarea {
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
        .woven-status { min-height: 20px; margin-top: 8px; }
        .woven-hint { color: #aeb8ca; line-height: 1.5; }
        @media (prefers-reduced-motion: reduce) {
            .woven-panel { transition: none; }
        }
    `;

    document.head.appendChild(style);

    const root = document.createElement("div");
    root.className = "woven-editor";
    root.setAttribute("data-background-editor", "");

    root.innerHTML = `
        <button class="woven-launcher" aria-expanded="false">
            Settings
        </button>
        <aside class="woven-panel" aria-label="Woven Time settings" inert>
            <div class="woven-header">
                <strong>Woven Time</strong>
                <button class="woven-close">Retract →</button>
            </div>
            <div class="woven-body">
                <div class="woven-controls"></div>
                <div class="woven-actions">
                    <button class="woven-show" aria-expanded="false">
                        Show code
                    </button>
                    <button class="woven-copy">Copy config</button>
                    <button class="woven-reset">Reset fabric</button>
                </div>
                <textarea readonly spellcheck="false" hidden
                    aria-label="Current configuration"></textarea>
                <div class="woven-status" role="status"></div>
                <p class="woven-hint">
                    Move the mouse to synchronize and calm nearby threads.
                    Recovery controls how quickly the calm patch disappears.
                    Time variation gives different regions different speeds.
                </p>
                <p class="woven-hint">
                    Smaller sampling spacing makes finer curves.
                    Changing thread spacing or amplitude resets the fabric.
                    RGB fields are R, G, B.
                </p>
                <p class="woven-hint">
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
    const panel = find(".woven-panel");
    const launcher = find(".woven-launcher");
    const close = find(".woven-close");
    const controls = find(".woven-controls");
    const show = find(".woven-show");
    const code = find("textarea");
    const status = find(".woven-status");

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

    find(".woven-copy").onclick = async () => {
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

    find(".woven-reset").onclick = () => {
        onReset();
        status.textContent = "Fabric reset.";
    };

    function keydown(event) {
        if (event.key === "Escape" && panel.classList.contains("open")) {
            setOpen(false);
        }
    }

    document.addEventListener("keydown", keydown);

    const groups = [
        ["Fabric", [
            ["fabric.spacing", "Thread spacing", 20, 80, 1],
            ["fabric.rotation", "Rotation", -180, 180, 1],
            ["fabric.lineWidth", "Line width", 0, 4, 0.1],
            ["fabric.opacity", "Opacity", 0, 1, 0.01],
            ["fabric.colorA", "Horizontal color", "color"],
            ["fabric.colorB", "Vertical color", "color"]
        ]],
        ["Time", [
            ["time.speed", "Global speed", -2, 2, 0.01],
            ["time.variation", "Time variation", 0, 1.5, 0.01],
            ["time.pauseStrength", "Local pauses", 0, 1, 0.01],
            ["time.recovery", "Recovery rate", 0.1, 5, 0.1]
        ]],
        ["Weave", [
            ["weave.amplitude", "Fold amplitude", 0, 60, 1],
            ["weave.wavelength", "Wavelength", 100, 700, 10],
            ["weave.knotStrength", "Knot strength", 0, 1.5, 0.01],
            ["weave.knotFrequency", "Knot frequency", 0.1, 2, 0.05],
            ["weave.crossingGap", "Crossing gap", 0, 10, 0.5]
        ]],
        ["Mouse", [
            ["mouse.enabled", "Enabled", "boolean"],
            ["mouse.radius", "Synchronization radius", 40, 500, 1],
            ["mouse.synchronization", "Synchronization rate", 0.1, 12, 0.1],
            ["mouse.calmness", "Calmness", 0, 1, 0.01],
            ["mouse.smoothing", "Response speed", 1, 20, 0.5],
            ["mouse.color", "Synchronized color", "color"]
        ]],
        ["Glow", [
            ["glow.enabled", "Enabled", "boolean"],
            ["glow.intensity", "Intensity", 0, 1, 0.01],
            ["glow.blur", "Blur", 0, 30, 1]
        ]],
        ["Rendering", [
            ["rendering.sampleSpacing", "Sampling spacing", 4, 20, 1]
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
            row.className = "woven-row";

            const label = document.createElement("label");
            const id = `woven-control-${index++}`;
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
                wrapper.className = "woven-colors";

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