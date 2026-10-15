
/* Plasma Reactor settings editor. Plain script: works with file:// in Edge. */
(function () {
  'use strict';

  const SECTIONS = [
    ['reactor', 'Magnetic Reactor', [
      ['radius', 'Containment radius', 0.6, 1.7, 0.01, 'Size of the plasma sphere and magnetic containment shell.'],
      ['energy', 'Reactor energy', 0.1, 3, 0.05, 'Increases plasma brightness and field intensity.'],
      ['spin', 'Plasma rotation', -2, 2, 0.01, 'Controls the angular movement of the plasma turbulence.'],
      ['pulse', 'Energy pulse', 0, 2, 0.01, 'Controls rhythmic changes in plasma brightness.'],
      ['instability', 'Instability', 0, 2, 0.01, 'Distorts the plasma and electrical discharge paths.'],
      ['fieldLines', 'Magnetic field lines', 0, 24, 1, 'Number of magnetic containment rings.'],
      ['arcs', 'Electric arcs', 0, 18, 1, 'Number of animated electrical discharge paths.'],
      ['arcIntensity', 'Arc intensity', 0, 4, 0.05, 'Brightness of the electric discharges.']
    ]],
    ['plasma', 'Plasma Surface', [
      ['turbulence', 'Turbulence', 0.1, 4, 0.05, 'Scale and complexity of the moving plasma noise.'],
      ['detail', 'Noise detail', 1, 6, 1, 'Number of procedural noise octaves. Higher values cost more GPU time.'],
      ['filaments', 'Plasma filaments', 1, 24, 1, 'Number of twisting luminous strands inside the plasma.'],
      ['glow', 'Halo strength', 0, 4, 0.05, 'Controls the broad glow surrounding the reactor.'],
      ['coreBrightness', 'Core brightness', 0, 3, 0.05, 'Brightness of the volumetric plasma emission.']
    ]],
    ['camera', 'Camera', [
      ['zoom', 'Camera distance', 2.5, 8, 0.05, 'Distance from the camera to the reactor. Smaller values zoom in.'],
      ['orbitSpeed', 'Automatic orbit', -1.5, 1.5, 0.01, 'Speed of the camera orbit around the reactor.'],
      ['tilt', 'Camera tilt', -1.2, 1.2, 0.01, 'Vertical angle of the camera.'],
      ['mouseOrbit', 'Mouse-controlled orbit', null, null, null, 'Enable camera steering using the mouse pointer.'],
      ['mouseStrength', 'Mouse sensitivity', 0, 2, 0.05, 'How much the mouse moves the viewing angle.']
    ]],
    ['colors', 'Color Palette', [
      ['core', 'Core color', null, null, null, 'Color of the hottest plasma regions.'],
      ['outer', 'Outer plasma', null, null, null, 'Color of the outer magnetic glow and cooler plasma.'],
      ['electric', 'Electric arcs', null, null, null, 'Color of the electrical discharges.'],
      ['background', 'Background', null, null, null, 'Background color of the scene.']
    ]],
    ['cinematic', 'Cinematic Rendering', [
      ['exposure', 'Exposure', 0.2, 3, 0.05, 'Overall brightness after tone mapping.'],
      ['vignette', 'Vignette', 0, 1, 0.01, 'Darkens the corners of the image.'],
      ['grain', 'Film grain', 0, 0.15, 0.005, 'Amount of subtle animated image noise.'],
      ['quality', 'Render resolution', 0.5, 1.5, 0.1, 'Scales the canvas rendering resolution. Lower values improve performance.']
    ]],
    ['animation', 'Animation', [
      ['speed', 'Animation speed', 0, 3, 0.05, 'Multiplier for the reactor animation clock.'],
      ['paused', 'Pause animation', null, null, null, 'Freezes the simulation clock without disabling rendering.']
    ]]
  ];

  function createSettingsEditor({config, defaults, onChange = () => {}, onReset = () => {}}) {
    const root = document.createElement('div');
    root.className = 'editor';
    root.setAttribute('data-background-editor', '');
    root.innerHTML = `
      <button class="editor-toggle" type="button" aria-expanded="false">Settings</button>
      <aside class="editor-panel" aria-label="Plasma Reactor settings">
        <div class="editor-head"><h2>Plasma Reactor</h2><button type="button" data-action="close">Close</button></div>
        <p class="editor-intro">Live WebGL2 controls. Hover over a setting to see its explanation.</p>
        <div class="editor-sections"></div>
        <div class="editor-actions">
          <button type="button" data-action="expand">Expand all</button>
          <button type="button" data-action="collapse">Collapse all</button>
          <button type="button" data-action="reset">Reset</button>
        </div>
        <div class="editor-actions">
          <button type="button" data-action="export">Export JSON</button>
          <button type="button" data-action="import">Import JSON</button>
        </div>
        <textarea class="editor-json" spellcheck="false" aria-label="JSON configuration" placeholder="Configuration JSON appears here"></textarea>
        <p class="editor-msg" role="status"></p>
      </aside>
      <div class="editor-tip" hidden></div>`;
    document.body.appendChild(root);

    const toggle = root.querySelector('.editor-toggle');
    const panel = root.querySelector('.editor-panel');
    const tip = root.querySelector('.editor-tip');
    const sections = root.querySelector('.editor-sections');
    const textarea = root.querySelector('.editor-json');
    const message = root.querySelector('.editor-msg');
    const controls = new Map();
    const storageKey = 'plasma-reactor-sections-v1';
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch (_) {}

    function notify(text) {
      message.textContent = text;
    }

    function setOpen(open) {
      panel.classList.toggle('open', open);
      toggle.hidden = open;
      toggle.setAttribute('aria-expanded', String(open));
      if (!open) tip.hidden = true;
    }

    function showTip(control, title, description) {
      if (!panel.classList.contains('open')) return;
      const bounds = control.getBoundingClientRect();
      if (window.innerWidth < 700 || bounds.left < 280) return;
      tip.innerHTML = '';
      const heading = document.createElement('strong');
      heading.textContent = title;
      const text = document.createElement('div');
      text.textContent = description;
      tip.append(heading, text);
      tip.hidden = false;
      tip.style.right = `${window.innerWidth - bounds.left + 14}px`;
      tip.style.top = `${Math.max(12, Math.min(bounds.top, window.innerHeight - 140))}px`;
    }

    function hideTip() { tip.hidden = true; }

    function updateInputs() {
      for (const [path, {input, output}] of controls) {
        const [section, key] = path.split('.');
        const value = config[section][key];
        if (input.type === 'checkbox') input.checked = Boolean(value);
        else input.value = value;
        if (output) output.textContent = String(value);
      }
    }

    function applyConfig(source) {
      if (!source || typeof source !== 'object') throw Error('Expected a JSON object.');
      for (const [section, , entries] of SECTIONS) {
        if (!source[section] || typeof source[section] !== 'object') continue;
        for (const [key, , min, max] of entries) {
          if (!Object.prototype.hasOwnProperty.call(source[section], key)) continue;
          const original = defaults[section][key];
          const value = source[section][key];
          if (typeof original === 'boolean') {
            if (typeof value !== 'boolean') throw Error(`Invalid boolean: ${section}.${key}`);
            config[section][key] = value;
          } else if (typeof original === 'string') {
            if (!/^#[0-9a-fA-F]{6}$/.test(value)) throw Error(`Invalid color: ${section}.${key}`);
            config[section][key] = value;
          } else {
            if (typeof value !== 'number' || !Number.isFinite(value)) throw Error(`Invalid number: ${section}.${key}`);
            config[section][key] = Math.max(min, Math.min(max, value));
          }
        }
      }
      updateInputs();
      onChange();
    }

    for (const [sectionKey, sectionName, entries] of SECTIONS) {
      const details = document.createElement('details');
      details.className = 'editor-section';
      details.open = saved[sectionKey] ?? (sectionKey === 'reactor');
      const summary = document.createElement('summary');
      summary.textContent = sectionName;
      const body = document.createElement('div');
      body.className = 'editor-section-body';
      details.append(summary, body);
      details.addEventListener('toggle', () => {
        saved[sectionKey] = details.open;
        try { localStorage.setItem(storageKey, JSON.stringify(saved)); } catch (_) {}
        hideTip();
      });
      sections.appendChild(details);

      for (const [key, title, min, max, step, help] of entries) {
        const value = config[sectionKey][key];
        const wrapper = document.createElement('div');
        wrapper.className = 'editor-control';
        const row = document.createElement('div');
        row.className = 'editor-row';
        const label = document.createElement('label');
        label.textContent = title;
        const id = `reactor-${sectionKey}-${key}`;
        label.htmlFor = id;
        const input = document.createElement('input');
        input.id = id;
        let output = null;

        if (typeof value === 'boolean') {
          input.type = 'checkbox';
          input.checked = value;
        } else if (typeof value === 'string') {
          input.type = 'color';
          input.value = value;
        } else {
          input.type = 'range';
          input.min = String(min);
          input.max = String(max);
          input.step = String(step);
          input.value = String(value);
          output = document.createElement('output');
          output.htmlFor = id;
          output.textContent = String(value);
        }

        input.addEventListener('input', () => {
          config[sectionKey][key] = input.type === 'checkbox'
            ? input.checked : input.type === 'range' ? Number(input.value) : input.value;
          if (output) output.textContent = input.value;
          onChange();
        });
        row.append(label, input);
        if (output) row.appendChild(output);
        wrapper.appendChild(row);
        wrapper.addEventListener('mouseenter', () => showTip(wrapper, title, help));
        wrapper.addEventListener('mouseleave', hideTip);
        wrapper.addEventListener('focusin', () => showTip(wrapper, title, help));
        wrapper.addEventListener('focusout', hideTip);
        body.appendChild(wrapper);
        controls.set(`${sectionKey}.${key}`, {input, output});
      }
    }

    toggle.addEventListener('click', () => setOpen(true));
    root.querySelector('[data-action="close"]').addEventListener('click', () => setOpen(false));
    root.querySelector('[data-action="expand"]').addEventListener('click', () => {
      sections.querySelectorAll('details').forEach(d => d.open = true);
    });
    root.querySelector('[data-action="collapse"]').addEventListener('click', () => {
      sections.querySelectorAll('details').forEach(d => d.open = false);
    });
    root.querySelector('[data-action="reset"]').addEventListener('click', () => {
      applyConfig(defaults);
      onReset();
      notify('Default settings restored.');
    });
    root.querySelector('[data-action="export"]').addEventListener('click', () => {
      textarea.value = JSON.stringify(config, null, 2);
      textarea.focus();
      textarea.select();
      notify('JSON ready to copy.');
    });
    root.querySelector('[data-action="import"]').addEventListener('click', () => {
      try {
        applyConfig(JSON.parse(textarea.value));
        notify('Configuration imported.');
      } catch (error) {
        notify(`Import failed: ${error.message}`);
      }
    });
    addEventListener('keydown', event => {
      if (event.key === 'Escape' && panel.classList.contains('open')) setOpen(false);
    });
    return {root, refresh: updateInputs, close: () => setOpen(false)};
  }

  window.createSettingsEditor = createSettingsEditor;
})();
