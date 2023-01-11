const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
    plugins: [
        // Automatically creat an index.html with the right bundle name and references to our javascript.
        new HtmlWebpackPlugin({
            template: 'html/index.html'
        }),
        // Copy game assets from our static, sounds directory, to the webpack output
        new CopyPlugin({
            patterns: [
                {from: 'static', to: 'static'},
            ]
        }),
    ],
    // Entrypoint for our game
    entry: './game.ts',
    module: {
        rules: [
            {
                // Load our files in as text
                test: /\.(glsl|vs|fs|vert|frag|mp3)$/, exclude: /node_modules/, use: ['raw-loader']
            },
            {
                // Process our typescript and use ts-loader to transpile it to Javascript
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            }

        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },

}
