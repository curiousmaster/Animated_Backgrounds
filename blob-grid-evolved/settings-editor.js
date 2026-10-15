
"use strict";

export function mountEditor({config,onChange=()=>{}}) {
    const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

    const root=document.createElement("div");
    root.className="dot-editor";
    root.setAttribute("data-background-editor","");

    root.innerHTML=`
        <button class="dot-editor-launcher"
                type="button" aria-expanded="false">
            Settings
        </button>

        <aside class="dot-editor-panel"
               aria-label="Background settings" inert>
            <div class="dot-editor-header">
                <strong>Electric Grid Background</strong>
                <button class="dot-editor-close"
                        type="button">Retract →</button>
            </div>

            <div class="dot-editor-body">
                <div class="dot-editor-controls"></div>

                <div class="dot-editor-actions">
                    <button class="dot-editor-show"
                            type="button">Show code</button>
                    <button class="dot-editor-copy"
                            type="button">Copy config</button>
                </div>

                <textarea readonly spellcheck="false"
                          hidden></textarea>

                <div class="dot-editor-status"
                     role="status"></div>

                <p class="dot-editor-hint">
                    Hover over a setting for its description.
                    All settings update the background live.
                    Copy config to preserve your settings.
                </p>
            </div>
        </aside>
    `;

    document.body.appendChild(root);

    const find=s=>root.querySelector(s);

    const panel=find(".dot-editor-panel");
    const launcher=find(".dot-editor-launcher");
    const close=find(".dot-editor-close");
    const controls=find(".dot-editor-controls");
    const show=find(".dot-editor-show");
    const copy=find(".dot-editor-copy");
    const code=find("textarea");
    const status=find(".dot-editor-status");

    const tooltip=document.createElement("div");
    tooltip.className="dot-editor-tooltip";
    tooltip.setAttribute("role","tooltip");
    root.appendChild(tooltip);

    function getValue(path) {
        return path.split(".").reduce(
            (obj,key)=>obj[key],config
        );
    }

    function setValue(path,value) {
        const keys=path.split(".");
        const last=keys.pop();

        const object=keys.reduce(
            (obj,key)=>obj[key],config
        );

        object[last]=value;
    }

    function getCode() {
        return "const config = "+
            JSON.stringify(config,null,4)+";";
    }

    function refreshCode() {
        code.value=getCode();
        status.textContent="";
    }

    function changed(path) {
        onChange(path);
        refreshCode();

        if (path==="panel.enabled") {
            if (!config.panel.enabled) setOpen(false);
            root.hidden=!config.panel.enabled;
        }
    }

    function setOpen(open) {
        open=Boolean(open&&config.panel.enabled);

        panel.classList.toggle("open",open);
        panel.inert=!open;

        launcher.hidden=open||!config.panel.enabled;
        launcher.setAttribute(
            "aria-expanded",String(open)
        );

        hideTooltip();

        if (open) close.focus();
        else if (config.panel.enabled) launcher.focus();
    }

    function setCodeVisible(visible) {
        code.hidden=!visible;
        show.textContent=visible?"Hide code":"Show code";
    }

    function hideTooltip() {
        tooltip.style.visibility="hidden";
    }

    function showTooltip(row,description) {
        if (!description) return;

        tooltip.textContent=description;
        tooltip.style.visibility="visible";

        const rect=row.getBoundingClientRect();
        const tooltipWidth=245;
        const gap=12;

        let left=rect.left-tooltipWidth-gap;
        let top=rect.top;

        if (left<8) {
            left=Math.max(8,rect.left);
            top=rect.bottom+8;
        }

        const tooltipHeight=tooltip.offsetHeight;

        top=clamp(
            top,8,
            Math.max(8,window.innerHeight-tooltipHeight-8)
        );

        tooltip.style.left=left+"px";
        tooltip.style.top=top+"px";
    }

    launcher.addEventListener("click",()=>setOpen(true));
    close.addEventListener("click",()=>setOpen(false));

    function onKeydown(event) {
        if (
            event.key==="Escape" &&
            panel.classList.contains("open")
        ) setOpen(false);
    }

    document.addEventListener("keydown",onKeydown);

    show.addEventListener("click",()=>{
        refreshCode();
        setCodeVisible(code.hidden);
    });

    copy.addEventListener("click",async()=>{
        refreshCode();

        try {
            await navigator.clipboard.writeText(getCode());
            status.textContent="Configuration copied.";
        } catch {
            setCodeVisible(true);
            code.focus();
            code.select();
            status.textContent=
                "Code selected. Press Ctrl+C to copy.";
        }
    });

    // ==================================================
    // SETTINGS DEFINITIONS
    // ==================================================
    //
    // Each field:
    // [path,label,min,max,step,description]
    //
    // Boolean:
    // [path,label,"boolean",description]
    //
    // Color:
    // [path,label,"color",description]
    //
    // ==================================================

    const groups=[
        {
            title:"Grid",
            fields:[
                ["spacing","Spacing",6,80,1,
                    "Distance between grid dots. Lower values create a denser grid."],
                ["minRadius","Minimum radius",0,8,0.05,
                    "Dot radius when there is little or no energy influence."],
                ["maxRadius","Maximum radius",0,16,0.1,
                    "Maximum base dot radius in strongly energized areas."]
            ]
        },
        {
            title:"Blobs",
            fields:[
                ["blobCount","Blob count",0,20,1,
                    "Number of independently moving energy blobs."],
                ["blobRadius","Blob radius",10,600,1,
                    "Radius of influence around each blob."],
                ["speed","Animation speed",0,2,0.01,
                    "Controls the movement speed of blobs and animated grid distortion."],
                ["blobColor","Blob color","color",
                    "Color applied to dots influenced by moving blobs."]
            ]
        },
        {
            title:"Mouse",
            fields:[
                ["mouseStrength","Strength",0,5,0.05,
                    "Strength of the mouse influence on nearby dots and blobs."],
                ["mouseRadius","Influence radius",10,400,1,
                    "Distance over which the mouse changes dot size and color."],
                ["mouseColor","Mouse color","color",
                    "Color of dots influenced by the mouse."]
            ]
        },
        {
            title:"Glow",
            fields:[
                ["glow.enabled","Enabled","boolean",
                    "Enable soft shader-generated glow around dots."],
                ["glow.intensity","Intensity",0,1,0.01,
                    "Overall brightness of the dot glow."],
                ["glow.blur","Blur",0,40,1,
                    "Softness and spread of the dot glow."],
                ["glow.radius","Radius multiplier",0,3,0.05,
                    "Multiplier for the glowing area surrounding each dot."]
            ]
        },
        {
            title:"Perspective",
            fields:[
                ["gridTilt","Grid rotation Z",-180,180,1,
                    "Rotates the entire grid in the screen plane."],
                ["perspectiveTiltX","Plane tilt X",-75,75,1,
                    "Tilts the grid backward or forward in 3D."],
                ["perspectiveTiltY","Plane tilt Y",-75,75,1,
                    "Tilts the grid horizontally in 3D."],
                ["perspective","Camera distance",300,3000,10,
                    "Perspective focal distance. Higher values flatten the appearance."]
            ]
        },
        {
            title:"Electricity",
            fields:[
                ["electricity.enabled","Enabled","boolean",
                    "Enable traveling electrical arcs and branching discharges."],
                ["electricity.frequency","Activity",0.01,2,0.01,
                    "How frequently new electrical arcs are generated."],
                ["electricity.maxArcs","Maximum arcs",0,60,1,
                    "Maximum number of simultaneous electrical discharges."],
                ["electricity.maxBranches","Maximum branches",0,8,1,
                    "Maximum number of smaller branches per electrical arc."],
                ["electricity.arcLength","Arc length",20,600,10,
                    "Maximum travel distance of an electrical discharge in screen pixels."],
                ["electricity.speed","Travel speed",0.1,4,0.1,
                    "Speed at which electrical arcs reveal their path."],
                ["electricity.lifetime","Lifetime",0.1,3,0.05,
                    "How long an electrical arc remains visible."],
                ["electricity.width","Line width",0.5,6,0.1,
                    "Thickness of the electrical discharge core."],
                ["electricity.glowIntensity","Glow intensity",0,2,0.05,
                    "Brightness of the electrical discharge and its surrounding halo."],
                ["electricity.color","Electricity color","color",
                    "Primary color of traveling electrical arcs."]
            ]
        },
        {
            title:"Energy pulses",
            fields:[
                ["pulses.enabled","Enabled","boolean",
                    "Enable continuous energy pulses moving through the grid."],
                ["pulses.count","Pulse count",0,100,1,
                    "Target number of simultaneous traveling pulses."],
                ["pulses.speed","Travel speed",10,500,5,
                    "Speed of pulses measured in screen pixels per second."],
                ["pulses.length","Trail length",1,20,1,
                    "Number of luminous trail segments behind each pulse."],
                ["pulses.brightness","Brightness",0,3,0.05,
                    "Brightness of the pulse core and trail."],
                ["pulses.color","Pulse color","color",
                    "Color of traveling energy pulses."]
            ]
        },
        {
            title:"Charged blobs",
            fields:[
                ["charge.enabled","Enabled","boolean",
                    "Allow blobs and the mouse to influence electrical discharge origins."],
                ["charge.blobCharge","Blob charge",0,2,0.05,
                    "Probability weighting for arcs originating near moving blobs."],
                ["charge.mouseCharge","Mouse charge",0,2,0.05,
                    "Probability weighting for arcs originating near the mouse."],
                ["charge.connectionChance","Connection chance",0,1,0.05,
                    "Chance of attempting an electrical connection between two blobs."]
            ]
        },
        {
            title:"Shockwaves",
            fields:[
                ["shockwaves.enabled","Enabled","boolean",
                    "Enable expanding rings of energy that illuminate and distort dots."],
                ["shockwaves.automatic","Automatic","boolean",
                    "Generate shockwaves periodically around moving blobs."],
                ["shockwaves.interval","Interval",0.2,30,0.2,
                    "Number of seconds between automatic shockwaves."],
                ["shockwaves.speed","Expansion speed",20,800,10,
                    "How quickly shockwaves expand outward."],
                ["shockwaves.width","Wave width",5,120,1,
                    "Thickness of the energy influence surrounding the shockwave ring."],
                ["shockwaves.strength","Strength",0,3,0.05,
                    "Controls shockwave brightness and displacement."],
                ["shockwaves.clickEnabled","Mouse click","boolean",
                    "Generate a shockwave when clicking the background."],
                ["shockwaves.color","Shockwave color","color",
                    "Color used for shockwave illumination and expanding rings."]
            ]
        },
        {
            title:"Living grid distortion",
            fields:[
                ["distortion.enabled","Enabled","boolean",
                    "Enable continuous organic movement of grid dots."],
                ["distortion.strength","Strength",0,40,0.5,
                    "Maximum displacement of dots caused by the living grid."],
                ["distortion.frequency","Wave frequency",0.001,0.05,0.001,
                    "Spatial frequency of the flowing grid distortion."],
                ["distortion.speed","Wave speed",0,4,0.05,
                    "Speed of the distortion wave animation."],
                ["distortion.energyResponse","Energy response",0,3,0.05,
                    "How strongly nearby blobs and mouse energy amplify grid movement."]
            ]
        },
        {
            title:"Electrical sparks",
            fields:[
                ["sparks.enabled","Enabled","boolean",
                    "Enable small electrical particles emitted during discharges."],
                ["sparks.count","Spark count",0,60,1,
                    "Number of sparks generated per electrical event."],
                ["sparks.speed","Initial speed",10,400,5,
                    "Initial outward velocity of electrical sparks."],
                ["sparks.lifetime","Lifetime",0.1,3,0.05,
                    "How long sparks remain visible before fading."],
                ["sparks.size","Spark size",0.5,8,0.1,
                    "Thickness of the luminous spark trails."],
                ["sparks.color","Spark color","color",
                    "Color of emitted electrical sparks."]
            ]
        },
        {
            title:"Settings pane",
            fields:[
                ["panel.enabled","Enable pane","boolean",
                    "Enable or disable the configuration editor. Reloading with this disabled prevents the editor from loading."]
            ]
        }
    ];

    // ==================================================
    // COLOR CONVERSION
    // ==================================================

    function toHex(color) {
        return "#"+color.map(v=>
            Math.round(clamp(v,0,255))
                .toString(16)
                .padStart(2,"0")
        ).join("");
    }

    function fromHex(hex) {
        return [1,3,5].map(i=>
            parseInt(hex.slice(i,i+2),16)
        );
    }

    // ==================================================
    // CONTROL GENERATION
    // ==================================================

    let controlIndex=0;

    for (const group of groups) {
        const fieldset=document.createElement("fieldset");
        const legend=document.createElement("legend");

        legend.textContent=group.title;
        fieldset.appendChild(legend);

        const toggle=document.createElement("button");
        toggle.type="button";
        toggle.className="dot-editor-section-toggle";
        toggle.setAttribute("aria-expanded","false");

        const title=document.createElement("span");
        title.textContent=group.title;

        const arrow=document.createElement("span");
        arrow.textContent="+";

        toggle.append(title,arrow);

        const content=document.createElement("div");
        content.hidden=true;

        toggle.addEventListener("click",()=>{
            const expanded=content.hidden;
            content.hidden=!expanded;
            toggle.setAttribute(
                "aria-expanded",String(expanded)
            );
            arrow.textContent=expanded?"−":"+";
            hideTooltip();
        });

        fieldset.appendChild(toggle);
        fieldset.appendChild(content);

        for (const field of group.fields) {
            const [path,labelText,typeOrMin]=field;

            const description=
                typeOrMin==="boolean"||typeOrMin==="color"
                    ? field[3]
                    : field[5];

            const row=document.createElement("div");
            row.className="dot-editor-control";

            const label=document.createElement("label");
            const id=`dot-editor-${controlIndex++}`;

            label.textContent=labelText;
            label.htmlFor=id;
            row.appendChild(label);

            row.addEventListener("mouseenter",()=>{
                showTooltip(row,description);
            });

            row.addEventListener("mouseleave",hideTooltip);

            // ------------------------------------------
            // Boolean
            // ------------------------------------------

            if (typeOrMin==="boolean") {
                const input=document.createElement("input");
                input.id=id;
                input.type="checkbox";
                input.checked=getValue(path);

                input.addEventListener("change",()=>{
                    setValue(path,input.checked);
                    changed(path);
                });

                row.appendChild(input);

            // ------------------------------------------
            // RGB color
            // ------------------------------------------

            } else if (typeOrMin==="color") {
                const wrapper=document.createElement("div");
                wrapper.className="dot-editor-colors";

                const picker=document.createElement("input");
                picker.id=id;
                picker.type="color";
                picker.value=toHex(getValue(path));

                const rgbWrapper=document.createElement("div");
                rgbWrapper.className="dot-editor-rgb";

                const inputs=["R","G","B"].map(
                    (channel,index)=>{
                        const input=document.createElement("input");

                        input.type="number";
                        input.min=0;
                        input.max=255;
                        input.step=1;
                        input.value=getValue(path)[index];

                        input.setAttribute(
                            "aria-label",`${labelText} ${channel}`
                        );

                        input.addEventListener("input",()=>{
                            const value=input.valueAsNumber;

                            if (!Number.isFinite(value)) return;

                            const color=[...getValue(path)];

                            color[index]=Math.round(
                                clamp(value,0,255)
                            );

                            setValue(path,color);
                            picker.value=toHex(color);
                            changed(path);
                        });

                        input.addEventListener("change",()=>{
                            input.value=getValue(path)[index];
                        });

                        rgbWrapper.appendChild(input);
                        return input;
                    }
                );

                picker.addEventListener("input",()=>{
                    const color=fromHex(picker.value);
                    setValue(path,color);

                    inputs.forEach((input,index)=>{
                        input.value=color[index];
                    });

                    changed(path);
                });

                wrapper.append(picker,rgbWrapper);
                row.appendChild(wrapper);

            // ------------------------------------------
            // Numeric slider and input
            // ------------------------------------------

            } else {
                const [, ,min,max,step]=field;

                const number=document.createElement("input");
                number.id=id;
                number.type="number";

                const range=document.createElement("input");
                range.type="range";
                range.setAttribute("aria-label",labelText);

                for (const input of [number,range]) {
                    input.min=min;
                    input.max=max;
                    input.step=step;
                    input.value=getValue(path);
                }

                function update(source,target) {
                    let value=source.valueAsNumber;

                    if (!Number.isFinite(value)) return;

                    value=clamp(value,min,max);

                    if (step===1) value=Math.round(value);

                    setValue(path,value);
                    target.value=value;
                    changed(path);
                }

                number.addEventListener("input",()=>{
                    update(number,range);
                });

                number.addEventListener("change",()=>{
                    number.value=getValue(path);
                });

                range.addEventListener("input",()=>{
                    update(range,number);
                });

                row.append(number,range);
            }

            content.appendChild(row);
        }

        controls.appendChild(fieldset);
    }

    // ==================================================
    // INITIALIZATION
    // ==================================================

    refreshCode();
    root.hidden=!config.panel.enabled;

    return {
        destroy() {
            document.removeEventListener(
                "keydown",onKeydown
            );
            root.remove();
        }
    };
}
