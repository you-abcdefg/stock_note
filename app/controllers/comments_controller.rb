# ============================================
# CommentsController - コメント機能のコントローラー
# ============================================
# 【役割】
# 投稿に対するコメントの作成・削除を行う
# すべてのアクションでログイン必須
# ============================================

class CommentsController < ApplicationController
  # すべてのアクションでログイン必須
  before_action :authenticate_user!
  
  # コメント対象の投稿を取得
  before_action :set_post
  
  # 削除時はコメント自体も取得
  before_action :set_comment, only: [:destroy]

  # =====================================
  # コメントを作成（ログイン必須）
  # =====================================
  def create
    # 投稿に紐づけてコメントを作成
    @comment = @post.comments.build(comment_params)
    # コメント作成者をログイン中のユーザーに設定
    @comment.user = current_user
    
    if @comment.save # 保存成功
      redirect_to @post, notice: 'コメントを作成しました。'
    else # 保存失敗
      redirect_to @post, alert: 'コメント作成に失敗しました。'
    end
  end

  # =====================================
  # コメントを削除（自分のコメントまたは管理者のみ）
  # =====================================
  def destroy
    # 自分のコメント または 管理者のみ削除可能
    if @comment.user == current_user || current_user.admin?
      @comment.destroy
      redirect_to @post, notice: 'コメントを削除しました。'
    else # 権限がない場合
      redirect_to @post, alert: '権限がありません。'
    end
  end

  # =====================================
  # privateメソッド
  # =====================================
  private

  # コメント対象の投稿を取得
  def set_post
    # URLのpost_idから投稿を取得（例：/posts/1/comments）
    @post = Post.find(params[:post_id])
  end

  # 削除対象のコメントを取得
  def set_comment
    @comment = Comment.find(params[:id])
  end

  # 許可するパラメータを指定（セキュリティ対策）
  def comment_params
    # bodyだけを受け取る（コメント本文のみ）
    params.require(:comment).permit(:body)
  end
end
