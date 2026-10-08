"use strict";

export function mountEditor({
    config,
    onChange = () => {},
    onClear = () => {}
}) {
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

    // Numeric limits: minimum, maximum, step.
    const limits = {
        "terrain.scale": [100, 600, 10],
        "terrain.speed": [-0.5, 0.5, 0.01],
        "terrain.amplitude": [0, 2, 0.05],
        "terrain.mouseHeight": [0, 2, 0.05],
        "grid.spacing": [16, 60, 1],
        "grid.rotation": [-180, 180, 1],
        "grid.tiltX": [-35, 35, 1],
        "grid.minRadius": [0, 3, 0.05],
        "grid.maxRadius": [0, 6, 0.1],
        "grid.opacity": [0, 1, 0.01],
        "contours.interval": [0.08, 0.5, 0.01],
        "contours.lineWidth": [0.1, 3, 0.1],
        "contours.opacity": [0, 1, 0.01],
        "contours.sampling": [16, 40, 1],
        "network.count": [0, 120, 1],
        "network.speed": [0, 60, 1],
        "network.connectionDistance": [30, 250, 1],
        "network.opacity": [0, 1, 0.01],
        "network.pointRadius": [0.1, 5, 0.1],
        "ripples.speed": [20, 350, 1],
        "ripples.width": [10, 100, 1],
        "ripples.strength": [0, 1, 0.01],
        "ripples.decay": [0.1, 2, 0.05],
        "ripples.interval": [0.1, 1, 0.05],
        "memories.lifetime": [8, 60, 1],
        "memories.growthSpeed": [5, 60, 1],
        "memories.branchLength": [8, 40, 1],
        "memories.maxDepth": [1, 5, 1],
        "memories.lingerTime": [1, 10, 0.5],
        "memories.maxCount": [1, 30, 1],
        "aurora.speed": [-0.5, 0.5, 0.01],
        "aurora.width": [30, 250, 1],
        "aurora.opacity": [0, 0.4, 0.01],
        "aurora.fragmentSize": [0, 15, 0.5],
        "mouse.radius": [50, 400, 1],
        "mouse.smoothing": [1, 20, 0.5],
        "mouse.spotlight": [0, 0.4, 0.01],
        "glow.intensity": [0, 1, 0.01],
        "glow.blur": [0, 25, 1]
    };

    const label = text => text
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/^./, c => c.toUpperCase());

    const style = document.createElement("style");
    style.textContent = `
        .atlas-editor, .atlas-editor * { box-sizing: border-box; }
        .atlas-editor { color: #eee; font: 12px system-ui, sans-serif; }
        .atlas-editor [hidden] { display: none !important; }
        .atlas-panel {
            position: fixed;
            inset: 0 0 0 auto;
            width: min(350px, 100vw);
            z-index: 1001;
            display: flex;
            flex-direction: column;
            background: rgba(15,20,26,.97);
            border-left: 1px solid #34404b;
            transform: translateX(100%);
            transition: transform .22s ease;
        }
        .atlas-panel.open { transform: translateX(0); }
        .atlas-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px;
            border-bottom: 1px solid #34404b;
        }
        .atlas-header strong { font-size: 15px; }
        .atlas-body { flex: 1; overflow-y: auto; padding: 0 16px 20px; }
        .atlas-editor fieldset {
            min-width: 0;
            margin: 18px 0;
            padding: 12px;
            border: 1px solid #34404b;
            border-radius: 8px;
        }
        .atlas-editor legend { padding: 0 6px; color: #92c9cc; }
        .atlas-row {
            display: grid;
            grid-template-columns: 1fr 90px;
            gap: 8px;
            align-items: center;
            margin-bottom: 12px;
        }
        .atlas-row:last-child { margin-bottom: 0; }
        .atlas-editor input[type=range] {
            grid-column: 1 / -1;
            width: 100%;
            accent-color: #72c9c1;
        }
        .atlas-editor input[type=number] {
            width: 90px;
            padding: 5px;
            color: #fff;
            background: #090d12;
            border: 1px solid #45515c;
            border-radius: 5px;
        }
        .atlas-editor input[type=checkbox] {
            justify-self: end;
            accent-color: #72c9c1;
        }
        .atlas-color {
            grid-column: 1 / -1;
            display: flex;
            gap: 6px;
            align-items: center;
        }
        .atlas-color input[type=number] { width: 100%; min-width: 0; }
        .atlas-color input[type=color] {
            flex-shrink: 0;
            width: 40px;
            height: 30px;
            background: transparent;
            border: 1px solid #45515c;
        }
        .atlas-editor button {
            padding: 8px 10px;
            color: #eee;
            background: #25313a;
            border: 1px solid #45515c;
            border-radius: 6px;
            cursor: pointer;
            font: inherit;
        }
        .atlas-editor button:hover { background: #354753; }
        .atlas-editor :focus-visible {
            outline: 2px solid #72c9c1;
            outline-offset: 2px;
        }
        .atlas-launcher { position: fixed; top: 16px; right: 16px; z-index: 1000; }
        .atlas-actions { display: flex; flex-wrap: wrap; gap: 8px; }
        .atlas-editor textarea {
            width: 100%;
            height: 330px;
            margin-top: 12px;
            padding: 10px;
            color: #b9e4df;
            background: #090d12;
            border: 1px solid #45515c;
            border-radius: 6px;
            font: 11px/1.5 monospace;
            white-space: pre;
        }
        .atlas-status { min-height: 20px; margin-top: 8px; }
        .atlas-hint { color: #aeb8ca; line-height: 1.5; }
        @media (prefers-reduced-motion: reduce) {
            .atlas-panel { transition: none; }
        }
    `;
    document.head.append(style);

    const root = document.createElement("div");
    root.className = "atlas-editor";
    root.setAttribute("data-background-editor", "");
    root.innerHTML = `
        <button class="atlas-launcher" aria-expanded="false">Settings</button>
        <aside class="atlas-panel" aria-label="Living Atlas settings" inert>
            <div class="atlas-header">
                <strong>Living Atlas</strong>
                <button class="atlas-close">Retract →</button>
            </div>
            <div class="atlas-body">
                <div class="atlas-controls"></div>
                <div class="atlas-actions">
                    <button class="atlas-show" aria-expanded="false">Show code</button>
                    <button class="atlas-copy">Copy config</button>
                    <button class="atlas-clear">Clear memories</button>
                </div>
                <textarea readonly spellcheck="false" hidden
                    aria-label="Current configuration"></textarea>
                <div class="atlas-status" role="status"></div>
                <p class="atlas-hint">
                    Move to create ripples. Linger or click to grow a crystal.
                    Each layer can be enabled separately.
                    RGB fields are R, G, B.
                </p>
                <p class="atlas-hint">
                    Smaller contour sampling values add detail.
                    Existing crystals retain their original branch geometry.
                    Copy settings before disabling the pane.
                    Save panel.enabled as false for production.
                </p>
            </div>
        </aside>
    `;
    document.body.append(root);
    root.querySelectorAll("button").forEach(b => b.type = "button");

    const find = selector => root.querySelector(selector);
    const panel = find(".atlas-panel");
    const launcher = find(".atlas-launcher");
    const close = find(".atlas-close");
    const controls = find(".atlas-controls");
    const show = find(".atlas-show");
    const code = find("textarea");
    const status = find(".atlas-status");

    function get(path) {
        return path.split(".").reduce((object, key) => object[key], config);
    }

    function set(path, value) {
        const keys = path.split(".");
        const last = keys.pop();
        const object = keys.reduce((o, k) => o[k], config);
        object[last] = value;
    }

    function exportCode() {
        return "const config = " + JSON.stringify(config, null, 4) + ";";
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

    find(".atlas-copy").onclick = async () => {
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

    find(".atlas-clear").onclick = () => {
        onClear();
        status.textContent = "Memories and ripples cleared.";
    };

    function keydown(event) {
        if (event.key === "Escape" && panel.classList.contains("open")) {
            setOpen(false);
        }
    }
    document.addEventListener("keydown", keydown);

    function hex(color) {
        return "#" + color.map(v =>
            Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0")
        ).join("");
    }

    let index = 0;

    // Automatically build controls for every configuration value.
    for (const [group, values] of Object.entries(config)) {
        const fieldset = document.createElement("fieldset");
        const legend = document.createElement("legend");
        legend.textContent = label(group);
        fieldset.append(legend);

        for (const [key, value] of Object.entries(values)) {
            const path = `${group}.${key}`;
            const row = document.createElement("div");
            row.className = "atlas-row";

            const caption = document.createElement("label");
            const id = `atlas-setting-${index++}`;
            caption.textContent = label(key);
            caption.htmlFor = id;
            row.append(caption);

            if (typeof value === "boolean") {
                const input = document.createElement("input");
                input.id = id;
                input.type = "checkbox";
                input.checked = value;
                input.onchange = () => {
                    set(path, input.checked);
                    changed(path);
                };
                row.append(input);
            } else if (Array.isArray(value)) {
                const wrapper = document.createElement("div");
                wrapper.className = "atlas-color";

                const picker = document.createElement("input");
                picker.id = id;
                picker.type = "color";
                picker.value = hex(value);
                wrapper.append(picker);

                const channels = ["R", "G", "B"].map((channel, i) => {
                    const input = document.createElement("input");
                    input.type = "number";
                    input.min = 0;
                    input.max = 255;
                    input.step = 1;
                    input.value = value[i];
                    input.setAttribute("aria-label", `${key} ${channel}`);

                    input.oninput = () => {
                        if (!Number.isFinite(input.valueAsNumber)) return;
                        const color = [...get(path)];
                        color[i] = Math.round(clamp(input.valueAsNumber, 0, 255));
                        set(path, color);
                        picker.value = hex(color);
                        changed(path);
                    };

                    input.onchange = () => input.value = get(path)[i];
                    wrapper.append(input);
                    return input;
                });

                picker.oninput = () => {
                    const color = [1, 3, 5].map(i =>
                        parseInt(picker.value.slice(i, i + 2), 16)
                    );
                    set(path, color);
                    channels.forEach((input, i) => input.value = color[i]);
                    changed(path);
                };

                row.append(wrapper);
            } else {
                const [min, max, step] = limits[path];
                const number = document.createElement("input");
                const range = document.createElement("input");
                number.id = id;
                number.type = "number";
                range.type = "range";
                range.setAttribute("aria-label", label(key));

                for (const input of [number, range]) {
                    input.min = min;
                    input.max = max;
                    input.step = step;
                    input.value = value;
                }

                function update(source, target) {
                    let next = source.valueAsNumber;
                    if (!Number.isFinite(next)) return;
                    next = clamp(next, min, max);
                    if (step === 1) next = Math.round(next);
                    set(path, next);
                    target.value = next;
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