var argv = require('yargs').argv,
    browserify = require('browserify'),
    buffer = require('vinyl-buffer'),
    connect = require('connect'),
    easyimage = require('easyimage'),
    fs = require('fs'),
    gif = require('gulp-if'),
    gulp = require('gulp'),
    gutil = require('gulp-util'),
    imageSize = require('image-size'),
    minifyhtml = require('gulp-minify-html'),
    mustache = require('mustache'),
    path = require('path'),
    plumber = require('gulp-plumber'),
    size = require('gulp-size'),
    source = require('vinyl-source-stream'),
    through = require('through2'),
    uglify = require('gulp-uglify'),
    url = require('url');

var config = {
  dev: argv.dev,
  dist: !argv.dev,
  port: process.env.PORT || 9000
};

var globs = {
  photos: './photos/**/*.jpg',
  html: './index.html',
  css: './app/**/*.css',
  js: './app/**/*.js'
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

gulp.task('photos-thumbnails', function (cb) {
  var photos = [];

  var processor = through.obj(
    function (file, _, cb) {
      var opts = {
        src: file.path,
        dst: './build/thumbnails/' + file.relative,
        width: 240,
        height: 160
      };

      easyimage.resize(opts)
        .then(function () {
          cb();
        })
        .catch(function (err) {
          cn(err);
        });
    }
  );

  return gulp.src(globs.photos, {read: false})
    .pipe(gif(config.dist, processor));
});


gulp.task('photos-list', function (cb) {
  var photos = [];

  var processor = through.obj(
    function (file, _, cb) {
      imageSize(file.path, function (err, dimensions) {
        if (!err) {
          photos.push({
            file: file,
            dimensions: dimensions
          });
          cb();
        } else {
          cb(err);
        }
      });
    },
    function (cb) {
      fs.readFile('./app/files.js.mustache', 'utf-8', function (err, template) {
        if (!err) {
          var rendered = mustache.render(template, {photos: photos});
          fs.writeFile('./app/files.js', rendered, function (err2) {
            cb(err2);
          })
        } else {
          cb(err);
        }
      });
    }
  );

  return gulp.src(globs.photos, {read: false})
    .pipe(processor);
});

gulp.task('photos-copy', function () {
  return gulp.src(globs.photos, {read: config.dist})
    .pipe(gulp.dest('./build/photos'));
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
  var globs = [
    './node_modules/photoswipe/dist/photoswipe.css',
    './node_modules/photoswipe/dist/photoswipe.min.js',
    './node_modules/photoswipe/dist/photoswipe-ui-default.min.js',
    './node_modules/photoswipe/dist/default-skin/*.*'
  ];
  return gulp.src(globs)
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


gulp.task('photos', ['photos-list', 'photos-copy', 'photos-thumbnails']);
gulp.task('vendor', ['vendor-photoswipe']);

gulp.task('build', ['photos', 'html', 'css', 'js', 'vendor']);
gulp.task('server', ['connect']);
gulp.task('default', ['server']);
