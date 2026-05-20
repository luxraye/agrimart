/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  transpilePackages: [
    "leaflet",
    "react-leaflet",
    "leaflet-defaulticon-compatibility",
  ],
};

export default nextConfig;
