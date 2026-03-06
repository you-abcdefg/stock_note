process.env.NODE_ENV = process.env.NODE_ENV || 'production'

const environment = require('./environment')
// 「const environment = require('./environment');」: environmentを保持する変数

module.exports = environment.toWebpackConfig()
