'use strict';

var Bluebird = require('bluebird'),
    easyimage = require('easyimage'),
    fs = require('fs'),
    imageSize = require('image-size'),
    mustache = require('mustache');

var renderAsync = function (templatePath, targetPath, context) {
  return new Bluebird(function (resolve, reject) {
    fs.readFile(templatePath, 'utf-8', function (err, template) {
      if (!err) {
        var rendered = mustache.render(template, context);
        fs.writeFile(targetPath, rendered, function (err2) {
          if (!err2) {
            resolve();
          } else {
            reject(err2);
          }
        });
      } else {
        reject(err);
      }
    });
  });
};

var imageSizeAsync = function (imagePath) {
  return new Bluebird(function (resolve, reject) {
    imageSize(imagePath, function (err, dimensions) {
      if (!err) {
        resolve(dimensions);
      } else {
        reject(err);
      }
    });
  });
};

var thumbnailAsync = function (sourcePath, targetPath, maxWidth, maxHeight) {
  return new Bluebird(function (resolve, reject) {
    var opts = {
      src: sourcePath,
      dst: targetPath,
      width: maxWidth,
      height: maxHeight
    };

    easyimage.resize(opts).then(function () {
      resolve();
    }).catch(function (err) {
      reject(err);
    });
  });
};

module.exports = {
  renderAsync: renderAsync,
  imageSizeAsync: imageSizeAsync,
  thumbnailAsync: thumbnailAsync
};
