class MockJobBuilder {
  constructor() {
    this.reset();
  }

  reset() {
    this.jobData = {
      id: this.generateId(),
      title: "Software Engineer",
      uuid: this.generateUuid(),
      refNumber: this.generateRefNumber(),
      company: {
        identifier: "TheWarehouseGroup1",
        name: "The Warehouse Group"
      },
      location: {
        city: "Auckland",
        region: "Auckland Region",
        country: "nz",
        address: "123 Queen Street",
        postalCode: "1010",
        remote: false,
        latitude: "-36.8484597",
        longitude: "174.7633315",
        fullLocation: "Auckland, Auckland Region, New Zealand"
      },
      employmentType: "Full-time",
      customField: [
        {
          fieldId: "5cd160b26b2f07000673dc00",
          fieldLabel: "Brands",
          valueId: "2b6526b2-ed37-426c-8592-1c580f462334",
          valueLabel: "The Warehouse"
        }
      ]
    };
    return this;
  }

  generateId() {
    return `74400009${Math.floor(1000000 + Math.random() * 9000000)}`;
  }

  generateUuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  generateRefNumber() {
    return `REF${Math.floor(10000 + Math.random() * 90000)}G`;
  }

  withId(id) {
    this.jobData.id = id;
    return this;
  }

  withTitle(title) {
    this.jobData.title = title;
    return this;
  }

  withUuid(uuid) {
    this.jobData.uuid = uuid;
    return this;
  }

  withRefNumber(refNumber) {
    this.jobData.refNumber = refNumber;
    return this;
  }

  withCompany(identifier, name) {
    this.jobData.company = {
      identifier: identifier || this.jobData.company.identifier,
      name: name || this.jobData.company.name
    };
    return this;
  }

  withLocation(locationData) {
    this.jobData.location = {
      ...this.jobData.location,
      ...locationData
    };
    return this;
  }

  withCity(city, region = null, fullLocation = null) {
    this.jobData.location.city = city;
    if (region) this.jobData.location.region = region;
    if (fullLocation) {
      this.jobData.location.fullLocation = fullLocation;
    } else {
      this.jobData.location.fullLocation = `${city}, ${this.jobData.location.region}, New Zealand`;
    }
    return this;
  }

  withEmploymentType(employmentType) {
    this.jobData.employmentType = employmentType;
    return this;
  }

  withCustomField(fieldId, fieldLabel, valueId, valueLabel) {
    this.jobData.customField.push({
      fieldId,
      fieldLabel,
      valueId,
      valueLabel
    });
    return this;
  }

  withCustomFields(fields) {
    this.jobData.customField = fields;
    return this;
  }

  withMultiRefCustomValues(categoryIds) {
    this.jobData.multiRefJobsCustomValues = categoryIds;
    return this;
  }

  withCategory(categoryId) {
    if (!this.jobData.multiRefJobsCustomValues) {
      this.jobData.multiRefJobsCustomValues = [];
    }
    this.jobData.multiRefJobsCustomValues.push(categoryId);
    return this;
  }

  withDepartment(department) {
    this.jobData.department = department;
    return this;
  }

  withJobDescription(companyDesc, jobDesc, qualifications, additionalInfo = null) {
    this.jobData.jobDescription = {
      companyDescription: { text: companyDesc },
      jobDescription: { text: jobDesc },
      qualifications: { text: qualifications }
    };
    if (additionalInfo) {
      this.jobData.jobDescription.additionalInformation = { text: additionalInfo };
    }
    return this;
  }

  withApplyLink(link) {
    this.jobData.applyLink = link;
    return this;
  }

  withLinkJobsTitle(link) {
    this.jobData['link-jobs-title'] = link;
    return this;
  }

  forPositionPage() {
    if (!this.jobData._id) {
      this.jobData._id = this.generateId();
    }
    if (!this.jobData.department) {
      this.jobData.department = 'Technology';
    }
    if (!this.jobData.jobDescription) {
      this.withJobDescription(
        '<p>Great company to work for</p>',
        '<p>You will build awesome stuff</p>',
        '<p>Must know how to code</p>',
        '<p>Additional info here</p>'
      );
    }
    if (!this.jobData.applyLink) {
      this.jobData.applyLink = `https://apply.com/${this.jobData.id}`;
    }
    return this;
  }

  asRemote() {
    this.jobData.location.remote = true;
    return this;
  }

  asOnsite() {
    this.jobData.location.remote = false;
    return this;
  }

  build() {
    const result = { ...this.jobData };
    this.reset();
    return result;
  }

  static createDefault() {
    return new MockJobBuilder().build();
  }

  static createSeniorEngineer() {
    return new MockJobBuilder()
      .withTitle("Senior Software Engineer")
      .withCity("Dunedin", "Otago Region")
      .withEmploymentType("Full-time")
      .build();
  }

  static createBackendDeveloper() {
    return new MockJobBuilder()
      .withTitle("Backend Developer")
      .withCity("Auckland", "Auckland Region")
      .withEmploymentType("Part-time")
      .build();
  }

  static createProductManager() {
    return new MockJobBuilder()
      .withTitle("Product Manager")
      .withCity("Wellington", "Wellington Region")
      .withEmploymentType("Full-time")
      .asRemote()
      .build();
  }

  static createMultiple(count, customizer = null) {
    const jobs = [];
    for (let i = 0; i < count; i++) {
      const builder = new MockJobBuilder();
      if (customizer) {
        customizer(builder, i);
      }
      jobs.push(builder.build());
    }
    return jobs;
  }

  static createJobsWithSameCategory(categoryId, count = 3) {
    const jobs = [];
    const titles = [
      'Frontend Developer', 'Backend Developer', 'Full Stack Engineer',
      'DevOps Engineer', 'QA Engineer', 'Data Scientist',
      'Product Manager', 'UX Designer', 'System Architect'
    ];
    const cities = [
      { city: 'Auckland', region: 'Auckland Region' },
      { city: 'Wellington', region: 'Wellington Region' },
      { city: 'Christchurch', region: 'Canterbury Region' },
      { city: 'Hamilton', region: 'Waikato Region' },
      { city: 'Dunedin', region: 'Otago Region' }
    ];

    for (let i = 0; i < count; i++) {
      const randomTitle = titles[Math.floor(Math.random() * titles.length)];
      const randomCity = cities[Math.floor(Math.random() * cities.length)];
      
      jobs.push(
        new MockJobBuilder()
          .withTitle(`${randomTitle} ${i + 1}`)
          .withCity(randomCity.city, randomCity.region)
          .withCategory(categoryId)
          .withLinkJobsTitle(`/jobs/${randomTitle.toLowerCase().replace(/\s+/g, '-')}-${i + 1}`)
          .forPositionPage()
          .build()
      );
    }
    return jobs;
  }
}

module.exports = MockJobBuilder;

