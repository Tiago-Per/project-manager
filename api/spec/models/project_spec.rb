require 'rails_helper'

RSpec.describe Project, type: :model do
  def attach_cover(project, fixture, content_type:)
    project.cover.attach(io: file_fixture(fixture).open, filename: fixture, content_type: content_type)
  end

  it "is valid with the factory attributes" do
    expect(build(:project)).to be_valid
  end

  describe "required attributes" do
    %i[name client start_date end_date].each do |attribute|
      it "requires #{attribute}" do
        project = build(:project, attribute => nil)

        expect(project).not_to be_valid
        expect(project.errors[attribute]).to include("can't be blank")
      end
    end
  end

  describe "name" do
    it "is invalid with a single word" do
      project = build(:project, name: "Website")

      expect(project).not_to be_valid
      expect(project.errors[:name]).to include("must have at least two words")
    end

    it "does not count surrounding whitespace as a second word" do
      project = build(:project, name: "  Website  ")

      expect(project).not_to be_valid
      expect(project.errors[:name]).to include("must have at least two words")
    end

    it "is valid with two words" do
      expect(build(:project, name: "Website Redesign")).to be_valid
    end

    it "reports only the blank error when missing" do
      project = build(:project, name: "")

      project.valid?

      expect(project.errors[:name]).to contain_exactly("can't be blank")
    end
  end

  describe "end_date" do
    let(:start_date) { Date.new(2026, 3, 10) }

    it "is invalid before start_date" do
      project = build(:project, start_date: start_date, end_date: start_date - 1.day)

      expect(project).not_to be_valid
      expect(project.errors[:end_date]).to include("can't be before start date")
    end

    it "is valid on the same day as start_date" do
      expect(build(:project, start_date: start_date, end_date: start_date)).to be_valid
    end

    it "is valid after start_date" do
      expect(build(:project, start_date: start_date, end_date: start_date + 1.day)).to be_valid
    end

    it "reports only the blank error when start_date is missing" do
      project = build(:project, start_date: nil)

      project.valid?

      expect(project.errors[:end_date]).to be_empty
      expect(project.errors[:start_date]).to contain_exactly("can't be blank")
    end
  end

  describe "cover" do
    let(:project) { build(:project) }

    it "is optional" do
      expect(project).to be_valid
      expect(project.cover).not_to be_attached
    end

    it "accepts a PNG image" do
      attach_cover(project, "cover.png", content_type: "image/png")

      expect(project).to be_valid
    end

    it "accepts a JPG image" do
      attach_cover(project, "cover.jpg", content_type: "image/jpeg")

      expect(project).to be_valid
    end

    it "rejects another image format" do
      attach_cover(project, "cover.gif", content_type: "image/gif")

      expect(project).not_to be_valid
      expect(project.errors[:cover]).to include("must be a JPG or PNG image")
    end

    it "rejects a non-image file" do
      attach_cover(project, "notes.txt", content_type: "text/plain")

      expect(project).not_to be_valid
      expect(project.errors[:cover]).to include("must be a JPG or PNG image")
    end

    it "rejects a GIF disguised as a PNG" do
      attach_cover(project, "gif_disguised_as.png", content_type: "image/png")

      expect(project).not_to be_valid
      expect(project.errors[:cover]).to include("must be a JPG or PNG image")
    end
  end

  describe "favorite" do
    it "defaults to false" do
      expect(described_class.new.favorite).to be(false)
    end

    it "accepts true" do
      expect(build(:project, favorite: true)).to be_valid
    end

    it "does not allow nil" do
      project = build(:project, favorite: nil)

      expect(project).not_to be_valid
      expect(project.errors[:favorite]).to be_present
    end
  end

  describe "database constraints" do
    %i[name client start_date end_date favorite].each do |column|
      it "does not allow a null #{column}" do
        project = build(:project, column => nil)

        expect { project.save!(validate: false) }.to raise_error(ActiveRecord::NotNullViolation)
      end
    end
  end
end
