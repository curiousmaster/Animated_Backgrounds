
"use strict";

export function mountEditor({
    config,
    onChange = () => {},
    onReset = () => {}
}) {
    const clamp = (v, min, max) =>
        Math.max(min, Math.min(max, v));

    // ========================================================
    // EDITOR HTML
    // ========================================================

    const root = document.createElement("div");

    root.className = "mag-editor";
    root.setAttribute("data-background-editor", "");

    root.innerHTML = `
        <button class="mag-launcher" type="button"
                aria-expanded="false">
            Settings
        </button>

        <aside class="mag-panel"
               aria-label="Magnetic particle settings"
               inert>

            <div class="mag-header">
                <strong>Magnetic Particles — WebGL2</strong>

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
                    aria-label="Current configuration code">
                </textarea>

                <div class="mag-status" role="status"></div>

                <p class="mag-hint">
                    All settings update immediately.
                    Particle rendering uses WebGL2.
                    Physics runs in JavaScript.
                </p>

                <p class="mag-hint">
                    Hover over a setting to see its description.
                    Click section headings to expand or collapse.
                </p>

                <p class="mag-hint">
                    Copy the configuration into index.html
                    to make your settings permanent.
                </p>
            </div>
        </aside>

        <div class="mag-tooltip" role="tooltip"></div>
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
    const tooltip = find(".mag-tooltip");

    // ========================================================
    // CONFIGURATION ACCESS
    // ========================================================

    function getValue(path) {
        return path.split(".").reduce(
            (object, key) => object[key],
            config
        );
    }

    function setValue(path, value) {
        const keys = path.split(".");
        const last = keys.pop();

        const object = keys.reduce(
            (current, key) => current[key],
            config
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

    // ========================================================
    // PANEL CONTROL
    // ========================================================

    function setOpen(open) {
        open = Boolean(open && config.panel.enabled);

        panel.classList.toggle("open", open);
        panel.inert = !open;

        launcher.hidden = open || !config.panel.enabled;

        launcher.setAttribute(
            "aria-expanded",
            String(open)
        );

        hideTooltip();

        if (open) {
            close.focus();
        } else if (config.panel.enabled) {
            launcher.focus();
        }
    }

    function changed(path) {
        onChange(path);
        refreshCode();

        if (path === "panel.enabled") {
            if (!config.panel.enabled) {
                setOpen(false);
            }

            root.hidden = !config.panel.enabled;
        }
    }

    function setCodeVisible(visible) {
        code.hidden = !visible;

        show.textContent = visible
            ? "Hide code"
            : "Show code";

        show.setAttribute(
            "aria-expanded",
            String(visible)
        );
    }

    launcher.addEventListener(
        "click",
        () => setOpen(true)
    );

    close.addEventListener(
        "click",
        () => setOpen(false)
    );

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

            status.textContent =
                "Configuration copied.";
        } catch {
            setCodeVisible(true);
            code.focus();
            code.select();

            status.textContent =
                "Code selected. Press Ctrl+C to copy.";
        }
    });

    reset.addEventListener("click", () => {
        onReset();
        status.textContent = "Particles reset.";
    });

    // ========================================================
    // TOOLTIP DESCRIPTIONS
    // ========================================================

    const descriptions = {
        particleCount:
            "Number of simulated particles. WebGL2 can render " +
            "large particle counts efficiently, although physics " +
            "still runs on the CPU.",

        particleRadius:
            "Radius of each particle in CSS pixels. " +
            "Larger particles produce brighter, more visible dots.",

        particleColor:
            "Base RGB color of particles outside the mouse " +
            "influence area.",

        maxSpeed:
            "Maximum particle movement speed in pixels per second.",

        friction:
            "Velocity damping. Higher values slow particles " +
            "more quickly. Zero disables drag.",

        trailLength:
            "Approximate trail persistence in seconds. " +
            "Higher values create longer motion trails. " +
            "Zero disables trails.",

        "poles.count":
            "Number of moving magnetic field poles. " +
            "Each pole influences nearby particles.",

        "poles.strength":
            "Force exerted by the magnetic poles. " +
            "Higher values accelerate particles more strongly.",

        "poles.radius":
            "Distance over which magnetic poles influence " +
            "particles. Larger values create broader fields.",

        "poles.orbitSpeed":
            "Speed of magnetic pole movement. Negative values " +
            "reverse their orbital direction.",

        "poles.swirl":
            "Tangential magnetic force that causes particles " +
            "to circulate around poles.",

        "poles.show":
            "Display the positions of the magnetic poles " +
            "as small glowing white markers.",

        "mouse.enabled":
            "Enable or disable mouse interaction with particles.",

        "mouse.mode":
            "Attract pulls particles toward the pointer. " +
            "Repel pushes particles away.",

        "mouse.strength":
            "Strength of the mouse attraction or repulsion force.",

        "mouse.radius":
            "Radius of the mouse influence field. " +
            "Larger values affect more particles.",

        "mouse.color":
            "RGB color used when particles enter the mouse " +
            "influence field.",

        "glow.enabled":
            "Enable the GPU-generated soft glow around particles.",

        "glow.intensity":
            "Brightness of the glow surrounding each particle.",

        "glow.blur":
            "Approximate size of the particle glow in pixels. " +
            "Larger values create wider luminous halos.",

        "panel.enabled":
            "Enable or disable the settings editor. " +
            "When disabled, the editor is hidden."
    };

    function showTooltip(row, description) {
        if (!description) return;

        tooltip.textContent = description;
        tooltip.classList.add("visible");

        const rect = row.getBoundingClientRect();
        const tooltipWidth = 245;
        const margin = 14;

        let left = rect.left - tooltipWidth - margin;

        if (left < 8) {
            left = rect.right + margin;
        }

        left = clamp(
            left,
            8,
            window.innerWidth - tooltipWidth - 8
        );

        const tooltipHeight = tooltip.offsetHeight;

        const top = clamp(
            rect.top,
            8,
            Math.max(
                8,
                window.innerHeight - tooltipHeight - 8
            )
        );

        tooltip.style.left = left + "px";
        tooltip.style.top = top + "px";
    }

    function hideTooltip() {
        tooltip.classList.remove("visible");
    }

    // ========================================================
    // SETTINGS DEFINITIONS
    // ========================================================

    const groups = [
        ["Particles", [
            ["particleCount", "Particle count", 0, 20000, 1],
            ["particleRadius", "Particle radius", 0.2, 10, 0.1],
            ["particleColor", "Particle color", "color"],
            ["maxSpeed", "Maximum speed", 0, 1000, 1],
            ["friction", "Friction", 0, 5, 0.05],
            ["trailLength", "Trail length", 0, 5, 0.05]
        ]],

        ["Magnetic poles", [
            ["poles.count", "Pole count", 0, 20, 1],
            ["poles.strength", "Strength", 0, 2000, 1],
            ["poles.radius", "Influence radius", 20, 1200, 1],
            ["poles.orbitSpeed", "Movement speed", -2, 2, 0.01],
            ["poles.swirl", "Swirl", 0, 8, 0.05],
            ["poles.show", "Show pole positions", "boolean"]
        ]],

        ["Mouse", [
            ["mouse.enabled", "Enabled", "boolean"],
            ["mouse.mode", "Mode", "select", ["attract", "repel"]],
            ["mouse.strength", "Strength", 0, 3000, 1],
            ["mouse.radius", "Influence radius", 20, 1000, 1],
            ["mouse.color", "Mouse color", "color"]
        ]],

        ["Glow", [
            ["glow.enabled", "Enabled", "boolean"],
            ["glow.intensity", "Intensity", 0, 1, 0.01],
            ["glow.blur", "Blur", 0, 50, 1]
        ]],

        ["Settings pane", [
            ["panel.enabled", "Enable pane", "boolean"]
        ]]
    ];

    // ========================================================
    // COLOR UTILITIES
    // ========================================================

    function toHex(color) {
        return "#" + color.map(value =>
            Math.round(clamp(value, 0, 255))
                .toString(16)
                .padStart(2, "0")
        ).join("");
    }

    function fromHex(hex) {
        return [1, 3, 5].map(index =>
            parseInt(
                hex.slice(index, index + 2),
                16
            )
        );
    }

    // ========================================================
    // GENERATE SETTINGS CONTROLS
    // ========================================================

    let controlIndex = 0;

    for (const [title, fields] of groups) {
        const section = document.createElement("details");
        const summary = document.createElement("summary");
        const body = document.createElement("div");

        section.className = "mag-section";
        section.open = true;

        summary.textContent = title;
        body.className = "mag-section-body";

        section.append(summary, body);

        for (
            const [path, labelText, typeOrMin, max, step]
            of fields
        ) {
            const row = document.createElement("div");
            const label = document.createElement("label");
            const id = `mag-control-${controlIndex++}`;

            row.className = "mag-control";
            label.textContent = labelText;
            label.htmlFor = id;

            row.appendChild(label);

            // Tooltip events.
            const description = descriptions[path];

            row.addEventListener("mouseenter", () => {
                showTooltip(row, description);
            });

            row.addEventListener(
                "mouseleave",
                hideTooltip
            );

            row.addEventListener("focusin", () => {
                showTooltip(row, description);
            });

            row.addEventListener("focusout", event => {
                if (!row.contains(event.relatedTarget)) {
                    hideTooltip();
                }
            });

            // ------------------------------------------------
            // BOOLEAN
            // ------------------------------------------------

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

            // ------------------------------------------------
            // SELECT
            // ------------------------------------------------

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

            // ------------------------------------------------
            // COLOR
            // ------------------------------------------------

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
                            "aria-label",
                            `${labelText} ${channel}`
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

            // ------------------------------------------------
            // NUMERIC RANGE
            // ------------------------------------------------

            } else {
                const number = document.createElement("input");
                const range = document.createElement("input");

                number.id = id;
                number.type = "number";
                range.type = "range";

                range.setAttribute(
                    "aria-label",
                    labelText
                );

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

                number.addEventListener("input", () => {
                    update(number, range);
                });

                number.addEventListener("change", () => {
                    number.value = getValue(path);
                });

                range.addEventListener("input", () => {
                    update(range, number);
                });

                row.append(number, range);
            }

            body.appendChild(row);
        }

        controls.appendChild(section);
    }

    // ========================================================
    // INITIALIZE
    // ========================================================

    refreshCode();

    root.hidden = !config.panel.enabled;

    return {
        destroy() {
            document.removeEventListener(
                "keydown",
                onKeydown
            );

            root.remove();
        }
    };
}
