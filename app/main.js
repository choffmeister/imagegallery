var photos = require('./files'),
    thumbnailsElement = document.querySelector('.thumbnails'),
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
  image.src = photo.thumb.src;

  anchor.appendChild(image);
  thumbnailsElement.appendChild(anchor);
});
