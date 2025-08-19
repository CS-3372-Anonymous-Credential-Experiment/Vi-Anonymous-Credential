const path = require('path');

module.exports = {
    target: 'node',
    mode: 'production',
    entry: './lambda/zkp-lambda.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'lambda-package.js',
        libraryTarget: 'commonjs2'
    },
    externals: {
        'aws-sdk': 'aws-sdk'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ]
    },
    resolve: {
        extensions: ['.js', '.json']
    },
    optimization: {
        minimize: false // Keep readable for debugging
    }
};
