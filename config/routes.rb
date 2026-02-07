Rails.application.routes.draw do
  # Devise（ユーザー認証）
  devise_for :users

  # ゲストログイン
  post 'guest_sign_in', to: 'sessions#guest_sign_in'

  # トップページ
  root 'posts#index'

  # 投稿機能
  resources :posts do
    # 投稿に紐づくコメント
    resources :comments, only: [:create, :destroy]
    # 投稿に紐づくいいね
    resources :likes, only: [:create, :destroy], shallow: true
    
    # 投稿検索
    collection do
      get 'search' # キーワード検索
      get 'tagged/:tag', to: 'posts#tagged', as: :tagged # タグ検索
    end
  end

  # いいね一覧
  get 'likes', to: 'likes#index'

  # グループ（ジャンル）
  resources :groups do
    member do
      post 'join' # グループに参加
      delete 'leave' # グループから退出
    end
  end

  # ユーザー
  resources :users, only: [:index, :show] do
    collection do
      get 'search' # ユーザー検索
    end
  end

  # 管理者機能
  namespace :admin do
    resources :users, only: [:index, :show, :edit, :update, :destroy]
    resources :comments, only: [:index, :destroy]
  end
end
