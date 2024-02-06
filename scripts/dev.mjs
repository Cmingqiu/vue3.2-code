import { build, context } from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const resolve = filename => path.resolve(__dirname, filename);

const target = 'reactivity';
context({
  entryPoints: [resolve(`../packages/${target}/src/index.ts`)],
  outfile: resolve(`../packages/${target}/dist/${target}.js`),
  bundle: true, // 将依赖文件打包在一起
  sourcemap: true,
  format: 'esm', //cjs esm iife
  platform: 'browser' // browser node
}).then(ctx => {
  console.log('start watching~~~~');
  ctx.watch();
});
