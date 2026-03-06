require 'rails_helper'

RSpec.describe Post, type: :model do
  let!(:user) do
    User.create!(
      email: 'post_model_user@example.com',
      password: 'password123',
      password_confirmation: 'password123',
      name: 'Post Model User',
      role: :general
    )
  end

  describe '.published_only' do
    it 'returns only published posts' do
      published_post = described_class.create!(user: user, title: 'pub', body: 'body', status: :published)
      described_class.create!(user: user, title: 'draft', body: 'body', status: :draft)

      expect(described_class.published_only).to contain_exactly(published_post)
    end
  end

  describe '.visible_to' do
    it 'returns published posts only for guests' do
      published_post = described_class.create!(user: user, title: 'pub', body: 'body', status: :published)
      described_class.create!(user: user, title: 'draft', body: 'body', status: :draft)

      expect(described_class.visible_to(nil)).to contain_exactly(published_post)
    end

    it 'returns published posts and own drafts for signed-in user' do
      own_draft = described_class.create!(user: user, title: 'own draft', body: 'body', status: :draft)
      published_post = described_class.create!(user: user, title: 'pub', body: 'body', status: :published)

      other_user = User.create!(
        email: 'post_model_other_user@example.com',
        password: 'password123',
        password_confirmation: 'password123',
        name: 'Other User',
        role: :general
      )
      described_class.create!(user: other_user, title: 'other draft', body: 'body', status: :draft)

      expect(described_class.visible_to(user)).to include(own_draft, published_post)
      expect(described_class.visible_to(user).pluck(:title)).not_to include('other draft')
    end
  end

  describe 'body document format' do
    it 'normalizes JSON array body into versioned document' do
      post_record = described_class.create!(user: user, title: 'json', body: '[{"type":"text","content":"hello"}]', status: :published)

      expect(post_record.body_document).to include('version' => Post::CARD_DOC_VERSION)
      expect(post_record.body_document['cards']).to be_an(Array)
    end

    it 'is invalid when card type is unsupported' do
      post_record = described_class.new(
        user: user,
        title: 'invalid json',
        body: '{"version":1,"cards":[{"type":"unknown"}]}',
        status: :published
      )

      expect(post_record).not_to be_valid
      expect(post_record.errors[:body].join).to include('type')
    end

    it 'is invalid when url card uses non-http scheme' do
      post_record = described_class.new(
        user: user,
        title: 'invalid url scheme',
        body: {
          version: Post::CARD_DOC_VERSION,
          cards: [
            { type: 'url', url: 'ftp://example.com' }
          ]
        }.to_json,
        status: :published
      )

      expect(post_record).not_to be_valid
      expect(post_record.errors[:body].join).to include('http/https')
    end

    it 'is invalid when url card is missing url value' do
      post_record = described_class.new(
        user: user,
        title: 'missing url value',
        body: {
          version: Post::CARD_DOC_VERSION,
          cards: [
            { type: 'url', url: '' }
          ]
        }.to_json,
        status: :published
      )

      expect(post_record).not_to be_valid
      expect(post_record.errors[:body].join).to include('必須')
    end

    it 'is invalid when text card is missing content' do
      post_record = described_class.new(
        user: user,
        title: 'missing text content',
        body: {
          version: Post::CARD_DOC_VERSION,
          cards: [
            { type: 'text' }
          ]
        }.to_json,
        status: :published
      )

      expect(post_record).not_to be_valid
      expect(post_record.errors[:body].join).to include('content')
      expect(post_record.errors[:body].join).to include('必須')
    end
  end
end
