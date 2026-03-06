process.env.NODE_ENV = process.env.NODE_ENV || 'development'

const environment = require('./environment')
// environment: この行で使用する値を保持する変数

module.exports = environment.toWebpackConfig()
