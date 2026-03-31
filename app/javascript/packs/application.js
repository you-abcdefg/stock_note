// This file is automatically compiled by Webpack, along with any other files
// present in this directory. You're encouraged to place your actual application logic in
// a relevant structure within app/javascript and only use these pack files to reference
// that code so it'll be compiled.

import Rails from "@rails/ujs"
import Turbolinks from "turbolinks"
import * as ActiveStorage from "@rails/activestorage"
import "channels"
import "../posts_editor_main"
import "../posts_editor" // posts_editor.jsを明示的にimport

Rails.start()
// 「Rails.start(【引数】);」: Rails.startを呼び出して必要な処理を実行する
Turbolinks.start()
// 「Turbolinks.start(【引数】);」: Turbolinks.startを呼び出して必要な処理を実行する
ActiveStorage.start()
// 「ActiveStorage.start(【引数】);」: ActiveStorage.startを呼び出して必要な処理を実行する


// Turbo/Turbolinks両対応: グローバル初期化イベント
document.addEventListener('turbolinks:load', () => {
	if (window.initContentEditableEditor) {
		window.initContentEditableEditor();
	}
});
document.addEventListener('turbo:load', () => {
	if (window.initContentEditableEditor) {
		window.initContentEditableEditor();
	}
});

const restoreDisabledSubmitButtons = () => {
	document.querySelectorAll('form input[type="submit"][disabled], form button[type="submit"][disabled]').forEach((button) => {
		button.disabled = false;
	});
};

document.addEventListener('turbolinks:load', restoreDisabledSubmitButtons);
document.addEventListener('turbo:load', restoreDisabledSubmitButtons);
window.addEventListener('pageshow', restoreDisabledSubmitButtons);
