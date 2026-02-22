import * as Sentry from "@sentry/node"

Sentry.init({
  dsn: "https://ecbccd9bdfec83cb2addd51032e7501d@o4510930266947584.ingest.de.sentry.io/4510930279530576",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
});