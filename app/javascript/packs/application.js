// This file is automatically compiled by Webpack, along with any other files
// present in this directory. You're encouraged to place your actual application logic in
// a relevant structure within app/javascript and only use these pack files to reference
// that code so it'll be compiled.

import Rails from "@rails/ujs"
import Turbolinks from "turbolinks"
import * as ActiveStorage from "@rails/activestorage"
import "channels"
import "../posts_editor"

Rails.start()
// Rails.start(): 関数を呼び出して必要な処理を実行する
Turbolinks.start()
// Turbolinks.start(): 関数を呼び出して必要な処理を実行する
ActiveStorage.start()
// ActiveStorage.start(): 関数を呼び出して必要な処理を実行する
