import Image from 'next/image';
import ViewSource from '../components/view-source';

// Pixel GIF code adapted from https://stackoverflow.com/a/33919020/266535
const keyStr =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

const triplet = (e1, e2, e3) =>
  keyStr.charAt(e1 >> 2) +
  keyStr.charAt(((e1 & 3) << 4) | (e2 >> 4)) +
  keyStr.charAt(((e2 & 15) << 2) | (e3 >> 6)) +
  keyStr.charAt(e3 & 63);

const rgbDataURL = (r, g, b) =>
  `data:image/gif;base64,R0lGODlhAQABAPAA${
    triplet(0, r, g) + triplet(b, 255, 255)
  }/yH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==`;

const Color = () => (
  <div>
    <ViewSource pathname="pages/color.js" />
    <h1>Image Component With Color Data URL</h1>
    <Image
      alt="Dog"
      src="/dog.jpeg"
      placeholder="blur"
      blurDataURL={rgbDataURL(237, 181, 6)}
      width={750}
      height={1000}
    />
    <Image
      alt="Cat"
      src="/cat.jpeg"
      placeholder="blur"
      blurDataURL={rgbDataURL(2, 129, 210)}
      width={750}
      height={1000}
    />
  </div>
);

export default Color;
