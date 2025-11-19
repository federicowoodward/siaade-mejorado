// webpack-hmr.config.js
const nodeExternals = require("webpack-node-externals");

/**
 * Configuración HMR para NestJS 11 usando Nest CLI.
 * IMPORTANTE: NO usamos RunScriptWebpackPlugin aquí,
 * porque Nest CLI ya se encarga de ejecutar el bundle.
 */
module.exports = function (options, webpack) {
  return {
    ...options,

    entry: ["webpack/hot/poll?100", options.entry],

    externals: [
      nodeExternals({
        allowlist: ["webpack/hot/poll?100"],
      }),
    ],

    plugins: [
      ...options.plugins,
      new webpack.HotModuleReplacementPlugin(),
      new webpack.WatchIgnorePlugin({
        paths: [/\.js$/, /\.d\.ts$/],
      }),
    ],
  };
};
