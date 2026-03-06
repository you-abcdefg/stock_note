process.env.NODE_ENV = process.env.NODE_ENV || 'production'

const environment = require('./environment')
// environment: この行で使用する値を保持する変数

module.exports = environment.toWebpackConfig()
