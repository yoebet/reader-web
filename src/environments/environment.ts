// const ServerRoot = 'http://localhost:3000';
// const ServerRoot = 'http://192.168.0.104:3000';
// const ServerRoot = 'https://39.105.209.195';
const ServerRoot = 'http://yuwen-reading.net';

export const environment = {
  production: false,
  apiBase: `${ServerRoot}/api-b`,
  webAppBase: `${ServerRoot}/ww`,
  staticBase: ServerRoot,
  // staticBase: `${ServerRoot}/api-b`,
  httpHeaders: {
    'X-UT': 'grMmqX5wDJsQKDs2oF7KxK'
  }
};

/*
export const environment = {
  production: true,
  apiBase: '/api-b',
  staticBase: '',
  httpHeaders: {}
};
*/
