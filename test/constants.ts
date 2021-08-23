interface FixtureResponse {
  ext: string;
  'content-type': string;
}
type Fixture = [string, FixtureResponse];

export const acceptAllFixtures: Fixture[] = [
  [
    'bmp/test.bmp',
    {
      ext: 'bmp',
      'content-type': 'image/bmp',
    },
  ],
  ['gif/test.gif', { ext: 'gif', 'content-type': 'image/gif' }],
  ['jpeg/test.jpg', { ext: 'jpeg', 'content-type': 'image/jpeg' }],
  ['png/test.png', { ext: 'png', 'content-type': 'image/png' }],
  ['svg/test.svg', { ext: 'svg', 'content-type': 'image/svg+xml' }],
  ['tiff/test.tiff', { ext: 'tiff', 'content-type': 'image/tiff' }],
  ['webp/test.webp', { ext: 'webp', 'content-type': 'image/webp' }],
  ['webp/animated.webp', { ext: 'webp', 'content-type': 'image/webp' }],
];

export const acceptWebpFixtures: Fixture[] = [
  [
    'bmp/test.bmp',
    {
      ext: 'bmp',
      'content-type': 'image/bmp',
    },
  ],
  ['gif/test.gif', { ext: 'webp', 'content-type': 'image/webp' }],
  ['jpeg/test.jpg', { ext: 'webp', 'content-type': 'image/webp' }],
  ['png/test.png', { ext: 'webp', 'content-type': 'image/webp' }],
  ['svg/test.svg', { ext: 'svg', 'content-type': 'image/svg+xml' }],
  ['tiff/test.tiff', { ext: 'webp', 'content-type': 'image/webp' }],
  ['webp/test.webp', { ext: 'webp', 'content-type': 'image/webp' }],
  ['webp/animated.webp', { ext: 'webp', 'content-type': 'image/webp' }],
];
