
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, mkdir, stat, writeFile } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { resolve, join, extname, dirname, relative, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";

const ROOT = resolve(import.meta.dirname ?? dirname(new URL(import.meta.url).pathname), "..");
const WIDTH = 480;
const HEIGHT = 270;
const WAIT_MS = 3000;
const QUALITY = 82;
const REGENERATE_ALL = process.argv.includes("--all");

const MIME = {
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

function isInsideRoot(file) {
    const rel = relative(ROOT, file);
    return rel !== ".." &&
        !rel.startsWith(".." + sep) &&
        !resolve(rel).startsWith("..");
}

function startServer() {
    const server = createServer(async (req, res) => {
        try {
            const url = new URL(req.url, "http://localhost");
            let pathname = decodeURIComponent(url.pathname);

            if (pathname.includes("\0")) {
                res.writeHead(400).end();
                return;
            }

            if (pathname.endsWith("/")) pathname += "index.html";

            const file = resolve(ROOT, "." + pathname);

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
                    MIME[extname(file).toLowerCase()] ||
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
                origin: `http://127.0.0.1:${address.port}`
            });
        });
    });
}

async function readBackgrounds() {
    // Import the existing backgrounds.js as an ES module,
    // even if the repository has no package.json.
    const source = await readFile(
        join(ROOT, "backgrounds.js"),
        "utf8"
    );

    const dataURL =
        "data:text/javascript;base64," +
        Buffer.from(source).toString("base64");

    const module = await import(dataURL);

    if (!Array.isArray(module.backgrounds)) {
        throw new Error(
            "backgrounds.js must export an array named backgrounds."
        );
    }

    return module.backgrounds;
}

function validateFolder(folder) {
    if (typeof folder !== "string" || !folder.trim()) {
        throw new Error("Invalid background folder.");
    }

    const segments = folder.split("/");

    if (segments.some(segment =>
        !segment ||
        segment === "." ||
        segment === ".." ||
        segment.includes("\\") ||
        segment.includes(":")
    )) {
        throw new Error(`Unsafe background folder: ${folder}`);
    }

    return segments;
}

async function generateThumbnail(browser, origin, background) {
    const segments = validateFolder(background.folder);
    const directory = join(ROOT, ...segments);
    const output = join(directory, "thumbnail.webp");

    try {
        const existing = await stat(output);
        if (existing.isFile() && !REGENERATE_ALL) {
            console.log(`SKIP ${background.name}: thumbnail exists`);
            return "skipped";
        }
    } catch {
        // No existing thumbnail.
    }

    const pageURL = origin + "/" +
        segments.map(encodeURIComponent).join("/") +
        "/index.html";

    const context = await browser.newContext({
        viewport: { width: WIDTH, height: HEIGHT },
        deviceScaleFactor: 1,
        reducedMotion: "no-preference",
        colorScheme: "dark"
    });

    const page = await context.newPage();

    // Keep the page lightweight: no need to load analytics
    // or unrelated third-party tracking resources.
    page.on("pageerror", error => {
        console.warn(
            `  Browser warning (${background.name}): ${error.message}`
        );
    });

    try {
        console.log(`CAPTURE ${background.name}: ${pageURL}`);

        const response = await page.goto(pageURL, {
            waitUntil: "load",
            timeout: 30000
        });

        if (!response || !response.ok()) {
            throw new Error(
                `HTTP ${response?.status() ?? "unknown"}`
            );
        }

        // Give WebGL shaders, particles, and animation
        // effects time to initialize and become visible.
        await page.waitForTimeout(WAIT_MS);

        // Screenshot the rendered page rather than trying
        // to read WebGL drawing buffers.
        const image = await page.screenshot({
            type: "png",
            animations: "allow",
            timeout: 15000
        });

        // Convert the screenshot to a compact WebP image
        // using Chromium's own canvas encoder.
        const webp = await page.evaluate(
            async ({ png, quality }) => {
                const binary = atob(png);
                const bytes = new Uint8Array(binary.length);

                for (let i = 0; i < binary.length; i++) {
                    bytes[i] = binary.charCodeAt(i);
                }

                const blob = new Blob([bytes], {
                    type: "image/png"
                });

                const bitmap = await createImageBitmap(blob);
                const canvas = document.createElement("canvas");

                canvas.width = bitmap.width;
                canvas.height = bitmap.height;

                canvas.getContext("2d").drawImage(bitmap, 0, 0);
                bitmap.close();

                const webpBlob = await new Promise(resolve => {
                    canvas.toBlob(resolve, "image/webp", quality);
                });

                if (!webpBlob || webpBlob.type !== "image/webp") {
                    throw new Error("WebP encoding failed");
                }

                const buffer = await webpBlob.arrayBuffer();
                const outputBytes = new Uint8Array(buffer);

                // Avoid large argument lists when encoding.
                let result = "";
                const chunkSize = 8192;

                for (
                    let i = 0;
                    i < outputBytes.length;
                    i += chunkSize
                ) {
                    result += String.fromCharCode(
                        ...outputBytes.subarray(i, i + chunkSize)
                    );
                }

                return btoa(result);
            },
            {
                png: image.toString("base64"),
                quality: QUALITY / 100
            }
        );

        await mkdir(directory, { recursive: true });
        await writeFile(output, Buffer.from(webp, "base64"));

        const info = await stat(output);

        console.log(
            `  SAVED ${relative(ROOT, output)} ` +
            `(${(info.size / 1024).toFixed(1)} KB)`
        );

        return "generated";

    } finally {
        await context.close();
    }
}

async function main() {
    const backgrounds = await readBackgrounds();

    if (!backgrounds.length) {
        throw new Error("No backgrounds found in backgrounds.js");
    }

    console.log(
        `Found ${backgrounds.length} backgrounds. ` +
        `Regenerate all: ${REGENERATE_ALL}`
    );

    const { server, origin } = await startServer();
    let browser;

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

        let generated = 0;
        let skipped = 0;
        let failed = 0;

        for (const background of backgrounds) {
            try {
                const result = await generateThumbnail(
                    browser,
                    origin,
                    background
                );

                if (result === "generated") generated++;
                else skipped++;

            } catch (error) {
                failed++;
                console.error(
                    `FAILED ${background.name}: ${error.message}`
                );
            }
        }

        console.log(
            `Completed: ${generated} generated, ` +
            `${skipped} skipped, ${failed} failed.`
        );

        if (failed) {
            process.exitCode = 1;
        }

    } finally {
        if (browser) await browser.close();

        await new Promise((resolveClose, reject) => {
            server.close(error => {
                if (error) reject(error);
                else resolveClose();
            });
        });
    }
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
