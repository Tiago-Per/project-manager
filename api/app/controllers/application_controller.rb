class ApplicationController < ActionController::API
  rescue_from ActiveRecord::RecordNotFound, with: :render_not_found
  rescue_from ActiveRecord::RecordInvalid do |error|
    render_validation_errors(error.record)
  end

  private

  def serialize(project)
    ProjectSerializer.new(project, base_url: request.base_url).as_json
  end

  def render_validation_errors(record)
    render json: { errors: record.errors.to_hash }, status: :unprocessable_content
  end

  def render_not_found(error)
    render json: { error: "#{error.model || 'Record'} not found" }, status: :not_found
  end
end
