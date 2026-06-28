import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default withSentryConfig(
  nextConfig,
  {
    org: "tennisace",
    project: "frontend",
    authToken: process.env.SENTRY_AUTH_TOKEN,
    silent: true,
    widenClientFileUpload: true,
    transpileClientSDK: true,
    tunnelRoute: "/monitoring",
    hideSourceMaps: true,
  }
);
