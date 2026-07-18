require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Book = require("./models/Book");
const Member = require("./models/Member");
const BorrowRecord = require("./models/BorrowRecord");
const User = require("./models/User");

// ─── Data from the frontend mock ───

const SEED_BOOKS = [
  { isbn:"978-0-262-03384-8", title:"Introduction to Algorithms",
    author:"Thomas H. Cormen, Charles E. Leiserson", category:"Computer Science",
    publisher:"MIT Press", year:2022, edition:"4th Edition", pages:1312, language:"English",
    description:"A comprehensive introduction to modern algorithms presenting a broad range of algorithms in depth, yet makes their design and analysis accessible to all levels of readers.",
    shelfLocation:"CS-A1-001", totalCopies:12, availableCopies:7, borrowCount:145, coverColor:"#6D28D9" },
  { isbn:"978-0-393-88443-0", title:"Molecular Biology of the Cell",
    author:"Bruce Alberts, Rebecca Heald", category:"Biology",
    publisher:"Norton", year:2022, edition:"7th Edition", pages:1394, language:"English",
    description:"The leading cell biology textbook that conveys the excitement of modern biology by combining experimental material with a strong emphasis on the ways we know what we know.",
    shelfLocation:"BIO-B2-014", totalCopies:8, availableCopies:2, borrowCount:98, coverColor:"#059669" },
  { isbn:"978-0-357-72210-3", title:"Principles of Economics",
    author:"N. Gregory Mankiw", category:"Economics",
    publisher:"Cengage", year:2021, edition:"9th Edition", pages:896, language:"English",
    description:"Using real-world applications to help students engage with economic concepts, Mankiw builds upon the foundational principles of economic thinking.",
    shelfLocation:"ECO-C1-007", totalCopies:15, availableCopies:0, borrowCount:201, coverColor:"#D97706" },
  { isbn:"978-1-285-74155-0", title:"Calculus: Early Transcendentals",
    author:"James Stewart, Daniel Clegg", category:"Mathematics",
    publisher:"Cengage", year:2020, edition:"9th Edition", pages:1376, language:"English",
    description:"James Stewart's Calculus series is the top-seller worldwide because of its problem-solving focus and outstanding examples.",
    shelfLocation:"MAT-A3-022", totalCopies:20, availableCopies:14, borrowCount:178, coverColor:"#2563EB" },
  { isbn:"978-0-470-92765-0", title:"Organic Chemistry",
    author:"David R. Klein", category:"Chemistry",
    publisher:"Wiley", year:2021, edition:"4th Edition", pages:1344, language:"English",
    description:"Klein's Organic Chemistry offers a student-centered approach featuring more coverage of mechanisms and reactions than other texts.",
    shelfLocation:"CHE-D2-008", totalCopies:10, availableCopies:3, borrowCount:122, coverColor:"#0891B2" },
  { isbn:"978-1-119-46049-7", title:"Fundamentals of Physics",
    author:"David Halliday, Robert Resnick", category:"Physics",
    publisher:"Wiley", year:2021, edition:"11th Edition", pages:1450, language:"English",
    description:"No other book on the market today can match the 30-year success of Halliday, Resnick and Walker's Fundamentals of Physics.",
    shelfLocation:"PHY-B1-003", totalCopies:10, availableCopies:6, borrowCount:87, coverColor:"#7C3AED" },
  { isbn:"978-0-7020-7504-4", title:"Medical Physiology",
    author:"Walter F. Boron, Emile L. Boulpaep", category:"Medicine",
    publisher:"Elsevier", year:2022, edition:"3rd Edition", pages:1272, language:"English",
    description:"The leading physiology textbook used in medical schools worldwide with a clear, consistent presentation.",
    shelfLocation:"MED-E1-019", totalCopies:6, availableCopies:0, borrowCount:64, coverColor:"#DC2626" },
  { isbn:"978-0-521-63306-9", title:"A History of Western Philosophy",
    author:"Bertrand Russell", category:"Philosophy",
    publisher:"Routledge", year:2004, edition:"2nd Edition", pages:836, language:"English",
    description:"Hailed as a masterpiece, Bertrand Russell's A History of Western Philosophy is widely regarded as the most comprehensive account of philosophy.",
    shelfLocation:"PHI-F3-002", totalCopies:5, availableCopies:4, borrowCount:43, coverColor:"#DB2777" },
  { isbn:"978-0-521-67444-4", title:"The Cambridge History of the English Language",
    author:"Richard M. Hogg", category:"Literature",
    publisher:"Cambridge University Press", year:2000, edition:"1st Edition", pages:760, language:"English",
    description:"A comprehensive and authoritative multi-volume history of the English language from Anglo-Saxon period to the present day.",
    shelfLocation:"LIT-G2-011", totalCopies:4, availableCopies:4, borrowCount:28, coverColor:"#BE123C" },
  { isbn:"978-0-470-64818-0", title:"Quantitative Chemical Analysis",
    author:"Daniel C. Harris", category:"Chemistry",
    publisher:"Wiley", year:2020, edition:"10th Edition", pages:928, language:"English",
    description:"A premier analytical chemistry textbook providing the most modern, comprehensive, and proven coverage of quantitative analytical chemistry.",
    shelfLocation:"CHE-D1-005", totalCopies:7, availableCopies:0, borrowCount:91, coverColor:"#0D9488" },
];

const SEED_MEMBERS = [
  { id:"STU-2024-0042", name:"Emily Chen",        type:"student", department:"Computer Science", activeLoans:2, email:"e.chen@uni.edu"       },
  { id:"STU-2024-0087", name:"James Wilson",      type:"student", department:"Biology",          activeLoans:1, email:"j.wilson@uni.edu"     },
  { id:"STF-2024-0012", name:"Aisha Rahman",      type:"staff",   department:"Library Services", activeLoans:1, email:"a.rahman@uni.edu"     },
  { id:"STU-2024-0156", name:"Michael Torres",    type:"student", department:"Economics",        activeLoans:1, email:"m.torres@uni.edu"     },
  { id:"STU-2024-0203", name:"Priya Sharma",      type:"student", department:"Chemistry",        activeLoans:0, email:"p.sharma@uni.edu"     },
  { id:"STU-2023-0089", name:"Daniel Park",       type:"student", department:"Mathematics",      activeLoans:1, email:"d.park@uni.edu"       },
  { id:"STU-2023-0134", name:"Sophie Martin",     type:"student", department:"Physics",          activeLoans:1, email:"s.martin@uni.edu"     },
  { id:"STU-2024-0055", name:"Kevin Liu",         type:"student", department:"Medicine",         activeLoans:1, email:"k.liu@uni.edu"        },
  { id:"STF-2024-0008", name:"Fatima Al-Zahra",  type:"staff",   department:"Research",         activeLoans:0, email:"f.alzahra@uni.edu"    },
  { id:"STU-2025-0021", name:"Lucas Nguyen",      type:"student", department:"Philosophy",       activeLoans:0, email:"l.nguyen@uni.edu"     },
  { id:"STU-2025-0044", name:"Sara Okafor",       type:"student", department:"History",          activeLoans:0, email:"s.okafor@uni.edu"     },
  { id:"STF-2025-0003", name:"Prof. Mark Evans", type:"staff",   department:"Literature",       activeLoans:0, email:"m.evans@uni.edu"      },
];

const SEED_BORROW_RECORDS = [
  { bookIndex:0, memberId:"STU-2024-0042", memberName:"Emily Chen",       memberType:"student", borrowDate:"2026-06-28", dueDate:"2026-07-15", status:"borrowed"  },
  { bookIndex:0, memberId:"STU-2024-0087", memberName:"James Wilson",     memberType:"student", borrowDate:"2026-07-01", dueDate:"2026-07-15", status:"borrowed"  },
  { bookIndex:1, memberId:"STF-2024-0012", memberName:"Aisha Rahman",     memberType:"staff",   borrowDate:"2026-06-15", dueDate:"2026-06-29", status:"overdue"   },
  { bookIndex:2, memberId:"STU-2024-0156", memberName:"Michael Torres",   memberType:"student", borrowDate:"2026-07-05", dueDate:"2026-07-26", status:"borrowed"  },
  { bookIndex:4, memberId:"STU-2024-0203", memberName:"Priya Sharma",     memberType:"student", borrowDate:"2026-06-20", dueDate:"2026-07-04", status:"overdue"   },
  { bookIndex:3, memberId:"STU-2023-0089", memberName:"Daniel Park",      memberType:"student", borrowDate:"2026-07-08", dueDate:"2026-07-22", status:"borrowed"  },
  { bookIndex:5, memberId:"STU-2023-0134", memberName:"Sophie Martin",    memberType:"student", borrowDate:"2026-07-10", dueDate:"2026-07-17", status:"borrowed"  },
  { bookIndex:1, memberId:"STU-2024-0055", memberName:"Kevin Liu",        memberType:"student", borrowDate:"2026-07-09", dueDate:"2026-07-12", status:"borrowed"  },
  { bookIndex:7, memberId:"STU-2025-0021", memberName:"Lucas Nguyen",     memberType:"student", borrowDate:"2026-07-11", dueDate:"2026-07-25", status:"borrowed"  },
  { bookIndex:6, memberId:"STF-2024-0008", memberName:"Fatima Al-Zahra", memberType:"staff",   borrowDate:"2026-07-10", dueDate:null,         status:"reserved"  },
  { bookIndex:2, memberId:"STU-2025-0021", memberName:"Lucas Nguyen",     memberType:"student", borrowDate:"2026-07-12", dueDate:null,         status:"reserved"  },
  { bookIndex:9, memberId:"STU-2024-0042", memberName:"Emily Chen",       memberType:"student", borrowDate:"2026-06-01", dueDate:"2026-06-15", returnDate:"2026-06-13", status:"returned" },
  { bookIndex:6, memberId:"STU-2024-0055", memberName:"Kevin Liu",        memberType:"student", borrowDate:"2026-05-01", dueDate:"2026-05-15", returnDate:"2026-05-14", status:"returned" },
  { bookIndex:8, memberId:"STU-2023-0089", memberName:"Daniel Park",      memberType:"student", borrowDate:"2026-04-01", dueDate:"2026-04-15", returnDate:"2026-04-17", status:"returned" },
  { bookIndex:3, memberId:"STU-2024-0203", memberName:"Priya Sharma",     memberType:"student", borrowDate:"2026-03-10", dueDate:"2026-03-24", returnDate:"2026-03-23", status:"returned" },
];

async function seed() {
  try {
    await connectDB();

    // Clear existing data
    await Book.deleteMany({});
    await Member.deleteMany({});
    await BorrowRecord.deleteMany({});

    console.log("Cleared existing data.");

    // Insert books
    const books = await Book.insertMany(SEED_BOOKS);
    console.log(`Inserted ${books.length} books.`);

    // Insert members
    const members = await Member.insertMany(SEED_MEMBERS);
    console.log(`Inserted ${members.length} members.`);

    // Build borrow records with actual book ObjectIds
    const borrowRecords = SEED_BORROW_RECORDS.map((r) => {
      const book = books[r.bookIndex];
      return {
        bookId: book._id,
        bookTitle: book.title,
        bookCoverColor: book.coverColor,
        isbn: book.isbn,
        memberId: r.memberId,
        memberName: r.memberName,
        memberType: r.memberType,
        borrowDate: new Date(r.borrowDate),
        dueDate: r.dueDate ? new Date(r.dueDate) : null,
        returnDate: r.returnDate ? new Date(r.returnDate) : null,
        status: r.status,
      };
    });

    const inserted = await BorrowRecord.insertMany(borrowRecords);
    console.log(`Inserted ${inserted.length} borrow records.`);

    // Seed users
    await User.deleteMany({});
    const seededUsers = [
      { fullName: "Sarah Johnson", email: "librarian@unilib.edu", password: "password123", role: "Librarian" },
      { fullName: "Admin User", email: "admin@unilib.edu", password: "admin123", role: "Admin" },
    ];
    for (const u of seededUsers) {
      await User.create(u);
    }
    console.log(`Inserted ${seededUsers.length} users (Librarian + Admin).`);

    console.log("\n Seed completed successfully!");
    console.log("Librarian login: librarian@unilib.edu / password123");
    console.log(" Admin login:     admin@unilib.edu / admin123");
    process.exit(0);
  } catch (err) {
    console.error(" Seed failed:", err);
    process.exit(1);
  }
}

seed();