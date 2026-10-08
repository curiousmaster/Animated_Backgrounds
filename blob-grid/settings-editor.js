"use strict";

export function mountEditor({ config, onChange = () => {} }) {
    const clamp = (value, min, max) =>
        Math.max(min, Math.min(max, value));

    // All editor CSS stays in this optional file.
    const style = document.createElement("style");

    style.textContent = `
        .dot-editor,
        .dot-editor * {
            box-sizing: border-box;
        }

        .dot-editor {
            font-family: system-ui, sans-serif;
            color: #eee;
        }

        .dot-editor [hidden] {
            display: none !important;
        }

        .dot-editor-panel {
            position: fixed;
            inset: 0 0 0 auto;
            width: min(340px, 100vw);
            z-index: 1001;
            display: flex;
            flex-direction: column;
            background: rgba(18, 20, 25, .96);
            border-left: 1px solid #343840;
            box-shadow: -8px 0 30px #0006;
            transform: translateX(100%);
            transition: transform 220ms ease;
        }

        .dot-editor-panel.open {
            transform: translateX(0);
        }

        .dot-editor-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px;
            border-bottom: 1px solid #343840;
        }

        .dot-editor-header strong {
            font-size: 15px;
        }

        .dot-editor-body {
            flex: 1;
            overflow-y: auto;
            padding: 0 16px 20px;
        }

        .dot-editor fieldset {
            min-width: 0;
            margin: 18px 0 0;
            padding: 12px;
            border: 1px solid #343840;
            border-radius: 8px;
        }

        .dot-editor legend {
            padding: 0 6px;
            color: #aeb8ca;
            font-size: 12px;
            font-weight: 600;
        }

        .dot-editor-control {
            display: grid;
            grid-template-columns: 1fr 90px;
            gap: 8px;
            align-items: center;
            margin-bottom: 12px;
            font-size: 12px;
        }

        .dot-editor-control:last-child {
            margin-bottom: 0;
        }

        .dot-editor input[type="range"] {
            grid-column: 1 / -1;
            width: 100%;
            margin: 0;
            accent-color: #80baff;
        }

        .dot-editor input[type="number"] {
            width: 90px;
            padding: 5px 7px;
            color: #fff;
            background: #090b10;
            border: 1px solid #454b57;
            border-radius: 5px;
        }

        .dot-editor input[type="checkbox"] {
            justify-self: end;
            accent-color: #80baff;
        }

        .dot-editor-colors {
            grid-column: 1 / -1;
            display: flex;
            gap: 8px;
            align-items: center;
        }

        .dot-editor input[type="color"] {
            width: 42px;
            height: 30px;
            padding: 2px;
            border: 1px solid #454b57;
            background: transparent;
            border-radius: 5px;
        }

        .dot-editor-rgb {
            display: flex;
            gap: 6px;
            flex: 1;
        }

        .dot-editor-rgb input[type="number"] {
            width: 100%;
            min-width: 0;
        }

        .dot-editor button {
            padding: 8px 11px;
            color: #eee;
            background: #272d38;
            border: 1px solid #454b57;
            border-radius: 6px;
            cursor: pointer;
            font: 12px system-ui, sans-serif;
        }

        .dot-editor button:hover {
            background: #384253;
        }

        .dot-editor button:focus-visible,
        .dot-editor input:focus-visible,
        .dot-editor textarea:focus-visible {
            outline: 2px solid #80baff;
            outline-offset: 2px;
        }

        .dot-editor-launcher {
            position: fixed;
            top: 16px;
            right: 16px;
            z-index: 1000;
        }

        .dot-editor-actions {
            display: flex;
            gap: 8px;
            margin-top: 18px;
        }

        .dot-editor textarea {
            width: 100%;
            height: 300px;
            margin-top: 12px;
            padding: 10px;
            resize: vertical;
            border: 1px solid #454b57;
            border-radius: 6px;
            background: #090b10;
            color: #bce0ff;
            font: 11px/1.5 monospace;
            white-space: pre;
        }

        .dot-editor-status {
            min-height: 18px;
            margin-top: 8px;
            color: #a8d6ad;
            font-size: 11px;
        }

        .dot-editor-hint {
            color: #aeb8ca;
            font-size: 11px;
            line-height: 1.5;
        }

        @media (prefers-reduced-motion: reduce) {
            .dot-editor-panel {
                transition: none;
            }
        }
    `;

    document.head.appendChild(style);

    const root = document.createElement("div");
    root.className = "dot-editor";
    root.setAttribute("data-background-editor", "");

    root.innerHTML = `
        <button class="dot-editor-launcher" type="button"
                aria-expanded="false">
            Settings
        </button>

        <aside class="dot-editor-panel"
               aria-label="Background settings" inert>
            <div class="dot-editor-header">
                <strong>Dot background</strong>
                <button class="dot-editor-close" type="button">
                    Retract →
                </button>
            </div>

            <div class="dot-editor-body">
                <div class="dot-editor-controls"></div>

                <div class="dot-editor-actions">
                    <button class="dot-editor-show" type="button"
                            aria-expanded="false">
                        Show code
                    </button>
                    <button class="dot-editor-copy" type="button">
                        Copy config
                    </button>
                </div>

                <textarea readonly spellcheck="false" hidden
                    aria-label="Current configuration code"></textarea>

                <div class="dot-editor-status" role="status"></div>

                <p class="dot-editor-hint">
                    RGB fields are ordered R, G, B.
                    Replace the const config block in your page
                    with the copied code.
                    Disabling the pane hides its controls immediately.
                    After reloading, the editor will not be imported.
                </p>
            </div>
        </aside>
    `;

    document.body.appendChild(root);

    const find = selector => root.querySelector(selector);

    const panel = find(".dot-editor-panel");
    const launcher = find(".dot-editor-launcher");
    const close = find(".dot-editor-close");
    const controls = find(".dot-editor-controls");
    const show = find(".dot-editor-show");
    const copy = find(".dot-editor-copy");
    const code = find("textarea");
    const status = find(".dot-editor-status");

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
        ["Grid", [
            ["spacing", "Spacing", 6, 80, 1],
            ["minRadius", "Minimum radius", 0, 8, 0.05],
            ["maxRadius", "Maximum radius", 0, 16, 0.1]
        ]],

        ["Blobs", [
            ["blobCount", "Blob count", 0, 20, 1],
            ["blobRadius", "Blob radius", 10, 600, 1],
            ["speed", "Animation speed", 0, 2, 0.01],
            ["blobColor", "Blob color", "color"]
        ]],

        ["Mouse", [
            ["mouseStrength", "Strength", 0, 5, 0.05],
            ["mouseRadius", "Influence radius", 10, 400, 1],
            ["mouseColor", "Mouse color", "color"]
        ]],

        ["Glow", [
            ["glow.enabled", "Enabled", "boolean"],
            ["glow.intensity", "Intensity", 0, 1, 0.01],
            ["glow.blur", "Blur", 0, 40, 1],
            ["glow.radius", "Radius multiplier", 0, 3, 0.05]
        ]],

        ["Perspective", [
            ["gridTilt", "Grid rotation Z", -180, 180, 1],
            ["perspectiveTiltX", "Plane tilt X", -75, 75, 1],
            ["perspectiveTiltY", "Plane tilt Y", -75, 75, 1],
            ["perspective", "Camera distance", 300, 3000, 10]
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
            const id = `dot-editor-control-${controlIndex++}`;

            row.className = "dot-editor-control";
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

                wrapper.className = "dot-editor-colors";
                rgbWrapper.className = "dot-editor-rgb";

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

    // Optional cleanup for applications that remove the background.
    return {
        destroy() {
            document.removeEventListener("keydown", onKeydown);
            root.remove();
            style.remove();
        }
    };
}