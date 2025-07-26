import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  devServer: {
    allowedDevOrigins: [
      "https://6000-firebase-studio-1753557456921.cluster-a6zx3cwnb5hnuwbgyxmofxpkfe.cloudworkstations.dev"
    ]
  }
};

export default nextConfig;
