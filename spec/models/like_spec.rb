require 'rails_helper'

RSpec.describe Like, type: :model do
  let!(:user) do
    User.create!(
      email: 'like_model_user@example.com',
      password: 'password123',
      password_confirmation: 'password123',
      name: 'Like Model User',
      role: :general
    )
  end
  let!(:post_record) { Post.create!(user: user, title: 'sample', body: 'body', status: :published) }

  it 'is valid with user and post' do
    like = described_class.new(user: user, post: post_record)
    expect(like).to be_valid
  end

  it 'is invalid when user likes the same post twice' do
    described_class.create!(user: user, post: post_record)
    duplicate = described_class.new(user: user, post: post_record)

    expect(duplicate).not_to be_valid
    expect(duplicate.errors[:user_id]).to be_present
  end
end
