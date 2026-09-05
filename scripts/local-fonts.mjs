import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const exec = promisify(execFile);
await mkdir('public/assets/fonts', { recursive: true });
let css = await readFile('public/assets/fonts-google.css', 'utf8');
const urls = [...css.matchAll(/url\((https:[^)]+)\)/g)].map((m) => m[1]);
await Promise.all(
  urls.map(async (url, i) => {
    const filename = `ibm-plex-${i}.ttf`;
    await exec('curl.exe', [
      '-f',
      '-L',
      '--max-time',
      '60',
      '--retry',
      '2',
      url,
      '-o',
      `public/assets/fonts/${filename}`,
    ]);
    css = css.replace(url, `./fonts/${filename}`);
    console.log(filename);
  }),
);
await writeFile('public/assets/fonts.css', css);
