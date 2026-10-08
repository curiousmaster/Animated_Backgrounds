"use strict";

export function mountEditor({
    config,
    onChange = () => {},
    onClear = () => {}
}) {
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

    const style = document.createElement("style");

    style.textContent = `
        .fossil-editor, .fossil-editor * { box-sizing: border-box; }
        .fossil-editor {
            color: #eee;
            font: 12px system-ui, sans-serif;
        }
        .fossil-editor [hidden] { display: none !important; }
        .fossil-panel {
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
        .fossil-panel.open { transform: translateX(0); }
        .fossil-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px;
            border-bottom: 1px solid #343840;
        }
        .fossil-header strong { font-size: 15px; }
        .fossil-body {
            flex: 1;
            overflow-y: auto;
            padding: 0 16px 20px;
        }
        .fossil-editor fieldset {
            min-width: 0;
            margin: 18px 0;
            padding: 12px;
            border: 1px solid #343840;
            border-radius: 8px;
        }
        .fossil-editor legend { color: #b9b0dd; padding: 0 6px; }
        .fossil-row {
            display: grid;
            grid-template-columns: 1fr 90px;
            gap: 8px;
            align-items: center;
            margin-bottom: 12px;
        }
        .fossil-row:last-child { margin-bottom: 0; }
        .fossil-editor input[type=range] {
            grid-column: 1 / -1;
            width: 100%;
            accent-color: #bd9cff;
        }
        .fossil-editor input[type=number] {
            width: 90px;
            padding: 5px;
            color: #fff;
            background: #090b10;
            border: 1px solid #454b57;
            border-radius: 5px;
        }
        .fossil-editor input[type=checkbox] {
            justify-self: end;
            accent-color: #bd9cff;
        }
        .fossil-colors {
            grid-column: 1 / -1;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .fossil-colors input[type=number] {
            width: 100%;
            min-width: 0;
        }
        .fossil-colors input[type=color] {
            flex-shrink: 0;
            width: 40px;
            height: 30px;
            background: transparent;
            border: 1px solid #454b57;
        }
        .fossil-editor button {
            padding: 8px 10px;
            color: #eee;
            background: #272d38;
            border: 1px solid #454b57;
            border-radius: 6px;
            cursor: pointer;
            font: inherit;
        }
        .fossil-editor button:hover { background: #384253; }
        .fossil-editor :focus-visible {
            outline: 2px solid #bd9cff;
            outline-offset: 2px;
        }
        .fossil-launcher {
            position: fixed;
            top: 16px;
            right: 16px;
            z-index: 1000;
        }
        .fossil-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        .fossil-editor textarea {
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
        .fossil-status { min-height: 20px; margin-top: 8px; }
        .fossil-hint { color: #aeb8ca; line-height: 1.5; }
        @media (prefers-reduced-motion: reduce) {
            .fossil-panel { transition: none; }
        }
    `;

    document.head.appendChild(style);

    const root = document.createElement("div");
    root.className = "fossil-editor";
    root.setAttribute("data-background-editor", "");

    root.innerHTML = `
        <button class="fossil-launcher" aria-expanded="false">
            Settings
        </button>
        <aside class="fossil-panel" aria-label="Memory Fossils settings"
               inert>
            <div class="fossil-header">
                <strong>Memory Fossils</strong>
                <button class="fossil-close">Retract →</button>
            </div>
            <div class="fossil-body">
                <div class="fossil-controls"></div>
                <div class="fossil-actions">
                    <button class="fossil-show" aria-expanded="false">
                        Show code
                    </button>
                    <button class="fossil-copy">Copy config</button>
                    <button class="fossil-clear">Clear memory</button>
                </div>
                <textarea readonly spellcheck="false" hidden
                    aria-label="Current configuration"></textarea>
                <div class="fossil-status" role="status"></div>
                <p class="fossil-hint">
                    Move the mouse to plant crystals.
                    Older formations obstruct new branches.
                    Outer branches erode first.
                </p>
                <p class="fossil-hint">
                    New growth uses the current branch settings.
                    Existing segments keep their original geometry.
                    RGB fields are R, G, B.
                </p>
                <p class="fossil-hint">
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
    const panel = find(".fossil-panel");
    const launcher = find(".fossil-launcher");
    const close = find(".fossil-close");
    const controls = find(".fossil-controls");
    const show = find(".fossil-show");
    const code = find("textarea");
    const status = find(".fossil-status");

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

    find(".fossil-copy").onclick = async () => {
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

    find(".fossil-clear").onclick = () => {
        onClear();
        status.textContent = "Memory cleared.";
    };

    function keydown(event) {
        if (event.key === "Escape" && panel.classList.contains("open")) {
            setOpen(false);
        }
    }

    document.addEventListener("keydown", keydown);

    const groups = [
        ["Growth", [
            ["growth.speed", "Growth speed", 0, 100, 1],
            ["growth.branchLength", "Branch length", 8, 80, 1],
            ["growth.branchChance", "Branch chance", 0, 1, 0.01],
            ["growth.branchAngle", "Branch angle", 10, 90, 1],
            ["growth.maxDepth", "Branch depth", 1, 8, 1],
            ["growth.avoidanceRadius", "Obstacle clearance", 0, 30, 1]
        ]],
        ["Memory", [
            ["memory.lifetime", "Lifetime before erosion", 5, 90, 1],
            ["memory.mineralizeTime", "Mineralization time", 1, 30, 1],
            ["memory.erosionDuration", "Erosion duration", 1, 30, 1],
            ["memory.maxCrystals", "Maximum crystals", 1, 100, 1],
            ["memory.maxSegments", "Maximum segments", 100, 4000, 100]
        ]],
        ["Appearance", [
            ["appearance.lineWidth", "Line width", 0, 4, 0.1],
            ["appearance.opacity", "Opacity", 0, 1, 0.01],
            ["appearance.tipRadius", "Growing tip radius", 0, 5, 0.1],
            ["appearance.freshColor", "Fresh color", "color"],
            ["appearance.fossilColor", "Fossil color", "color"],
            ["appearance.dustColor", "Dust color", "color"]
        ]],
        ["Dust", [
            ["dust.enabled", "Enabled", "boolean"],
            ["dust.countPerSegment", "Particles per segment", 0, 5, 1],
            ["dust.speed", "Drift speed", 0, 60, 1],
            ["dust.lifetime", "Lifetime", 1, 10, 0.1],
            ["dust.radius", "Particle radius", 0, 3, 0.1],
            ["dust.maxParticles", "Maximum particles", 0, 2000, 100]
        ]],
        ["Mouse", [
            ["mouse.enabled", "Plant with mouse", "boolean"],
            ["mouse.seedSpacing", "Seed spacing", 15, 150, 1]
        ]],
        ["Ambient growth", [
            ["ambient.enabled", "Enabled", "boolean"],
            ["ambient.seedInterval", "Seed interval", 1, 20, 0.5]
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
            row.className = "fossil-row";

            const label = document.createElement("label");
            const id = `fossil-control-${index++}`;
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
                wrapper.className = "fossil-colors";

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
                    if (step >= 1) value = Math.round(value);

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