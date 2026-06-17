/** @type {import('next').NextConfig} */
const nextConfig = {
  // Gera build autocontido (.next/standalone) para imagem Docker mínima
  output: "standalone",
  reactStrictMode: true,
};

export default nextConfig;
