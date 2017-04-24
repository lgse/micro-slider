# micro-slider

[![version](https://img.shields.io/badge/Version-1.0.3-green.svg)](https://npmjs.org/package/micro-slider)
[![license](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://raw.githubusercontent.com/lgse/micro-slider/master/LICENSE)

https://github.com/lgse/micro-slider

Lightweight, Responsive, Touch Friendly, Dependency-Free JavaScript Slider with Hardware Accelerated Transitions.

## About

**micro-slider** is a light weight carousel library with hardware accelerated transitions.

## Features
- Responsive
- Touch Friendly for Mobile Devices
- Small size, less than 12kb minified/gzipped
- Support to RequireJS/CommonJS and global definition
- Uses [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame) for animations

## Demo
[Demo here](https://lgse.github.io/micro-slider)

## Install
```sh
npm install --save micro-slider
```
## Usage within a Webpack / Gulp context
You can import it using either require or import syntax:
```javascript
// ES6 Syntax
import MicroSlider from 'micro-slider';
const slider = new MicroSlider('.micro-slider', {...options...});
 
// RequireJS / CommonJS
var MicroSlider = require('micro-slider');
var slider = new MicroSlider('.micro-slider', {...options...});
```

## Usage within a web page context
##### 1. Include micro-slider located in the dist folder
```html
<link rel="stylesheet" href="micro-slider.css">
<script type="text/javascript" src="micro-slider.min.js"></script>
```
##### 2. Add markup
```html
// These are the default class names for container/children
<div class="micro-slider">
  <div class="slider-item"></div>
  <div class="slider-item"></div>
  <div class="slider-item"></div>
</div>
```
##### 3. Call micro-slider on document load
```html
<script type="text/javascript">
window.onload = function () {
  // You can use any CSS selector to instantiate the slider
  // You can also pass it an HTML Element
  new MicroSlider('.micro-slider', {...options...});
}
</script>
```

## Methods
##### Go to Next / Previous Slide
```javascript
var slider = new MicroSlider(...);

// This would make the slider move onto the next element
document.getElementById('next').addEventListener(function (e) {
  slider.next();
});

// This would make the slider move onto the previous element
document.getElementById('previous').addEventListener(function (e) {
  slider.previous();
});
```

##### Go to Slide
```javascript
// This would set the slider to the 3rd element.
var slider = new MicroSlider(...);
slider.set(3);
```

### Available Options

Here is the list of available values to customize how your slider is going to work:

- **activeItemClass**: <String> Class appended to the active item.
- **fullWidth**: <Bool> The carousel can be in full width mode which removes the 3d perspective and makes it flat.
- **indicators**: <Bool> Optional indicators to show which slide you are one.
- **indicatorActiveClass**: <String> Class appended to the active indicator item.
- **indicatorContainerClass**: <String> Class appended to the indicator container.
- **indicatorContainerTag**: <String> Indicator container element tag.
- **indicatorItemClass**: <String> Class appended to the indicators.
- **indicatorItemTag**: <String> Indicator element tag.
- **noWrap**: <Bool> Whether the carousel items continuously wrap around or not.
- **onCycleTo**: <Function> Callback function for when the carousel has cycled to the next element.
- **padding**: <Number> Padding between items.
- **shift**: <Number> Carousel item offset.
- **sliderClass**: <String> Class appended to carousel item container.
- **sliderItemClass**: <String> Class appended to carousel items.
- **transitionDuration**: <Number> Transition duration in milliseconds.
- **zoomScale**: <Number> Carousel perspective zoom scale.


### Default values

```js
{
  activeItemClass: 'active',
  fullWidth: false,
  indicators: false,
  indicatorActiveClass: 'active',
  indicatorContainerClass: 'indicators',
  indicatorContainerTag: 'ul',
  indicatorItemClass: 'indicator',
  indicatorItemTag: 'li',
  indicatorText: '&bull;',
  initializedClass: 'initialized',
  noWrap: false,
  onCycleTo: null,
  padding: 0,
  scrollingClass: 'scrolling',
  shift: 0,
  sliderClass: 'micro-slider',
  sliderItemClass: 'slider-item',
  transitionDuration: 250,
  zoomScale: -100,
}
```

## API
### Available methods:

- `next()` Switches displaying item to the next one.
- `prev()` Switches displaying item to the previous one.
- `set(index)` Changes image to a given `index` value.


## License

MIT © [LGSE Ltd.](http://www.lgse.com)
