source 'https://rubygems.org'
# source：Gemの取得元を指定する
# 'https://rubygems.org'：公式のRubyGemsサーバー
git_source(:github) { |repo| "https://github.com/#{repo}.git" }
# git_source：GitHubから取得するgemのURLを定義する
# :github：GitHub用の識別子
# { |repo| "https://github.com/#{repo}.git" }：リポジトリ名からURLを生成する

ruby '3.1.2'
# ruby：使用するRubyのバージョンを指定する
# '3.1.2'：実行環境のRubyバージョン

# ●Bundle edge Rails instead: gem 'rails', github: 'rails/rails', branch: 'main'
gem 'rails', '~> 6.1.7', '>= 6.1.7.10' # Rails本体
# gem：依存ライブラリを追加する
# 'rails'：Rails本体のgem名
# '~> 6.1.7'：許容するRailsのバージョン範囲
# '>= 6.1.7.10'：最低バージョン指定
# ●Use sqlite3 as the database for Active Record
gem 'sqlite3', '~> 1.4' # SQLite3用のgem
# gem：依存ライブラリを追加する
# 'sqlite3'：SQLite3用のgem名
# '~> 1.4'：許容するバージョン範囲
# ●Use Puma as the app server
gem 'puma', '~> 3.11' # アプリサーバー
# gem：依存ライブラリを追加する
# 'puma'：アプリサーバーのgem名
# '~> 3.11'：許容するバージョン範囲
# ●Use SCSS for stylesheets
gem 'sass-rails', '>= 6' # Sass用のgem
# gem：依存ライブラリを追加する
# 'sass-rails'：Sass用のgem名
# '>= 6'：最低バージョン指定
# ●Transpile app-like JavaScript. Read more: https://github.com/rails/webpacker
gem 'webpacker', '~> 5.0' # Webpacker用のgem
# gem：依存ライブラリを追加する
# 'webpacker'：Webpacker用のgem名
# '~> 5.0'：許容するバージョン範囲
# ●Turbolinks makes navigating your web application faster. Read more: https://github.com/turbolinks/turbolinks
gem 'turbolinks', '~> 5' # Turbolinks用のgem
# gem：依存ライブラリを追加する
# 'turbolinks'：Turbolinks用のgem名
# '~> 5'：許容するバージョン範囲
# ●Build JSON APIs with ease. Read more: https://github.com/rails/jbuilder
gem 'jbuilder', '~> 2.7' # JSON構築用のgem
# gem：依存ライブラリを追加する
# 'jbuilder'：JSON構築用のgem名
# '~> 2.7'：許容するバージョン範囲
# ●Use Redis adapter to run Action Cable in production
# gem 'redis', '~> 4.0'
# ●Use Active Model has_secure_password
# gem 'bcrypt', '~> 3.1.7'

# ●Use Active Storage variant
# gem 'image_processing', '~> 1.2'

# ●Reduces boot times through caching; required in config/boot.rb
gem 'bootsnap', '>= 1.4.4', require: false # 起動時間短縮用のgem
# gem：依存ライブラリを追加する
# 'bootsnap'：起動時間短縮用のgem名
# '>= 1.4.4'：最低バージョン指定
# require: false：自動requireを無効にする

group :development, :test do
# group：指定環境にだけ適用する
# :development, :test：開発とテスト環境
  # ●Call 'byebug' anywhere in the code to stop execution and get a debugger console
  gem 'byebug', platforms: [:mri, :mingw, :x64_mingw] # デバッガ用のgem
  # gem：依存ライブラリを追加する
  # 'byebug'：デバッガ用のgem名
  # platforms：対応プラットフォームを指定する
end
# end：groupブロックを終了する

group :development do
# group：指定環境にだけ適用する
# :development：開発環境
  # ●Access an interactive console on exception pages or by calling 'console' anywhere in the code.
  gem 'web-console', '>= 4.1.0' # ブラウザでコンソールを使うgem
  # gem：依存ライブラリを追加する
  # 'web-console'：ブラウザでコンソールを使うgem名
  # '>= 4.1.0'：最低バージョン指定
  # ●Display performance information such as SQL time and flame graphs for each request in your browser.
  # Can be configured to work on production as well see: https://github.com/MiniProfiler/rack-mini-profiler/blob/master/README.md
  gem 'rack-mini-profiler', '~> 2.0' # 性能計測用のgem
  # gem：依存ライブラリを追加する
  # 'rack-mini-profiler'：性能計測用のgem名
  # '~> 2.0'：許容するバージョン範囲
  gem 'listen', '~> 3.3' # ファイル変更監視用のgem
  # gem：依存ライブラリを追加する
  # 'listen'：ファイル変更監視用のgem名
  # '~> 3.3'：許容するバージョン範囲
  # ●Spring speeds up development by keeping your application running in the background. Read more: https://github.com/rails/spring
  gem 'spring', '4.2.1' # アプリ高速化用のgem
  # gem：依存ライブラリを追加する
  # 'spring'：アプリ高速化用のgem名
  # '4.2.1'：固定バージョン指定
end
# end：groupブロックを終了する

group :test do
# group：指定環境にだけ適用する
# :test：テスト環境
  # ●Adds support for Capybara system testing and selenium driver
  gem 'capybara', '>= 3.26' # E2Eテスト用のgem
  # gem：依存ライブラリを追加する
  # 'capybara'：E2Eテスト用のgem名
  # '>= 3.26'：最低バージョン指定
  gem 'selenium-webdriver', '>= 4.0.0.rc1' # ブラウザ自動操作用のgem
  # gem：依存ライブラリを追加する
  # 'selenium-webdriver'：ブラウザ自動操作用のgem名
  # '>= 4.0.0.rc1'：最低バージョン指定
  # ●Easy installation and use of web drivers to run system tests with browsers
  gem 'webdrivers' # WebDriver管理用のgem
  # gem：依存ライブラリを追加する
  # 'webdrivers'：WebDriver管理用のgem名
end
# end：groupブロックを終了する

# ●Windows does not include zoneinfo files, so bundle the tzinfo-data gem
gem 'tzinfo-data', platforms: [:mingw, :mswin, :x64_mingw, :jruby] # Windows用タイムゾーンデータ
# gem：依存ライブラリを追加する
# 'tzinfo-data'：Windows用タイムゾーンデータ
# platforms：対象プラットフォームを指定する
gem 'rspec-rails', group: [:development, :test] # RSpec用のgem
# gem：依存ライブラリを追加する
# 'rspec-rails'：RSpec用のgem名
# group：対象環境を指定する
gem 'rubocop', require: false # 静的解析用のgem
# gem：依存ライブラリを追加する
# 'rubocop'：静的解析用のgem名
# require: false：自動requireを無効にする
gem 'pry-rails', group: :development # PryをRailsで使うgem
# gem：依存ライブラリを追加する
# 'pry-rails'：PryをRailsで使うgem名
# group: :development：開発環境のみ適用
gem 'devise' # 認証機能のgem
# gem：依存ライブラリを追加する
# 'devise'：認証機能のgem名
gem 'devise-i18n' # Deviseの日本語対応
# gem：依存ライブラリを追加する
# 'devise-i18n'：Deviseの日本語対応
gem 'rails-i18n' # Railsの国際化対応
# gem：依存ライブラリを追加する
# 'rails-i18n'：Railsの国際化対応
gem 'kaminari' # ページネーション用
# gem：依存ライブラリを追加する
# 'kaminari'：ページネーション用
gem 'ransack' # 検索機能用
# gem：依存ライブラリを追加する
# 'ransack'：検索機能用
gem 'acts-as-taggable-on', '~> 10.0' # タグ機能用
# gem：依存ライブラリを追加する
# 'acts-as-taggable-on'：タグ機能用
# '~> 10.0'：許容するバージョン範囲
# ●Markdownレンダリング用
gem 'redcarpet' # MarkdownをHTMLへ変換するライブラリ
# gem：Gemfileに依存ライブラリを追加する
# 'redcarpet'：MarkdownをHTMLへ変換するライブラリ名
# ●コードブロックのシンタックスハイライト用
gem 'rouge' # コードブロックの色付けを行うライブラリ
# gem：Gemfileに依存ライブラリを追加する
# 'rouge'：コードブロックの色付けを行うライブラリ名

# --------------------開発環境用のgem--------------------
gem 'dotenv-rails' # .env から環境変数を読み込む
# gem：依存ライブラリを追加する
# 'dotenv-rails'：.env から環境変数を読み込む
group :production do
  gem 'mysql2' # 本番環境のDBアダプター
  # gem：依存ライブラリを追加する
  # 'mysql2'：本番環境のDBアダプター
end
gem "net-smtp" # SMTPでメール送信を行うライブラリ
# gem：依存ライブラリを追加する
# 'net-smtp'：SMTPでメール送信を行うライブラリ
gem "net-pop" # POP3でメール受信を行うライブラリ
# gem：依存ライブラリを追加する
# 'net-pop'：POP3でメール受信を行うライブラリ
gem "net-imap" # IMAPでメール受信を行うライブラリ
# gem：依存ライブラリを追加する
# 'net-imap'：IMAPでメール受信を行うライブラリ
# --------------------開発環境用のgem--------------------