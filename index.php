
<?php
declare(strict_types=1);

/*
 * Background Gallery
 * Single-file PHP implementation.
 *
 * Requirements:
 * - PHP 8.1+
 * - PHP ZipArchive extension
 * - backgrounds.js in this directory
 * - Background directories containing index.html
 */

function downloadError(int $status, string $message): never
{
    http_response_code($status);
    header('Content-Type: text/plain; charset=UTF-8');
    header('Cache-Control: no-store');
    echo $message;
    exit;
}

/*
 * Handle ZIP downloads before sending any HTML.
 */
if (($_GET['action'] ?? '') === 'download') {

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        header('Allow: POST');
        downloadError(405, 'POST required.');
    }

    if (!class_exists(ZipArchive::class)) {
        downloadError(
            500,
            'PHP ZipArchive extension is not installed.'
        );
    }

    if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 1048576) {
        downloadError(413, 'Request is too large.');
    }

    $payload = json_decode(
        file_get_contents('php://input') ?: '',
        true
    );

    if (
        !is_array($payload) ||
        !is_string($payload['folder'] ?? null)
    ) {
        downloadError(400, 'Invalid download request.');
    }

    $folder = $payload['folder'];

    // Allow safe relative directory names.
    if (
        $folder === '' ||
        strlen($folder) > 240 ||
        !preg_match(
            '~^[a-zA-Z0-9_-]+(?:/[a-zA-Z0-9_-]+)*$~D',
            $folder
        )
    ) {
        downloadError(400, 'Invalid background folder.');
    }

    $root = realpath(__DIR__);

    $directory = realpath(
        __DIR__ . DIRECTORY_SEPARATOR .
        str_replace('/', DIRECTORY_SEPARATOR, $folder)
    );

    if (
        $root === false ||
        $directory === false ||
        !str_starts_with(
            $directory,
            $root . DIRECTORY_SEPARATOR
        ) ||
        !is_dir($directory) ||
        !is_file(
            $directory . DIRECTORY_SEPARATOR . 'index.html'
        )
    ) {
        downloadError(404, 'Background not found.');
    }

    /*
     * Only allow backgrounds declared in backgrounds.js.
     */
    $manifest = @file_get_contents(
        __DIR__ . DIRECTORY_SEPARATOR . 'backgrounds.js'
    );

    if ($manifest === false) {
        downloadError(
            500,
            'Could not read backgrounds.js.'
        );
    }

    preg_match_all(
        '~\bfolder\s*:\s*["\']([^"\']+)["\']~',
        $manifest,
        $matches
    );

    if (!in_array($folder, $matches[1], true)) {
        downloadError(
            404,
            'Background is not in the gallery.'
        );
    }

    /*
     * Receive current configuration from the iframe.
     */
    $config = $payload['config'] ?? null;

    if (
        !is_array($config) ||
        array_is_list($config)
    ) {
        downloadError(
            400,
            'Invalid background configuration.'
        );
    }

    $configJson = json_encode(
        $config,
        JSON_PRETTY_PRINT |
        JSON_UNESCAPED_SLASHES |
        JSON_UNESCAPED_UNICODE |
        JSON_HEX_TAG |
        JSON_HEX_AMP |
        JSON_HEX_APOS |
        JSON_HEX_QUOT
    );

    if ($configJson === false) {
        downloadError(
            400,
            'Unable to serialize background configuration.'
        );
    }

    /*
     * Create temporary ZIP archive.
     */
    $zipPath = tempnam(
        sys_get_temp_dir(),
        'bgzip_'
    );

    if ($zipPath === false) {
        downloadError(
            500,
            'Unable to create temporary archive.'
        );
    }

    $zip = new ZipArchive();

    if (
        $zip->open(
            $zipPath,
            ZipArchive::OVERWRITE | ZipArchive::CREATE
        ) !== true
    ) {
        @unlink($zipPath);

        downloadError(
            500,
            'Unable to open ZIP archive.'
        );
    }

    try {
        /*
         * Recursively include files and subdirectories.
         */
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator(
                $directory,
                FilesystemIterator::SKIP_DOTS
            ),
            RecursiveIteratorIterator::LEAVES_ONLY
        );

        $count = 0;
        $foundIndex = false;

        foreach ($iterator as $file) {

            if (!$file->isFile() || $file->isLink()) {
                continue;
            }

            $path = $file->getPathname();
            $real = realpath($path);

            if (
                $real === false ||
                !str_starts_with(
                    $real,
                    $directory . DIRECTORY_SEPARATOR
                )
            ) {
                continue;
            }

            $relative = str_replace(
                DIRECTORY_SEPARATOR,
                '/',
                substr(
                    $path,
                    strlen($directory) + 1
                )
            );

            $segments = explode('/', $relative);

            // Skip hidden files and directories.
            if (
                array_filter(
                    $segments,
                    static fn(string $part): bool =>
                        str_starts_with($part, '.')
                )
            ) {
                continue;
            }

            // Exclude potentially sensitive server files.
            if (
                preg_match(
                    '~\.(?:php\d*|phtml|phar|env|pem|key)$~i',
                    $relative
                )
            ) {
                continue;
            }

            if (++$count > 10000) {
                throw new RuntimeException(
                    'Too many files in background.'
                );
            }

            /*
             * Modify index.html to include current settings.
             */
            if ($relative === 'index.html') {

                $html = file_get_contents($path);

                if ($html === false) {
                    throw new RuntimeException(
                        'Unable to read background HTML.'
                    );
                }

                $pattern =
                    '/\bconst\s+config\s*=\s*\{[\s\S]*?^\s*\};/m';

                $replaced = preg_replace_callback(
                    $pattern,
                    static function (array $match) use ($configJson): string {
                        return 'const config = ' .
                            $configJson . ';';
                    },
                    $html,
                    1,
                    $replacements
                );

                if (
                    $replaced === null ||
                    $replacements !== 1
                ) {
                    throw new RuntimeException(
                        'Could not locate the background configuration block.'
                    );
                }

                if (!$zip->addFromString($relative, $replaced)) {
                    throw new RuntimeException(
                        'Unable to add background HTML to ZIP.'
                    );
                }

                $foundIndex = true;

            } else {

                if (!$zip->addFile($path, $relative)) {
                    throw new RuntimeException(
                        'Unable to add file to ZIP: ' .
                        $relative
                    );
                }
            }
        }

        if (!$foundIndex) {
            throw new RuntimeException(
                'Background index.html was not included.'
            );
        }

        if (!$zip->close()) {
            throw new RuntimeException(
                'Unable to finalize ZIP archive.'
            );
        }

    } catch (Throwable $error) {

        @$zip->close();
        @unlink($zipPath);

        downloadError(
            500,
            $error->getMessage()
        );
    }

    /*
     * Send ZIP to browser.
     */
    $name = basename($folder) . '-custom.zip';

    header('Content-Type: application/zip');

    header(
        'Content-Disposition: attachment; filename="' .
        $name . '"'
    );

    header(
        'Content-Length: ' . filesize($zipPath)
    );

    header('Cache-Control: no-store');

    readfile($zipPath);
    @unlink($zipPath);
    exit;
}

header('Content-Type: text/html; charset=UTF-8');
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta
    name="viewport"
    content="width=device-width, initial-scale=1, viewport-fit=cover"
>
<title>Background Gallery</title>

<style>
* {
    box-sizing: border-box;
}

html, body {
    margin: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #000;
    color: #fff;
    font-family: system-ui, sans-serif;
}

#background {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    border: 0;
}

.panel {
    position: fixed;
    inset:
        max(12px, env(safe-area-inset-top))
        max(12px, env(safe-area-inset-right))
        max(12px, env(safe-area-inset-bottom))
        max(12px, env(safe-area-inset-left));

    margin: auto;
    width: min(
        480px,
        calc(
            100% - 24px -
            env(safe-area-inset-left) -
            env(safe-area-inset-right)
        )
    );
    height: fit-content;
    max-height: calc(
        100dvh - 24px -
        env(safe-area-inset-top) -
        env(safe-area-inset-bottom)
    );

    padding: clamp(18px, 4vw, 32px);
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-width: thin;
    scrollbar-color: #ffffff40 transparent;

    background: rgba(0, 0, 0, 0.24);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;

    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: 20px;
    text-align: center;

    box-shadow: none;
    text-shadow: 0 2px 6px rgba(0, 0, 0, 0.9);
}

.eyebrow {
    margin: 0 0 12px;
    color: #a8c9df;
    font-size: 11px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
}

h1 {
    margin: 0 0 12px;
    font-size: clamp(26px, 5vw, 36px);
    font-weight: 600;
    letter-spacing: -0.04em;
}

.description {
    margin: 0 0 26px;
    color: rgba(255, 255, 255, 0.75);
    font-size: 14px;
    line-height: 1.65;
}

label {
    display: block;
    margin-bottom: 10px;
    text-align: left;
    font-size: 12px;
    color: #c7d5df;
}

select {
    width: 100%;
    padding: 13px 14px;
    color: #fff;
    background: rgba(5, 10, 18, 0.55);
    border: 1px solid rgba(255, 255, 255, 0.22);
    border-radius: 10px;
    font: 14px system-ui, sans-serif;
    cursor: pointer;
}

option {
    color: #fff;
    background: #111820;
}

.actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 16px;
}

button,
.open-link {
    flex: 1;
    min-height: 44px;
    padding: 11px 12px;
    color: #fff;
    background: rgba(255, 255, 255, 0.07);
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 10px;
    font: 13px system-ui, sans-serif;
    text-decoration: none;
    cursor: pointer;
    touch-action: manipulation;
}

button:hover,
.open-link:hover {
    background: rgba(255, 255, 255, 0.15);
}

button:disabled {
    cursor: wait;
    opacity: 0.65;
}

.open-link {
    display: flex;
    align-items: center;
    justify-content: center;
}

:focus-visible {
    outline: 2px solid #8acde5;
    outline-offset: 3px;
}

.hint {
    margin: 20px 0 0;
    color: rgba(255, 255, 255, 0.5);
    font-size: 11px;
    line-height: 1.6;
}

#show-panel {
    position: fixed;
    bottom: max(16px, env(safe-area-inset-bottom));
    left: 50%;
    transform: translateX(-50%);
    max-width: calc(100% - 32px);
    padding-inline: 20px;

    background: rgba(15, 20, 28, 0.6);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
}

[hidden] {
    display: none !important;
}

/* Background picker */

#background-select {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 13px 14px;
    font-size: 16px;
    text-align: left;
    gap: 12px;
    background: rgba(5, 10, 18, 0.6);
}

#selected-name {
    min-width: 0;
    overflow-wrap: anywhere;
}

#background-list {
    max-height: min(240px, 35dvh);
    overflow-y: auto;
    margin-top: 7px;
    padding: 5px;
    text-align: left;

    border: 1px solid #ffffff30;
    border-radius: 10px;
    background: rgba(8, 15, 25, 0.96);

    overscroll-behavior: contain;
    touch-action: pan-y;
    scrollbar-width: thin;
}

.background-option {
    display: flex;
    align-items: center;
    min-height: 44px;
    padding: 9px 11px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    touch-action: manipulation;
}

.background-option.active {
    background: #ffffff18;
    color: #b9e8f8;
}

.background-option[aria-selected="true"]::after {
    content: ' ✓';
    color: #9ad8c5;
    margin-left: auto;
    padding-left: 8px;
}

/* Background details */

.background-details {
    text-align: left;
    margin-top: 18px;
    padding-top: 16px;
    border-top: 1px solid #ffffff26;
}

#detail-label {
    margin: 0 0 6px;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    color: #a8c9df;
}

#detail-title {
    margin: 0 0 7px;
    font-size: 18px;
    font-weight: 600;
}

#detail-description {
    margin: 0;
    min-height: 0;
    font-size: 14px;
    line-height: 1.65;
    color: #e2e9ef;
}

/* Download controls */

.download-option {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    margin: 8px 0 0;
    font-size: 12px;
    cursor: pointer;
}

.download-option input {
    flex: 0 0 auto;
    width: 18px;
    height: 18px;
    margin: 0;
    accent-color: #8acde5;
}

#download-status {
    overflow-wrap: anywhere;
}

#download-status:empty {
    display: none;
}

/* Responsive layout */

@media (max-width: 480px) {
    .panel {
        border-radius: 16px;
    }

    .eyebrow {
        font-size: 10px;
        letter-spacing: 0.13em;
        margin-bottom: 8px;
    }

    h1 {
        font-size: clamp(24px, 7vw, 32px);
        margin-bottom: 8px;
    }

    .description {
        font-size: 13px;
        margin-bottom: 18px;
    }

    .background-details {
        margin-top: 14px;
        padding-top: 12px;
    }

    .hint {
        margin-top: 12px;
    }
}

@media (max-width: 360px) {
    .actions {
        grid-template-columns: 1fr;
        gap: 8px;
    }
}

@media (max-height: 550px) and (min-width: 600px) {
    .panel {
        width: min(620px, calc(100% - 32px));
        padding: 18px 24px;
    }

    .eyebrow {
        margin-bottom: 5px;
    }

    h1 {
        font-size: 26px;
        margin-bottom: 6px;
    }

    .description {
        margin-bottom: 12px;
    }

    .hint {
        margin-top: 10px;
    }
}

@media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
        scroll-behavior: auto !important;
    }
}
</style>
</head>

<body>

<iframe
    id="background"
    title="Selected animated background"
></iframe>

<main class="panel" id="panel">

    <p class="eyebrow">
        Interactive background collection
    </p>

    <h1>A little moving magic.</h1>

    <p class="description">
        Choose a world to explore. Move your pointer across
        the background and see how it responds.
    </p>

    <label id="picker-label">
        Choose your background
    </label>

    <div class="picker">

        <button
            id="background-select"
            type="button"
            aria-haspopup="listbox"
            aria-expanded="false"
            aria-controls="background-list"
            aria-labelledby="picker-label selected-name"
        >
            <span id="selected-name"></span>
            <span aria-hidden="true">⌄</span>
        </button>

        <div
            id="background-list"
            role="listbox"
            tabindex="-1"
            aria-labelledby="picker-label"
            hidden
        ></div>

    </div>

    <section
        class="background-details"
        aria-live="polite"
        aria-atomic="true"
    >
        <p id="detail-label">Now playing</p>
        <h2 id="detail-title"></h2>
        <p id="detail-description"></p>
    </section>

    <div class="actions">

        <button id="hide-panel" type="button">
            Hide panel
        </button>

        <a
            class="open-link"
            id="open-background"
            target="_blank"
            rel="noopener"
        >
            Open background ↗
        </a>

    </div>

    <button
        id="download-background"
        type="button"
        style="width:100%;margin-top:12px"
    >
        Download background ZIP ↓
    </button>

    <label class="download-option">
        <input
            id="download-editor-enabled"
            type="checkbox"
        >
        Enable settings editor in downloaded background
    </label>

    <p
        id="download-status"
        role="status"
        aria-live="polite"
        style="font-size:12px;line-height:1.5;margin:10px 0 0"
    ></p>

    <p class="hint">
        Your selection is remembered.<br>
        Hide the panel to explore the entire background.
    </p>

</main>

<button id="show-panel" type="button" hidden>
    Show selection
</button>

<script type="module">
"use strict";

import { backgrounds } from "./backgrounds.js";

const frame = document.getElementById("background");
const select = document.getElementById("background-select");
const panel = document.getElementById("panel");
const showButton = document.getElementById("show-panel");
const hideButton = document.getElementById("hide-panel");
const openLink = document.getElementById("open-background");

const storageKey = "background-gallery-selection";

const list = document.getElementById("background-list");
const selectedName = document.getElementById("selected-name");

let selectedIndex = 0;
let activeIndex = 0;
let isOpen = false;

/*
 * Update description panel.
 */
function describe(index, preview = false) {
    const item = backgrounds[index];

    document.getElementById("detail-label").textContent =
        preview ? "Explore this background" : "Now playing";

    document.getElementById("detail-title").textContent =
        item.name;

    document.getElementById("detail-description").textContent =
        item.description;
}

/*
 * Highlight background in picker.
 */
function highlight(index, scroll = false) {
    activeIndex = index;

    [...list.children].forEach((option, i) => {
        option.classList.toggle("active", i === index);
    });

    list.setAttribute(
        "aria-activedescendant",
        `background-option-${index}`
    );

    describe(index, index !== selectedIndex);

    if (scroll) {
        list.children[index].scrollIntoView({
            block: "nearest"
        });
    }
}

/*
 * Open/close background picker.
 */
function setPickerOpen(open, focus = true) {
    isOpen = open;

    list.hidden = !open;

    select.setAttribute(
        "aria-expanded",
        String(open)
    );

    if (open) {
        highlight(selectedIndex, true);
        list.focus();
    } else {
        describe(selectedIndex);

        if (focus) {
            select.focus();
        }
    }
}

/*
 * Populate background picker.
 */
backgrounds.forEach((background, index) => {

    const option = document.createElement("div");

    option.id = `background-option-${index}`;
    option.className = "background-option";

    option.setAttribute("role", "option");
    option.setAttribute("aria-selected", "false");

    option.textContent = background.name;

    option.addEventListener("pointerenter", event => {
        if (event.pointerType !== "touch") {
            highlight(index);
        }
    });

    option.addEventListener("click", () => {
        selectBackground(background.folder);
        setPickerOpen(false);
    });

    list.append(option);
});

/*
 * Picker mouse interaction.
 */
select.addEventListener("click", () => {
    setPickerOpen(!isOpen);
});

select.addEventListener("keydown", event => {

    if (["ArrowDown", "ArrowUp"].includes(event.key)) {
        event.preventDefault();
        setPickerOpen(true);
    }

});

/*
 * Keyboard navigation and type-to-search.
 */
let searchText = "";
let searchTimer;

list.addEventListener("keydown", event => {

    if (
        event.key === "ArrowDown" ||
        event.key === "ArrowUp"
    ) {
        event.preventDefault();

        highlight(
            (
                activeIndex +
                (event.key === "ArrowDown" ? 1 : -1) +
                backgrounds.length
            ) % backgrounds.length,
            true
        );

    } else if (
        event.key === "Home" ||
        event.key === "End"
    ) {
        event.preventDefault();

        highlight(
            event.key === "Home"
                ? 0
                : backgrounds.length - 1,
            true
        );

    } else if (
        event.key === "Enter" ||
        event.key === " "
    ) {
        event.preventDefault();

        selectBackground(
            backgrounds[activeIndex].folder
        );

        setPickerOpen(false);

    } else if (event.key === "Escape") {
        event.preventDefault();
        setPickerOpen(false);

    } else if (event.key === "Tab") {
        setPickerOpen(false);

    } else if (
        event.key.length === 1 &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
    ) {
        searchText += event.key.toLowerCase();

        clearTimeout(searchTimer);

        searchTimer = setTimeout(() => {
            searchText = "";
        }, 700);

        const match = backgrounds.findIndex(item =>
            item.name.toLowerCase().startsWith(searchText)
        );

        if (match >= 0) {
            highlight(match, true);
        }
    }
});

/*
 * Close picker when clicking outside.
 */
document.addEventListener("pointerdown", event => {

    if (
        isOpen &&
        !event.target.closest(".picker")
    ) {
        setPickerOpen(false, false);
    }

});

document.addEventListener("focusin", event => {

    if (
        isOpen &&
        !event.target.closest(".picker")
    ) {
        setPickerOpen(false, false);
    }

});

/*
 * Build background URL.
 */
function backgroundURL(folder) {
    const path = folder
        .split("/")
        .map(segment => encodeURIComponent(segment))
        .join("/");

    return `${path}/index.html`;
}

/*
 * Select and display background.
 */
function selectBackground(folder) {

    const background =
        backgrounds.find(item => item.folder === folder) ||
        backgrounds[0];

    selectedIndex = backgrounds.indexOf(background);

    selectedName.textContent = background.name;

    [...list.children].forEach((option, index) => {
        option.setAttribute(
            "aria-selected",
            String(index === selectedIndex)
        );
    });

    describe(selectedIndex);

    const url = backgroundURL(background.folder);

    frame.src = url;
    frame.title = `${background.name} animated background`;

    openLink.href = url;

    try {
        localStorage.setItem(
            storageKey,
            background.folder
        );
    } catch {
        // Selection works without localStorage.
    }
}

/*
 * Hide/show panel.
 */
function setPanelVisible(visible) {

    if (!visible) {
        setPickerOpen(false, false);
    }

    panel.hidden = !visible;
    showButton.hidden = visible;

    if (visible) {
        select.focus();
    } else {
        showButton.focus();
    }
}

hideButton.addEventListener("click", () => {
    setPanelVisible(false);
});

showButton.addEventListener("click", () => {
    setPanelVisible(true);
});

/*
 * Restore previous selection.
 */
let savedSelection = null;

try {
    savedSelection = localStorage.getItem(storageKey);
} catch {
    // Use first background.
}

selectBackground(savedSelection);

/*
 * Deactivate pointer interaction when
 * entering foreground controls.
 */
function deactivateBackgroundPointer() {
    try {
        frame.contentWindow.dispatchEvent(
            new Event("blur")
        );
    } catch {
        // Applicable to same-origin backgrounds.
    }
}

panel.addEventListener(
    "pointerenter",
    deactivateBackgroundPointer
);

showButton.addEventListener(
    "pointerenter",
    deactivateBackgroundPointer
);

/*
 * Download selected background.
 *
 * PHP recursively collects the files.
 * JavaScript sends the current configuration.
 */
const downloadButton =
    document.getElementById("download-background");

const downloadStatus =
    document.getElementById("download-status");

downloadButton.addEventListener("click", async () => {

    downloadButton.disabled = true;
    downloadButton.textContent = "Preparing download…";
    downloadStatus.textContent = "";

    try {

        const background = backgrounds[selectedIndex];

        const sourceURL = new URL(
            backgroundURL(background.folder),
            document.baseURI
        );

        const child = frame.contentWindow;

        /*
         * Verify iframe and configuration API.
         */
        if (
            child.location.href !== sourceURL.href ||
            typeof child.getBackgroundConfig !== "function"
        ) {
            throw new Error(
                "Wait for the background to load. " +
                "It must expose window.getBackgroundConfig()."
            );
        }

        /*
         * Capture current configuration.
         */
        const currentConfig = JSON.parse(
            JSON.stringify(
                child.getBackgroundConfig()
            )
        );

        if (
            !currentConfig ||
            typeof currentConfig !== "object" ||
            Array.isArray(currentConfig)
        ) {
            throw new Error(
                "The background returned an invalid configuration."
            );
        }

        /*
         * Apply editor checkbox.
         */
        if (
            currentConfig.panel &&
            typeof currentConfig.panel === "object"
        ) {
            currentConfig.panel.enabled =
                document.getElementById(
                    "download-editor-enabled"
                ).checked;
        }

        /*
         * Request ZIP from this same PHP file.
         */
        const response = await fetch(
            "index.php?action=download",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    folder: background.folder,
                    config: currentConfig
                })
            }
        );

        if (!response.ok) {

            const message = await response.text();

            throw new Error(
                message ||
                `Download failed (${response.status}).`
            );
        }

        /*
         * Download generated ZIP.
         */
        const blob = await response.blob();

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;

        link.download =
            `${background.folder.split("/").pop()}-custom.zip`;

        document.body.append(link);

        link.click();

        link.remove();

        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 60000);

        downloadStatus.textContent =
            `${background.name} downloaded with your current settings.`;

    } catch (error) {

        downloadStatus.textContent =
            error.name === "SecurityError"
                ? "The gallery and background must be served from the same origin."
                : error.message;

    } finally {

        downloadButton.disabled = false;

        downloadButton.textContent =
            "Download background ZIP ↓";
    }
});

</script>
</body>
</html>
