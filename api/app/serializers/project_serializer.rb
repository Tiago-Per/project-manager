class ProjectSerializer
  def initialize(project, base_url:)
    @project = project
    @base_url = base_url
  end

  def as_json(*)
    {
      id: project.id,
      name: project.name,
      client: project.client,
      start_date: project.start_date,
      end_date: project.end_date,
      favorite: project.favorite,
      cover_url: cover_url
    }
  end

  private

  attr_reader :project, :base_url

  def cover_url
    return unless project.cover.attached?

    Rails.application.routes.url_helpers.rails_blob_url(project.cover, host: base_url)
  end
end
