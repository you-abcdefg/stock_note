require 'json'
require 'uri'

class Post < ApplicationRecord
  CARD_DOC_VERSION = 1
  CARD_TYPES = %w[text formula code url image].freeze

  belongs_to :user
  has_many :comments, dependent: :destroy
  has_many :likes, dependent: :destroy
  has_many :liked_users, through: :likes, source: :user
  has_many :post_groups, dependent: :destroy
  has_many :groups, through: :post_groups
  has_many :list_items, dependent: :destroy
  has_many :lists, through: :list_items

  acts_as_taggable_on :tags
  has_many_attached :images

  enum status: { draft: 0, published: 1 }

  scope :published_only, -> { where(status: :published) }
  scope :visible_to, lambda { |user|
    return published_only unless user

    where(
      arel_table[:status].eq(statuses[:published]).or(
        arel_table[:user_id].eq(user.id)
      )
    )
  }

  before_validation :normalize_body_document
  validate :validate_body_document_format

  def self.ransackable_attributes(_auth_object = nil)
    %w[title body status created_at updated_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[user comments likes groups tags]
  end

  def body_document
    parse_body_document(body)
  end

  def body_document?
    body_document.present?
  end

  private

  def normalize_body_document
    document = parse_body_document(body)
    return unless document

    self.body = JSON.generate(document)
  end

  def validate_body_document_format
    raw_body = body.to_s.strip
    return if raw_body.blank?
    return unless raw_body.start_with?('{', '[')

    document = parse_body_document(raw_body)
    if document.nil?
      errors.add(:body, 'JSON形式が不正です。')
      return
    end

    validate_document_schema(document)
  end

  def parse_body_document(raw_body)
    parsed = JSON.parse(raw_body.to_s)

    if parsed.is_a?(Array)
      { 'version' => CARD_DOC_VERSION, 'cards' => parsed }
    elsif parsed.is_a?(Hash) && parsed.key?('version') && parsed.key?('cards')
      parsed
    else
      nil
    end
  rescue JSON::ParserError
    nil
  end

  def validate_document_schema(document)
    unless document['version'].to_i == CARD_DOC_VERSION
      errors.add(:body, "version は #{CARD_DOC_VERSION} のみ対応です。")
    end

    cards = document['cards']
    unless cards.is_a?(Array)
      errors.add(:body, 'cards は配列で指定してください。')
      return
    end

    cards.each_with_index do |card, index|
      unless card.is_a?(Hash)
        errors.add(:body, "cards[#{index}] はオブジェクトで指定してください。")
        next
      end

      type = card['type'].to_s
      unless CARD_TYPES.include?(type)
        errors.add(:body, "cards[#{index}].type が不正です。")
        next
      end

      validate_card_payload(card, index, type)
    end
  end

  def validate_card_payload(card, index, type)
    case type
    when 'text', 'formula'
      validate_string_field(card, index, 'content', max: 20_000)
    when 'code'
      validate_string_field(card, index, 'content', max: 50_000)
      if card.key?('lang')
        validate_string_field(card, index, 'lang', max: 64, required: false)
      end
    when 'url'
      validate_string_field(card, index, 'url', max: 2_048)
      return unless card['url'].present?

      begin
        uri = URI.parse(card['url'].to_s)
        unless uri.is_a?(URI::HTTP) || uri.is_a?(URI::HTTPS)
          errors.add(:body, "cards[#{index}].url は http/https のみ指定できます。")
        end
      rescue URI::InvalidURIError
        errors.add(:body, "cards[#{index}].url の形式が不正です。")
      end
    when 'image'
      validate_string_field(card, index, 'filename', max: 255)
    end
  end

  def validate_string_field(card, index, key, max:, required: true)
    value = card[key]
    if required && value.blank?
      errors.add(:body, "cards[#{index}].#{key} は必須です。")
      return
    end
    return if value.blank? && !required

    unless value.is_a?(String)
      errors.add(:body, "cards[#{index}].#{key} は文字列で指定してください。")
      return
    end

    if value.length > max
      errors.add(:body, "cards[#{index}].#{key} は #{max} 文字以内で指定してください。")
    end
  end
end
