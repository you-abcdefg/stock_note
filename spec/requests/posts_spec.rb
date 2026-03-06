require 'rails_helper'

RSpec.describe "Posts", type: :request do
  let!(:user) do
    User.create!(
      email: 'request_spec_user@example.com',
      password: 'password123',
      password_confirmation: 'password123',
      name: 'Request Spec User',
      role: :general
    )
  end
  let!(:post_record) { Post.create!(user: user, title: 'sample', body: 'body', status: :published) }

  describe "GET /posts" do
    it "returns http success" do
      get "/posts"
      expect(response).to have_http_status(:success)
    end
  end

  describe "GET /posts/:id" do
    it "returns http success" do
      get "/posts/#{post_record.id}"
      expect(response).to have_http_status(:success)
    end
  end

  describe "GET /posts/new" do
    it "redirects to sign in" do
      get new_post_path
      expect(response).to have_http_status(:found)
    end
  end

  describe "POST /posts" do
    it "redirects to sign in" do
      post posts_path, params: { post: { title: 'new', body: 'body', status: :published } }
      expect(response).to have_http_status(:found)
    end
  end

  describe "GET /posts/:id/edit" do
    it "redirects to sign in" do
      get edit_post_path(post_record)
      expect(response).to have_http_status(:found)
    end
  end

  describe "PATCH /posts/:id" do
    it "redirects to sign in" do
      patch post_path(post_record), params: { post: { title: 'updated' } }
      expect(response).to have_http_status(:found)
    end
  end

  describe "DELETE /posts/:id" do
    it "redirects to sign in" do
      delete post_path(post_record)
      expect(response).to have_http_status(:found)
    end
  end
end
