(function (MS) {
  'use strict';

  /**
   * Support RequireJS and CommonJS/NodeJS module formats.
   * Attach microSlider to the `window` when executed as a <script>.
   * Cond 1: RequireJS
   * Cond 2: CommonJS
   * Cond 3: Other
   */
  if (typeof define === 'function' && define.amd) {
    define(MS);
  } else if (typeof exports === 'object' && typeof module === 'object') {
    module.exports = MS();
  } else if (typeof window === 'object') {
    window.MicroSlider = MS();
  }
})(function(){
  'use strict';

  class MicroSlider {
    static defaults = {
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
      shift: 0,
      sliderClass: 'micro-slider',
      sliderItemClass: 'slider-item',
      transitionDuration: 250,
      zoomScale: -100,
    };

    constructor(container, options = {}) {
      this.activeIndicator = null;
      this.activeItem = null;
      this.activeItemIndex = 0;
      this.amplitude = null;
      this.center = 0;
      this.sliderContainer = container;
      this.draggedX = false;
      this.draggedY = false;
      this.frame = null;
      this.lastCenter = null;
      this.offset = 0;
      this.options = Object.assign({}, MicroSlider.defaults, options);
      this.pressed = false;
      this.referencePos = { x: 0, y: 0 };
      this.scrolling = false;
      this.scrollingTimeout = null;
      this.target = 0;
      this.ticker = null;
      this.timestamp = null;
      this.velocity = null;
      this.init();
    }

    init() {
      this.setSliderContainer();
      this.setSliderItems();
      this.setSliderDimensions();
      this.setIndicators();
      this.setXForm();
      this.bindEvents();

      if (!this.sliderContainer.classList.contains(this.options.initializedClass)) {
        this.sliderContainer.classList.add(this.options.initializedClass);
      } else {
        this.resizeHandler();
        this.cycleTo(this.activeItemIndex);
      }

      this.scroll();
    }

    setSliderContainer() {
      if (typeof this.sliderContainer === 'string') {
        this.sliderContainer = document.querySelector(this.sliderContainer);
      }

      if (!(this.sliderContainer instanceof HTMLElement)) {
        throw new Error(`
        The slider needs to be instantiated with an HTML Element as the first parameter or a valid CSS selector.
        eg.: new Carousel(document.getElementById('MyElement')) or new Carousel('#myElement').
      `);
      }

      if (!this.sliderContainer.classList.contains(this.options.sliderClass)) {
        this.sliderContainer.classList.add(this.options.sliderClass);
      }
    }

    setSliderItems() {
      const children = this.sliderContainer.children;
      this.items = [];

      for (let i = 0, len = children.length; i < len; i++) {
        const child = children[i];
        if (child.classList.contains(this.options.sliderItemClass)) {
          this.items.push(child);

          if (child.classList.contains(this.options.activeItemClass)) {
            this.activeItemIndex = i;
          }
        }
      }

      this.itemCount = this.items.length;
      if (!this.itemCount) {
        throw new Error(`
        The slider does not contain any valid items. 
        Please ensure that the items have the class name 'slider-item' appended to them.
      `);
      }
    }

    setSliderDimensions() {
      const item = this.items[0];

      /**
       * Force display to detect height
       */
      item.style.display = 'block';

      this.itemDimensions = {
        height: item.offsetHeight,
        width: item.offsetWidth,
      };
      this.sliderContainer.style.height = item.offsetHeight;
      this.dim = this.itemDimensions.width * 2 + this.options.padding;

      item.style.display = 'none';
    }

    setIndicators() {
      if (this.options.indicators) {
        this.indicators = [];
        this.indicatorContainer = document.createElement(this.options.indicatorContainerTag);
        this.indicatorContainer.className = this.options.indicatorContainerClass;
        this.sliderContainer.appendChild(this.indicatorContainer);

        for (let i = 0; i < this.itemCount; i++) {
          const indicator = document.createElement(this.options.indicatorItemTag);
          indicator.className = this.options.indicatorItemClass;
          indicator.innerHTML = `<a href="#">${this.options.indicatorText}</a>`;

          if (i === 0) {
            this.activeIndicator = indicator;
            indicator.classList.add(this.options.indicatorActiveClass);
          }

          indicator.addEventListener('click', (e) => {
            e.preventDefault();
            this.set(i);
          });

          this.indicatorContainer.appendChild(indicator);
          this.indicators.push(indicator);
        }
      }
    }

    setXForm() {
      let xForm = 'transform';

      ['webkit', 'Moz', 'O', 'ms'].forEach((prefix) => {
        let e = `${prefix}Transform`;

        if (typeof document.body.style[e] !== 'undefined') {
          xForm = e;
        }
      });

      this.xForm = xForm;
    }

    bindEvents() {
      /**
       * Touch Events
       */
      if (typeof window.ontouchstart !== 'undefined') {
        this.sliderContainer.addEventListener('touchstart', this.tapHandler);
        this.sliderContainer.addEventListener('touchmove', this.dragHandler);
        this.sliderContainer.addEventListener('touchend', this.releaseHandler);
      }

      /**
       * Mouse Events
       */
      this.sliderContainer.addEventListener('mousedown', this.tapHandler);
      this.sliderContainer.addEventListener('mousemove', this.dragHandler);
      this.sliderContainer.addEventListener('mouseup', this.releaseHandler);
      this.sliderContainer.addEventListener('mouseleave', this.releaseHandler);
      this.sliderContainer.addEventListener('click', this.clickHandler);

      /**
       * Window Resize Event
       */
      window.addEventListener('resize', this.resizeHandler);
    }

    getXPos = (e) => {
      let x = e.clientX;

      if (e.targetTouches && (e.targetTouches.length >= 1)) {
        x = e.targetTouches[0].clientX;
      }

      return x;
    };

    getYPos = (e) => {
      let y = e.clientY;

      if (e.targetTouches && (e.targetTouches.length >= 1)) {
        y = e.targetTouches[0].clientY;
      }

      return y;
    };

    getClosestItem = (el) => {
      /**
       * Check if original element is a slider item before traversing parents
       */
      if (el.classList.contains(this.options.sliderItemClass)) {
        return el;
      }

      /**
       * Traverse Parents
       */
      let parent;
      while (el) {
        parent = el.parentElement;
        if (parent && parent.classList.contains(this.options.sliderItemClass)) {
          return parent;
        }
        el = parent;
      }

      return null;
    };

    getItemIndex = (el) => {
      for (let i = 0; i < this.itemCount; i++) {
        if (this.items[i] === el) {
          return i;
        }
      }

      return -1;
    };

    prevHandler = (n = -1) => {
      this.target = (this.dim * Math.round(this.offset / this.dim)) - (this.dim * n);

      if (this.offset !== this.target) {
        this.amplitude = this.target - this.offset;
        this.timestamp = Date.now();
        requestAnimationFrame(this.autoScroll);
      }
    };

    nextHandler = (n = 1) => {
      this.target = (this.dim * Math.round(this.offset / this.dim)) + (this.dim * n);

      if (this.offset !== this.target) {
        this.amplitude = this.target - this.offset;
        this.timestamp = Date.now();
        requestAnimationFrame(this.autoScroll);
      }
    };

    clickHandler = (e) => {
      if (!e.target.classList.contains(this.options.sliderItemClass)) {
        return;
      }

      if (this.draggedY) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      } else if (!this.options.fullWidth) {
        const closest = this.getClosestItem(e.target);
        const clickedIndex = this.getItemIndex(closest);
        const diff = (this.center % this.itemCount) - clickedIndex;

        if (diff !== 0) {
          e.preventDefault();
          e.stopPropagation();
        }
        this.cycleTo(clickedIndex);
      }
    };

    tapHandler = (e) => {
      if (e.target === this.sliderContainer || e.target.classList.contains(this.options.sliderItemClass)) {
        e.preventDefault();
      }
      this.pressed = true;
      this.draggedX = false;
      this.draggedY = false;
      this.velocity = 0;
      this.amplitude = 0;
      this.frame = this.offset;
      this.timestamp = Date.now();
      this.referencePos = {
        x: this.getXPos(e),
        y: this.getYPos(e)
      };
      clearInterval(this.ticker);
      this.ticker = setInterval(this.track, 100);
    };

    dragHandler = (e) => {
      if (this.pressed) {
        const x = this.getXPos(e);
        const y = this.getYPos(e);
        const deltaX = this.referencePos.x - x;
        const deltaY = Math.abs(this.referencePos.y - y);

        if (deltaY < 30 && !this.draggedX) {
          if (deltaX > 2 || deltaX < -2) {
            this.draggedY = true;
            this.referencePos.x = x;
            this.scroll(this.offset + deltaX);
          }
        } else if (this.draggedY) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        } else {
          this.draggedX = true;
        }
      }

      if (this.draggedY) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    releaseHandler = (e) => {
      if (!this.pressed) {
        return;
      }
      this.pressed = false;

      clearInterval(this.ticker);
      this.target = this.offset;

      if (this.velocity > 10 || this.velocity < -10) {
        this.amplitude = 0.9 * this.velocity;
        this.target = this.offset + this.amplitude;
      }
      this.target = Math.round(this.target / this.dim) * this.dim;

      if (this.options.noWrap) {
        if (this.target >= this.dim * (this.itemCount - 1)) {
          this.target = this.dim * (this.itemCount - 1);
        } else if (this.target < 0) {
          this.target = 0;
        }
      }
      this.amplitude = this.target - this.offset;
      this.timestamp = Date.now();
      requestAnimationFrame(this.autoScroll);

      if (this.draggedY) {
        e.preventDefault();
        e.stopPropagation();
      }
      return false;
    };

    resizeHandler = () => {
      if (this.options.fullWidth) {
        this.setSliderDimensions();
        this.offset = this.center * 2 * this.itemDimensions.width;
        this.target = this.offset;
      } else {
        this.scroll();
      }
    };

    track = () => {
      let now = Date.now();
      let elapsed = now - this.timestamp;
      this.timestamp = now;

      let delta = this.offset - this.frame;
      this.frame = this.offset;

      const v = 1000 * delta / (1 + elapsed);
      this.velocity = 0.8 * v + 0.2 * this.velocity;
    };

    wrap = (x) => {
      const c = this.itemCount;
      return (x >= c) ? (x % c) : (x < 0) ? this.wrap(c + (x % c)) : x;
    };

    cycleTo = (n) => {
      const c = this.itemCount;
      let diff = (this.center % c) - n;

      /**
       * Account for Wraparound
       */
      if (!this.options.noWrap) {
        if (diff < 0 && (Math.abs(diff + c) < Math.abs(diff))) {
          diff += c;
        } else if (diff > 0 && (Math.abs(diff - c) < diff)) {
          diff -= c;
        }
      }

      /**
       * Cycle to Next or Previous Item
       */
      if (diff < 0) {
        this.nextHandler(Math.abs(diff))
      } else if (diff > 0) {
        this.prevHandler(diff);
      }
    };

    scroll = (x = 0) => {
      let el;
      let i = 0;
      let tweenOpacity;
      let zTranslation;
      this.setScrollTimeout();

      /**
       * Compute Scroll
       */
      this.lastCenter = this.center;
      this.offset = (typeof x === 'number') ? x : this.offset;
      this.center = Math.floor((this.offset + this.dim / 2) / this.dim);

      const delta = this.offset - this.center * this.dim;
      const dir = (delta < 0) ? 1 : -1;
      const tween = -dir * delta * 2 / this.dim;
      const half = this.itemCount >> 1;

      /**
       * Center Item Positioning
       */
      if (!this.options.noWrap || (this.center >= 0 && this.center < this.itemCount)) {
        el = this.items[this.wrap(this.center)];
        this.setActiveItem(el);

        this.renderTranslation(
          el,
          0,
          this.options.fullWidth ? 1 : 1 - 0.2 * tween,
          -delta / 2,
          this.options.zoomScale * tween,
          dir * this.options.shift * tween * i
        );
      }

      /**
       * Iterate through all slider items and position them
       */
      for (i = 1; i <= half; ++i) {
        /**
         * Right Items Positioning
         */
        if (this.options.fullWidth) {
          zTranslation = this.options.zoomScale;
          tweenOpacity = (i === half && delta < 0) ? 1 - tween : 1;
        } else {
          zTranslation = this.options.zoomScale * (i * 2 + tween * dir);
          tweenOpacity = 1 - 0.2 * (i * 2 + tween * dir);
        }

        if (!this.options.noWrap || this.center + i < this.itemCount) {
          el = this.items[this.wrap(this.center + i)];

          this.renderTranslation(
            el,
            -i,
            tweenOpacity,
            this.options.shift + (this.dim * i - delta) / 2,
            zTranslation
          );
        }

        /**
         * Left Items Positioning
         */
        if (this.options.fullWidth) {
          zTranslation = this.options.zoomScale;
          tweenOpacity = (i === half && delta > 0) ? 1 - tween : 1;
        } else {
          zTranslation = this.options.zoomScale * (i * 2 - tween * dir);
          tweenOpacity = 1 - 0.2 * (i * 2 - tween * dir);
        }

        /**
         * Hide Wrapped Items
         */
        if (!this.options.noWrap || this.center - i >= 0) {
          el = this.items[this.wrap(this.center - i)];

          this.renderTranslation(
            el,
            -i,
            tweenOpacity,
            -this.options.shift + (-this.dim * i - delta) / 2,
            zTranslation
          )
        }
      }

      /**
       * onCycleTo Callback
       */
      if (
        this.lastCenter !== this.center
        && typeof(this.options.onCycleTo) === 'function'
      ) {
        this.options.onCycleTo.call(this, this.activeItem, this.draggedY);
      }
    };

    setScrollTimeout = () => {
      this.scrolling = true;

      if (this.sliderContainer.classList.contains(this.options.scrollingClass)) {
        this.sliderContainer.classList.add(this.options.scrollingClass)
      }

      if (this.scrollingTimeout != null) {
        window.clearTimeout(this.scrollingTimeout);
      }

      this.scrollingTimeout = window.setTimeout(() => {
        this.scrolling = false;
        this.sliderContainer.classList.remove(this.options.scrollingClass);
      }, this.options.transitionDuration);
    };

    setActiveItem = (el) => {
      if (!el.classList.contains(this.options.activeItemClass)) {
        if (this.activeItem !== null) {
          this.activeItem.classList.remove(this.options.activeItemClass);
        }
        this.activeItem = el;
        this.activeItemIndex = this.getItemIndex(el);

        if (!this.activeItem.classList.contains(this.options.activeItemClass)) {
          this.activeItem.classList.add(this.options.activeItemClass);
        }
      }

      this.setActiveIndicator();
    };

    setActiveIndicator = () => {
      if (
        this.options.indicators
        && this.activeIndicator !== this.indicators[this.activeItemIndex]
      ) {
        this.activeIndicator.classList.remove(this.options.indicatorActiveClass);
        this.activeIndicator = this.indicators[this.activeItemIndex];
        this.activeIndicator.classList.add(this.options.indicatorActiveClass);
      }
    };

    renderTranslation = (el, zIndex, opacity, x1, z, x2 = null) => {
      let alignment = 'translateX(0)';
      if (!this.options.fullWidth) {
        const tX = (this.sliderContainer.clientWidth - this.itemDimensions.width) / 2;
        const tY = (this.sliderContainer.clientHeight - this.itemDimensions.height) / 2;
        alignment = `translateX(${tX}px) translateY(${tY}px)`;
      }

      let tx2 = '';
      if (x2 !== null) {
        tx2 = `translateX(${x2}px) `;
      }

      el.style[this.xForm] = `${alignment} translateX(${x1}px) ${tx2}translateZ(${z}px)`;
      el.style.zIndex = zIndex;
      el.style.opacity = opacity;
      el.style.display = 'block';
    };

    autoScroll = () => {
      if (this.amplitude) {
        const elapsed = Date.now() - this.timestamp;
        const delta = this.amplitude * Math.exp(-elapsed / this.options.transitionDuration);
        if (delta > 2 || delta < -2) {
          this.scroll(this.target - delta);
          requestAnimationFrame(this.autoScroll);
        } else {
          this.scroll(this.target);
        }
      }
    };

    next = () => {
      const i = this.activeItemIndex + 1;

      if (!this.options.noWrap || this.options.noWrap && i < this.itemCount) {
        this.cycleTo(i);
      }
    };

    prev = () => {
      const i = this.activeItemIndex - 1;

      if (!this.options.noWrap || this.options.noWrap && i >= 0) {
        this.cycleTo(i);
      }
    };

    set = (n) => this.cycleTo(n);
  }

  return MicroSlider;
});