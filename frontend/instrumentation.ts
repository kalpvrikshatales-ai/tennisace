export async function register() {
  if (process.env.NEXT_ENV === "server") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_ENV === "client") {
    await import("./sentry.client.config");
  }
}
