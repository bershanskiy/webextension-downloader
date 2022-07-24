import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';
import css from 'rollup-plugin-css-only';
import sveltePreprocess from 'svelte-preprocess';
import typescript from '@rollup/plugin-typescript';

const production = !process.env.ROLLUP_WATCH;

function serve() {
  let server;

  function toExit() {
    if (server) server.kill(0);
  }

  return {
    writeBundle() {
      if (server) return;
      server = require('child_process').spawn(
        'npm',
        ['run', 'start', '--', '--dev'],
        {
          stdio: ['ignore', 'inherit', 'inherit'],
          shell: true,
        }
      );

      process.on('SIGTERM', toExit);
      process.on('exit', toExit);
    },
  };
}

const uiOnlyPlugins = [
  svelte({
    preprocess: sveltePreprocess({ sourceMap: !production }),
    compilerOptions: {
      // enable run-time checks when not in production
      dev: !production,
    },
  }),
  // we'll extract any component CSS out into
  // a separate file - better for performance
  css({ output: 'bundle.css' }),

  // If you have external dependencies installed from
  // npm, you'll most likely need these plugins. In
  // some cases you'll need additional configuration -
  // consult the documentation for details:
  // https://github.com/rollup/plugins/tree/master/packages/commonjs
  resolve({
    browser: true,
    dedupe: ['svelte'],
  }),
];

const regularPlugins = [
  typescript({
    sourceMap: true,
    inlineSources: !production
  }),

  // In dev mode, call `npm run start` once
  // the bundle has been generated
  !production && serve(),

  // Watch the `build` directory and refresh the
  // browser on changes when not in production
  !production && livereload('build'),

  // If we're building for production (npm run build
  // instead of npm run dev), minify
  production && terser(),
];

const uiPlugins = [
  ...uiOnlyPlugins,
  ...regularPlugins,
]

const tsPlugins = [
  resolve(),
  ...regularPlugins
];

export default [
  {
    input: 'src/popup/main.ts',
    output: {
      sourcemap: true,
      format: 'iife',
      name: 'app',
      file: 'build/popup/bundle.js',
    },
    plugins: uiPlugins,
    watch: {
      clearScreen: false,
    },
  },
  {
    input: 'src/background.ts',
    output: {
      sourcemap: true,
      format: 'iife',
      file: 'build/background.js',
    },
    plugins: tsPlugins,
    watch: {
      clearScreen: false,
    },
  },
];
