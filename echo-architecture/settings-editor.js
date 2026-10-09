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
        "structures.count": [0, 40, 1],
        "structures.width": [20, 140, 1],
        "structures.height": [40, 320, 1],
        "structures.floors": [1, 12, 1],
        "structures.cycleDuration": [6, 40, 1],
        "structures.unfolding": [0.1, 0.5, 0.01],
        "structures.persistence": [0, 0.4, 0.01],

        "perspective.distance": [300, 1200, 10],
        "perspective.horizon": [0.2, 0.65, 0.01],
        "perspective.spread": [200, 1200, 10],
        "perspective.depth": [400, 2500, 10],
        "perspective.rotation": [-0.5, 0.5, 0.01],

        "appearance.lineWidth": [0, 3, 0.1],
        "appearance.opacity": [0, 1, 0.01],
        "appearance.constructionOpacity": [0, 0.5, 0.01],
        "appearance.faceOpacity": [0, 0.2, 0.005],

        "mouse.radius": [50, 500, 1],
        "mouse.extraFloors": [0, 8, 1],
        "mouse.vanishingShift": [0, 0.5, 0.01],
        "mouse.smoothing": [1, 20, 0.5],

        "glow.intensity": [0, 1, 0.01],
        "glow.blur": [0, 30, 1]
    };

    const style = document.createElement("style");
    style.textContent = `
        .echo-editor, .echo-editor * { box-sizing: border-box; }
        .echo-editor { color: #eee; font: 12px system-ui, sans-serif; }
        .echo-editor [hidden] { display: none !important; }
        .echo-panel {
            position: fixed; inset: 0 0 0 auto;
            width: min(350px, 100vw); z-index: 1001;
            display: flex; flex-direction: column;
            background: rgba(15,20,28,.97);
            border-left: 1px solid #34404b;
            transform: translateX(100%);
            transition: transform .22s ease;
        }
        .echo-panel.open { transform: translateX(0); }
        .echo-header {
            display: flex; justify-content: space-between;
            align-items: center; padding: 16px;
            border-bottom: 1px solid #34404b;
        }
        .echo-header strong { font-size: 15px; }
        .echo-body { flex: 1; overflow-y: auto; padding: 0 16px 20px; }
        .echo-editor fieldset {
            min-width: 0; margin: 18px 0; padding: 12px;
            border: 1px solid #34404b; border-radius: 8px;
        }
        .echo-editor legend { padding: 0 6px; color: #a5cde5; }
        .echo-row {
            display: grid; grid-template-columns: 1fr 90px;
            gap: 8px; align-items: center; margin-bottom: 12px;
        }
        .echo-row:last-child { margin-bottom: 0; }
        .echo-editor input[type=range] {
            grid-column: 1 / -1; width: 100%; accent-color: #91c9ec;
        }
        .echo-editor input[type=number] {
            width: 90px; padding: 5px; color: #fff;
            background: #090d12; border: 1px solid #45515c;
            border-radius: 5px;
        }
        .echo-editor input[type=checkbox] {
            justify-self: end; accent-color: #91c9ec;
        }
        .echo-color {
            grid-column: 1 / -1; display: flex;
            gap: 6px; align-items: center;
        }
        .echo-color input[type=number] { width: 100%; min-width: 0; }
        .echo-color input[type=color] {
            flex-shrink: 0; width: 40px; height: 30px;
            background: transparent; border: 1px solid #45515c;
        }
        .echo-editor button {
            padding: 8px 10px; color: #eee; background: #25313a;
            border: 1px solid #45515c; border-radius: 6px;
            cursor: pointer; font: inherit;
        }
        .echo-editor button:hover { background: #354753; }
        .echo-editor :focus-visible {
            outline: 2px solid #91c9ec; outline-offset: 2px;
        }
        .echo-launcher {
            position: fixed; top: 16px; right: 16px; z-index: 1000;
        }
        .echo-actions { display: flex; flex-wrap: wrap; gap: 8px; }
        .echo-editor textarea {
            width: 100%; height: 330px; margin-top: 12px;
            padding: 10px; color: #c3e5ff; background: #090d12;
            border: 1px solid #45515c; border-radius: 6px;
            font: 11px/1.5 monospace; white-space: pre;
        }
        .echo-status { min-height: 20px; margin-top: 8px; }
        .echo-hint { color: #aeb8ca; line-height: 1.5; }
        @media (prefers-reduced-motion: reduce) {
            .echo-panel { transition: none; }
        }
    `;
    document.head.append(style);

    const root = document.createElement("div");
    root.className = "echo-editor";
    root.setAttribute("data-background-editor", "");

    root.innerHTML = `
        <button class="echo-launcher" aria-expanded="false">Settings</button>
        <aside class="echo-panel" aria-label="Echo Architecture settings" inert>
            <div class="echo-header">
                <strong>Echo Architecture</strong>
                <button class="echo-close">Retract →</button>
            </div>
            <div class="echo-body">
                <div class="echo-controls"></div>
                <div class="echo-actions">
                    <button class="echo-show" aria-expanded="false">Show code</button>
                    <button class="echo-copy">Copy config</button>
                    <button class="echo-reset">Reset structures</button>
                </div>
                <textarea readonly spellcheck="false" hidden
                    aria-label="Current configuration"></textarea>
                <div class="echo-status" role="status"></div>
                <p class="echo-hint">
                    The mouse shifts perspective and reveals extra floors.
                    Unfolding and persistence are fractions of each lifecycle.
                    RGB fields are R, G, B.
                </p>
                <p class="echo-hint">
                    Copy settings before disabling the pane.
                    Save panel.enabled as false for production.
                </p>
            </div>
        </aside>
    `;
    document.body.append(root);

    root.querySelectorAll("button").forEach(b => b.type = "button");

    const find = selector => root.querySelector(selector);
    const panel = find(".echo-panel");
    const launcher = find(".echo-launcher");
    const close = find(".echo-close");
    const controls = find(".echo-controls");
    const show = find(".echo-show");
    const code = find("textarea");
    const status = find(".echo-status");

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

    find(".echo-copy").onclick = async () => {
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

    find(".echo-reset").onclick = () => {
        onReset();
        status.textContent = "Structures reset.";
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
            row.className = "echo-row";

            const caption = document.createElement("label");
            const id = `echo-setting-${index++}`;
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
                wrapper.className = "echo-color";

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