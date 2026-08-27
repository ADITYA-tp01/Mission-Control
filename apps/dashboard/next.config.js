/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@truefoundry/trueforge-ui'],
  webpack(config) {
    // @openuidev/react-ui pulls in monaco-editor whose prebuilt ESM web
    // worker breaks webpack's minimizer. The chat surface never renders the
    // code editor, so resolve all monaco imports to an empty module.
    config.resolve.alias['monaco-editor'] = false
    return config
  },
}

module.exports = nextConfig
