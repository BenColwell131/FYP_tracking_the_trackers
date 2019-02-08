const path = require('path');
      CleanWebpackPlugin = require("clean-webpack-plugin");
      CopyWebpackPlugin = require("copy-webpack-plugin");
      HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  mode: "development",
  entry: {
    popup: path.join(__dirname, "src", "js", "popup.js"),
    background: path.join(__dirname, "src", "js", "background.js"),
    options: path.join(__dirname, "src", "js", "options.js")
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: "[name].bundle.js"
  },
  //TODO: May need module options here
  plugins: [
    // Clean build directory.
    new CleanWebpackPlugin(["build"]),
    // Copy manifest file to build.
    new CopyWebpackPlugin([{
      from: "src/manifest.json",
      to: "manifest.json"
    }]),
    // Generate HTML documents.
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "src", "popup.html"),
      filename: "popup.html",
      chunks: ["popup"]
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "src", "background.html"),
      filename: "background.html",
      chunks: ["background"]
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "src", "options.html"),
      filename: "options.html",
      chunks: ["options"]
    })
  ]
};
