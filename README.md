<div align=center>

# [THR2PXL]

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Release](https://github.com/d3p1/thr2pxl/actions/workflows/release.yml/badge.svg)](https://github.com/d3p1/thr2pxl/actions/workflows/release.yml)
[![semantic-release: angular](https://img.shields.io/badge/semantic--release-angular-e10079?logo=semantic-release)](https://github.com/semantic-release/semantic-release)

</div>

## Introduction

An efficient model-to-pixel transformation with motion effects, leveraging WebGL's hardware acceleration and [GPGPU](https://en.wikipedia.org/wiki/General-purpose_computing_on_graphics_processing_units) through [Three.js](https://threejs.org/):

<div align="center">

![Demo](https://raw.githubusercontent.com/d3p1/thr2pxl/main/doc/media/demo.gif)

</div>

> [!TIP]
> If you would like to implement a similar effect on a 2D image, you can use the related library [`d3p1/img2pxl`](https://github.com/d3p1/img2pxl).

> [!NOTE]
> This library was inspired by these excellent tutorial:
> - [Three.js Journey - GPGPU Flow Field Particles](https://threejs-journey.com/lessons/gpgpu-flow-field-particles-shaders).

## Installation

You can install this library using a package manager like `npm`:

```javascript
npm install @d3p1/thr2pxl
```

Or you can use a CDN like [jsDelivr](https://www.jsdelivr.com/) and this [importmap](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script/type/importmap) in the `<head>` of your `html` file:

```html
<head>
  ...
  <script type="importmap">
    {
      "imports": {
        "@d3p1/thr2pxl": "https://cdn.jsdelivr.net/npm/@d3p1/thr2pxl@<version>/dist/thr2pxl.min.js",
        "three": "https://cdn.jsdelivr.net/npm/three@<version>/build/three.module.min.js",
        "tweakpane": "https://cdn.jsdelivr.net/npm/tweakpane@<version>/dist/tweakpane.min.js"
      }
    }
  </script>
  ...
</head>
```

> [!NOTE]
> Remember to replace the `<version>` with the actual version of `thr2pxl` and its peer dependencies ([`three`](https://github.com/mrdoob/three.js) and [`tweakpane`](https://github.com/cocopon/tweakpane)). To do that, you can check the [`package.json`](https://github.com/d3p1/thr2pxl/blob/main/package.json) of the last release and get required versions from there.

## Usage

Using this library is straightforward:

1. Go to our [builder page](https://d3p1.github.io/thr2pxl/) and make the desired customizations in the tweak panel to achieve the desired effect.

2. Use the `Copy` button to obtain the configuration that produces the desired effect.

3. Instantiate the library with the configuration copied in the previous step, for example:

```javascript
import Thr2pxl from '@d3p1/thr2pxl'

new Thr2pxl({
  models: {
    0: {
      src: {
        highPoly: <model-high-poly-src>,
        lowPoly: <model-low-poly-src>
      },
      width: <model-width>,
      height: <model-height>,
      point: {
        size: 5,
        motion: {
          frequency: 0.1,
          strength: 1.5,
          ratio: 0.25,
          lifeDecay: 0.2
        }
      }
    },
  },
  pointer: {
    strength: 0.2,
    minRad: 1,
    maxRad: 2,
    pulseStrength: 0.2,
    pulseFrequency: 1
  }
})
```

> [!NOTE]
> To gain a deeper understanding of how to use this library and how it works under the hood, visit the [wiki page](https://github.com/d3p1/thr2pxl/wiki) _(in progress)_.

## Changelog

Detailed changes for each release are documented in [`CHANGELOG.md`](./CHANGELOG.md).

## License

This work is published under [MIT License](./LICENSE).

## Author

Always happy to receive a greeting on:

- [LinkedIn](https://www.linkedin.com/in/cristian-marcelo-de-picciotto/)
- [Web](https://d3p1.dev/)