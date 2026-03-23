const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  mode: process.env.NODE_ENV || "production",
  devtool: "cheap-module-source-map",
  entry: {
    "ui/popup.min": "./src/ui/popup.js",
    "content/content.min": "./src/content/content.js",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
        },
      },
    ],
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: "manifest.json", to: "manifest.json" },
        { from: "assets/icons/", to: "icons/" },
        { from: "src/background/background.js", to: "background/background.js" },
        { from: "src/ui/popup.html", to: "ui/popup.html" },
        { from: "src/ui/styles.css", to: "ui/styles.css" },
      ],
    }),
  ],
};


