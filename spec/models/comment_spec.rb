require 'rails_helper'

RSpec.describe Comment, type: :model do
  let!(:user) do
    User.create!(
      email: 'comment_model_user@example.com',
      password: 'password123',
      password_confirmation: 'password123',
      name: 'Comment Model User',
      role: :general
    )
  end
  let!(:post_record) { Post.create!(user: user, title: 'sample', body: 'body', status: :published) }

  it 'is valid with body, user, and post' do
    comment = described_class.new(body: 'comment', user: user, post: post_record)
    expect(comment).to be_valid
  end

  it 'is invalid without body' do
    comment = described_class.new(body: nil, user: user, post: post_record)
    expect(comment).not_to be_valid
    expect(comment.errors[:body]).to be_present
  end
end
