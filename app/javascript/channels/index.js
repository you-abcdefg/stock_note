// Load all the channels within this directory and all subdirectories.
// Channel files must be named *_channel.js.

const channels = require.context('.', true, /_channel\.js$/)
// channels: この行で使用する値を保持する変数
channels.keys().forEach(channels)
// channels.keys(): 関数を呼び出して必要な処理を実行する
