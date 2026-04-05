require 'rails_helper'

RSpec.describe "Comments", type: :request do
  let!(:user) do
    User.create!(
      email: 'comments_spec_user@example.com',
      password: 'password123',
      password_confirmation: 'password123',
      name: 'Comments Spec User',
      role: :general
    )
  end
  let!(:post_record) { Post.create!(user: user, title: 'sample', body: 'body', status: :published) }
  let!(:comment) { Comment.create!(user: user, post: post_record, body: 'comment') }

  describe "POST /posts/:post_id/comments" do
    it "redirects to sign in" do
      post post_comments_path(post_record), params: { comment: { body: 'new comment' } }
      expect(response).to have_http_status(:found)
    end
  end

  describe "DELETE /posts/:post_id/comments/:id" do
    it "redirects to sign in" do
      delete post_comment_path(post_record, comment)
      expect(response).to have_http_status(:found)
    end
  end
end
