// ●Babel設定を環境に応じて組み立てる
module.exports = function(api) { // Babel設定を生成する関数をエクスポート
  // module.exports: CommonJSで外部に関数を公開するための窓口
  // function(api): Babelから渡されるAPIを受け取る関数

  var validEnv = ['development', 'test', 'production'] // 許可する環境名の一覧を定義
  // validEnv: 許可する環境名の配列
  // ['development', 'test', 'production']: 有効とみなすNODE_ENV/BABEL_ENVの候補

  var currentEnv = api.env() // 現在の環境名を取得
  // currentEnv: 現在の環境名
  // api.env(): Babel APIから環境名を取得する呼び出し

  var isDevelopmentEnv = api.env('development') // 開発環境かを判定
  // isDevelopmentEnv: development判定結果
  // api.env('development'): 引数と一致するかをBabel側で判定

  var isProductionEnv = api.env('production') // 本番環境かを判定
  // isProductionEnv: production判定結果
  // api.env('production'): 引数と一致するかをBabel側で判定

  var isTestEnv = api.env('test') // テスト環境かを判定
  // isTestEnv: test判定結果
  // api.env('test'): 引数と一致するかをBabel側で判定

  if (!validEnv.includes(currentEnv)) { // 不正な環境名ならエラーにする
    // if: 有効環境かどうかを判定する条件分岐
    throw new Error(
      'Please specify a valid `NODE_ENV` or ' +
        '`BABEL_ENV` environment variables. Valid values are "development", ' +
        '"test", and "production". Instead, received: ' +
        JSON.stringify(currentEnv) +
        '.'
    )
    // throw: 設定生成を中断するため例外を発生させる
    // new Error(...): エラーメッセージを持つ例外オブジェクトを作成する
    // JSON.stringify(currentEnv): 受け取った環境名を文字列化して表示する
  }

  // ●プリセットとプラグインを含む設定オブジェクトを返す
  return {
    // return: 呼び出し元へ設定を返す
    // { ... }: presetsとpluginsをまとめた設定本体

    presets: [ // 環境ごとのプリセット設定を定義
      // presets: Babelが使用するプリセット配列
      isTestEnv && [ // test環境のときだけプリセットを有効化
        // isTestEnv: test環境かどうかの判定結果
        // [ ... ]: test環境向けプリセット定義
        '@babel/preset-env', // test環境用にpreset-envを使用
        // '@babel/preset-env': 実行環境に合わせて変換を行うプリセット
        {
          targets: {
            node: 'current' // テスト実行中のNode.jsをターゲットにする
            // node: 変換ターゲットとしてNode.jsを指定
            // 'current': 実行中のNode.jsバージョンを使う
          }
          // targets: 変換対象環境を指定するオプション
        }
      ],
      (isProductionEnv || isDevelopmentEnv) && [ // 本番または開発のときだけ有効化
        // isProductionEnv || isDevelopmentEnv: 本番・開発どちらかを判定
        // [ ... ]: 本番・開発向けプリセット定義
        '@babel/preset-env', // 本番・開発用にpreset-envを使用
        // '@babel/preset-env': 実行環境に合わせて変換を行うプリセット
        {
          forceAllTransforms: true, // すべての変換を強制する
          // forceAllTransforms: 変換を強制適用するフラグ
          useBuiltIns: 'entry', // polyfillの注入方法を指定
          // useBuiltIns: core-jsの挿入方式を指定する設定
          // 'entry': エントリーポイントで一括導入する方式
          corejs: 3, // core-jsのバージョンを指定
          // corejs: 利用するcore-jsのメジャーバージョン
          modules: false, // ESモジュール変換を無効化
          // modules: モジュール変換の有無を制御する設定
          exclude: ['transform-typeof-symbol'] // 特定の変換を除外
          // exclude: 適用しない変換名の一覧
          // 'transform-typeof-symbol': 除外する変換の識別子
        }
      ]
    ].filter(Boolean), // 無効化された要素を取り除く
    // .filter(Boolean): false相当の要素を配列から除外する

    plugins: [ // 追加の変換プラグインを定義
      // plugins: Babelが使用するプラグイン配列
      'babel-plugin-macros', // マクロ機能を有効化
      // 'babel-plugin-macros': ビルド時マクロを扱うプラグイン
      '@babel/plugin-syntax-dynamic-import', // dynamic import構文を有効化
      // '@babel/plugin-syntax-dynamic-import': 動的import構文の解析を有効化
      isTestEnv && 'babel-plugin-dynamic-import-node', // test環境で動的importをNode向けに変換
      // isTestEnv: test環境かどうかの判定結果
      // 'babel-plugin-dynamic-import-node': dynamic importをNodeで動く形に変換
      '@babel/plugin-transform-destructuring', // 分割代入の変換を行う
      // '@babel/plugin-transform-destructuring': 分割代入を旧環境向けに変換
      [
        '@babel/plugin-proposal-class-properties', // クラスフィールドを変換
        // '@babel/plugin-proposal-class-properties': クラスプロパティ構文を変換
        {
          loose: true // 互換性よりも簡略な変換を優先
          // loose: 変換の厳密さを調整する設定
        }
      ],
      [
        '@babel/plugin-proposal-object-rest-spread', // オブジェクトのrest/spreadを変換
        // '@babel/plugin-proposal-object-rest-spread': rest/spread構文を変換
        {
          useBuiltIns: true // ビルトイン実装を活用する
          // useBuiltIns: 既存のビルトインを利用する設定
        }
      ],
      [
        '@babel/plugin-transform-private-methods', // privateメソッドを変換
        // '@babel/plugin-transform-private-methods': privateメソッド構文を変換
        {
          loose: true // 互換性よりも簡略な変換を優先
          // loose: 変換の厳密さを調整する設定
        }
      ],
      [
        '@babel/plugin-transform-private-property-in-object', // privateプロパティ判定を変換
        // '@babel/plugin-transform-private-property-in-object': privateプロパティのin演算子対応
        {
          loose: true // 互換性よりも簡略な変換を優先
          // loose: 変換の厳密さを調整する設定
        }
      ],
      [
        '@babel/plugin-transform-runtime', // ヘルパー関数の重複を避ける
        // '@babel/plugin-transform-runtime': 変換ヘルパーを共通化する
        {
          helpers: false // helpersの自動注入を無効化
          // helpers: 変換ヘルパーの扱いを制御する設定
        }
      ],
      [
        '@babel/plugin-transform-regenerator', // generator/async変換を制御
        // '@babel/plugin-transform-regenerator': regeneratorを使った変換を制御
        {
          async: false // async変換を無効化
          // async: async関数変換の有無を指定する設定
        }
      ]
    ].filter(Boolean) // 無効化された要素を取り除く
    // .filter(Boolean): false相当の要素を配列から除外する
  }
}
