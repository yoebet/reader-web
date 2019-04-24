// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

// const ServerRoot = 'http://localhost:3000';
const ServerRoot = 'https://39.105.209.195';

export const environment = {
  production: false,
  apiBase: `${ServerRoot}/api-b`,
  // staticBase: ServerRoot,
  staticBase: `http://localhost:3000/api-b`,
  httpHeaders: {
    'X-UT': 'grMmqX5wDJsQKDs2oF7KxK'
  }
};
