const path = require('path'),
      webpack = require("webpack"),
      CleanWebpackPlugin = require("clean-webpack-plugin"),
      CopyWebpackPlugin = require("copy-webpack-plugin"),
      HtmlWebpackPlugin = require("html-webpack-plugin");

var minifyOptions = {
  collapseWhitespace: true,
  removeComments: true,
  removeRedundantAttributes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
  useShortDoctype: true
};

var options = {
  mode: "development",
  entry: {
    popup: path.join(__dirname, "src", "js", "popup.js"),
    background: path.join(__dirname, "src", "js", "background.js"),
    options: path.join(__dirname, "src", "js", "options.js"),
    contentScript: path.join(__dirname, "src", "js", "contentScript.js"),
    webSocketPatch: path.join(__dirname, "src", "js", "webSocketPatch.js")
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: "[name].bundle.js"
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        loader: "style-loader!css-loader",
        exclude: /node_modules/
      },
      {
        test: /\.html$/,
        loader: "html-loader",
        exclude: /node_modules/
      }
    ]
  },
  plugins: [
    // Clean build directory.
    new CleanWebpackPlugin(["build/*.*"]),
    // Copy manifest file to build.
    new CopyWebpackPlugin([{
      from: "src/manifest.json",
      to: "manifest.json"
    }]),
    // Copy over assets folder.
    new CopyWebpackPlugin([{
      from: "src/assets",
      to: "assets"
    }]),
    // Generate HTML documents.
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "src", "html", "popup.html"),
      filename: "popup.html",
      chunks: ["popup"],
      minify: minifyOptions
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "src", "html", "background.html"),
      filename: "background.html",
      chunks: ["background"],
      minify: minifyOptions
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "src", "html", "options.html"),
      filename: "options.html",
      chunks: ["options"],
      minify: minifyOptions
    })
  ]
};

if(options.mode === "development"){
  options.devtool = "cheap-module-source-map";
}

module.exports = options;
