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

  describe "#remove_cover" do
    let(:project) { create(:project, cover: file_fixture("cover.png").open) }

    it "defaults to false" do
      expect(described_class.new.remove_cover).to be(false)
    end

    it "casts form values to a boolean" do
      expect(described_class.new(remove_cover: "1").remove_cover).to be(true)
      expect(described_class.new(remove_cover: "false").remove_cover).to be(false)
    end

    it "detaches the cover on save when true" do
      project.update!(remove_cover: true)

      expect(project.reload.cover).not_to be_attached
    end

    it "keeps the cover when the record is invalid" do
      expect(project.update(name: "Single", remove_cover: true)).to be(false)

      expect(project.reload.cover).to be_attached
    end
  end

  describe ".search" do
    let!(:website) { create(:project, name: "Website Redesign") }
    let!(:mobile) { create(:project, name: "Mobile App") }

    it "matches a part of the name" do
      expect(described_class.search("redes")).to contain_exactly(website)
    end

    it "ignores case" do
      expect(described_class.search("WEBSITE")).to contain_exactly(website)
    end

    it "returns nothing when no name matches" do
      expect(described_class.search("Unknown")).to be_empty
    end

    it "filters when the term has exactly 3 characters" do
      expect(described_class.search("Mob")).to contain_exactly(mobile)
    end

    it "returns all projects when the term has fewer than 3 characters" do
      expect(described_class.search("Mo")).to contain_exactly(website, mobile)
    end

    it "returns all projects when the term is nil" do
      expect(described_class.search(nil)).to contain_exactly(website, mobile)
    end

    it "does not count surrounding whitespace towards the minimum length" do
      expect(described_class.search("  Mo  ")).to contain_exactly(website, mobile)
    end

    context "with LIKE wildcards in the term" do
      it "treats % as a literal character" do
        percent = create(:project, name: "100% Done")
        create(:project, name: "1000 Done")

        expect(described_class.search("100%")).to contain_exactly(percent)
      end

      it "does not let % match every project" do
        expect(described_class.search("%%%")).to be_empty
      end

      it "treats _ as a literal character" do
        underscore = create(:project, name: "foo_bar Project")
        create(:project, name: "fooxbar Project")

        expect(described_class.search("foo_bar")).to contain_exactly(underscore)
      end

      it "treats a backslash as a literal character" do
        backslash = create(:project, name: 'Path\To Project')
        create(:project, name: "PathTo Project")

        expect(described_class.search('Path\To')).to contain_exactly(backslash)
      end
    end

    context "with SQL injection attempts" do
      it "does not widen the results" do
        expect(described_class.search("' OR '1'='1")).to be_empty
      end

      it "does not execute injected statements" do
        expect(described_class.search("'; DROP TABLE projects; --")).to be_empty
        expect(described_class.count).to eq(2)
      end
    end
  end

  describe ".favorites" do
    it "returns only favorite projects" do
      favorite = create(:project, favorite: true)
      create(:project, favorite: false)

      expect(described_class.favorites).to contain_exactly(favorite)
    end

    it "returns nothing when there are no favorites" do
      create(:project, favorite: false)

      expect(described_class.favorites).to be_empty
    end
  end

  describe ".sorted_by" do
    # Every project below has started and none has ended yet.
    before { travel_to Time.zone.local(2026, 3, 15, 12) }

    let!(:alpha) do
      create(:project, name: "Alpha Project", start_date: Date.new(2026, 2, 1), end_date: Date.new(2026, 12, 1))
    end
    let!(:bravo) do
      create(:project, name: "Bravo Project", start_date: Date.new(2026, 3, 1), end_date: Date.new(2026, 4, 1))
    end
    let!(:charlie) do
      create(:project, name: "Charlie Project", start_date: Date.new(2026, 1, 1), end_date: Date.new(2026, 8, 1))
    end

    it "sorts by name" do
      expect(described_class.sorted_by("name")).to eq([ alpha, bravo, charlie ])
    end

    it "sorts by most recent start_date with recent" do
      expect(described_class.sorted_by("recent")).to eq([ bravo, alpha, charlie ])
    end

    it "sorts by nearest end_date with deadline" do
      expect(described_class.sorted_by("deadline")).to eq([ bravo, charlie, alpha ])
    end

    it "accepts the option as a symbol" do
      expect(described_class.sorted_by(:recent)).to eq([ bravo, alpha, charlie ])
    end

    it "falls back to name when the option is nil" do
      expect(described_class.sorted_by(nil)).to eq([ alpha, bravo, charlie ])
    end

    it "falls back to name for an unknown option" do
      expect(described_class.sorted_by("name; DROP TABLE projects")).to eq([ alpha, bravo, charlie ])
    end

    context "with recent and projects starting after today" do
      before { travel_to Time.zone.local(2026, 11, 11, 12) }

      it "lists started projects first, then upcoming ones by nearest start" do
        Project.delete_all
        started = create(:project, start_date: Date.new(2026, 11, 10), end_date: Date.new(2026, 12, 31))
        next_week = create(:project, start_date: Date.new(2026, 11, 19), end_date: Date.new(2026, 12, 31))
        tomorrow = create(:project, start_date: Date.new(2026, 11, 12), end_date: Date.new(2026, 12, 31))
        older = create(:project, start_date: Date.new(2026, 10, 1), end_date: Date.new(2026, 12, 31))

        expect(described_class.sorted_by("recent")).to eq([ started, older, tomorrow, next_week ])
      end

      it "counts a project starting today as started" do
        Project.delete_all
        tomorrow = create(:project, start_date: Date.new(2026, 11, 12), end_date: Date.new(2026, 12, 31))
        today = create(:project, start_date: Date.new(2026, 11, 11), end_date: Date.new(2026, 12, 31))

        expect(described_class.sorted_by("recent")).to eq([ today, tomorrow ])
      end
    end

    context "with deadline and projects already finished" do
      before { travel_to Time.zone.local(2026, 11, 11, 12) }

      it "lists open projects by nearest end, then finished ones by latest end" do
        Project.delete_all
        long_ago = create(:project, start_date: Date.new(2026, 1, 1), end_date: Date.new(2026, 3, 1))
        next_month = create(:project, start_date: Date.new(2026, 1, 1), end_date: Date.new(2026, 12, 20))
        yesterday = create(:project, start_date: Date.new(2026, 1, 1), end_date: Date.new(2026, 11, 10))
        next_week = create(:project, start_date: Date.new(2026, 1, 1), end_date: Date.new(2026, 11, 18))

        expect(described_class.sorted_by("deadline")).to eq([ next_week, next_month, yesterday, long_ago ])
      end

      it "counts a project ending today as open" do
        Project.delete_all
        yesterday = create(:project, start_date: Date.new(2026, 1, 1), end_date: Date.new(2026, 11, 10))
        today = create(:project, start_date: Date.new(2026, 1, 1), end_date: Date.new(2026, 11, 11))

        expect(described_class.sorted_by("deadline")).to eq([ today, yesterday ])
      end
    end

    it "uses the Sao Paulo date, not UTC" do
      # 22:00 on Nov 11 in Sao Paulo is already Nov 12 in UTC.
      travel_to Time.zone.local(2026, 11, 11, 22)
      Project.delete_all
      tomorrow = create(:project, start_date: Date.new(2026, 11, 12), end_date: Date.new(2026, 12, 31))
      started = create(:project, start_date: Date.new(2026, 11, 1), end_date: Date.new(2026, 12, 31))

      expect(described_class.sorted_by("recent")).to eq([ started, tomorrow ])
    end
  end

  describe "chaining scopes" do
    it "combines search, favorites and sorted_by" do
      travel_to Time.zone.local(2026, 3, 15, 12)
      older = create(:project, name: "Website Alpha", favorite: true, start_date: Date.new(2026, 1, 1))
      newer = create(:project, name: "Website Bravo", favorite: true, start_date: Date.new(2026, 2, 1))
      create(:project, name: "Website Charlie", favorite: false)
      create(:project, name: "Mobile App", favorite: true)

      expect(described_class.search("website").favorites.sorted_by("recent")).to eq([ newer, older ])
    end

    it "keeps the chain when the search term is too short" do
      favorite = create(:project, favorite: true)
      create(:project, favorite: false)

      expect(described_class.favorites.search("ab")).to contain_exactly(favorite)
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
