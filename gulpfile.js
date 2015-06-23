'use strict';

var argv = require('yargs').argv,
    browserify = require('browserify'),
    buffer = require('vinyl-buffer'),
    connect = require('connect'),
    extend = require('extend'),
    gif = require('gulp-if'),
    gulp = require('gulp'),
    gutil = require('gulp-util'),
    minifyhtml = require('gulp-minify-html'),
    plumber = require('gulp-plumber'),
    size = require('gulp-size'),
    source = require('vinyl-source-stream'),
    through = require('through2'),
    uglify = require('gulp-uglify'),
    utils = require('./utils');

var config = {
  dev: argv.dev,
  dist: !argv.dev,
  port: process.env.PORT || 9000
};

var globs = {
  photos: './photos/**/*.jpg',
  html: './index.html',
  css: './app/**/*.css',
  js: './app/**/*.js',
  photoswipe: [
    './node_modules/photoswipe/dist/photoswipe.css',
    './node_modules/photoswipe/dist/photoswipe.min.js',
    './node_modules/photoswipe/dist/photoswipe-ui-default.min.js',
    './node_modules/photoswipe/dist/default-skin/*.*'
  ]
};

var errorHandler = function () {
  return plumber({
    errorHandler: !config.dev ? false : function (err) {
      if (err.plugin) {
        gutil.log('Error in plugin \'' + gutil.colors.cyan(err.plugin) + '\'', gutil.colors.red(err.message));
      } else {
        gutil.log('Error', gutil.colors.red(err.message));
      }
      gutil.beep();
    }
  });
};

gulp.task('photos-originals', function () {
  return gulp.src(globs.photos)
    .pipe(gulp.dest('./build/photos'));
});

gulp.task('photos-thumbnails', function () {
  var processor = through.obj(
    function (file, _, cb) {
      gutil.log('Creating thumbnail of ' + file.path);
      utils.thumbnailAsync(file.path, './build/thumbnails/' + file.relative, 240, 160).then(function () {
        cb();
      }).catch(function (err) {
        cb(err);
      });
    }
  );

  return gulp.src(globs.photos, {read: false})
    .pipe(gif(config.dist, processor));
});

gulp.task('photos-list', ['photos-originals', 'photos-thumbnails'], function () {
  var photos = [];

  var processor = through.obj(
    function (file, _, cb) {
      var originalUrl = 'photos/' + file.relative;
      var thumbnailUrl = 'thumbnails/' + file.relative;

      utils.imageSizeAsync('./build/' + originalUrl).then(function (originalDimensions) {
        return utils.imageSizeAsync('./build/' + thumbnailUrl).then(function (thumbailDimensions) {
          return {
            original: extend(originalDimensions, {
              url: originalUrl
            }),
            thumbnail: extend(thumbailDimensions, {
              url: thumbnailUrl
            })
          };
        });
      }).then(function (photo) {
        photos.push({
          file: file,
          original: photo.original,
          thumbnail: photo.thumbnail
        });
        cb();
      }).catch(function (err) {
        cb(err);
      });
    },
    function (cb) {
      utils.renderAsync('./app/files.js.mustache', './app/files.js', {photos: photos}).then(function () {
        cb();
      }).catch(function (err) {
        cb(err);
      });
    }
  );

  return gulp.src(globs.photos, {read: false})
    .pipe(processor);
});

gulp.task('html', function () {
  return gulp.src(globs.html)
    .pipe(errorHandler())
    .pipe(gif(config.dist, minifyhtml()))
    .pipe(size({ showFiles: true, gzip: config.dist }))
    .pipe(gulp.dest('./build'));
});

gulp.task('css', function () {
  return gulp.src(globs.css)
    .pipe(errorHandler())
    .pipe(gulp.dest('./build/app'));
});

gulp.task('js', ['photos-list'], function () {
  var bundler = browserify('./app/main.js');

  var bundle = function () {
    return bundler.bundle()
      .pipe(errorHandler())
      .pipe(source('main.js'))
      .pipe(buffer())
      .pipe(gif(config.dist, uglify({ preserveComments: 'some' })))
      .pipe(size({ showFiles: true, gzip: config.dist }))
      .pipe(gulp.dest('./build/app'));
  };

  return bundle();
});

gulp.task('vendor-photoswipe', function () {
  return gulp.src(globs.photoswipe)
    .pipe(gulp.dest('./build/app/photoswipe'));
});

gulp.task('connect', ['build'], function (/*next*/) {
  var serveStatic = require('serve-static');
  connect()
    .use(serveStatic('./build'))
    .use(serveStatic('./'))
    .listen(config.port, function () {
      gutil.log('Listening on http://localhost:' + config.port + '/');
      //next();
    });
});

gulp.task('photos', ['photos-list', 'photos-originals', 'photos-thumbnails']);
gulp.task('vendor', ['vendor-photoswipe']);

gulp.task('build', ['photos', 'html', 'css', 'js', 'vendor']);
gulp.task('server', ['connect']);
gulp.task('default', ['server']);
