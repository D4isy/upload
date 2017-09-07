var path = require('path'),
    rootPath = path.normalize(__dirname + '/..'),
    env = process.env.NODE_ENV || 'development';

var config = {
  development: {
    root: rootPath,
    app: {
      name: 'uploads'
    },
    port: process.env.PORT || 3000,
    db: 'mongodb://localhost:27017/uploadTest'
  },

  test: {
    root: rootPath,
    app: {
      name: 'uploads'
    },
    port: process.env.PORT || 3000,
    db: 'mongodb://localhost/uploads-test'
  },

  production: {
    root: rootPath,
    app: {
      name: 'uploads'
    },
    port: process.env.PORT || 3000,
    db: 'mongodb://localhost/uploads-production'
  }
};

module.exports = config[env];
