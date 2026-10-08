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
        .mag-editor,
        .mag-editor * {
            box-sizing: border-box;
        }

        .mag-editor {
            font-family: system-ui, sans-serif;
            color: #eee;
        }

        .mag-editor [hidden] {
            display: none !important;
        }

        .mag-panel {
            position: fixed;
            inset: 0 0 0 auto;
            width: min(350px, 100vw);
            z-index: 1001;
            display: flex;
            flex-direction: column;
            background: rgba(18,20,25,.96);
            border-left: 1px solid #343840;
            box-shadow: -8px 0 30px #0006;
            transform: translateX(100%);
            transition: transform 220ms ease;
        }

        .mag-panel.open {
            transform: translateX(0);
        }

        .mag-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px;
            border-bottom: 1px solid #343840;
        }

        .mag-header strong {
            font-size: 15px;
        }

        .mag-body {
            flex: 1;
            overflow-y: auto;
            padding: 0 16px 20px;
        }

        .mag-editor fieldset {
            min-width: 0;
            margin: 18px 0 0;
            padding: 12px;
            border: 1px solid #343840;
            border-radius: 8px;
        }

        .mag-editor legend {
            padding: 0 6px;
            color: #aeb8ca;
            font-size: 12px;
            font-weight: 600;
        }

        .mag-control {
            display: grid;
            grid-template-columns: 1fr 100px;
            gap: 8px;
            align-items: center;
            margin-bottom: 12px;
            font-size: 12px;
        }

        .mag-control:last-child {
            margin-bottom: 0;
        }

        .mag-editor input[type="range"] {
            grid-column: 1 / -1;
            width: 100%;
            margin: 0;
            accent-color: #80baff;
        }

        .mag-editor input[type="number"],
        .mag-editor select {
            width: 100px;
            padding: 5px 7px;
            color: #fff;
            background: #090b10;
            border: 1px solid #454b57;
            border-radius: 5px;
        }

        .mag-editor input[type="checkbox"] {
            justify-self: end;
            accent-color: #80baff;
        }

        .mag-colors {
            grid-column: 1 / -1;
            display: flex;
            gap: 8px;
            align-items: center;
        }

        .mag-editor input[type="color"] {
            width: 42px;
            height: 30px;
            padding: 2px;
            background: transparent;
            border: 1px solid #454b57;
            border-radius: 5px;
        }

        .mag-rgb {
            display: flex;
            flex: 1;
            gap: 6px;
        }

        .mag-rgb input[type="number"] {
            width: 100%;
            min-width: 0;
        }

        .mag-editor button {
            padding: 8px 11px;
            color: #eee;
            background: #272d38;
            border: 1px solid #454b57;
            border-radius: 6px;
            cursor: pointer;
            font: 12px system-ui, sans-serif;
        }

        .mag-editor button:hover {
            background: #384253;
        }

        .mag-editor button:focus-visible,
        .mag-editor input:focus-visible,
        .mag-editor select:focus-visible,
        .mag-editor textarea:focus-visible {
            outline: 2px solid #80baff;
            outline-offset: 2px;
        }

        .mag-launcher {
            position: fixed;
            top: 16px;
            right: 16px;
            z-index: 1000;
        }

        .mag-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 18px;
        }

        .mag-editor textarea {
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

        .mag-status {
            min-height: 18px;
            margin-top: 8px;
            color: #a8d6ad;
            font-size: 11px;
        }

        .mag-hint {
            color: #aeb8ca;
            font-size: 11px;
            line-height: 1.5;
        }

        @media (prefers-reduced-motion: reduce) {
            .mag-panel {
                transition: none;
            }
        }
    `;

    document.head.appendChild(style);

    const root = document.createElement("div");
    root.className = "mag-editor";
    root.setAttribute("data-background-editor", "");

    root.innerHTML = `
        <button class="mag-launcher" type="button"
                aria-expanded="false">
            Settings
        </button>

        <aside class="mag-panel"
               aria-label="Magnetic particle settings" inert>
            <div class="mag-header">
                <strong>Magnetic particles</strong>
                <button class="mag-close" type="button">
                    Retract →
                </button>
            </div>

            <div class="mag-body">
                <div class="mag-controls"></div>

                <div class="mag-actions">
                    <button class="mag-show" type="button"
                            aria-expanded="false">
                        Show code
                    </button>

                    <button class="mag-copy" type="button">
                        Copy config
                    </button>

                    <button class="mag-reset" type="button">
                        Reset particles
                    </button>
                </div>

                <textarea readonly spellcheck="false" hidden
                    aria-label="Current configuration code"></textarea>

                <div class="mag-status" role="status"></div>

                <p class="mag-hint">
                    All settings update immediately.
                    RGB fields are ordered R, G, B.
                    Copy the configuration into index.html
                    to make your settings permanent.
                </p>

                <p class="mag-hint">
                    Higher friction slows particles more quickly.
                    Swirl controls circulation around the poles.
                    Set trail length to zero for crisp moving dots.
                </p>

                <p class="mag-hint">
                    Disabling the pane hides its controls.
                    Save panel.enabled as false to prevent
                    the editor from loading next time.
                </p>
            </div>
        </aside>
    `;

    document.body.appendChild(root);

    const find = selector => root.querySelector(selector);

    const panel = find(".mag-panel");
    const launcher = find(".mag-launcher");
    const close = find(".mag-close");
    const controls = find(".mag-controls");
    const show = find(".mag-show");
    const copy = find(".mag-copy");
    const reset = find(".mag-reset");
    const code = find("textarea");
    const status = find(".mag-status");

    function getValue(path) {
        return path.split(".").reduce(
            (object, key) => object[key], config
        );
    }

    function setValue(path, value) {
        const keys = path.split(".");
        const last = keys.pop();

        const object = keys.reduce(
            (current, key) => current[key], config
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
        refreshCode();

        if (path === "panel.enabled") {
            if (!config.panel.enabled) setOpen(false);
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
        status.textContent = "Particles reset.";
    });

    const groups = [
        ["Particles", [
            ["particleCount", "Particle count", 0, 2000, 1],
            ["particleRadius", "Particle radius", 0.2, 5, 0.1],
            ["particleColor", "Particle color", "color"],
            ["maxSpeed", "Maximum speed", 0, 400, 1],
            ["friction", "Friction", 0, 5, 0.05],
            ["trailLength", "Trail length", 0, 3, 0.05]
        ]],

        ["Magnetic poles", [
            ["poles.count", "Pole count", 0, 10, 1],
            ["poles.strength", "Strength", 0, 1000, 1],
            ["poles.radius", "Influence radius", 20, 800, 1],
            ["poles.orbitSpeed", "Movement speed", -1, 1, 0.01],
            ["poles.swirl", "Swirl", 0, 4, 0.05],
            ["poles.show", "Show pole positions", "boolean"]
        ]],

        ["Mouse", [
            ["mouse.enabled", "Enabled", "boolean"],
            ["mouse.mode", "Mode", "select", ["attract", "repel"]],
            ["mouse.strength", "Strength", 0, 1500, 1],
            ["mouse.radius", "Influence radius", 20, 600, 1],
            ["mouse.color", "Mouse color", "color"]
        ]],

        ["Glow", [
            ["glow.enabled", "Enabled", "boolean"],
            ["glow.intensity", "Intensity", 0, 1, 0.01],
            ["glow.blur", "Blur", 0, 40, 1]
        ]],

        ["Settings pane", [
            ["panel.enabled", "Enable pane", "boolean"]
        ]]
    ];

    function toHex(color) {
        return "#" + color.map(value =>
            Math.round(clamp(value, 0, 255))
                .toString(16).padStart(2, "0")
        ).join("");
    }

    function fromHex(hex) {
        return [1, 3, 5].map(index =>
            parseInt(hex.slice(index, index + 2), 16)
        );
    }

    let controlIndex = 0;

    for (const [title, fields] of groups) {
        const fieldset = document.createElement("fieldset");
        const legend = document.createElement("legend");

        legend.textContent = title;
        fieldset.appendChild(legend);

        for (const [path, labelText, typeOrMin, max, step] of fields) {
            const row = document.createElement("div");
            const label = document.createElement("label");
            const id = `mag-control-${controlIndex++}`;

            row.className = "mag-control";
            label.textContent = labelText;
            label.htmlFor = id;
            row.appendChild(label);

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
            } else if (typeOrMin === "select") {
                const select = document.createElement("select");
                select.id = id;

                for (const value of max) {
                    const option = document.createElement("option");

                    option.value = value;
                    option.textContent =
                        value[0].toUpperCase() + value.slice(1);

                    select.appendChild(option);
                }

                select.value = getValue(path);

                select.addEventListener("change", () => {
                    setValue(path, select.value);
                    changed(path);
                });

                row.appendChild(select);
            } else if (typeOrMin === "color") {
                const wrapper = document.createElement("div");
                const picker = document.createElement("input");
                const rgbWrapper = document.createElement("div");

                wrapper.className = "mag-colors";
                rgbWrapper.className = "mag-rgb";

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
                            "aria-label", `${labelText} ${channel}`
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

                for (const input of [number, range]) {
                    input.min = typeOrMin;
                    input.max = max;
                    input.step = step;
                    input.value = getValue(path);
                }

                function update(source, target) {
                    let value = source.valueAsNumber;
                    if (!Number.isFinite(value)) return;

                    value = clamp(value, typeOrMin, max);
                    if (step === 1) value = Math.round(value);

                    setValue(path, value);
                    target.value = value;
                    changed(path);
                }

                number.addEventListener("input", () =>
                    update(number, range)
                );

                number.addEventListener("change", () => {
                    number.value = getValue(path);
                });

                range.addEventListener("input", () =>
                    update(range, number)
                );

                row.append(number, range);
            }

            fieldset.appendChild(row);
        }

        controls.appendChild(fieldset);
    }

    refreshCode();
    root.hidden = !config.panel.enabled;

    return {
        destroy() {
            document.removeEventListener("keydown", onKeydown);
            root.remove();
            style.remove();
        }
    };
}