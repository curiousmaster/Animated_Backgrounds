"use strict";

export function mountEditor({
    config,
    onChange = () => {},
    onClearRipples = () => {}
}) {
    const clamp = (value, min, max) =>
        Math.max(min, Math.min(max, value));

    const style = document.createElement("style");

    style.textContent = `
        .wave-editor,
        .wave-editor * {
            box-sizing: border-box;
        }

        .wave-editor {
            font-family: system-ui, sans-serif;
            color: #eee;
        }

        .wave-editor [hidden] {
            display: none !important;
        }

        .wave-editor-panel {
            position: fixed;
            inset: 0 0 0 auto;
            width: min(350px, 100vw);
            z-index: 1001;
            display: flex;
            flex-direction: column;
            background: rgba(18, 20, 25, .96);
            border-left: 1px solid #343840;
            box-shadow: -8px 0 30px #0006;
            transform: translateX(100%);
            transition: transform 220ms ease;
        }

        .wave-editor-panel.open {
            transform: translateX(0);
        }

        .wave-editor-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px;
            border-bottom: 1px solid #343840;
        }

        .wave-editor-header strong {
            font-size: 15px;
        }

        .wave-editor-body {
            flex: 1;
            overflow-y: auto;
            padding: 0 16px 20px;
        }

        .wave-editor fieldset {
            min-width: 0;
            margin: 18px 0 0;
            padding: 12px;
            border: 1px solid #343840;
            border-radius: 8px;
        }

        .wave-editor legend {
            padding: 0 6px;
            color: #aeb8ca;
            font-size: 12px;
            font-weight: 600;
        }

        .wave-editor-control {
            display: grid;
            grid-template-columns: 1fr 90px;
            gap: 8px;
            align-items: center;
            margin-bottom: 12px;
            font-size: 12px;
        }

        .wave-editor-control:last-child {
            margin-bottom: 0;
        }

        .wave-editor input[type="range"] {
            grid-column: 1 / -1;
            width: 100%;
            margin: 0;
            accent-color: #80baff;
        }

        .wave-editor input[type="number"] {
            width: 90px;
            padding: 5px 7px;
            color: #fff;
            background: #090b10;
            border: 1px solid #454b57;
            border-radius: 5px;
        }

        .wave-editor input[type="checkbox"] {
            justify-self: end;
            accent-color: #80baff;
        }

        .wave-editor-colors {
            grid-column: 1 / -1;
            display: flex;
            gap: 8px;
            align-items: center;
        }

        .wave-editor input[type="color"] {
            width: 42px;
            height: 30px;
            padding: 2px;
            background: transparent;
            border: 1px solid #454b57;
            border-radius: 5px;
        }

        .wave-editor-rgb {
            display: flex;
            flex: 1;
            gap: 6px;
        }

        .wave-editor-rgb input[type="number"] {
            width: 100%;
            min-width: 0;
        }

        .wave-editor button {
            padding: 8px 11px;
            color: #eee;
            background: #272d38;
            border: 1px solid #454b57;
            border-radius: 6px;
            cursor: pointer;
            font: 12px system-ui, sans-serif;
        }

        .wave-editor button:hover {
            background: #384253;
        }

        .wave-editor button:focus-visible,
        .wave-editor input:focus-visible,
        .wave-editor textarea:focus-visible {
            outline: 2px solid #80baff;
            outline-offset: 2px;
        }

        .wave-editor-launcher {
            position: fixed;
            top: 16px;
            right: 16px;
            z-index: 1000;
        }

        .wave-editor-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 18px;
        }

        .wave-editor textarea {
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

        .wave-editor-status {
            min-height: 18px;
            margin-top: 8px;
            color: #a8d6ad;
            font-size: 11px;
        }

        .wave-editor-hint {
            color: #aeb8ca;
            font-size: 11px;
            line-height: 1.5;
        }

        @media (prefers-reduced-motion: reduce) {
            .wave-editor-panel {
                transition: none;
            }
        }
    `;

    document.head.appendChild(style);

    const root = document.createElement("div");

    root.className = "wave-editor";
    root.setAttribute("data-background-editor", "");

    root.innerHTML = `
        <button class="wave-editor-launcher" type="button"
                aria-expanded="false">
            Settings
        </button>

        <aside class="wave-editor-panel"
               aria-label="Wave background settings" inert>
            <div class="wave-editor-header">
                <strong>Wave field</strong>
                <button class="wave-editor-close" type="button">
                    Retract →
                </button>
            </div>

            <div class="wave-editor-body">
                <div class="wave-editor-controls"></div>

                <div class="wave-editor-actions">
                    <button class="wave-editor-show" type="button"
                            aria-expanded="false">
                        Show code
                    </button>

                    <button class="wave-editor-copy" type="button">
                        Copy config
                    </button>

                    <button class="wave-editor-clear" type="button">
                        Clear ripples
                    </button>
                </div>

                <textarea readonly spellcheck="false" hidden
                    aria-label="Current configuration code"></textarea>

                <div class="wave-editor-status" role="status"></div>

                <p class="wave-editor-hint">
                    All changes apply immediately.
                    RGB fields are ordered R, G, B.
                    Copy the code into index.html for permanent settings.
                </p>

                <p class="wave-editor-hint">
                    Disable the pane after copying your settings.
                    Set panel.enabled to false in your saved configuration
                    to prevent the editor from loading.
                </p>
            </div>
        </aside>
    `;

    document.body.appendChild(root);

    const find = selector => root.querySelector(selector);

    const panel = find(".wave-editor-panel");
    const launcher = find(".wave-editor-launcher");
    const close = find(".wave-editor-close");
    const controls = find(".wave-editor-controls");
    const show = find(".wave-editor-show");
    const copy = find(".wave-editor-copy");
    const clear = find(".wave-editor-clear");
    const code = find("textarea");
    const status = find(".wave-editor-status");

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

    clear.addEventListener("click", () => {
        onClearRipples();
        status.textContent = "Ripples cleared.";
    });

    const groups = [
        ["Grid", [
            ["spacing", "Spacing", 6, 80, 1],
            ["minRadius", "Minimum radius", 0, 8, 0.05],
            ["maxRadius", "Maximum radius", 0, 16, 0.1],
            ["gridTilt", "Grid rotation", -180, 180, 1]
        ]],

        ["Waves", [
            ["waveCount", "Wave count", 0, 10, 1],
            ["wavelength", "Wavelength", 40, 800, 1],
            ["waveSpeed", "Speed", -200, 200, 1],
            ["amplitude", "Amplitude", 0, 2, 0.01],
            ["waveColor", "Wave color", "color"]
        ]],

        ["Mouse ripples", [
            ["mouseEnabled", "Enabled", "boolean"],
            ["mouseColor", "Ripple color", "color"],
            ["rippleStrength", "Strength", 0, 4, 0.05],
            ["rippleSpeed", "Expansion speed", 0, 600, 1],
            ["rippleWidth", "Ring width", 5, 150, 1],
            ["rippleDecay", "Fade rate", 0, 3, 0.05],
            ["rippleInterval", "Emission interval", 0.04, 1, 0.01],
            ["maxRipples", "Maximum ripples", 0, 60, 1]
        ]],

        ["Glow", [
            ["glow.enabled", "Enabled", "boolean"],
            ["glow.intensity", "Intensity", 0, 1, 0.01],
            ["glow.blur", "Blur", 0, 40, 1],
            ["glow.radius", "Radius multiplier", 0, 3, 0.05]
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
            const id = `wave-editor-control-${controlIndex++}`;

            row.className = "wave-editor-control";
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

                wrapper.className = "wave-editor-colors";
                rgbWrapper.className = "wave-editor-rgb";

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

                    if (step === 1) {
                        value = Math.round(value);
                    }

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