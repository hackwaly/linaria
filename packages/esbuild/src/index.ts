/**
 * This file contains an esbuild loader for Linaria.
 * It uses the transform.ts function to generate class names from source code,
 * returns transformed code without template literals and attaches generated source maps
 */

import fs from 'fs';
import path from 'path';

import type { Plugin, TransformOptions, Loader } from 'esbuild';
import { transformSync } from 'esbuild';

import type { PluginOptions, Preprocessor } from '@linaria/babel-preset';
import { slugify, transform } from '@linaria/babel-preset';

type EsbuildPluginOptions = {
  sourceMap?: boolean;
  preprocessor?: Preprocessor;
  esbuildOptions?: TransformOptions;
} & Partial<PluginOptions>;

const nodeModulesRegex = /^(?:.*[\\/])?node_modules(?:[\\/].*)?$/;

export default function linaria({
  sourceMap,
  preprocessor,
  esbuildOptions,
  ...rest
}: EsbuildPluginOptions = {}): Plugin {
  let options = esbuildOptions;
  return {
    name: 'linaria',
    setup(build) {
      const cssLookup = new Map<string, string>();

      build.onResolve({ filter: /\.linaria\.css$/ }, (args) => {
        return {
          namespace: 'linaria',
          path: args.path,
        };
      });

      build.onLoad({ filter: /.*/, namespace: 'linaria' }, (args) => {
        return {
          contents: cssLookup.get(args.path),
          loader: 'css',
          resolveDir: path.basename(args.path),
        };
      });

      build.onLoad({ filter: /\.(js|jsx|ts|tsx)$/ }, (args) => {
        const rawCode = fs.readFileSync(args.path, 'utf8');
        const { ext, name: filename } = path.parse(args.path);
        const loader = ext.replace(/^\./, '') as Loader;

        if (nodeModulesRegex.test(args.path)) {
          return {
            loader,
            contents: rawCode,
          };
        }

        if (!options) {
          options = {};
          if ('jsxFactory' in build.initialOptions) {
            options.jsxFactory = build.initialOptions.jsxFactory;
          }
          if ('jsxFragment' in build.initialOptions) {
            options.jsxFragment = build.initialOptions.jsxFragment;
          }
        }

        const { code } = transformSync(rawCode, {
          ...options,
          loader,
        });
        const result = transform(code, {
          filename: args.path,
          preprocessor,
          pluginOptions: rest,
        });

        if (!result.cssText) {
          return {
            contents: code,
            loader,
            resolveDir: path.dirname(args.path),
          };
        }

        let { cssText } = result;

        const slug = slugify(cssText);
        const cssFilename = `${filename}_${slug}.linaria.css`;

        if (sourceMap && result.cssSourceMapText) {
          const map = Buffer.from(result.cssSourceMapText).toString('base64');
          cssText += `/*# sourceMappingURL=data:application/json;base64,${map}*/`;
        }

        cssLookup.set(cssFilename, cssText);

        return {
          contents: `
          import ${JSON.stringify(cssFilename)};
          ${result.code}
          `,
          loader,
          resolveDir: path.dirname(args.path),
        };
      });
    },
  };
}
