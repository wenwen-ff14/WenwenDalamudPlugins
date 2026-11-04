import test from 'node:test';
import assert from 'node:assert/strict';
import { merge } from './sync.mjs';
const source = { internalName: 'Example', url: 'https://example.com/repo.json' };
const entry = { InternalName: 'Example', Name: 'Example', Author: 'Author', Description: 'Description', Punchline: 'Summary', ApplicableVersion: 'any', AssemblyVersion: '1.2.3.4', DalamudApiLevel: 13, RepoUrl: 'https://example.com', DownloadLinkInstall: 'https://example.com/a.zip', DownloadLinkUpdate: 'https://example.com/a.zip', ExtraField: true };
test('preserves all metadata and different API levels', () => {
  const other = { ...entry, InternalName: 'Global', DalamudApiLevel: 15 };
  assert.deepEqual(merge([source, {...source, internalName: 'Global'}], [[entry], [other]]), [entry, other]);
});
test('rejects duplicate identifiers', () => assert.throws(() => merge([source, source], [[entry], [entry]]), /Duplicate/));
test('rejects missing and malformed manifests', () => {
  assert.throws(() => merge([source], [[]]));
  assert.throws(() => merge([source], [[{...entry, DownloadLinkInstall: 'http://example.com/a.zip'}]]));
});
test('rejects source rollback', () => assert.throws(() => merge([source], [[entry]], [{...entry, AssemblyVersion:'1.2.3.5'}]), /downgrade/));
test('requires a Penumbra version that accepts this repository', () => assert.throws(() => merge([{...source, minimumVersion:'1.5.1.29'}], [[entry]]), /unified repository/));
