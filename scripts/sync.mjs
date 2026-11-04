import { readFile, writeFile, rename } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const versionPattern = /^\d+\.\d+\.\d+\.\d+$/;
function version(value) {
  if (typeof value !== 'string' || !versionPattern.test(value)) throw new Error(`Invalid version: ${value}`);
  return value.split('.').map(Number);
}
function compare(a, b) {
  const aa = version(a), bb = version(b);
  for (let i = 0; i < 4; i++) if (aa[i] !== bb[i]) return aa[i] - bb[i];
  return 0;
}
function httpsUrl(value) {
  if (typeof value !== 'string' || new URL(value).protocol !== 'https:') throw new Error(`Invalid HTTPS URL: ${value}`);
}
export function merge(sources, manifests, previous = []) {
  if (!Array.isArray(sources) || !sources.length || sources.length !== manifests.length) throw new Error('Invalid sources');
  const seen = new Set();
  const output = sources.map((source, i) => {
    httpsUrl(source.url);
    const items = manifests[i];
    if (!Array.isArray(items) || items.length !== 1 || items[0]?.InternalName !== source.internalName) throw new Error(`Unexpected manifest: ${source.url}`);
    const entry = items[0];
    const key = entry.InternalName.toLowerCase();
    if (seen.has(key)) throw new Error(`Duplicate InternalName: ${entry.InternalName}`);
    seen.add(key);
    for (const field of ['Name', 'Author', 'Description', 'Punchline', 'ApplicableVersion']) {
      if (typeof entry[field] !== 'string' || !entry[field].trim()) throw new Error(`Missing ${field}: ${entry.InternalName}`);
    }
    version(entry.AssemblyVersion);
    if (!Number.isInteger(entry.DalamudApiLevel) || entry.DalamudApiLevel < 1) throw new Error('Invalid API level');
    for (const field of ['RepoUrl', 'DownloadLinkInstall', 'DownloadLinkUpdate']) httpsUrl(entry[field]);
    if (entry.DownloadLinkTesting) httpsUrl(entry.DownloadLinkTesting);
    if (entry.TestingAssemblyVersion) version(entry.TestingAssemblyVersion);
    if (source.minimumVersion && compare(entry.AssemblyVersion, source.minimumVersion) < 0) throw new Error(`Source does not support unified repository: ${entry.InternalName}`);
    const old = previous.find(p => p.InternalName?.toLowerCase() === key);
    if (old && compare(entry.AssemblyVersion, old.AssemblyVersion) < 0) throw new Error(`Version downgrade: ${entry.InternalName}`);
    return entry;
  });
  return output.sort((a, b) => a.InternalName.localeCompare(b.InternalName, 'en'));
}
async function request(url, method = 'GET') {
  httpsUrl(url);
  let error;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { method, signal: AbortSignal.timeout(60000), headers: { 'User-Agent': 'WenwenDalamudPlugins-sync' } });
      if (!response.ok) throw new Error(`${response.status}: ${url}`);
      return response;
    } catch (e) { error = e; }
  }
  throw error;
}
export async function sync(root = process.cwd()) {
  const sources = JSON.parse(await readFile(path.join(root, 'sources.json'), 'utf8'));
  const target = path.join(root, 'pluginmaster.json');
  let oldText = '';
  try { oldText = await readFile(target, 'utf8'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  const manifests = await Promise.all(sources.map(async s => (await request(s.url)).json()));
  const merged = merge(sources, manifests, oldText ? JSON.parse(oldText) : []);
  const links = new Set(merged.flatMap(e => [e.DownloadLinkInstall, e.DownloadLinkUpdate, e.DownloadLinkTesting].filter(Boolean)));
  for (const link of links) await request(link, 'HEAD');
  const text = JSON.stringify(merged, null, 2) + '\n';
  if (text !== oldText) {
    await writeFile(target + '.tmp', text);
    await rename(target + '.tmp', target);
    console.log(`Updated ${merged.length} plugins; ${links.size} package URLs verified.`);
  } else console.log(`No changes; ${merged.length} plugins and ${links.size} package URLs verified.`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  sync().catch(error => { console.error(error.message); process.exitCode = 1; });
}
