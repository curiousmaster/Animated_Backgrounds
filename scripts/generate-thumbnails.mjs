
import { chromium } from "playwright";

import {
    readFile,
    writeFile,
    mkdir,
    stat
} from "node:fs/promises";

import { createReadStream } from "node:fs";
import { createServer } from "node:http";

import {
    resolve,
    join,
    dirname,
    relative,
    extname,
    sep
} from "node:path";

import { fileURLToPath } from "node:url";

/* ============================================================
   CONFIGURATION
   ============================================================ */

const ROOT = resolve(
    dirname(fileURLToPath(import.meta.url)),
    ".."
);

const CONFIG = {
    renderWidth: 1920,
    renderHeight: 1080,

    thumbnailWidth: 480,
    thumbnailHeight: 270,

    webpQuality: 85,

    // Capture after these delays, measured from page load.
    captureTimes: [3000, 5500, 8500],

    navigationTimeout: 30000,
    captureTimeout: 20000,

    retries: 2,

    diagnosticDirectory: "_thumbnail-diagnostics"
};

const REGENERATE_ALL = process.argv.includes("--all");
const DIAGNOSTICS = process.argv.includes("--diagnostics");

const MIME_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".glsl": "text/plain; charset=utf-8",
    ".vert": "text/plain; charset=utf-8",
    ".frag": "text/plain; charset=utf-8"
};

/* ============================================================
   HELPERS
   ============================================================ */

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function isInsideRoot(path) {
    const rel = relative(ROOT, path);

    return rel === "" ||
        (
            rel !== ".." &&
            !rel.startsWith(".." + sep) &&
            !resolve(path).startsWith("..")
        );
}

function validateFolder(folder) {
    if (
        typeof folder !== "string" ||
        !folder.trim()
    ) {
        throw new Error("Invalid background folder");
    }

    const parts = folder.split("/");

    if (parts.some(part =>
        !part ||
        part === "." ||
        part === ".." ||
        part.includes("\\") ||
        part.includes(":")
    )) {
        throw new Error(
            `Unsafe background folder: ${folder}`
        );
    }

    return parts;
}

async function fileExists(path) {
    try {
        const info = await stat(path);
        return info.isFile();
    } catch {
        return false;
    }
}

/* ============================================================
   LOCAL HTTP SERVER
   ============================================================ */

async function startServer() {
    const server = createServer(async (req, res) => {
        try {
            const url = new URL(
                req.url,
                "http://127.0.0.1"
            );

            let pathname = decodeURIComponent(url.pathname);

            if (pathname.includes("\0")) {
                res.writeHead(400).end();
                return;
            }

            if (pathname.endsWith("/")) {
                pathname += "index.html";
            }

            const file = resolve(
                ROOT,
                "." + pathname
            );

            if (!isInsideRoot(file)) {
                res.writeHead(403).end();
                return;
            }

            const info = await stat(file);

            if (!info.isFile()) {
                res.writeHead(404).end();
                return;
            }

            res.writeHead(200, {
                "Content-Type":
                    MIME_TYPES[extname(file).toLowerCase()] ||
                    "application/octet-stream",

                "Cache-Control": "no-store"
            });

            createReadStream(file).pipe(res);

        } catch {
            res.writeHead(404).end("Not found");
        }
    });

    return new Promise((resolveServer, reject) => {
        server.once("error", reject);

        server.listen(0, "127.0.0.1", () => {
            const address = server.address();

            resolveServer({
                server,
                origin:
                    `http://127.0.0.1:${address.port}`
            });
        });
    });
}

/* ============================================================
   READ BACKGROUNDS
   ============================================================ */

async function readBackgrounds() {
    const source = await readFile(
        join(ROOT, "backgrounds.js"),
        "utf8"
    );

    // Import backgrounds.js without requiring package.json
    // to declare type: module.
    const dataURL =
        "data:text/javascript;base64," +
        Buffer.from(source).toString("base64");

    const module = await import(dataURL);

    if (!Array.isArray(module.backgrounds)) {
        throw new Error(
            "backgrounds.js must export an array named backgrounds"
        );
    }

    return module.backgrounds;
}

/* ============================================================
   SCREENSHOT CAPTURE
   ============================================================ */

async function captureScreenshot(cdp) {
    const result = await Promise.race([
        cdp.send("Page.captureScreenshot", {
            format: "png",
            captureBeyondViewport: false,
            fromSurface: true
        }),

        sleep(CONFIG.captureTimeout).then(() => {
            throw new Error(
                "CDP screenshot timeout"
            );
        })
    ]);

    return Buffer.from(result.data, "base64");
}

/* ============================================================
   IMAGE ANALYSIS
   ============================================================ */

async function analyzeScreenshot(page, pngBuffer) {
    return page.evaluate(async base64 => {
        const binary = atob(base64);

        const bytes = new Uint8Array(
            binary.length
        );

        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }

        const blob = new Blob(
            [bytes],
            { type: "image/png" }
        );

        const bitmap = await createImageBitmap(blob);

        const canvas = document.createElement("canvas");

        // Analysis does not require full resolution.
        canvas.width = 160;
        canvas.height = 90;

        const ctx = canvas.getContext("2d", {
            willReadFrequently: true
        });

        ctx.drawImage(
            bitmap,
            0,
            0,
            canvas.width,
            canvas.height
        );

        bitmap.close();

        const image = ctx.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
        );

        const pixels = image.data;

        let contrast = 0;
        let edges = 0;
        let brightness = 0;

        const width = canvas.width;
        const height = canvas.height;

        const luminance = new Float32Array(
            width * height
        );

        for (let i = 0; i < width * height; i++) {
            const offset = i * 4;

            const r = pixels[offset];
            const g = pixels[offset + 1];
            const b = pixels[offset + 2];

            const lum =
                r * 0.2126 +
                g * 0.7152 +
                b * 0.0722;

            luminance[i] = lum;
            brightness += lum;
        }

        const mean =
            brightness / (width * height);

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const i = y * width + x;

                contrast += Math.abs(
                    luminance[i] - mean
                );

                const dx = Math.abs(
                    luminance[i] -
                    luminance[i + 1]
                );

                const dy = Math.abs(
                    luminance[i] -
                    luminance[i + width]
                );

                edges += dx + dy;
            }
        }

        contrast /= width * height;
        edges /= width * height;

        // Higher score indicates more visual detail.
        // This is a heuristic, not a guarantee of accuracy.
        const score =
            contrast * 0.55 +
            edges * 0.45;

        return {
            score,
            contrast,
            edges,
            brightness: mean
        };

    }, pngBuffer.toString("base64"));
}

/* ============================================================
   WEBP CONVERSION
   ============================================================ */

async function convertToWebP(page, pngBuffer) {
    const base64 = pngBuffer.toString("base64");

    const result = await page.evaluate(
        async ({ base64, width, height, quality }) => {
            const binary = atob(base64);

            const bytes = new Uint8Array(
                binary.length
            );

            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }

            const blob = new Blob(
                [bytes],
                { type: "image/png" }
            );

            const bitmap = await createImageBitmap(blob);

            const canvas = document.createElement("canvas");

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext("2d");

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";

            ctx.drawImage(
                bitmap,
                0,
                0,
                width,
                height
            );

            bitmap.close();

            const webpBlob = await new Promise(resolve => {
                canvas.toBlob(
                    resolve,
                    "image/webp",
                    quality
                );
            });

            if (
                !webpBlob ||
                webpBlob.type !== "image/webp"
            ) {
                throw new Error(
                    "WebP conversion failed"
                );
            }

            const buffer = await webpBlob.arrayBuffer();
            const data = new Uint8Array(buffer);

            let output = "";

            const chunkSize = 8192;

            for (
                let i = 0;
                i < data.length;
                i += chunkSize
            ) {
                output += String.fromCharCode(
                    ...data.subarray(
                        i,
                        i + chunkSize
                    )
                );
            }

            return btoa(output);

        },
        {
            base64,
            width: CONFIG.thumbnailWidth,
            height: CONFIG.thumbnailHeight,
            quality: CONFIG.webpQuality / 100
        }
    );

    return Buffer.from(result, "base64");
}

/* ============================================================
   CAPTURE BACKGROUND
   ============================================================ */

async function captureBackground(
    browser,
    origin,
    background
) {
    const parts = validateFolder(
        background.folder
    );

    const directory = join(
        ROOT,
        ...parts
    );

    const indexPath = join(
        directory,
        "index.html"
    );

    const outputPath = join(
        directory,
        "thumbnail.webp"
    );

    if (!(await fileExists(indexPath))) {
        throw new Error(
            `Missing file: ${relative(ROOT, indexPath)}`
        );
    }

    if (
        !REGENERATE_ALL &&
        await fileExists(outputPath)
    ) {
        console.log(
            `SKIP ${background.name}: thumbnail exists`
        );

        return "skipped";
    }

    const url =
        origin + "/" +
        parts.map(encodeURIComponent).join("/") +
        "/index.html";

    let lastError;

    for (
        let attempt = 1;
        attempt <= CONFIG.retries;
        attempt++
    ) {
        let context;

        try {
            console.log(
                `CAPTURE ${background.name} ` +
                `(attempt ${attempt}/${CONFIG.retries})`
            );

            context = await browser.newContext({
                viewport: {
                    width: CONFIG.renderWidth,
                    height: CONFIG.renderHeight
                },

                deviceScaleFactor: 1,
                colorScheme: "dark",
                reducedMotion: "no-preference"
            });

            const page = await context.newPage();

            page.on("pageerror", error => {
                console.warn(
                    `  PAGE ERROR: ${error.message}`
                );
            });

            page.setDefaultTimeout(
                CONFIG.navigationTimeout
            );

            const response = await page.goto(
                url,
                {
                    waitUntil: "domcontentloaded",
                    timeout: CONFIG.navigationTimeout
                }
            );

            if (!response || !response.ok()) {
                throw new Error(
                    `HTTP ${response?.status() ?? "unknown"}`
                );
            }

            // CDP captures the browser compositor output,
            // including WebGL and multiple canvas layers.
            const cdp = await context.newCDPSession(page);

            await cdp.send("Page.enable");

            const start = Date.now();

            const candidates = [];

            for (
                const captureTime of CONFIG.captureTimes
            ) {
                const elapsed = Date.now() - start;

                if (captureTime > elapsed) {
                    await sleep(captureTime - elapsed);
                }

                const png = await captureScreenshot(cdp);

                const analysis = await analyzeScreenshot(
                    page,
                    png
                );

                candidates.push({
                    png,
                    time: captureTime,
                    ...analysis
                });

                console.log(
                    `  Frame ${captureTime}ms: ` +
                    `score=${analysis.score.toFixed(2)}, ` +
                    `brightness=${analysis.brightness.toFixed(2)}`
                );
            }

            if (!candidates.length) {
                throw new Error(
                    "No screenshots captured"
                );
            }

            // Select the most visually detailed frame.
            candidates.sort(
                (a, b) => b.score - a.score
            );

            const best = candidates[0];

            console.log(
                `  Selected frame at ${best.time}ms`
            );

            const webp = await convertToWebP(
                page,
                best.png
            );

            await mkdir(
                directory,
                { recursive: true }
            );

            // Save only after successful conversion.
            await writeFile(
                outputPath,
                webp
            );

            const info = await stat(outputPath);

            console.log(
                `  SAVED ${relative(ROOT, outputPath)} ` +
                `(${(info.size / 1024).toFixed(1)} KB)`
            );

            if (DIAGNOSTICS) {
                const diagnosticDirectory = join(
                    ROOT,
                    CONFIG.diagnosticDirectory
                );

                await mkdir(
                    diagnosticDirectory,
                    { recursive: true }
                );

                const diagnosticName =
                    parts.join("__") + ".png";

                await writeFile(
                    join(
                        diagnosticDirectory,
                        diagnosticName
                    ),
                    best.png
                );
            }

            return "generated";

        } catch (error) {
            lastError = error;

            console.warn(
                `  ATTEMPT ${attempt} FAILED: ` +
                error.message
            );

        } finally {
            if (context) {
                await context.close().catch(() => {});
            }
        }
    }

    throw lastError;
}

/* ============================================================
   DIAGNOSTIC CONTACT SHEET
   ============================================================ */

async function generateContactSheet(backgrounds) {
    if (!DIAGNOSTICS) return;

    const directory = join(
        ROOT,
        CONFIG.diagnosticDirectory
    );

    await mkdir(
        directory,
        { recursive: true }
    );

    const cards = backgrounds.map(background => {
        const name = escapeHTML(background.name);

        const folder = validateFolder(
            background.folder
        );

        const imagePath =
            "../" +
            folder.map(encodeURIComponent).join("/") +
            "/thumbnail.webp";

        return `
            <div class="card">
                <img
                    src="${imagePath}"
                    alt="${name}"
                    loading="lazy"
                >
                <div class="name">${name}</div>
                <div class="folder">
                    ${escapeHTML(background.folder)}
                </div>
            </div>
        `;
    }).join("\n");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Background Thumbnail Contact Sheet</title>
<style>
* {
    box-sizing: border-box;
}
body {
    margin: 0;
    padding: 30px;
    background: #080c14;
    color: #fff;
    font-family: system-ui, sans-serif;
}
h1 {
    margin: 0 0 10px;
}
p {
    color: #aab4c4;
    margin-bottom: 30px;
}
.grid {
    display: grid;
    grid-template-columns:
        repeat(auto-fill, minmax(240px, 1fr));
    gap: 18px;
}
.card {
    background: #131b29;
    border: 1px solid #ffffff20;
    border-radius: 12px;
    overflow: hidden;
}
.card img {
    display: block;
    width: 100%;
    aspect-ratio: 16 / 9;
    object-fit: cover;
    background: #000;
}
.name {
    padding: 12px 12px 3px;
    font-size: 14px;
    font-weight: 600;
}
.folder {
    padding: 0 12px 12px;
    color: #8994a7;
    font-size: 11px;
}
</style>
</head>
<body>
<h1>Background Thumbnail Contact Sheet</h1>
<p>${backgrounds.length} backgrounds</p>
<div class="grid">
${cards}
</div>
</body>
</html>`;

    await writeFile(
        join(directory, "contact-sheet.html"),
        html,
        "utf8"
    );

    console.log(
        "Diagnostic contact sheet generated."
    );
}

function escapeHTML(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

/* ============================================================
   MAIN
   ============================================================ */

async function main() {
    const backgrounds = await readBackgrounds();

    if (!backgrounds.length) {
        throw new Error(
            "No backgrounds found in backgrounds.js"
        );
    }

    console.log("====================================");
    console.log("Background Thumbnail Generator");
    console.log("====================================");

    console.log(
        `Backgrounds: ${backgrounds.length}`
    );

    console.log(
        `Render resolution: ` +
        `${CONFIG.renderWidth}x${CONFIG.renderHeight}`
    );

    console.log(
        `Thumbnail resolution: ` +
        `${CONFIG.thumbnailWidth}x${CONFIG.thumbnailHeight}`
    );

    console.log(
        `Regenerate all: ${REGENERATE_ALL}`
    );

    console.log(
        `Diagnostics: ${DIAGNOSTICS}`
    );

    const { server, origin } = await startServer();

    let browser;

    const results = {
        generated: [],
        skipped: [],
        failed: []
    };

    try {
        browser = await chromium.launch({
            headless: true,

            args: [
                "--enable-webgl",
                "--use-gl=angle",
                "--use-angle=swiftshader",
                "--enable-unsafe-swiftshader",
                "--disable-dev-shm-usage"
            ]
        });

        for (const background of backgrounds) {
            try {
                const result = await captureBackground(
                    browser,
                    origin,
                    background
                );

                results[result].push(
                    background.name
                );

            } catch (error) {
                results.failed.push({
                    name: background.name,
                    error: error.message
                });

                console.error(
                    `FAILED ${background.name}: ` +
                    error.message
                );
            }
        }

        await generateContactSheet(backgrounds);

        console.log("");
        console.log("====================================");
        console.log("THUMBNAIL GENERATION SUMMARY");
        console.log("====================================");

        console.log(
            `Generated: ${results.generated.length}`
        );

        console.log(
            `Skipped: ${results.skipped.length}`
        );

        console.log(
            `Failed: ${results.failed.length}`
        );

        if (results.failed.length) {
            console.log("");
            console.log("Failed backgrounds:");

            for (const failed of results.failed) {
                console.log(
                    ` - ${failed.name}: ${failed.error}`
                );
            }
        }

        console.log("====================================");

        // Individual failures are reported but do not block
        // the workflow from committing successful thumbnails.
        //
        // A total generator failure (missing backgrounds.js,
        // browser startup failure, etc.) still throws.

    } finally {
        if (browser) {
            await browser.close().catch(() => {});
        }

        await new Promise(resolveClose => {
            server.close(() => resolveClose());
        });
    }
}

main().catch(error => {
    console.error(
        "FATAL:",
        error.stack || error.message
    );

    process.exitCode = 1;
});
