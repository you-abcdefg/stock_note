process.env.NODE_ENV = process.env.NODE_ENV || 'development'

const environment = require('./environment')
// 「const environment = require('./environment');」: environmentを保持する変数

module.exports = environment.toWebpackConfig()
