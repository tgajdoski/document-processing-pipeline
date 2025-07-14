const path = require('path');

module.exports = {
  mode: 'development', // or 'production'
  entry: './src/client/client.ts',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'public'), // Output compiled JS to the public folder
  },
  devtool: 'inline-source-map', // For easier debugging
};