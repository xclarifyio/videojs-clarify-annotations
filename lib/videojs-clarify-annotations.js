/*! videojs-clarify-annotations - v0.1.0 - 2015-3-10
 * Copyright (c) 2015 - 2016 Clarify, Inc.
 * Licensed under the MIT license. */

(function(window, document, videojs) {
  'use strict';

  var defaults = {
        showButtons: true, // Show the action buttons
        showActive: true,  // Set an annotation as active during playback
        audioOffset: 0.6   // The offset to start playback before a search result
      };


  // Borrowed this piece from lodash
  var MAX_ARRAY_LENGTH = Math.pow(2, 32) - 1,
      MAX_ARRAY_INDEX =  MAX_ARRAY_LENGTH - 1,
      HALF_MAX_ARRAY_LENGTH = MAX_ARRAY_LENGTH >>> 1;

  function identity(value) {
    return value;
  }

  function binaryIndex(array, value, retHighest) {
    var low = 0,
        high = array ? array.length : low;

    if (typeof value === 'number' && value === value && high <= HALF_MAX_ARRAY_LENGTH) {
      while (low < high) {
        var mid = (low + high) >>> 1,
            computed = array[mid];

        if (retHighest ? (computed <= value) : (computed < value)) {
          low = mid + 1;

        } else {
          high = mid;
        }
      }

      return high;
    }

    return binaryIndexBy(array, value, identity, retHighest);
  }

  function binaryIndexBy(array, value, iteratee, retHighest) {
    value = iteratee(value);

    var low = 0,
        high = array ? array.length : 0,
        valIsNaN = value !== value,
        valIsUndef = typeof value === 'undefined',
        setLow;

    while (low < high) {
      var mid = Math.floor((low + high) / 2),
          computed = iteratee(array[mid]),
          isReflexive = computed === computed;

      if (valIsNaN) {
        setLow = isReflexive || retHighest;
      } else if (valIsUndef) {
        setLow = isReflexive && (retHighest || typeof computed !== 'undefined');
      } else {
        setLow = retHighest ? (computed <= value) : (computed < value);
      }
      if (setLow) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }
    return Math.min(high, MAX_ARRAY_INDEX);
  }

  var sortedIndex = function (array, value) {
    return binaryIndex(array, value);
  };


  /**
   * Clarify Annotations Plugin
   * @param player {object} the videojs player
   * @param data {object} the clarify search result for the video
   * @param options (optional) {object} configuration for the plugin
   */
  function ClarifyAnnotations(player, searchResults, itemIndex, options) {
    var self = this;

    // Setup vars
    self.player = player;
    self.data = searchResults || {};
    self.itemIndex = itemIndex || 0;
    self.options =  options;
    self.hits = [];
    self.active = [];

    // Setup objects
    self.$annotations = document.createElement('div');
    self.$annotations.className = 'vjs-annotations';

    // Start loading the data
    self.player.preload(true);

    // Draw the elements
    self.draw();

    // Start the Event Handler
    self.events();
  }

  /**
   * Draw the elements
   */
  ClarifyAnnotations.prototype.draw = function () {
    var self = this;
    var $controlBar = self.player.el().querySelectorAll('.vjs-control-bar');
    var $progressHolder = self.player.el().querySelectorAll('.vjs-progress-holder');

    // Add Annotations only if the progress bar exists
    if ($progressHolder.length) {
      $progressHolder[0].appendChild(self.$annotations);
    }

    // Add actions
    if (self.options.showButtons) {
      self.$actions = document.createElement('div');
      self.$actions.className = 'vjs-annotations-control vjs-control';
      self.$actions.innerHTML = '<button class="vjs-annotation-action" data-direction="previous">&laquo;<i class="vjs-speech-bubble"></i></button><button class="vjs-annotation-action" data-direction="next"><i class="vjs-speech-bubble"></i>&raquo;</button>';

      $controlBar[0].appendChild(self.$actions);
    }
  };

  /**
   * Initialize the plugin
   */
  ClarifyAnnotations.prototype.init = function () {
    var self = this;

    // Clear any annotations
    self.clear();

    self.player.on('loadedmetadata', function () {
      // Get the annotations
      self.getAnnotations();
    });
  };

  /**
   * Event Handler
   */
  ClarifyAnnotations.prototype.events = function () {
    var self = this;

    if (self.options.showButtons) {
      var $buttons = self.$actions.querySelectorAll('.vjs-annotation-action');

      [].forEach.call($buttons, function ($button, id) {
        $button.addEventListener('click', function (e) {
          var direction = e.target.getAttribute('data-direction');

          // Skip to annotation
          self.skipToAnnotation(direction);
        });
      });
    }

    if (self.options.showActive) {
      self.player.on('timeupdate', function () {
        self.checkAnnotations();
      });
    }
  };

  /**
   * Get the Annotations
   */
  ClarifyAnnotations.prototype.getAnnotations = function () {
    var self = this;
    var hits = [];
    var item;

    // Get the first item result which should be for this video
    item = self.data.item_results[self.itemIndex];

    // Parse through all term results
    if (item && item.term_results && item.term_results.length) {
      item.term_results.forEach( function (result, idx) {
        var term = self.data.search_terms[idx].term;

        // Check for matches and grab only the audio tags to show
        if (result.matches && result.matches.length) {
          result.matches.forEach( function (match) {

            if (match.type === 'audio') {
              hits = match.hits.map( function (hit) {
                hit.term_index = idx;
                hit.term = term;
                return hit;
              });
              self.hits = self.hits.concat(hits);

              // Make sure to sort them by start time
              self.hits.sort(function (a, b) {
                return a.start - b.start;
              });
              return;
            }
          });
        }

        if (hits.length) {
          for (var i = 0; i < hits.length; i += 1) {
            self.add(hits[i]);
          }
        }
      });
    } else {
      if (window.console) {
        window.console.error('ClarifyAnnotations: Unable to locate search results.');
      }
    }
  };

  /**
   * Add an annotation to the progress bar
   * @param hit {object} the start/stop time for the result
   * @param idx {integer} the id of the term result
   */
  ClarifyAnnotations.prototype.add = function (hit, idx) {
    var self = this;
    var start = ((hit.start / self.player.duration()) * 100).toFixed(2);
    var end = ((hit.end / self.player.duration()) * 100).toFixed(2);
    var width = (end - start).toFixed(2);
    var $annotation = document.createElement('span');

    $annotation.className = 'annotation';
    $annotation.style.width = width + '%';
    $annotation.style.left = start + '%';
    $annotation.setAttribute('data-start', hit.start);
    $annotation.setAttribute('data-end', hit.end);
    $annotation.setAttribute('data-term', hit.term);
    $annotation.setAttribute('data-index', hit.term_index);

    self.$annotations.appendChild($annotation);
  };

  /**
   * Skip to the next annotation in the timeline
   * @param direction {string} can be previous or next
   */
  ClarifyAnnotations.prototype.skipToAnnotation = function (direction) {
    var self = this;
    var currentTime = self.player.currentTime();
    if (!self.hits || !self.hits.length) {
        return;
    }
    var times = self.hits.map( function (hit) {
      return hit.start;
    });

    var currentIndex = sortedIndex(times, currentTime + self.options.audioOffset);
    var newTime;

    direction = direction || 'next';

    switch (direction) {
      case 'previous':
        newTime = self.hits[Math.max(0, currentIndex - 2)].start;
        break;

      case 'next':
        newTime = self.hits[currentIndex].start;
        break;
    }

    self.player.currentTime(newTime - self.options.audioOffset);
    self.player.trigger('timeupdate');
  };

  /**
   * Check if an annotation is active
   */
  ClarifyAnnotations.prototype.checkAnnotations = function () {
    var self = this;
    var currentTime = self.player.currentTime();

    // Reset the active labels
    self.active = [];

    // Look for active hits
    self.hits.forEach( function (hit, idx) {
      // Check if the current time is after or equal to the start
      if ((hit.start - self.options.audioOffset <= currentTime) && (hit.end + self.options.audioOffset > currentTime)) {
        var $el = self.$annotations.querySelectorAll('[data-start="' + hit.start + '"][data-term="' + hit.term + '"]');
        for (var i = 0; i < $el.length; i += 1) {
          self.active.push($el[i]);
        }
      }

      // We have gone too far abort!
      if (hit.start > currentTime) {
        return;
      }
    });

    // Show the active ones
    self.showActive();
  };

  /**
   * Show Active Anotations
   */
  ClarifyAnnotations.prototype.showActive = function () {
    var self = this;
    var currentActive = self.$annotations.querySelectorAll('.active');
    var i, j;

    // No results, with active annotations
    if (!self.active.length && currentActive.length) {
      for (i = 0; i < currentActive.length; i += 1) {
        currentActive[i].className = currentActive[i].className.replace('active', '');
      }
      return;

    } else {
      // There are results
      if (self.active.length) {
        self.active.forEach(function ($el) {
          // Add class if not already there
          if ($el.className.indexOf('active') < 0) {
            $el.className += ' active';
          }
        });
      }

      // Remove items that are no longer active
      if (currentActive.length) {
        for (i = 0; i < currentActive.length; i += 1) {
          var found = false;

          for (j = 0; j < self.active.length; j += 1) {
            if (currentActive[i] === self.active[j]) {
              found = true;
              break;
            }

          }

          if (!found) {
            currentActive[i].className = currentActive[i].className.replace('active', '');
          }
        }
      }
    }
  };

  /**
   * Clear all of the notations
   */
  ClarifyAnnotations.prototype.clear = function () {
    var self = this;
    var currentTime = self.player.currentTime();

    // Reset the active labels
    self.active = [];

    // Empty the annotation container
    self.$annotations.innerHTML = '';
  };

  // register the plugin
  videojs.plugin('clarifyAnnotations', function (searchResults, itemIndex, options) {
    // check for search results
    if (searchResults && typeof searchResults === 'object' && !searchResults.item_results &&
        itemIndex === undefined && options === undefined ) {
      options = searchResults; // It is options being passed
      searchResults = null;
      itemIndex = null;

    } else if (itemIndex && typeof itemIndex === 'object' && !options){
      options = itemIndex; // It is options being passed
      itemIndex = 0;

    }
    var doInit = false;

    if (!this._clarifyAnnotations) {
      searchResults = searchResults || {};
      itemIndex = itemIndex || 0;
      options = options || {};
      var settings = videojs.util.mergeOptions(defaults, options);
      this._clarifyAnnotations = new ClarifyAnnotations(this, searchResults, itemIndex, settings);
      doInit = true;

    } else {
      if (options) {
        // Update the options
        this._clarifyAnnotations.options = videojs.util.mergeOptions(this._clarifyAnnotations.options, options);
      }
      // Update the data if specified
      if (searchResults) {
        this._clarifyAnnotations.data = searchResults;
        doInit = true;
      }
      if (typeof itemIndex === 'number') {
        this._clarifyAnnotations.itemIndex = itemIndex;
        doInit = true;
      }
    }
    if (doInit) {
      // init the annotations
      this._clarifyAnnotations.init();
    }

    return this._clarifyAnnotations;
  });
})(window, document, window.videojs);
