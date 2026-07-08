import fs from 'fs';
import path from 'path';

// Helper to read .env
const getEnvVar = (key: string): string | undefined => {
    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) return undefined;
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
        const [k, v] = line.split('=');
        if (k?.trim() === key) return v?.trim()?.replace(/^["']|["']$/g, '');
    }
    return undefined;
};


const extensionPath = path.join(process.cwd(), 'shortlist-extension');

// 1. Update sidepanel.html
const htmlPath = path.join(extensionPath, 'sidepanel.html');
if (fs.existsSync(htmlPath)) {
    let html = fs.readFileSync(htmlPath, 'utf8');
    html = html.replace(/src="http[^"]+\/extension-mode"/, `src="https://shortlistai.cv/extension-mode"`);
    fs.writeFileSync(htmlPath, html);
    console.log(`Updated sidepanel.html with URL: https://shortlistai.cv`);
}

// 2. Update sidepanel.js
const jsPath = path.join(extensionPath, 'sidepanel.js');
if (fs.existsSync(jsPath)) {
    let js = fs.readFileSync(jsPath, 'utf8');
    // Replace the origin in postMessage
    // iframe.contentWindow.postMessage(..., "ORIGIN");
    js = js.replace(/iframe\.contentWindow\.postMessage\(\s*\{[^}]+\},\s*"[^"]*"\s*\)/g, (match: string) => {
        return match.replace(/"[^"]*"\s*\)$/, `"https://shortlistai.cv")`);
    });
    fs.writeFileSync(jsPath, js);
    console.log(`Updated sidepanel.js with origin: https://shortlistai.cv`);
}
