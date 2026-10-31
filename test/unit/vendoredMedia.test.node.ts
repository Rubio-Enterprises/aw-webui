import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '../..');

describe('vendored ActivityWatch media', () => {
  test('keeps committed files rather than an upstream gitlink', () => {
    const entries = execFileSync('git', ['-C', root, 'ls-files', '--stage', '--', 'media'], {
      encoding: 'utf8',
    })
      .trim()
      .split('\n');
    expect(entries.length).toBeGreaterThan(0);
    entries.forEach(entry => expect(entry).toMatch(/^100(?:644|755) /));
  });

  test('preserves the upstream license, attribution and build inputs', () => {
    expect(fs.readFileSync(path.join(root, 'media/LICENSE'), 'utf8')).toMatch(
      /^Mozilla Public License Version 2\.0/
    );
    expect(fs.readFileSync(path.join(root, 'media/README.md'), 'utf8')).toContain('ActivityWatch');
    for (const asset of ['logo/logo.png', 'logo/logo.svg']) {
      expect(fs.statSync(path.join(root, 'media', asset)).size).toBeGreaterThan(0);
    }
  });
});
