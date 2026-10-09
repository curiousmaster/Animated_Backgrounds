"use strict";

export function mountEditor({
    config,
    onChange = () => {},
    onReset = () => {}
}) {
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

    const label = text => text
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/^./, c => c.toUpperCase());

    const limits = {
        "fractures.count": [0, 15, 1],
        "fractures.branching": [0, 0.8, 0.01],
        "fractures.maxDepth": [0, 4, 1],
        "fractures.segmentLength": [25, 120, 1],
        "fractures.roughness": [0, 1, 0.01],
        "fractures.openingWidth": [0, 5, 0.1],
        "fractures.bendStrength": [0, 100, 1],

        "pulses.speed": [10, 300, 1],
        "pulses.length": [10, 180, 1],
        "pulses.interval": [0, 6, 0.1],
        "pulses.intensity": [0, 1, 0.01],

        "appearance.baseOpacity": [0, 1, 0.01],

        "mouse.radius": [40, 500, 1],
        "mouse.pulseInterval": [0.1, 2, 0.05],
        "mouse.smoothing": [1, 20, 0.5],

        "glow.intensity": [0, 1, 0.01],
        "glow.blur": [0, 40, 1]
    };

    const style = document.createElement("style");
    style.textContent = `
        .fault-editor, .fault-editor * { box-sizing: border-box; }
        .fault-editor { color: #eee; font: 12px system-ui, sans-serif; }
        .fault-editor [hidden] { display: none !important; }
        .fault-panel {
            position: fixed; inset: 0 0 0 auto;
            width: min(350px, 100vw); z-index: 1001;
            display: flex; flex-direction: column;
            background: rgba(15,20,28,.97);
            border-left: 1px solid #34404b;
            transform: translateX(100%);
            transition: transform .22s ease;
        }
        .fault-panel.open { transform: translateX(0); }
        .fault-header {
            display: flex; justify-content: space-between;
            align-items: center; padding: 16px;
            border-bottom: 1px solid #34404b;
        }
        .fault-header strong { font-size: 15px; }
        .fault-body { flex: 1; overflow-y: auto; padding: 0 16px 20px; }
        .fault-editor fieldset {
            min-width: 0; margin: 18px 0; padding: 12px;
            border: 1px solid #34404b; border-radius: 8px;
        }
        .fault-editor legend { padding: 0 6px; color: #a5cde5; }
        .fault-row {
            display: grid; grid-template-columns: 1fr 90px;
            gap: 8px; align-items: center; margin-bottom: 12px;
        }
        .fault-row:last-child { margin-bottom: 0; }
        .fault-editor input[type=range] {
            grid-column: 1 / -1; width: 100%; accent-color: #91c9ec;
        }
        .fault-editor input[type=number] {
            width: 90px; padding: 5px; color: #fff;
            background: #090d12; border: 1px solid #45515c;
            border-radius: 5px;
        }
        .fault-editor input[type=checkbox] {
            justify-self: end; accent-color: #91c9ec;
        }
        .fault-color {
            grid-column: 1 / -1; display: flex;
            gap: 6px; align-items: center;
        }
        .fault-color input[type=number] { width: 100%; min-width: 0; }
        .fault-color input[type=color] {
            flex-shrink: 0; width: 40px; height: 30px;
            background: transparent; border: 1px solid #45515c;
        }
        .fault-editor button {
            padding: 8px 10px; color: #eee; background: #25313a;
            border: 1px solid #45515c; border-radius: 6px;
            cursor: pointer; font: inherit;
        }
        .fault-editor button:hover { background: #354753; }
        .fault-editor :focus-visible {
            outline: 2px solid #91c9ec; outline-offset: 2px;
        }
        .fault-launcher {
            position: fixed; top: 16px; right: 16px; z-index: 1000;
        }
        .fault-actions { display: flex; flex-wrap: wrap; gap: 8px; }
        .fault-editor textarea {
            width: 100%; height: 330px; margin-top: 12px;
            padding: 10px; color: #c3e5ff; background: #090d12;
            border: 1px solid #45515c; border-radius: 6px;
            font: 11px/1.5 monospace; white-space: pre;
        }
        .fault-status { min-height: 20px; margin-top: 8px; }
        .fault-hint { color: #aeb8ca; line-height: 1.5; }
        @media (prefers-reduced-motion: reduce) {
            .fault-panel { transition: none; }
        }
    `;
    document.head.append(style);

    const root = document.createElement("div");
    root.className = "fault-editor";
    root.setAttribute("data-background-editor", "");

    root.innerHTML = `
        <button class="fault-launcher" aria-expanded="false">Settings</button>
        <aside class="fault-panel" aria-label="Chromatic Faults settings" inert>
            <div class="fault-header">
                <strong>Chromatic Faults</strong>
                <button class="fault-close">Retract →</button>
            </div>
            <div class="fault-body">
                <div class="fault-controls"></div>
                <div class="fault-actions">
                    <button class="fault-show" aria-expanded="false">Show code</button>
                    <button class="fault-copy">Copy config</button>
                    <button class="fault-reset">Regenerate fractures</button>
                </div>
                <textarea readonly spellcheck="false" hidden
                    aria-label="Current configuration"></textarea>
                <div class="fault-status" role="status"></div>
                <p class="fault-hint">
                    The mouse bends nearby cracks and injects light pulses.
                    Set pulse interval to zero to disable ambient pulses.
                    Geometry changes regenerate the fracture network.
                </p>
                <p class="fault-hint">
                    RGB fields are R, G, B.
                    Copy settings before disabling the pane.
                    Save panel.enabled as false for production.
                </p>
            </div>
        </aside>
    `;
    document.body.append(root);
    root.querySelectorAll("button").forEach(b => b.type = "button");

    const find = selector => root.querySelector(selector);
    const panel = find(".fault-panel");
    const launcher = find(".fault-launcher");
    const close = find(".fault-close");
    const controls = find(".fault-controls");
    const show = find(".fault-show");
    const code = find("textarea");
    const status = find(".fault-status");

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

    find(".fault-copy").onclick = async () => {
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

    find(".fault-reset").onclick = () => {
        onReset();
        status.textContent = "Fractures regenerated.";
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

    for (const [group, values] of Object.entries(config)) {
        const fieldset = document.createElement("fieldset");
        const legend = document.createElement("legend");
        legend.textContent = label(group);
        fieldset.append(legend);

        for (const [key, value] of Object.entries(values)) {
            const path = `${group}.${key}`;
            const row = document.createElement("div");
            row.className = "fault-row";

            const caption = document.createElement("label");
            const id = `fault-setting-${index++}`;
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
                wrapper.className = "fault-color";

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
                    input.setAttribute("aria-label", `${label(key)} ${channel}`);

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