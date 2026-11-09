class Project < ApplicationRecord
  COVER_CONTENT_TYPES = %w[image/jpeg image/png].freeze

  has_one_attached :cover

  validates :name, :client, :start_date, :end_date, presence: true
  validates :favorite, inclusion: { in: [ true, false ] }
  validates :end_date,
            comparison: { greater_than_or_equal_to: :start_date, message: "can't be before start date" },
            if: -> { start_date.present? && end_date.present? }
  validate :name_must_have_at_least_two_words
  validate :cover_must_be_jpg_or_png

  private

  def name_must_have_at_least_two_words
    return if name.blank? || name.split.size >= 2

    errors.add(:name, "must have at least two words")
  end

  def cover_must_be_jpg_or_png
    return unless cover.attached?
    return if COVER_CONTENT_TYPES.include?(cover.content_type)

    errors.add(:cover, "must be a JPG or PNG image")
  end
end
