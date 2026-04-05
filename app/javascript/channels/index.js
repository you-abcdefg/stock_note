// Load all the channels within this directory and all subdirectories.
// Channel files must be named *_channel.js.

const channels = require.context('.', true, /_channel\.js$/)
// 「const channels = require.context('.', true, /_channel\.js$/);」: channelsを保持する変数
channels.keys().forEach(channels)
// 「channels.keys().forEach(【引数】);」: channels.keys().forEachを呼び出して必要な処理を実行する
