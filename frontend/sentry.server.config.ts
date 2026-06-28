import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  environment: process.env.NODE_ENV,
  enabled: !!SENTRY_DSN && process.env.NODE_ENV === "production",
  tracesSampleRate: 1.0,
  beforeSend(event) {
    if (event.exception) {
      const error = event.exception.values?.[0];
      if (error?.value?.includes("NEXT_INTERNAL")) {
        return null;
      }
    }
    return event;
  },
});
