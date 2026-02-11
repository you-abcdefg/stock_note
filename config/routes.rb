Rails.application.routes.draw do # ルーティング設定をここから開始する
  # Rails.application.routes.draw：Railsがルーティング定義を読み取る開始位置を示す
  # Devise（ユーザー認証）
  devise_for :users # Devise（ユーザー認証）用のルートを定義する
  # devise_for：Deviseが必要な認証ルート一式を自動定義する
  # :users：Userモデルに対する認証ルートを定義する

  # ゲストログイン
  post 'guest_sign_in', to: 'sessions#guest_sign_in' # ゲストログイン用のルートを定義する
  # post：このルートはPOSTリクエストだけを受け付ける
  # 'guest_sign_in'：このルートのURLパスを指定する
  # to: 'sessions#guest_sign_in'：SessionsControllerのguest_sign_inアクションを呼び出す

  # トップページ
  root 'pages#top' # トップページのルートを定義する
  # root：トップページに対応するルートを指定する
  # 'pages#top'：PagesControllerのtopアクションを表示する

  # ページ管理（About など）
  get 'about', to: 'pages#about' # Aboutページのルートを定義する
  # 'about'：このルートのURLパスを指定する
  # to: 'pages#about'：PagesControllerのaboutアクションを呼び出す

  # 投稿機能
  resources :posts do # 投稿機能のルートをまとめて定義する
    # resources：RESTfulルート（index/show/new/create/edit/update/destroy）を定義する
    # :posts：Postモデル向けのルートを定義する
    
    # 画像URL取得API（JavaScript用）
    collection do
      get 'image_url' # /posts/image_url?filename=... で画像URLを取得
    end
    
    # 投稿に紐づくコメント
    resources :comments, only: [:create, :destroy] # コメントの作成・削除ルートだけを定義する
    # only：指定したアクションだけを定義する
    # [:create, :destroy]：作成と削除のルートだけを定義する
    # 投稿に紐づくいいね
    resources :likes, only: [:create, :destroy], shallow: true # いいねの作成・削除ルートだけを定義する
    # shallow: true：ネストを浅くしてURLを簡潔にする
    
    # 投稿検索
    collection do
      # collection：一覧系の追加ルート（/posts/xxx）を定義する
      get 'search' # 投稿検索ルートを定義する
      # get：このルートはGETリクエストだけを受け付ける
      # 'search'：このルートのURLパスを指定する
      get 'tagged/:tag', to: 'posts#tagged', as: :tagged # タグ検索ルートを定義する
      # 'tagged/:tag'：tagというURLパラメータを受け取る
      # to: 'posts#tagged'：PostsControllerのtaggedアクションを呼び出す
      # as: :tagged：tagged_posts_pathというヘルパー名を付ける
    end
  end

  # いいね一覧
  get 'likes', to: 'likes#index' # いいね一覧のルートを定義する
  # 'likes'：このルートのURLパスを指定する
  # to: 'likes#index'：LikesControllerのindexアクションを呼び出す

  # グループ（ジャンル）
  resources :groups do # グループ（ジャンル）のルートを定義する
    # :groups：Groupモデル向けのルートを定義する
    member do
      # member：個別リソース向けの追加ルート（/groups/:id/xxx）を定義する
      post 'join' # グループ参加ルートを定義する
      # post 'join'：参加処理をPOSTで受け取る
      delete 'leave' # グループ退出ルートを定義する
      # delete 'leave'：退出処理をDELETEで受け取る
    end
  end

  # ユーザー
  get 'mypage', to: 'users#mypage' # マイページのルートを定義する
  # 'mypage'：このルートのURLパスを指定する
  # to: 'users#mypage'：UsersControllerのmypageアクションを呼び出す

  resources :users, only: [:index, :show, :edit, :update, :destroy] do # ユーザーのルートを定義する
    # only：指定したアクションだけを定義する
    collection do
      # collection：一覧系の追加ルート（/users/xxx）を定義する
      get 'search' # ユーザー検索ルートを定義する
      # 'search'：このルートのURLパスを指定する
    end
  end

  # タグ
  resources :tags, only: [:index] do # タグ一覧のルートを定義する
    # only：indexアクションだけを定義する
  end

  # 管理者機能
  namespace :admin do # 管理者機能のルートを定義する
    # namespace：/admin配下にルートとコントローラーを分離する
    resources :users # 管理者ユーザー管理のルートを定義する
    # 管理者ユーザー管理のルートを定義する
    resources :comments, only: [:index, :destroy] # 管理者コメント管理のルートを定義する
    # 管理者コメント管理のルートを定義する
  end
end
