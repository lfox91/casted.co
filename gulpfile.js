var gulp = require('gulp');
var webpack = require('webpack');
var path = require('path');
var fs = require('fs');
var DeepMerge = require('deep-merge');
var nodemon = require('nodemon');


var nodeModules = {};
/*
 * Avoid making binaries in nod_modules a bundle dependency (node)
 * Create nodeModules object that filters all binary files
 * This object is applied to backendConfig.externals - files unresolved by Webpack
 * The unfiltered modules will be the bundles dependencies
 */

fs.readdirSync('node_modules')
  .filter(function(x) {
    return ['.bin'].indexOf(x) === -1;
  })
  .forEach(function(mod) {
    nodeModules[mod] = 'commonjs ' + mod;
  });

// ????
var deepmerge = DeepMerge(function(target, source, key) {
  if(target instanceof Array) {
    return [].concat(target, source);
  }
  return source;
});



/* 
 * ############# DEFAULT ###################################
 * A config shared by both Backend an Frontend
 *
 */
var defaultConfig = {
  resolve: {
    // Add `.ts` and `.tsx` as a resolvable extension.
    extensions: ['', '.ts', '.tsx', '.js']
  },
  module: {
    loaders: [
      // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
      { test: /\.tsx?$/, loader: 'ts-loader' }
    ],
  },
   plugins: [
    new webpack.optimize.OccurenceOrderPlugin(true)
  ]
};
// Don't debug/ sourcemap in production environment 
if(process.env.NODE_ENV !== 'production') {
  defaultConfig.devtool = 'source-map';
  defaultConfig.debug = true;
}
// ???
function config(overrides) {
  return deepmerge(defaultConfig, overrides || {});
}
// end DEFAULT CONFIG
/////////////////////////////////////////////////////////////



// ########## FRONTEND CONFIG #############################

var frontendConfig = config({
  entry: './src/app/app.ts',
  output: {
    path: path.join(__dirname, 'src/app/build'),
    filename: 'frontend.js'
  }
});
// end FRONTEND CONFIG
////////////////////////////////////////////////////////////



// ########## BACKEND CONFIG #############################
var backendConfig = config({
  entry: './src/server.ts',
  target: 'node',
  output: {
    path: path.join(__dirname, 'src/server/build'),
    filename: 'backend.js'
  },
  externals: nodeModules,
  plugins: [
    new webpack.IgnorePlugin(/\.(css|less)$/),
    new webpack.BannerPlugin('require("source-map-support").install();',
                             { raw: true, entryOnly: false })
  ],
  devtool: 'sourcemap'
});
// end BACKEND CONFIG
///////////////////////////////////////////////////////////// 



//////////////////////////////////////////////////////////////
/////////////////////    TASKS     ///////////////////////////
function onBuild(done) {
  return function(err, stats) {
    if(err) {
      console.log('Error', err);
    }
    else {
      console.log(stats.toString());
    }

    if(done) {
      done();
    }
  }
}

gulp.task('frontend-build', function(done) {
  webpack(frontendConfig).run(onBuild(done));
});

gulp.task('frontend-watch', function() {
  webpack(frontendConfig).watch(100, onBuild());
});

gulp.task('backend-build', function(done) {
  webpack(backendConfig).run(onBuild(done));
});

gulp.task('backend-watch', function() {
  webpack(backendConfig).watch(100, onBuild());
});

gulp.task('build', ['frontend-build', 'backend-build']);
gulp.task('watch', ['frontend-watch', 'backend-watch']);
gulp.task('run', ['backend-watch', 'frontend-watch'], function() {
  nodemon({
    execMap: {
      js: 'node'
    },
    script: path.join(__dirname, 'src/server/build/backend.js'),
    ignore: ['node_modules'],
    watch: ['./'],
    ext: 'js, ts, html, json'
  }).on('restart', function() {
    console.log('Restarted!');
  });
});
