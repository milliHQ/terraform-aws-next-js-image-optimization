// inputFilename | outputContentType
type Fixture = [string, string];

export const acceptAllFixtures: Fixture[] = [
  // inputFilename | outputContentType
  ['avif/test.avif', 'image/avif'],
  ['bmp/test.bmp', 'image/bmp'],
  ['gif/test.gif', 'image/gif'],
  ['jpeg/test.jpg', 'image/jpeg'],
  ['png/test.png', 'image/png'],
  ['svg/test.svg', 'image/svg+xml'],
  ['tiff/test.tiff', 'image/tiff'],
  ['webp/test.webp', 'image/webp'],
  ['webp/animated.webp', 'image/webp'],
];

export const acceptWebpFixtures: Fixture[] = [
  // inputFilename | outputContentType
  ['avif/test.avif', 'image/webp'],
  ['bmp/test.bmp', 'image/bmp'],
  ['gif/test.gif', 'image/webp'],
  ['jpeg/test.jpg', 'image/webp'],
  ['png/test.png', 'image/webp'],
  ['svg/test.svg', 'image/svg+xml'],
  ['tiff/test.tiff', 'image/webp'],
  ['webp/test.webp', 'image/webp'],
  ['webp/animated.webp', 'image/webp'],
];
