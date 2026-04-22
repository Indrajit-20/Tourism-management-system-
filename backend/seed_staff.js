const mongoose = require("mongoose");
const Staff = require("./models/Staff");
const db = require("./config/db");

const seedStaff = async () => {
    try {
        await db();
        
        const staffData = [
            // 5 Drivers in Ahmedabad
            {
                name: "Rajesh Kumar",
                designation: "driver",
                contact_no: "9876500001",
                email: "rajesh.driver@gmail.com",
                password: "password123",
                dob: "15-05-1985",
                gender: "Male",
                address: "Satellite, Ahmedabad, Gujarat",
                driver_license: "GUJ-DRV-001",
                date_of_joining: "01-01-2022",
                experience: "10 Years"
            },
            {
                name: "Suresh Patel",
                designation: "driver",
                contact_no: "9876500002",
                email: "suresh.driver@gmail.com",
                password: "password123",
                dob: "20-08-1988",
                gender: "Male",
                address: "Prahladnagar, Ahmedabad, Gujarat",
                driver_license: "GUJ-DRV-002",
                date_of_joining: "15-03-2022",
                experience: "8 Years"
            },
            {
                name: "Amit Shah",
                designation: "driver",
                contact_no: "9876500003",
                email: "amit.driver@gmail.com",
                password: "password123",
                dob: "10-12-1982",
                gender: "Male",
                address: "Maninagar, Ahmedabad, Gujarat",
                driver_license: "GUJ-DRV-003",
                date_of_joining: "10-06-2021",
                experience: "12 Years"
            },
            {
                name: "Mahesh Rathod",
                designation: "driver",
                contact_no: "9876500004",
                email: "mahesh.driver@gmail.com",
                password: "password123",
                dob: "05-02-1990",
                gender: "Male",
                address: "Navrangpura, Ahmedabad, Gujarat",
                driver_license: "GUJ-DRV-004",
                date_of_joining: "20-11-2023",
                experience: "5 Years"
            },
            {
                name: "Vikram Thakor",
                designation: "driver",
                contact_no: "9876500005",
                email: "vikram.driver@gmail.com",
                password: "password123",
                dob: "30-04-1986",
                gender: "Male",
                address: "Naroda, Ahmedabad, Gujarat",
                driver_license: "GUJ-DRV-005",
                date_of_joining: "05-01-2023",
                experience: "9 Years"
            },
            // 5 Tour Guides in Ahmedabad
            {
                name: "Anjali Mehta",
                designation: "guide",
                contact_no: "9876510001",
                email: "anjali.guide@gmail.com",
                password: "password123",
                dob: "12-09-1992",
                gender: "Female",
                address: "Vastrapur, Ahmedabad, Gujarat",
                date_of_joining: "10-02-2022",
                experience: "4 Years"
            },
            {
                name: "Rahul Sharma",
                designation: "guide",
                contact_no: "9876510002",
                email: "rahul.guide@gmail.com",
                password: "password123",
                dob: "25-06-1995",
                gender: "Male",
                address: "Bodakdev, Ahmedabad, Gujarat",
                date_of_joining: "01-05-2023",
                experience: "2 Years"
            },
            {
                name: "Priya Singh",
                designation: "guide",
                contact_no: "9876510003",
                email: "priya.guide@gmail.com",
                password: "password123",
                dob: "18-11-1990",
                gender: "Female",
                address: "Thaltej, Ahmedabad, Gujarat",
                date_of_joining: "15-08-2021",
                experience: "6 Years"
            },
            {
                name: "Hardik Joshi",
                designation: "guide",
                contact_no: "9876510004",
                email: "hardik.guide@gmail.com",
                password: "password123",
                dob: "04-03-1987",
                gender: "Male",
                address: "Gurukul, Ahmedabad, Gujarat",
                date_of_joining: "20-10-2023",
                experience: "7 Years"
            },
            {
                name: "Sanjana Roy",
                designation: "guide",
                contact_no: "9876510005",
                email: "sanjana.guide@gmail.com",
                password: "password123",
                dob: "22-12-1994",
                gender: "Female",
                address: "Chandkheda, Ahmedabad, Gujarat",
                date_of_joining: "01-12-2022",
                experience: "3 Years"
            }
        ];

        for (const data of staffData) {
            const existing = await Staff.findOne({ email: data.email });
            if (!existing) {
                await Staff.create(data);
                console.log(`✅ Seeded: ${data.name} (${data.designation})`);
            } else {
                console.log(`ℹ️ Existing: ${data.name}`);
            }
        }

        console.log("🌟 Staff seeding complete!");
        process.exit();
    } catch (error) {
        console.error("❌ Seeding error:", error);
        process.exit(1);
    }
};

seedStaff();
