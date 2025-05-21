const express = require('express');
const connection = require('../connection');
const router = express.Router();
const crypto = require('crypto'); // For generating secure tokens
const nodemailer = require('nodemailer'); // For sending reset emails
const multer = require("multer");
const path = require("path");
router.use('/uploads', express.static('uploads')); // Serve static files
const fs = require('fs'); // Import the filesystem module to delete files


// Configure Multer for File Uploads
const storage = multer.diskStorage({
    destination: "./uploads/",
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    },
  });
  const upload = multer({ storage });
  
  // API Endpoint for File Upload  

  router.post("/upload", upload.single("profile_image"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }

    const { employeeId } = req.body; // Get Employee ID from request
    if (!employeeId) {
        return res.status(400).json({ message: "Employee ID is required" });
    }

    const imagePath = `/uploads/${req.file.filename}`; // New image path

    // Step 1: Fetch the old image path from the database
    const fetchOldImageQuery = "SELECT Profile_Image FROM signup WHERE Employee_ID = ?";
    connection.query(fetchOldImageQuery, [employeeId], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ message: "Database error" });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "Employee ID not found" });
        }

        const oldImagePath = results[0].Profile_Image;

        // Step 2: Delete the old image file (if it exists)
        if (oldImagePath) {
            const oldImageFullPath = path.join(__dirname, '..', oldImagePath); // Construct full path
            fs.unlink(oldImageFullPath, (err) => {
                if (err) {
                    console.error("Error deleting old image:", err);
                    // Don't stop the process if deletion fails
                } else {
                    console.log("Old image deleted successfully:", oldImagePath);
                }
            });
        }

        // Step 3: Update the database with the new image path
        const updateQuery = "UPDATE signup SET Profile_Image = ? WHERE Employee_ID = ?";
        connection.query(updateQuery, [imagePath, employeeId], (err, result) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ message: "Database error" });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Employee ID not found" });
            }
            res.status(200).json({ message: "Profile image updated successfully", path: imagePath });
        });
    });
});

//signup
// router.post('/signup', (req, res) => {
//   const { Employee_ID, Employee_Name, Email, Mobile_Number, Password } = req.body;

//   if (!Employee_ID || !Employee_Name || !Email || !Mobile_Number || !Password) {
//     return res.status(400).json({ error: 'All fields are required' });
//   }

//   // Check if the Employee_ID or Email already exists
//   const checkQuery = `SELECT * FROM signup WHERE Employee_ID = ? OR Email = ?`;

//   connection.query(checkQuery, [Employee_ID, Email], (err, results) => {
//       if (err) {
//           console.error('Error checking user data: ' + err.stack);
//           return res.status(500).json({ error: 'Error checking user data' });
//       }

//       if (results.length > 0) {
//           // If the user already exists
//           return res.status(409).json({ error: 'Account already exists' });
//       }

//       // Proceed with inserting the new user data
//       const query = `INSERT INTO signup (Employee_ID, Employee_Name, Email, Mobile_Number, Password) VALUES (?, ?, ?, ?, ?)`;

//       connection.query(query, [Employee_ID, Employee_Name, Email, Mobile_Number, Password], (err, result) => {
//           if (err) {
//               console.error('Error inserting data: ' + err.stack);
//               return res.status(500).json({ error: 'Error saving user data' });
//           }

//           res.status(201).json({ message: 'User signed up successfully' });
//       });
//   });
// });

router.post('/signup', upload.single('profile_image'), (req, res) => {
    console.log("File:", req.file); // Debugging: See if file is received
    const { Employee_ID, Employee_Name, Email, Mobile_Number, Password } = req.body;
    const profileImage = req.file ? `/uploads/${req.file.filename}` : null;

    if (!Employee_ID || !Employee_Name || !Email || !Mobile_Number || !Password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const checkQuery = `SELECT * FROM signup WHERE Employee_ID = ? OR Email = ?`;

    connection.query(checkQuery, [Employee_ID, Email], (err, results) => {
        if (err) {
            console.error('Error checking user data:', err);
            return res.status(500).json({ error: 'Error checking user data' });
        }

        if (results.length > 0) {
            return res.status(409).json({ error: 'Account already exists' });
        }

        // Insert new user data with the image path
        const query = `INSERT INTO signup (Employee_ID, Employee_Name, Email, Mobile_Number, Password, Profile_Image) VALUES (?, ?, ?, ?, ?, ?)`;

        connection.query(query, [Employee_ID, Employee_Name, Email, Mobile_Number, Password, profileImage], (err, result) => {
            if (err) {
                console.error('Error inserting data:', err);
                return res.status(500).json({ error: 'Error saving user data' });
            }

            res.status(201).json({ message: 'User signed up successfully', profileImage });
        });
    });
});

  
  
  router.post('/login', (req, res) => {
    const { Employee_ID, Password } = req.body;

    if (!Employee_ID || !Password) {
        return res.status(400).json({ error: 'Employee ID and Password are required' });
    }

    const query = `SELECT * FROM signup WHERE Employee_ID = ?`;

    connection.query(query, [Employee_ID], (err, results) => {
        if (err) {
            console.error('Error querying data: ' + err.stack);
            return res.status(500).json({ error: 'Error querying user data' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = results[0];

        // Compare the password (make sure to use a secure hashing method like bcrypt in production)
        if (user.Password !== Password) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        res.status(200).json({ message: 'Login successful'});
    });
});






const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465, // Use 587 for STARTTLS
    secure: true, // Use `false` if using port 587
    auth: {
        user: 'dharani.t@shoubii.net',  // Replace with your email
        pass: 'rarx rrka lere dpkm'  
    }
});

// Forgot Password - Generate Reset Token
router.post('/forgot-password', (req, res) => {
    const { Email } = req.body;

    if (!Email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    // Check if email exists
    const checkQuery = `SELECT * FROM signup WHERE Email = ?`;
    connection.query(checkQuery, [Email], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expireTime = Date.now() + 3600000; // Token valid for 1 hour

        // Store token in database
        const updateQuery = `UPDATE signup SET Reset_Token = ?, Reset_Expires = ? WHERE Email = ?`;
        connection.query(updateQuery, [resetToken, expireTime, Email], (err) => {
            if (err) {
                console.error('Error storing reset token:', err);
                return res.status(500).json({ error: 'Error storing reset token' });
            }

            // Send email with reset link
            
            const resetLink = `http://localhost:8100/reset-password?resetToken=${resetToken}`;

            const mailOptions = {
                from: '',
                to: Email,
                subject: 'Password Reset Request',
                text: `Click the link below to reset your password:\n\n${resetLink}\n\nThis link is valid for 1 hour.`
            };

            transporter.sendMail(mailOptions, (err) => {
                if (err) {
                    console.error('Error sending email:', err);
                    return res.status(500).json({ error: 'Error sending email' });
                }

                res.status(200).json({ message: 'Password reset link sent to your email' });
            });
        });
    });
});


router.post('/user/reset-password/:token', (req, res) => {
    const { token } = req.params;
    const { Password } = req.body;

    if (!Password) {
        return res.status(400).json({ error: 'New password is required' });
    }

    // Check if token exists
    const query = `SELECT * FROM signup WHERE Reset_token = ? AND Reset_Expires > ?`;
    connection.query(query, [token, Date.now()], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (results.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }

        // Update password
        const updateQuery = `UPDATE signup SET Password = ?, Reset_Token = NULL, Reset_Expires = NULL WHERE reset_token = ?`;
        connection.query(updateQuery, [Password, token], (err) => {
            if (err) {
                console.error('Error updating password:', err);
                return res.status(500).json({ error: 'Error resetting password' });
            }

            res.status(200).json({ message: 'Password reset successful!' });
        });
    });
});


// API to Get Employee Details by Employee ID


// router.get('/user-profile/:employeeId', (req, res) => {
//     const employeeId = req.params.employeeId;

//     if (!employeeId) {
//         return res.status(400).json({ error: 'Employee ID is required' });
//     }

//     const query = `SELECT Employee_ID, Employee_Name, Email, Mobile_Number, Profile_Image FROM signup WHERE Employee_ID = ?`;

//     connection.query(query, [employeeId], (err, results) => {
//         if (err) {
//             console.error('Error fetching user data:', err);
//             return res.status(500).json({ error: 'Error retrieving user data' });
//         }

//         if (results.length === 0) {
//             return res.status(404).json({ error: 'User not found' });
//         }

//         const user = results[0];
//         if (user.Profile_Image) {
//             user.Profile_Image = `http://localhost:2025${user.Profile_Image}`; // Convert to full URL
//         }
        
//         res.status(200).json(user);
//     });
// });

router.get('/user-profile/:employeeId', (req, res) => {
    const { employeeId } = req.params;

    const sql = "SELECT Employee_ID, Employee_Name, Email, Mobile_Number, Profile_Image FROM signup WHERE Employee_ID = ?";
    connection.query(sql, [employeeId], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ message: "Database error" });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: "Employee ID not found" });
        }

        const userProfile = results[0];
        res.status(200).json(userProfile);
    });
});

module.exports = router;





