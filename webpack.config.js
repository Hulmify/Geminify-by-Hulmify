const path = require("path");

module.exports = [
  {
    entry: "./ui/popup.js",
    output: {
      filename: "popup.min.js",
      path: path.resolve(__dirname, "ui"),
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
    mode: "production",
  },
  {
    entry: "./scripts/content.js",
    output: {
      filename: "content.min.js",
      path: path.resolve(__dirname, "scripts"),
    },
  },
];
