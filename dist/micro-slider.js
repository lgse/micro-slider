'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function (MS) {
  'use strict';

  /**
   * Support RequireJS and CommonJS/NodeJS module formats.
   * Attach microSlider to the `window` when executed as a <script>.
   * Cond 1: RequireJS
   * Cond 2: CommonJS
   * Cond 3: Attach to Window Object
   */

  if (typeof define === 'function' && define.amd) {
    define(MS);
  } else if ((typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object' && (typeof module === 'undefined' ? 'undefined' : _typeof(module)) === 'object') {
    module.exports = MS();
  } else if ((typeof window === 'undefined' ? 'undefined' : _typeof(window)) === 'object') {
    window.MicroSlider = MS();
  }
})(function () {
  'use strict';

  var MicroSlider = function () {
    function MicroSlider(container) {
      var _this = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      _classCallCheck(this, MicroSlider);

      this.prevHandler = function () {
        var n = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : -1;

        if (!_this.attached) {
          return;
        }

        _this.target = _this.dim * Math.round(_this.offset / _this.dim) - _this.dim * n;

        if (_this.offset !== _this.target) {
          _this.amplitude = _this.target - _this.offset;
          _this.timestamp = Date.now();
          requestAnimationFrame(_this.autoScroll);
        }
      };

      this.nextHandler = function () {
        var n = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;

        if (!_this.attached) {
          return;
        }

        _this.target = _this.dim * Math.round(_this.offset / _this.dim) + _this.dim * n;

        if (_this.offset !== _this.target) {
          _this.amplitude = _this.target - _this.offset;
          _this.timestamp = Date.now();
          requestAnimationFrame(_this.autoScroll);
        }
      };

      this.clickHandler = function (e) {
        if (!_this.attached) {
          return;
        }

        if (!e.target.classList.contains(_this.options.sliderItemClass)) {
          return;
        }

        if (_this.draggedY) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        } else if (!_this.options.fullWidth) {
          var closest = _this.getClosestItem(e.target);
          var clickedIndex = _this.getItemIndex(closest);
          var diff = _this.center % _this.itemCount - clickedIndex;

          if (diff !== 0) {
            e.preventDefault();
            e.stopPropagation();
          }
          _this.cycleTo(clickedIndex);
        }
      };

      this.tapHandler = function (e) {
        if (!_this.attached) {
          return;
        }

        if (e.target === _this.sliderContainer || e.target.classList.contains(_this.options.sliderItemClass)) {
          e.preventDefault();
        }
        _this.pressed = true;
        _this.draggedX = false;
        _this.draggedY = false;
        _this.velocity = 0;
        _this.amplitude = 0;
        _this.frame = _this.offset;
        _this.timestamp = Date.now();
        _this.referencePos = {
          x: _this.getXPos(e),
          y: _this.getYPos(e)
        };
        clearInterval(_this.ticker);
        _this.ticker = setInterval(_this.track, 100);
      };

      this.dragHandler = function (e) {
        if (!_this.attached) {
          return;
        }

        if (_this.pressed) {
          var x = _this.getXPos(e);
          var y = _this.getYPos(e);
          var deltaX = _this.referencePos.x - x;
          var deltaY = Math.abs(_this.referencePos.y - y);

          if (deltaY < 30 && !_this.draggedX) {
            if (deltaX > 2 || deltaX < -2) {
              _this.draggedY = true;
              _this.referencePos.x = x;
              _this.scroll(_this.offset + deltaX);
            }
          } else if (_this.draggedY) {
            e.preventDefault();
            e.stopPropagation();
            return false;
          } else {
            _this.draggedX = true;
          }
        }

        if (_this.draggedY) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      };

      this.releaseHandler = function (e) {
        if (!_this.pressed) {
          return;
        }
        _this.pressed = false;

        clearInterval(_this.ticker);
        _this.target = _this.offset;

        if (_this.velocity > 10 || _this.velocity < -10) {
          _this.amplitude = 0.9 * _this.velocity;
          _this.target = _this.offset + _this.amplitude;
        }
        _this.target = Math.round(_this.target / _this.dim) * _this.dim;

        if (_this.options.noWrap) {
          if (_this.target >= _this.dim * (_this.itemCount - 1)) {
            _this.target = _this.dim * (_this.itemCount - 1);
          } else if (_this.target < 0) {
            _this.target = 0;
          }
        }
        _this.amplitude = _this.target - _this.offset;
        _this.timestamp = Date.now();
        requestAnimationFrame(_this.autoScroll);

        if (_this.draggedY) {
          e.preventDefault();
          e.stopPropagation();
        }
        return false;
      };

      this.resizeHandler = function () {
        if (!_this.attached) {
          return;
        }

        if (_this.options.fullWidth) {
          _this.setSliderDimensions();
          _this.offset = _this.center * 2 * _this.itemDimensions.width;
          _this.target = _this.offset;
        } else {
          _this.scroll();
        }
      };

      this.track = function () {
        var now = Date.now();
        var elapsed = now - _this.timestamp;
        _this.timestamp = now;

        var delta = _this.offset - _this.frame;
        _this.frame = _this.offset;

        var v = 1000 * delta / (1 + elapsed);
        _this.velocity = 0.8 * v + 0.2 * _this.velocity;
      };

      this.cycleTo = function (n) {
        var c = _this.itemCount;
        var diff = _this.center % c - n;

        /**
         * Account for Wraparound
         */
        if (!_this.options.noWrap) {
          if (diff < 0 && Math.abs(diff + c) < Math.abs(diff)) {
            diff += c;
          } else if (diff > 0 && Math.abs(diff - c) < diff) {
            diff -= c;
          }
        }

        /**
         * Cycle to Next or Previous Item
         */
        if (diff < 0) {
          _this.nextHandler(Math.abs(diff));
        } else if (diff > 0) {
          _this.prevHandler(diff);
        }
      };

      this.scroll = function () {
        var x = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

        var el = void 0;
        var i = 0;
        var tweenOpacity = void 0;
        var zTranslation = void 0;
        _this.setScrollTimeout();

        /**
         * Compute Scroll
         */
        _this.lastCenter = _this.center;
        _this.offset = typeof x === 'number' ? x : _this.offset;
        _this.center = Math.floor((_this.offset + _this.dim / 2) / _this.dim);

        var delta = _this.offset - _this.center * _this.dim;
        var dir = delta < 0 ? 1 : -1;
        var tween = -dir * delta * 2 / _this.dim;
        var half = _this.itemCount >> 1;

        /**
         * Center Item Positioning
         */
        if (!_this.options.noWrap || _this.center >= 0 && _this.center < _this.itemCount) {
          el = _this.items[_this.wrap(_this.center)];
          _this.setActiveItem(el);

          _this.renderTranslation(el, 0, _this.options.fullWidth ? 1 : 1 - 0.2 * tween, -delta / 2, _this.options.zoomScale * tween, dir * _this.options.shift * tween * i);
        }

        /**
         * Iterate through all slider items and position them
         */
        for (i = 1; i <= half; ++i) {
          /**
           * Right Items Positioning
           */
          if (_this.options.fullWidth) {
            zTranslation = _this.options.zoomScale;
            tweenOpacity = i === half && delta < 0 ? 1 - tween : 1;
          } else {
            zTranslation = _this.options.zoomScale * (i * 2 + tween * dir);
            tweenOpacity = 1 - 0.2 * (i * 2 + tween * dir);
          }

          if (!_this.options.noWrap || _this.center + i < _this.itemCount) {
            el = _this.items[_this.wrap(_this.center + i)];

            _this.renderTranslation(el, -i, tweenOpacity, _this.options.shift + (_this.dim * i - delta) / 2, zTranslation);
          }

          /**
           * Left Items Positioning
           */
          if (_this.options.fullWidth) {
            zTranslation = _this.options.zoomScale;
            tweenOpacity = i === half && delta > 0 ? 1 - tween : 1;
          } else {
            zTranslation = _this.options.zoomScale * (i * 2 - tween * dir);
            tweenOpacity = 1 - 0.2 * (i * 2 - tween * dir);
          }

          /**
           * Hide Wrapped Items
           */
          if (!_this.options.noWrap || _this.center - i >= 0) {
            el = _this.items[_this.wrap(_this.center - i)];

            _this.renderTranslation(el, -i, tweenOpacity, -_this.options.shift + (-_this.dim * i - delta) / 2, zTranslation);
          }
        }

        /**
         * onCycleTo Callback
         */
        if (_this.lastCenter !== _this.center && typeof _this.options.onCycleTo === 'function') {
          _this.options.onCycleTo.call(_this, _this.activeItem, _this.draggedY);
        }
      };

      this.setScrollTimeout = function () {
        _this.scrolling = true;

        if (_this.sliderContainer.classList.contains(_this.options.scrollingClass)) {
          _this.sliderContainer.classList.add(_this.options.scrollingClass);
        }

        if (_this.scrollingTimeout != null) {
          window.clearTimeout(_this.scrollingTimeout);
        }

        _this.scrollingTimeout = window.setTimeout(function () {
          _this.scrolling = false;
          _this.sliderContainer.classList.remove(_this.options.scrollingClass);
        }, _this.options.transitionDuration);
      };

      this.setActiveItem = function (el) {
        if (!el.classList.contains(_this.options.activeItemClass)) {
          if (_this.activeItem !== null) {
            _this.activeItem.classList.remove(_this.options.activeItemClass);
          }
          _this.activeItem = el;
          _this.activeItemIndex = _this.getItemIndex(el);

          if (!_this.activeItem.classList.contains(_this.options.activeItemClass)) {
            _this.activeItem.classList.add(_this.options.activeItemClass);
          }
        }

        _this.setActiveIndicator();
      };

      this.setActiveIndicator = function () {
        if (_this.options.indicators && _this.activeIndicator !== _this.indicators[_this.activeItemIndex]) {
          _this.activeIndicator.classList.remove(_this.options.indicatorActiveClass);
          _this.activeIndicator = _this.indicators[_this.activeItemIndex];
          _this.activeIndicator.classList.add(_this.options.indicatorActiveClass);
        }
      };

      this.renderTranslation = function (el, zIndex, opacity, x1, z) {
        var x2 = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : null;

        var alignment = 'translateX(0)';
        if (!_this.options.fullWidth) {
          var tX = (_this.sliderContainer.clientWidth - _this.itemDimensions.width) / 2;
          var tY = (_this.sliderContainer.clientHeight - _this.itemDimensions.height) / 2;
          alignment = 'translateX(' + tX + 'px) translateY(' + tY + 'px)';
        }

        var tx2 = '';
        if (x2 !== null) {
          tx2 = 'translateX(' + x2 + 'px) ';
        }

        el.style[_this.xForm] = alignment + ' translateX(' + x1 + 'px) ' + tx2 + 'translateZ(' + z + 'px)';
        el.style.zIndex = zIndex;
        el.style.opacity = opacity;
        el.style.display = 'block';
      };

      this.autoScroll = function () {
        var elapsed = Date.now() - _this.timestamp;
        var delta = _this.amplitude * Math.exp(-elapsed / _this.options.transitionDuration);

        if (!_this.amplitude) {
          return false;
        } else if (delta > 2 || delta < -2) {
          _this.scroll(_this.target - delta);
          requestAnimationFrame(_this.autoScroll);
        } else {
          _this.scroll(_this.target);
        }
      };

      this.next = function () {
        var i = _this.activeItemIndex + 1;

        if (!_this.options.noWrap || _this.options.noWrap && i < _this.itemCount) {
          _this.cycleTo(i);
        }
      };

      this.prev = function () {
        var i = _this.activeItemIndex - 1;

        if (!_this.options.noWrap || _this.options.noWrap && i >= 0) {
          _this.cycleTo(i);
        }
      };

      this.set = function (n) {
        return _this.cycleTo(n);
      };

      this.activeIndicator = null;
      this.activeItem = null;
      this.activeItemIndex = 0;
      this.amplitude = null;
      this.attached = false;
      this.center = 0;
      this.draggedX = false;
      this.draggedY = false;
      this.frame = null;
      this.initialized = false;
      this.lastCenter = null;
      this.offset = 0;
      this.options = _extends({}, MicroSlider.defaults, options);
      this.pressed = false;
      this.referencePos = { x: 0, y: 0 };
      this.scrolling = false;
      this.scrollingTimeout = null;
      this.sliderContainer = container;
      this.sliderWrapper = null;
      this.target = 0;
      this.ticker = null;
      this.timestamp = null;
      this.velocity = null;
      this.init();
    }

    _createClass(MicroSlider, [{
      key: 'init',
      value: function init() {
        this.setSliderContainer();
        this.setSliderWrapper();
        this.setSliderItems();
        this.setSliderDimensions();
        this.setSliderPerspective();
        this.setIndicators();
        this.setXForm();
        this.bindEvents();

        /**
         * Trigger window resize event and manually scroll to finish initialization.
         */
        this.refresh();
        this.initialized = true;
      }
    }, {
      key: 'setSliderContainer',
      value: function setSliderContainer() {
        if (typeof this.sliderContainer === 'string') {
          this.sliderContainer = document.querySelector(this.sliderContainer);
        }

        if (!(this.sliderContainer instanceof HTMLElement)) {
          throw new Error('\n        The slider needs to be instantiated with an HTML Element as the first parameter or a valid CSS selector.\n        eg.: new Carousel(document.getElementById(\'MyElement\')) or new Carousel(\'#myElement\').\n      ');
        }

        if (!this.sliderContainer.classList.contains(this.options.sliderClass)) {
          this.sliderContainer.classList.add(this.options.sliderClass);
        }

        if (!this.sliderContainer.classList.contains(this.options.initializedClass)) {
          this.sliderContainer.classList.add(this.options.initializedClass);
        }
      }
    }, {
      key: 'setSliderWrapper',
      value: function setSliderWrapper() {
        this.sliderWrapper = document.createElement('div');
        this.sliderWrapper.classList.add(this.options.sliderWrapperClass);
        this.sliderWrapper.style.overflow = 'hidden';
        this.sliderWrapper.style.width = '100%';
        this.sliderContainer.appendChild(this.sliderWrapper);
      }
    }, {
      key: 'setSliderItems',
      value: function setSliderItems() {
        var children = this.sliderContainer.children;
        var dispose = [];
        this.items = [];

        for (var i = 0, len = children.length; i < len; i++) {
          var child = children[i];
          var clone = child.cloneNode(true);

          if (child.classList.contains(this.options.sliderItemClass)) {
            if (child.classList.contains(this.options.activeItemClass)) {
              this.activeItemIndex = i;
            }

            dispose.push(child);
            this.items.push(clone);
            this.sliderWrapper.appendChild(clone);
          }
        }

        for (var _i = 0, _len = dispose.length; _i < _len; _i++) {
          var d = dispose[_i];
          d.parentNode.removeChild(d);
        }

        this.itemCount = this.items.length;
        if (!this.itemCount) {
          throw new Error('\n        The slider does not contain any valid items. \n        Please ensure that the items have the class name \'slider-item\' appended to them.\n      ');
        }
      }
    }, {
      key: 'setSliderDimensions',
      value: function setSliderDimensions() {
        var item = this.items[0];
        item.style.display = 'block';
        this.setSliderItemsDimensions(item.offsetHeight + 'px', item.offsetWidth + 'px');

        if (!this.initialized) {
          item.style.display = 'none';
        }
      }
    }, {
      key: 'setSliderItemsDimensions',
      value: function setSliderItemsDimensions() {
        var height = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '320px';
        var width = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '320px';

        for (var i = 0; i < this.itemCount; i++) {
          var item = this.items[i];
          item.style.height = height;
          item.style.width = width;
        }

        this.itemDimensions = {
          height: parseInt(height),
          width: parseInt(width)
        };

        this.dim = this.itemDimensions.width * 2 + this.options.padding;
      }
    }, {
      key: 'setSliderPerspective',
      value: function setSliderPerspective() {
        this.sliderWrapper.style.height = this.sliderContainer.offsetHeight + 'px';
        this.sliderWrapper.style.perspective = this.options.fullWidth ? 'none' : this.itemDimensions.height * this.options.perspectiveFactor + 'px';
      }
    }, {
      key: 'setIndicators',
      value: function setIndicators() {
        var _this2 = this;

        if (this.options.indicators) {
          this.indicators = [];
          this.indicatorContainer = document.createElement(this.options.indicatorContainerTag);
          this.indicatorContainer.className = this.options.indicatorContainerClass;
          this.sliderContainer.appendChild(this.indicatorContainer);

          var _loop = function _loop(i) {
            var indicator = document.createElement(_this2.options.indicatorItemTag);
            indicator.className = _this2.options.indicatorItemClass;
            indicator.innerHTML = '<a href="#">' + _this2.options.indicatorText + '</a>';

            if (i === 0) {
              _this2.activeIndicator = indicator;
              indicator.classList.add(_this2.options.indicatorActiveClass);
            }

            indicator.addEventListener('click', function (e) {
              e.preventDefault();
              _this2.set(i);
            });

            _this2.indicatorContainer.appendChild(indicator);
            _this2.indicators.push(indicator);
          };

          for (var i = 0; i < this.itemCount; i++) {
            _loop(i);
          }
        }
      }
    }, {
      key: 'setXForm',
      value: function setXForm() {
        var xForm = 'transform';

        ['webkit', 'Moz', 'O', 'ms'].forEach(function (prefix) {
          var e = prefix + 'Transform';

          if (typeof document.body.style[e] !== 'undefined') {
            xForm = e;
          }
        });

        this.xForm = xForm;
      }
    }, {
      key: 'bindEvents',
      value: function bindEvents() {
        var unbind = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

        var fn = unbind === false ? 'addEventListener' : 'removeEventListener';

        /**
         * Touch Events
         */
        if (typeof window.ontouchstart !== 'undefined') {
          this.sliderContainer[fn]('touchstart', this.tapHandler);
          this.sliderContainer[fn]('touchmove', this.dragHandler);
          this.sliderContainer[fn]('touchend', this.releaseHandler);
        }

        /**
         * Mouse Events
         */
        this.sliderContainer[fn]('mousedown', this.tapHandler);
        this.sliderContainer[fn]('mousemove', this.dragHandler);
        this.sliderContainer[fn]('mouseup', this.releaseHandler);
        this.sliderContainer[fn]('mouseleave', this.releaseHandler);
        this.sliderContainer[fn]('click', this.clickHandler);

        /**
         * Window Resize Event
         */
        window[fn]('resize', this.resizeHandler);

        this.attached = unbind === false;
      }
    }, {
      key: 'getXPos',
      value: function getXPos(e) {
        var x = e.clientX;

        if (e.targetTouches && e.targetTouches.length >= 1) {
          x = e.targetTouches[0].clientX;
        }

        return x;
      }
    }, {
      key: 'getYPos',
      value: function getYPos(e) {
        var y = e.clientY;

        if (e.targetTouches && e.targetTouches.length >= 1) {
          y = e.targetTouches[0].clientY;
        }

        return y;
      }
    }, {
      key: 'wrap',
      value: function wrap(x) {
        var c = this.itemCount;

        if (x >= c) {
          return x % c;
        } else if (x < 0) {
          return this.wrap(c + x % c);
        } else {
          return x;
        }
      }
    }, {
      key: 'getClosestItem',
      value: function getClosestItem(el) {
        /**
         * Check if original element is a slider item before traversing parents
         */
        if (el.classList.contains(this.options.sliderItemClass)) {
          return el;
        }

        /**
         * Traverse Parents
         */
        var parent = void 0;
        while (el) {
          parent = el.parentElement;
          if (parent && parent.classList.contains(this.options.sliderItemClass)) {
            return parent;
          }
          el = parent;
        }

        return null;
      }
    }, {
      key: 'getItemIndex',
      value: function getItemIndex(el) {
        for (var i = 0; i < this.itemCount; i++) {
          if (this.items[i] === el) {
            return i;
          }
        }

        return -1;
      }
    }, {
      key: 'refresh',
      value: function refresh() {
        requestAnimationFrame(this.autoScroll);
        this.resizeHandler();
        this.scroll();
      }
    }, {
      key: 'toggleFullWidth',
      value: function toggleFullWidth() {
        var fullWidth = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
        var itemWidth = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 320;
        var itemHeight = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

        var height = itemHeight === null ? this.itemDimensions.height + 'px' : itemHeight + 'px';
        var width = fullWidth ? '100%' : itemWidth + 'px';
        this.options.fullWidth = fullWidth;

        this.setSliderItemsDimensions(height, width);
        this.setSliderPerspective();
        this.refresh();
      }
    }, {
      key: 'detach',
      value: function detach() {
        this.bindEvents(true);
      }
    }]);

    return MicroSlider;
  }();

  MicroSlider.defaults = {
    activeItemClass: 'active',
    fullWidth: false,
    scrollingClass: 'scrolling',
    indicators: false,
    indicatorActiveClass: 'active',
    indicatorContainerTag: 'ul',
    indicatorContainerClass: 'indicators',
    indicatorItemTag: 'li',
    indicatorItemClass: 'indicator',
    indicatorText: '&bull;',
    initializedClass: 'initialized',
    noWrap: false,
    onCycleTo: null,
    padding: 0,
    perspectiveFactor: 1.25,
    shift: 0,
    sliderClass: 'micro-slider',
    sliderItemClass: 'slider-item',
    sliderWrapperClass: 'slider-wrapper',
    transitionDuration: 250,
    zoomScale: -100
  };


  return MicroSlider;
});
