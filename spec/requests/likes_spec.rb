require 'rails_helper'

RSpec.describe "Likes", type: :request do
  let!(:user) do
    User.create!(
      email: 'likes_spec_user@example.com',
      password: 'password123',
      password_confirmation: 'password123',
      name: 'Likes Spec User',
      role: :general
    )
  end
  let!(:post_record) { Post.create!(user: user, title: 'sample', body: 'body', status: :published) }
  let!(:like) { Like.create!(user: user, post: post_record) }

  describe "POST /posts/:post_id/likes" do
    it "redirects to sign in" do
      post post_likes_path(post_record)
      expect(response).to have_http_status(:found)
    end
  end

  describe "DELETE /posts/:post_id/likes/:id" do
    it "redirects to sign in" do
      delete like_path(like)
      expect(response).to have_http_status(:found)
    end
  end
end
