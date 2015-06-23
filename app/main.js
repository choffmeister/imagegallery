/*eslint-env browser*/
/*eslint camelcase: 0*/
/*global PhotoSwipe, PhotoSwipeUI_Default*/
'use strict';

var photos = require('./files');

var thumbnailsElement = document.querySelector('.thumbnails'),
    pswpElement = document.querySelector('.pswp');

photos.forEach(function (photo, index) {
  var anchor = document.createElement('a');
  anchor.href = '#';
  anchor.onclick = function (event) {
    var gallery = new PhotoSwipe(pswpElement, PhotoSwipeUI_Default, photos, {index: index});
    gallery.init();

    event.preventDefault();
  };

  var image = document.createElement('img');
  image.className = 'thumbnail';
  image.src = photo.thumbnail.src;
  image.width = photo.thumbnail.w;
  image.height = photo.thumbnail.h;

  anchor.appendChild(image);
  thumbnailsElement.appendChild(anchor);
});
