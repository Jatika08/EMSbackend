const { sequelize, User } = require('../models/user');
require('dotenv').config();

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to PostgreSQL');

    await sequelize.sync();

    const testUser = await User.create({
      email: "test@example.com",
      password: "test123", 
      joiningDate: new Date(),
      position: "Tester",
      name: "Test User",
      aadhar: "123412341234",
      panNo: "ABCDE1234F",
      isSuperUser: false,
      address: "456 Test Street",
      dateOfBirth: new Date("1995-05-05"),
      githubId: "testGit",
      linkedInId: "testLinkedIn",
      phone: "1234567890",
      leaveDate: [], // empty leave object array
    });

    console.log("Test user added!", testUser.toJSON());

  } catch (err) {
    console.error("PostgreSQL connection error:", err);
  } finally {
    await sequelize.close();
  }
})();
