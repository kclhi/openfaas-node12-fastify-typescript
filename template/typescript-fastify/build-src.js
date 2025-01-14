const esbuild = require('esbuild');
const packageJSON = require('./package.json');

esbuild.buildSync({
  entryPoints: [
    './src/index.ts',
  ],
  outfile: './index.js',
  bundle: true,
  sourcemap: false,
  platform: 'node',
  tsconfig: './tsconfig.json',
  external: Object.keys(packageJSON.dependencies),
  target: "esnext",
});
