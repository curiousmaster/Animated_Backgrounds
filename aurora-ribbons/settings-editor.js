"use strict";

export function mountEditor({
    config,
    onChange = () => {}
}) {
    const clamp = (value, min, max) =>
        Math.max(min, Math.min(max, value));

    const style = document.createElement("style");

    style.textContent = `
        .aurora-editor,
        .aurora-editor * {
            box-sizing: border-box;
        }

        .aurora-editor {
            color: #eee;
            font-family: system-ui, sans-serif;
        }

        .aurora-editor [hidden] {
            display: none !important;
        }

        .aurora-panel {
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

        .aurora-panel.open {
            transform: translateX(0);
        }

        .aurora-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px;
            border-bottom: 1px solid #343840;
        }

        .aurora-header strong {
            font-size: 15px;
        }

        .aurora-body {
            flex: 1;
            overflow-y: auto;
            padding: 0 16px 20px;
        }

        .aurora-editor fieldset {
            min-width: 0;
            margin: 18px 0 0;
            padding: 12px;
            border: 1px solid #343840;
            border-radius: 8px;
        }

        .aurora-editor legend {
            padding: 0 6px;
            color: #aeb8ca;
            font-size: 12px;
            font-weight: 600;
        }

        .aurora-control {
            display: grid;
            grid-template-columns: 1fr 100px;
            gap: 8px;
            align-items: center;
            margin-bottom: 12px;
            font-size: 12px;
        }

        .aurora-control:last-child {
            margin-bottom: 0;
        }

        .aurora-editor input[type="range"] {
            grid-column: 1 / -1;
            width: 100%;
            margin: 0;
            accent-color: #80baff;
        }

        .aurora-editor input[type="number"] {
            width: 100px;
            padding: 5px 7px;
            color: #fff;
            background: #090b10;
            border: 1px solid #454b57;
            border-radius: 5px;
        }

        .aurora-editor input[type="checkbox"] {
            justify-self: end;
            accent-color: #80baff;
        }

        .aurora-colors {
            grid-column: 1 / -1;
            display: flex;
            gap: 8px;
            align-items: center;
        }

        .aurora-editor input[type="color"] {
            width: 42px;
            height: 30px;
            padding: 2px;
            background: transparent;
            border: 1px solid #454b57;
            border-radius: 5px;
        }

        .aurora-rgb {
            display: flex;
            flex: 1;
            gap: 6px;
        }

        .aurora-rgb input[type="number"] {
            width: 100%;
            min-width: 0;
        }

        .aurora-editor button {
            padding: 8px 11px;
            color: #eee;
            background: #272d38;
            border: 1px solid #454b57;
            border-radius: 6px;
            cursor: pointer;
            font: 12px system-ui, sans-serif;
        }

        .aurora-editor button:hover {
            background: #384253;
        }

        .aurora-editor button:focus-visible,
        .aurora-editor input:focus-visible,
        .aurora-editor textarea:focus-visible {
            outline: 2px solid #80baff;
            outline-offset: 2px;
        }

        .aurora-launcher {
            position: fixed;
            top: 16px;
            right: 16px;
            z-index: 1000;
        }

        .aurora-actions {
            display: flex;
            gap: 8px;
            margin-top: 18px;
        }

        .aurora-editor textarea {
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

        .aurora-status {
            min-height: 18px;
            margin-top: 8px;
            color: #a8d6ad;
            font-size: 11px;
        }

        .aurora-hint {
            color: #aeb8ca;
            font-size: 11px;
            line-height: 1.5;
        }

        @media (prefers-reduced-motion: reduce) {
            .aurora-panel {
                transition: none;
            }
        }
    `;

    document.head.appendChild(style);

    const root = document.createElement("div");
    root.className = "aurora-editor";
    root.setAttribute("data-background-editor", "");

    root.innerHTML = `
        <button class="aurora-launcher" type="button"
                aria-expanded="false">
            Settings
        </button>

        <aside class="aurora-panel"
               aria-label="Aurora ribbon settings" inert>
            <div class="aurora-header">
                <strong>Aurora ribbons</strong>
                <button class="aurora-close" type="button">
                    Retract →
                </button>
            </div>

            <div class="aurora-body">
                <div class="aurora-controls"></div>

                <div class="aurora-actions">
                    <button class="aurora-show" type="button"
                            aria-expanded="false">
                        Show code
                    </button>

                    <button class="aurora-copy" type="button">
                        Copy config
                    </button>
                </div>

                <textarea readonly spellcheck="false" hidden
                    aria-label="Current configuration code"></textarea>

                <div class="aurora-status" role="status"></div>

                <p class="aurora-hint">
                    All changes apply immediately.
                    RGB fields are ordered R, G, B.
                    Copy the configuration into index.html
                    for permanent settings.
                </p>

                <p class="aurora-hint">
                    Spread controls separation between ribbons.
                    Larger wavelengths create broader curves.
                    More layers soften the ribbon edges.
                </p>

                <p class="aurora-hint">
                    Copy your settings before disabling the pane.
                    Set panel.enabled to false in your saved code
                    to prevent the editor from loading.
                </p>
            </div>
        </aside>
    `;

    document.body.appendChild(root);

    const find = selector => root.querySelector(selector);

    const panel = find(".aurora-panel");
    const launcher = find(".aurora-launcher");
    const close = find(".aurora-close");
    const controls = find(".aurora-controls");
    const show = find(".aurora-show");
    const copy = find(".aurora-copy");
    const code = find("textarea");
    const status = find(".aurora-status");

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

    const groups = [
        ["Ribbons", [
            ["ribbons.count", "Ribbon count", 0, 12, 1],
            ["ribbons.width", "Width", 10, 300, 1],
            ["ribbons.spread", "Spread", 0, 1.2, 0.01],
            ["ribbons.amplitude", "Wave amplitude", 0, 250, 1],
            ["ribbons.wavelength", "Wavelength", 100, 1500, 10],
            ["ribbons.speed", "Movement speed", -2, 2, 0.01],
            ["ribbons.rotation", "Rotation", -180, 180, 1],
            ["ribbons.opacity", "Opacity", 0, 1, 0.01],
            ["ribbons.colorA", "First color", "color"],
            ["ribbons.colorB", "Last color", "color"]
        ]],

        ["Mouse", [
            ["mouse.enabled", "Enabled", "boolean"],
            ["mouse.radius", "Influence radius", 30, 600, 1],
            ["mouse.strength", "Attraction strength", 0, 1, 0.01],
            ["mouse.smoothing", "Response speed", 1, 20, 0.5],
            ["mouse.color", "Mouse color", "color"]
        ]],

        ["Glow", [
            ["glow.enabled", "Enabled", "boolean"],
            ["glow.intensity", "Intensity", 0, 1, 0.01],
            ["glow.blur", "Blur", 0, 60, 1]
        ]],

        ["Rendering", [
            ["rendering.sampleSpacing", "Sampling spacing", 4, 40, 1],
            ["rendering.layers", "Softness layers", 1, 16, 1]
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
            const id = `aurora-control-${controlIndex++}`;

            row.className = "aurora-control";
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
            } else if (typeOrMin === "color") {
                const wrapper = document.createElement("div");
                const picker = document.createElement("input");
                const rgbWrapper = document.createElement("div");

                wrapper.className = "aurora-colors";
                rgbWrapper.className = "aurora-rgb";

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