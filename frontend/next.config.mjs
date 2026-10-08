import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Caminho base para arquitetura multi-produto (ex: avallmarketing.com.br/vallor)
  basePath: '/vallor',

  // Desativação total de Source Maps no navegador do cliente em produção
  productionBrowserSourceMaps: false,

  // Remoção de logs em produção para não expor telemetria interna
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },

  webpack: (config, { isServer, dev }) => {
    if (!dev) {
      // Impede geração de devtools / source maps
      config.devtool = false;

      // Ofuscação e otimização do pipeline de minificação do lado cliente
      if (!isServer && config.optimization && config.optimization.minimizer) {
        config.optimization.minimizer.forEach((minimizer) => {
          if (minimizer.constructor && minimizer.constructor.name === 'TerserPlugin') {
            minimizer.options.terserOptions = {
              ...minimizer.options.terserOptions,
              compress: {
                ...minimizer.options.terserOptions?.compress,
                drop_debugger: true,
                dead_code: true,
                passes: 2,
              },
              mangle: {
                toplevel: true,
                safari10: true,
              },
              format: {
                comments: false, // Remove comentários de código e licenças no bundle final
              },
            };
          }
        });
      }
    }
    return config;
  },

  async rewrites() {
    return [
      {
        source: '/api-backend/:path*',
        destination: 'http://187.127.10.166:3001/:path*',
      },
      {
        source: '/socket.io/:path*',
        destination: 'http://187.127.10.166:3001/socket.io/:path*',
      },
      {
        source: '/api-backend/:path*',
        destination: 'http://187.127.10.166:3001/:path*',
        basePath: false,
      },
      {
        source: '/socket.io/:path*',
        destination: 'http://187.127.10.166:3001/socket.io/:path*',
        basePath: false,
      },
    ];
  },

  async redirects() {
    return [
      {
        source: '/',
        destination: '/vallor',
        basePath: false,
        permanent: false,
      },
      {
        source: '/login',
        destination: '/vallor/login',
        basePath: false,
        permanent: false,
      },
      {
        source: '/settings/:path*',
        destination: '/vallor/settings/:path*',
        basePath: false,
        permanent: false,
      },
      {
        source: '/inbox/:path*',
        destination: '/vallor/inbox/:path*',
        basePath: false,
        permanent: false,
      },
      {
        source: '/dashboard/:path*',
        destination: '/vallor/dashboard/:path*',
        basePath: false,
        permanent: false,
      },
      {
        source: '/crm/:path*',
        destination: '/vallor/crm/:path*',
        basePath: false,
        permanent: false,
      },
      {
        source: '/super-admin/:path*',
        destination: '/vallor/super-admin/:path*',
        basePath: false,
        permanent: false,
      },
      {
        source: '/contacts/:path*',
        destination: '/vallor/contacts/:path*',
        basePath: false,
        permanent: false,
      },
      {
        source: '/contracts/:path*',
        destination: '/vallor/contracts/:path*',
        basePath: false,
        permanent: false,
      },
      {
        source: '/proposals/:path*',
        destination: '/vallor/proposals/:path*',
        basePath: false,
        permanent: false,
      },
      {
        source: '/support/:path*',
        destination: '/vallor/support/:path*',
        basePath: false,
        permanent: false,
      },
      {
        source: '/monitor/:path*',
        destination: '/vallor/monitor/:path*',
        basePath: false,
        permanent: false,
      },
      {
        source: '/integrations/:path*',
        destination: '/vallor/integrations/:path*',
        basePath: false,
        permanent: false,
      },
      {
        source: '/relatorio/:path*',
        destination: '/vallor/relatorio/:path*',
        basePath: false,
        permanent: false,
      },
      {
        source: '/team-chat/:path*',
        destination: '/vallor/team-chat/:path*',
        basePath: false,
        permanent: false,
      },
      {
        source: '/chat-interno/:path*',
        destination: '/vallor/chat-interno/:path*',
        basePath: false,
        permanent: false,
      },
      {
        source: '/email-inbox/:path*',
        destination: '/vallor/email-inbox/:path*',
        basePath: false,
        permanent: false,
      },
      {
        source: '/checklist/:path*',
        destination: '/vallor/checklist/:path*',
        basePath: false,
        permanent: false,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG || "avall",
  project: process.env.SENTRY_PROJECT || "javascript-nextjs",

  // Não quebrar o build caso o token de autenticação não esteja configurado
  dryRun: !process.env.SENTRY_AUTH_TOKEN,
  silent: true,

  // Não fazer upload de source maps ampliados
  widenClientFileUpload: false,

  // Oculta source maps dos bundles de clientes gerados
  hideSourceMaps: true,

  // Remove logs de Sentry para reduzir bundle e evitar exposição
  disableLogger: true,
});
