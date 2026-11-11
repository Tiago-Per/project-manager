class Project < ApplicationRecord
  COVER_CONTENT_TYPES = %w[image/jpeg image/png].freeze
  SEARCH_MIN_LENGTH = 3
  SORT_ORDERS = {
    "name" => { name: :asc, id: :asc },
    "recent" => { start_date: :desc, id: :asc },
    "deadline" => { end_date: :asc, id: :asc }
  }.freeze

  has_one_attached :cover

  attribute :remove_cover, :boolean, default: false
  before_validation :remove_cover_attachment, if: :remove_cover

  scope :favorites, -> { where(favorite: true) }
  scope :sorted_by, ->(option) { order(SORT_ORDERS.fetch(option.to_s, SORT_ORDERS["name"])) }
  scope :search, ->(term) {
    term = term.to_s.strip
    where("projects.name ILIKE ?", "%#{sanitize_sql_like(term)}%") if term.length >= SEARCH_MIN_LENGTH
  }

  validates :name, :client, :start_date, :end_date, presence: true
  validates :name, format: { with: /\A\s*\S+(?:\s+\S+)+\s*\z/, message: "must have at least two words" }, allow_blank: true
  validates :favorite, inclusion: { in: [ true, false ] }
  validates :end_date,
            comparison: { greater_than_or_equal_to: :start_date, message: "can't be before start date" },
            if: -> { start_date.present? && end_date.present? }
  validate :cover_must_be_jpg_or_png

  private

  # Assigning nil only schedules the removal: Active Storage detaches the cover when the
  # record is saved and purges the file after commit, so a failed update keeps it.
  def remove_cover_attachment
    self.cover = nil
  end

  def cover_must_be_jpg_or_png
    return unless cover.attached?
    return if COVER_CONTENT_TYPES.include?(cover.content_type)

    errors.add(:cover, "must be a JPG or PNG image")
  end
end
