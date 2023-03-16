/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const PATH = process.env.PATH.split(':')
  .filter((p) => !p.includes(process.env.TMPDIR))
  .join(':');

const nest = require.resolve('@nestjs/cli/bin/nest.js');

module.exports = {
  apps: [
    {
      name: 'support',
      cwd: __dirname,
      script: `${nest} start --debug=9190 --watch`,
      max_restarts: '1',
      min_uptime: '2m',
      env: {
        NODE_ENV: 'development',
        TS_NODE_TRANSPILE_ONLY: 'true',
        TS_NODE_FILES: 'true',
        PORT: '7100',
        PATH,
        SENTRY_ENV: 'local',
        SENTRY_DSN: process.env.SENTRY_DSN_SUPPPORT_PANEL,
        TRACING_SERVICE_NAME: 'fxa-support-panel',
      },
      filter_env: ['npm_'],
      watch: ['src'],
      time: true,
    },
  ],
};
