const express = require('express');
const connection = require('../connection');
const router = express.Router();

router.get("/getProject/:employeeId", (req, res) => {
    const employeeId = req.params.employeeId;
  
    const query = `
      SELECT p.Project_ID, p.Project_Name 
      FROM project p
      JOIN project_allocation pa ON p.Project_ID = pa.Project_ID
      WHERE pa.Employee_ID = ?
    `;
  
    connection.query(query, [employeeId], (err, results) => {
      if (err) return res.status(500).json({ error: "Database query failed" });
  
      if (results.length > 0) {
        res.json(results[0]); // Return only the first project if multiple exist
      } else {
        res.status(404).json({ message: "No project found for this employee" });
      }
    });
  });


  const { v4: uuidv4 } = require('uuid'); // Import UUID library

 
  router.post('/submitTimesheet', (req, res) => { 
    const {
        Employee_Id,
        Project_Id,
        Timesheet_Start_Date,
        Timesheet_End_Date,
        Day1_Hrs,
        Day2_Hrs,
        Day3_Hrs,
        Day4_Hrs,
        Day5_Hrs,
        Day6_Hrs,
        Day7_Hrs,
        Total_Hrs
    } = req.body;

    if (!Employee_Id || !Project_Id || !Timesheet_Start_Date || !Timesheet_End_Date) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if timesheet already exists for this period
    const checkQuery = `
        SELECT * FROM timesheet 
        WHERE Employee_Id = ? AND Project_Id = ? 
        AND Timesheet_Start_Date = ? AND Timesheet_End_Date = ?
    `;

    connection.query(checkQuery, [Employee_Id, Project_Id, Timesheet_Start_Date, Timesheet_End_Date], (err, result) => {
        if (err) {
            console.error('Error checking existing timesheet:', err.sqlMessage);
            return res.status(500).json({ error: err.sqlMessage });
        }

        if (result.length > 0) {
            return res.status(400).json({ error: "Timesheet for this period has already been submitted." });
        }

        // Fetch holiday dates
        const holidayQuery = `
            SELECT Event_Date FROM calendar WHERE Event_Type = 'Holiday' 
            AND Event_Date BETWEEN ? AND DATE_ADD(?, INTERVAL 6 DAY);
        `;

        connection.query(holidayQuery, [Timesheet_Start_Date, Timesheet_Start_Date], (err, holidays) => {
            if (err) {
                console.error('Error fetching holidays:', err.sqlMessage);
                return res.status(500).json({ error: err.sqlMessage });
            }

            const holidayDates = holidays.map(h => new Date(h.Event_Date).toISOString().split('T')[0]);

            // Function to check if a given date is a holiday
            const isHoliday = (dateOffset) => {
                const currentDate = new Date(Timesheet_Start_Date);
                currentDate.setDate(currentDate.getDate() + dateOffset);
                return holidayDates.includes(currentDate.toISOString().split('T')[0]) ? "Holiday" : 0;
            };

            // If a day is a holiday, store "Holiday", otherwise store the entered hours
            const processedHours = [
                isHoliday(0) === "Holiday" ? "Holiday" : Day1_Hrs || 0,
                isHoliday(1) === "Holiday" ? "Holiday" : Day2_Hrs || 0,
                isHoliday(2) === "Holiday" ? "Holiday" : Day3_Hrs || 0,
                isHoliday(3) === "Holiday" ? "Holiday" : Day4_Hrs || 0,
                isHoliday(4) === "Holiday" ? "Holiday" : Day5_Hrs || 0,
                isHoliday(5) === "Holiday" ? "Holiday" : Day6_Hrs || 0,
                isHoliday(6) === "Holiday" ? "Holiday" : Day7_Hrs || 0,
               
            ];

            // Calculate Total_Hrs (excluding "Holiday")
            const totalHours = processedHours
                .filter(hour => hour !== "Holiday") // Exclude holidays
                .reduce((total, hour) => total + hour, 0); // Sum up worked hours

            // Insert into database
            const Timesheet_Id = uuidv4();
            const insertQuery = `
                INSERT INTO timesheet (
                    Timesheet_Id, Employee_Id, Project_Id, Timesheet_Start_Date, Timesheet_End_Date, 
                    Day1_Hrs, Day2_Hrs, Day3_Hrs, Day4_Hrs, Day5_Hrs, Day6_Hrs, Day7_Hrs, Total_Hrs, 
                    Timesheet_Status, Supervisor_Name, Supervision, Timesheet_Submit_Date, 
                    Supervision_Date, Revision
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', NULL, NULL, NOW(), NULL, NULL)
            `;

            const values = [
                Timesheet_Id, Employee_Id, Project_Id, Timesheet_Start_Date, Timesheet_End_Date,
                ...processedHours, Total_Hrs || 0
            ];

            connection.query(insertQuery, values, (err, result) => {
                if (err) {
                    console.error('Error inserting timesheet:', err.sqlMessage);
                    return res.status(500).json({ error: err.sqlMessage });
                }

                res.status(200).json({ message: 'Timesheet submitted successfully', result });
            });
        });
    });
});



router.post('/submitLeave', (req, res) => { 
    const {
        Employee_Id, Project_Id, Leave_Start_Date, Leave_End_Date,
        Day1_Hrs, Day2_Hrs, Day3_Hrs, Day4_Hrs, Day5_Hrs, Day6_Hrs, Day7_Hrs, Total_Hrs
    } = req.body;

    if (!Employee_Id || !Project_Id || !Leave_Start_Date || !Leave_End_Date) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    // Fetch holidays for the given leave period
    const holidayQuery = `
        SELECT Event_Date FROM calendar WHERE Event_Type = 'Holiday' 
        AND Event_Date BETWEEN ? AND DATE_ADD(?, INTERVAL 6 DAY);
    `;

    connection.query(holidayQuery, [Leave_Start_Date, Leave_Start_Date], (err, holidays) => {
        if (err) {
            console.error('Error fetching holidays:', err.sqlMessage);
            return res.status(500).json({ error: err.sqlMessage });
        }

        const holidayDates = holidays.map(h => new Date(h.Event_Date).toISOString().split('T')[0]);

        // Function to determine leave hours (0 or "Holiday")
        const getLeaveHours = (offset, inputValue) => {
            const date = new Date(Leave_Start_Date);
            date.setDate(date.getDate() + offset);
            return holidayDates.includes(date.toISOString().split('T')[0]) ? "Holiday" : inputValue || 0;
        };

        // Check if leave record already exists
        const checkQuery = `
            SELECT * FROM leave_records 
            WHERE Employee_Id = ? AND Project_Id = ? 
            AND Leave_Start_Date = ? AND Leave_End_Date = ?
        `;

        connection.query(checkQuery, [Employee_Id, Project_Id, Leave_Start_Date, Leave_End_Date], (err, result) => {
            if (err) {
                console.error('Error checking existing leave record:', err.sqlMessage);
                return res.status(500).json({ error: err.sqlMessage });
            }

            if (result.length > 0) {
                return res.status(400).json({ error: "Leave record for this period has already been submitted." });
            }

            // If no existing leave record, proceed with insertion
            const Leave_Id = uuidv4();
            const insertQuery = `
                INSERT INTO leave_records (
                    Leave_Id, Employee_Id, Project_Id, Leave_Start_Date, Leave_End_Date, 
                    Day1_Hrs, Day2_Hrs, Day3_Hrs, Day4_Hrs, Day5_Hrs, Day6_Hrs, Day7_Hrs, Total_Hrs, 
                    Leave_Status, Supervision, Leave_Submit_Date, Supervision_Date, Revision
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', NULL, NOW(), NULL, 1)
            `;

            const values = [
                Leave_Id, Employee_Id, Project_Id, Leave_Start_Date, Leave_End_Date,
                getLeaveHours(0, Day1_Hrs),
                getLeaveHours(1, Day2_Hrs),
                getLeaveHours(2, Day3_Hrs),
                getLeaveHours(3, Day4_Hrs),
                getLeaveHours(4, Day5_Hrs),
                getLeaveHours(5, Day6_Hrs),
                getLeaveHours(6, Day7_Hrs),
                Total_Hrs || 0
            ];

            connection.query(insertQuery, values, (err, result) => {
                if (err) {
                    console.error('Error inserting leave data:', err.sqlMessage);
                    return res.status(500).json({ error: err.sqlMessage });
                }

                res.status(200).json({ message: 'Leave record submitted successfully', result });
            });
        });
    });
});

router.get('/getTimesheet/:employeeId/:projectId/:startDate', (req, res) => {
    const { employeeId, projectId, startDate } = req.params;

    const timesheetQuery = `
        SELECT Day1_Hrs, Day2_Hrs, Day3_Hrs, Day4_Hrs, Day5_Hrs, Day6_Hrs, Day7_Hrs
        FROM timesheet 
        WHERE Employee_Id = ? AND Project_Id = ? AND Timesheet_Start_Date = ?;
    `;

    connection.query(timesheetQuery, [employeeId, projectId, startDate], (error, results) => {
        if (error) {
            return res.status(500).json({ error: "Database query failed" });
        }

        if (results.length > 0) {
            const timesheetData = results[0];

            const holidayQuery = `
                SELECT Event_Date FROM calendar WHERE Event_Type = 'Holiday' 
                AND Event_Date BETWEEN ? AND DATE_ADD(?, INTERVAL 6 DAY);
            `;

            connection.query(holidayQuery, [startDate, startDate], (err, holidays) => {
                if (err) {
                    return res.status(500).json({ error: "Holiday query failed" });
                }

                const holidayDates = holidays.map(h => new Date(h.Event_Date).toISOString().split('T')[0]);

                Object.keys(timesheetData).forEach((key, index) => {
                    const currentDate = new Date(startDate);
                    currentDate.setDate(currentDate.getDate() + index);

                    if (holidayDates.includes(currentDate.toISOString().split('T')[0])) {
                        timesheetData[key] = "Holiday";
                    }
                });

                res.json(timesheetData);
            });
        } else {
            const defaultTimesheet = {
                Day1_Hrs: "", Day2_Hrs: "", Day3_Hrs: "", Day4_Hrs: "", 
                Day5_Hrs: "", Day6_Hrs: "", Day7_Hrs: ""
            };

            const holidayQuery = `
                SELECT Event_Date FROM calendar WHERE Event_Type = 'Holiday' 
                AND Event_Date BETWEEN ? AND DATE_ADD(?, INTERVAL 6 DAY);
            `;

            connection.query(holidayQuery, [startDate, startDate], (err, holidays) => {
                if (err) {
                    return res.status(500).json({ error: "Holiday query failed" });
                }

                const holidayDates = holidays.map(h => new Date(h.Event_Date).toISOString().split('T')[0]);

                Object.keys(defaultTimesheet).forEach((key, index) => {
                    const currentDate = new Date(startDate);
                    currentDate.setDate(currentDate.getDate() + index);

                    if (holidayDates.includes(currentDate.toISOString().split('T')[0])) {
                        defaultTimesheet[key] = "Holiday";
                    }
                });

                res.json(defaultTimesheet);
            });
        }
    });
});


router.get('/getLeaveRecords/:employeeId/:projectId/:startDate', (req, res) => {
    const { employeeId, projectId, startDate } = req.params;

    const leaveQuery = `
        SELECT Day1_Hrs, Day2_Hrs, Day3_Hrs, Day4_Hrs, Day5_Hrs, Day6_Hrs, Day7_Hrs
        FROM leave_records 
        WHERE Employee_Id = ? AND Project_Id = ? AND Leave_Start_Date = ?;
    `;

    connection.query(leaveQuery, [employeeId, projectId, startDate], (error, results) => {
        if (error) {
            console.error("Database Error:", error);
            return res.status(500).json({ error: "Database query failed" });
        }

        // If leave data is found
        if (results.length > 0) {
            const leaveData = results[0];

            const holidayQuery = `
                SELECT Event_Date FROM calendar WHERE Event_Type = 'Holiday' 
                AND Event_Date BETWEEN ? AND DATE_ADD(?, INTERVAL 6 DAY);
            `;

            connection.query(holidayQuery, [startDate, startDate], (err, holidays) => {
                if (err) {
                    return res.status(500).json({ error: "Holiday query failed" });
                }

                const holidayDates = holidays.map(h => new Date(h.Event_Date).toISOString().split('T')[0]);

                Object.keys(leaveData).forEach((key, index) => {
                    const currentDate = new Date(startDate);
                    currentDate.setDate(currentDate.getDate() + index);

                    if (holidayDates.includes(currentDate.toISOString().split('T')[0])) {
                        leaveData[key] = "Holiday";
                    }
                });

                res.json(leaveData);
            });
        } else {
            // No leave record found, return default structure
            const defaultLeaveData = {
                Day1_Hrs: "", Day2_Hrs: "", Day3_Hrs: "", Day4_Hrs: "", 
                Day5_Hrs: "", Day6_Hrs: "", Day7_Hrs: ""
            };

            const holidayQuery = `
                SELECT Event_Date FROM calendar WHERE Event_Type = 'Holiday' 
                AND Event_Date BETWEEN ? AND DATE_ADD(?, INTERVAL 6 DAY);
            `;

            connection.query(holidayQuery, [startDate, startDate], (err, holidays) => {
                if (err) {
                    return res.status(500).json({ error: "Holiday query failed" });
                }

                const holidayDates = holidays.map(h => new Date(h.Event_Date).toISOString().split('T')[0]);

                Object.keys(defaultLeaveData).forEach((key, index) => {
                    const currentDate = new Date(startDate);
                    currentDate.setDate(currentDate.getDate() + index);

                    if (holidayDates.includes(currentDate.toISOString().split('T')[0])) {
                        defaultLeaveData[key] = "Holiday";
                    }
                });

                res.json(defaultLeaveData);
            });
        }
    });
});


// router.put('/updateStatus/:employeeId', (req, res) => {
//     const { employeeId } = req.params;
//     const { startDate, endDate, status } = req.body;

//     if (!startDate || !endDate || !status || (status !== "Approved" && status !== "Rejected")) {
//         return res.status(400).json({ error: "Invalid request. Provide startDate, endDate, and valid status ('Approved' or 'Rejected')." });
//     }

//     const timesheetQuery = `
//         UPDATE timesheet 
//         SET Timesheet_Status = ? 
//         WHERE Employee_Id = ? 
//         AND Timesheet_Start_Date = ? 
//         AND Timesheet_End_Date = ?
//     `;

//     const leaveQuery = `
//         UPDATE leave_records 
//         SET Leave_Status = ? 
//         WHERE Employee_Id = ? 
//         AND Leave_Start_Date = ? 
//         AND Leave_End_Date = ?
//     `;

//     // Start transaction
//     connection.beginTransaction(err => {
//         if (err) {
//             console.error("Error starting transaction:", err);
//             return res.status(500).json({ error: "Transaction error" });
//         }

//         // Update Timesheet Status
//         connection.query(timesheetQuery, [status, employeeId, startDate, endDate], (err, timesheetResult) => {
//             if (err) {
//                 console.error("Error updating timesheet status:", err.sqlMessage);
//                 return connection.rollback(() => {
//                     res.status(500).json({ error: err.sqlMessage });
//                 });
//             }

//             // Update Leave Status
//             connection.query(leaveQuery, [status, employeeId, startDate, endDate], (err, leaveResult) => {
//                 if (err) {
//                     console.error("Error updating leave status:", err.sqlMessage);
//                     return connection.rollback(() => {
//                         res.status(500).json({ error: err.sqlMessage });
//                     });
//                 }

//                 // Commit transaction
//                 connection.commit(err => {
//                     if (err) {
//                         console.error("Error committing transaction:", err);
//                         return connection.rollback(() => {
//                             res.status(500).json({ error: "Commit error" });
//                         });
//                     }

//                     res.status(200).json({
//                         message: `Timesheet and leave status updated to '${status}' successfully.`,
//                         timesheetAffectedRows: timesheetResult.affectedRows,
//                         leaveAffectedRows: leaveResult.affectedRows
//                     });
//                 });
//             });
//         });
//     });
// });

// correct code
// router.get("/getFilteredEmployeeDetails/:loginEmployeeId/:filterEmployeeId/:startDate/:endDate", (req, res) => { 
//     const { loginEmployeeId, filterEmployeeId, startDate, endDate } = req.params;
  
//     // First, check the role of the logged-in employee.
//     const roleQuery = `SELECT Employee_Role FROM signup WHERE Employee_Id = ?`;
  
//     connection.query(roleQuery, [loginEmployeeId], (err, roleResults) => {
//       if (err) {
//         console.error("Database Error:", err.sqlMessage);
//         return res.status(500).json({ error: "Database query failed" });
//       }
  
//       if (roleResults.length === 0) {
//         return res.status(404).json({ message: "Employee not found" });
//       }
  
//       const employeeRole = roleResults[0].Employee_Role;
  
//       // User can only filter their own data
//       if (employeeRole === "User" && loginEmployeeId !== filterEmployeeId) {
//         return res.status(403).json({ message: "Unauthorized: Users can only filter their own data" });
//       }
  
//       // Build the filtered query
//       let query = `
//         SELECT 
//             s.Employee_Id,
//             s.Employee_Name,
//             COALESCE(SUM(l.Total_Hrs), 0) AS Total_Leave_Hours,
//             p.Project_ID, 
//             p.Project_Name, 
//             COALESCE(SUM(t.Total_Hrs), 0) AS Total_Worked_Hours, 
//             t.Timesheet_Status
//            FROM signup s
//            LEFT JOIN leave_records l 
//             ON s.Employee_Id = l.Employee_Id 
//             AND l.Leave_Start_Date BETWEEN ? AND ?
//         LEFT JOIN project_allocation pa 
//             ON s.Employee_Id = pa.Employee_ID
//         LEFT JOIN project p 
//             ON pa.Project_ID = p.Project_ID
//         LEFT JOIN timesheet t 
//             ON pa.Employee_ID = t.Employee_Id 
//             AND pa.Project_ID = t.Project_Id 
//             AND t.Timesheet_Start_Date BETWEEN ? AND ?
//         WHERE s.Employee_Id = ?
//        `;
  
//       let params = [startDate, endDate, startDate, endDate, filterEmployeeId];
  
//       query += `
//       GROUP BY s.Employee_Id, s.Employee_Name, p.Project_ID, p.Project_Name, t.Timesheet_Status;
//     `;
  
//       connection.query(query, params, (err, results) => {
//         if (err) {
//           console.error("Database Error:", err);
//           return res.status(500).json({ error: "Database query failed" });
//         }
  
//         if (results.length > 0) {
//           // Append startDate and endDate to each record in the response.
//           const updatedResults = results.map(record => ({
//             ...record,
//             Start_Date: startDate,
//             End_Date: endDate
//           }));
  
//           res.json(updatedResults);
//         } else {
//           res.status(404).json({ message: "No records found for the selected filters" });
//         }
//       });
//     });
//   });



// backend for dashboard


router.get("/getFilteredEmployeeDetails/:loginEmployeeId/:filterEmployeeId/:startDate/:endDate", (req, res) => { 
    const { loginEmployeeId, filterEmployeeId, startDate, endDate } = req.params;

    // Query to get the employee role of the logged-in user
    const roleQuery = `SELECT Employee_Role FROM signup WHERE Employee_Id = ?`;

    connection.query(roleQuery, [loginEmployeeId], (err, roleResults) => {
        if (err) {
            console.error("Database Error:", err.sqlMessage);
            return res.status(500).json({ error: "Database query failed" });
        }

        if (roleResults.length === 0) {
            return res.status(404).json({ message: "Employee not found" });
        }

        const employeeRole = roleResults[0].Employee_Role;

        // **Users can only filter their own data**
        if (employeeRole === "User" && loginEmployeeId !== filterEmployeeId) {
            return res.status(403).json({ message: "Unauthorized: Users can only filter their own data" });
        }

        // **Admins cannot filter their own data**
        if (employeeRole === "admin" && loginEmployeeId === filterEmployeeId) {
            return res.status(403).json({ message: "Admins cannot filter their own details" });
        }

        // Build the filtered query
        let query = `
            SELECT 
                s.Employee_Id,
                s.Employee_Name,
                COALESCE(SUM(l.Total_Hrs), 0) AS Total_Leave_Hours,
                p.Project_ID, 
                p.Project_Name, 
                COALESCE(SUM(t.Total_Hrs), 0) AS Total_Worked_Hours, 
                t.Timesheet_Status
            FROM signup s
            LEFT JOIN leave_records l 
                ON s.Employee_Id = l.Employee_Id 
                AND l.Leave_Start_Date BETWEEN ? AND ?
            LEFT JOIN project_allocation pa 
                ON s.Employee_Id = pa.Employee_ID
            LEFT JOIN project p 
                ON pa.Project_ID = p.Project_ID
            LEFT JOIN timesheet t 
                ON pa.Employee_ID = t.Employee_Id 
                AND pa.Project_ID = t.Project_Id 
                AND t.Timesheet_Start_Date BETWEEN ? AND ?
            WHERE s.Employee_Id = ?
            GROUP BY s.Employee_Id, s.Employee_Name, p.Project_ID, p.Project_Name, t.Timesheet_Status;
        `;

        let params = [startDate, endDate, startDate, endDate, filterEmployeeId];

        connection.query(query, params, (err, results) => {
            if (err) {
                console.error("Database Error:", err);
                return res.status(500).json({ error: "Database query failed" });
            }

            if (results.length > 0) {
                // Append startDate and endDate to each record in the response.
                const updatedResults = results.map(record => ({
                    ...record,
                    Start_Date: startDate,
                    End_Date: endDate
                }));

                res.json(updatedResults);
            } else {
                res.status(404).json({ message: "No records found for the selected filters" });
            }
        });
    });
});


router.get('/getEmployeeSummary/:employeeId', (req, res) => {
    const { employeeId } = req.params;

    const query = `
        WITH WeeklyData AS (
            SELECT 
                Employee_Id,
                YEAR(Timesheet_Start_Date) AS year,                        
                WEEK(Timesheet_Start_Date, 1) AS weekNumber,                
                MIN(Timesheet_Start_Date) AS weekStartDate,                 
                MAX(Timesheet_End_Date) AS weekEndDate,                    
                SUM(
                    CASE WHEN Day1_Hrs > 0 THEN 1 ELSE 0 END +  
                    CASE WHEN Day2_Hrs > 0 THEN 1 ELSE 0 END +  
                    CASE WHEN Day3_Hrs > 0 THEN 1 ELSE 0 END +  
                    CASE WHEN Day4_Hrs > 0 THEN 1 ELSE 0 END +  
                    CASE WHEN Day5_Hrs > 0 THEN 1 ELSE 0 END +  
                    CASE WHEN Day6_Hrs > 0 THEN 1 ELSE 0 END +  
                    CASE WHEN Day7_Hrs > 0 THEN 1 ELSE 0 END    
                ) AS totalWorkingDays
            FROM 
                timesheet
            WHERE 
                Employee_Id = ? AND
                MONTH(Timesheet_Start_Date) = MONTH(CURRENT_DATE) 
                AND YEAR(Timesheet_Start_Date) = YEAR(CURRENT_DATE)
            GROUP BY 
                Employee_Id, YEAR(Timesheet_Start_Date), WEEK(Timesheet_Start_Date, 1)
        )
        SELECT 
            (SELECT COALESCE(SUM(Total_Hrs), 0) 
             FROM leave_records 
             WHERE Employee_Id = ? 
             AND MONTH(Leave_Start_Date) = MONTH(CURRENT_DATE) 
             AND YEAR(Leave_Start_Date) = YEAR(CURRENT_DATE)) AS total_leave_hrs,

            (SELECT COALESCE(SUM(Total_Hrs), 0) 
             FROM timesheet 
             WHERE Employee_Id = ? 
             AND MONTH(Timesheet_Start_Date) = MONTH(CURRENT_DATE) 
             AND YEAR(Timesheet_Start_Date) = YEAR(CURRENT_DATE)) AS total_worked_hrs,

            (SELECT SUM(totalWorkingDays) FROM WeeklyData) AS total_worked_days,

            (SELECT COUNT(*) 
             FROM timesheet 
             WHERE Employee_Id = ? 
             AND Timesheet_Status = 'Pending') AS pending_approvals;
    `;

    connection.query(query, [employeeId, employeeId, employeeId, employeeId], (error, results) => {
        if (error) {
            console.error("Database Error:", error);
            return res.status(500).json({ error: "Database query failed" });
        }

        if (results.length > 0) {
            res.json(results[0]); // Return summary details
        } else {
            res.json({ 
                total_leave_hrs: 0, 
                total_worked_hrs: 0, 
                total_worked_days: 0, 
                pending_approvals: 0
            });
        }
    });
});



  
router.get("/getEmployeeDetails/:employeeId", (req, res) => { 
    const employeeId = req.params.employeeId;
  
    // Query to check the role of the employee
    const roleQuery = `SELECT Employee_Role FROM signup WHERE Employee_Id = ?`;
  
    connection.query(roleQuery, [employeeId], (err, roleResults) => {
        if (err) {
            console.error("Database Error:", err.sqlMessage);
            return res.status(500).json({ error: "Database query failed" });
        }
  
        if (roleResults.length === 0) {
            return res.status(404).json({ message: "Employee not found" });
        }
  
        const employeeRole = roleResults[0].Employee_Role; // Get the role
  
        let query = `
            SELECT 
                s.Employee_Id,
                s.Employee_Name,
                p.Project_ID, 
                p.Project_Name, 
                COALESCE(t.Timesheet_Start_Date, '-') AS Start_Date,
                COALESCE(t.Timesheet_End_Date, '-') AS End_Date,
                COALESCE(t.Total_Worked_Hours, 0) AS Total_Worked_Hours, 
                COALESCE(l.Total_Leave_Hours, 0) AS Total_Leave_Hours,
                t.Timesheet_Status
            FROM signup s
            LEFT JOIN project_allocation pa ON s.Employee_Id = pa.Employee_ID
            LEFT JOIN project p ON pa.Project_ID = p.Project_ID
            LEFT JOIN (
                SELECT 
                    Employee_Id, 
                    Project_Id,
                    Timesheet_Status,
                    Timesheet_Start_Date,
                    Timesheet_End_Date,
                    SUM(Total_Hrs) AS Total_Worked_Hours
                FROM timesheet 
                GROUP BY Employee_Id, Project_Id, Timesheet_Status, Timesheet_Start_Date, Timesheet_End_Date
            ) t ON pa.Employee_ID = t.Employee_Id AND pa.Project_ID = t.Project_Id
            LEFT JOIN (
                SELECT 
                    l.Employee_Id, 
                    l.Project_Id, 
                    t.Timesheet_Start_Date,
                    t.Timesheet_End_Date,
                    SUM(l.Total_Hrs) AS Total_Leave_Hours  
                FROM leave_records l
                JOIN timesheet t ON 
                    l.Employee_Id = t.Employee_Id 
                    AND l.Project_Id = t.Project_Id
                    AND l.Leave_Start_Date >= t.Timesheet_Start_Date  
                    AND l.Leave_End_Date <= t.Timesheet_End_Date
                GROUP BY l.Employee_Id, l.Project_Id, t.Timesheet_Start_Date, t.Timesheet_End_Date
            ) l ON pa.Employee_Id = l.Employee_Id 
               AND pa.Project_ID = l.Project_Id 
               AND t.Timesheet_Start_Date = l.Timesheet_Start_Date 
               AND t.Timesheet_End_Date = l.Timesheet_End_Date
        `;
  
        let params = [];
  
        if (employeeRole === "User") {
            // Show only the logged-in user's records
            query += ` WHERE s.Employee_Id = ?`;
            params.push(employeeId);
        } else if (employeeRole === "admin") {
            // Show only users' records (exclude admins)
            query += ` WHERE s.Employee_Role = 'User'`;
        }
  
        connection.query(query, params, (err, results) => {
            if (err) {
                console.error("Database Error:", err.sqlMessage);
                return res.status(500).json({ error: "Database query failed" });
            }
  
            if (results.length > 0) {
                res.json(results);
            } else {
                res.status(404).json({ message: "No employee records found" });
            }
        });
    });
  });

  //



/**
 * Fetch Timesheet Status
 */
router.get('/getTimesheetStatus/:employeeId/:startDate', (req, res) => {
    const { employeeId, startDate } = req.params;

    const query = `
        SELECT Timesheet_Status 
        FROM timesheet 
        WHERE Employee_Id = ? AND Timesheet_Start_Date = ?;
    `;

    connection.query(query, [employeeId, startDate], (error, results) => {
        if (error) {
            return res.status(500).json({ error: "Database query failed" });
        }
        if (results.length > 0) {
            res.json({ status: results[0].Timesheet_Status });
        } else {
            res.status(404).json({ message: "Timesheet not found" });
        }
    });
});

/**
 * Update Worked Hours (Restricted if Approved)
 */
router.put('/updateTimesheetHours', (req, res) => {
    const { employeeId, startDate, day1, day2, day3, day4, day5, day6, day7 } = req.body;

    // Check status first
    connection.query(
        "SELECT Timesheet_Status FROM timesheet WHERE Employee_Id = ? AND Timesheet_Start_Date = ?",
        [employeeId, startDate],
        (error, results) => {
            if (error) {
                return res.status(500).json({ error: "Database query failed" });
            }
            if (results.length > 0) {
                const status = results[0].Timesheet_Status;
                if (status === "Approved") {
                    return res.status(403).json({ message: "Timesheet is approved and cannot be edited." });
                }

                // If Pending or Rejected, update hours
                const updateQuery = `
                    UPDATE timesheet 
                    SET Day1_Hrs = ?, Day2_Hrs = ?, Day3_Hrs = ?, Day4_Hrs = ?, 
                        Day5_Hrs = ?, Day6_Hrs = ?, Day7_Hrs = ?
                    WHERE Employee_Id = ? AND Timesheet_Start_Date = ?;
                `;

                connection.query(updateQuery, [day1, day2, day3, day4, day5, day6, day7, employeeId, startDate], (err, result) => {
                    if (err) {
                        return res.status(500).json({ error: "Failed to update timesheet" });
                    }
                    res.status(200).json({ message: "Timesheet updated successfully", result });
                });
            } else {
                res.status(404).json({ message: "Timesheet not found" });
            }
        }
    );
});

/**
 * Update Leave Hours (Restricted if Approved)
 */
router.put('/updateLeaveHours', (req, res) => {
    const { employeeId, startDate, day1, day2, day3, day4, day5, day6, day7 } = req.body;

    // Check status first
    connection.query(
        "SELECT Leave_Status FROM leave_records WHERE Employee_Id = ? AND Leave_Start_Date = ?",
        [employeeId, startDate],
        (error, results) => {
            if (error) {
                return res.status(500).json({ error: "Database query failed" });
            }
            if (results.length > 0) {
                const status = results[0].Leave_Status;
                if (status === "Approved") {
                    return res.status(403).json({ message: "Leave is approved and cannot be edited." });
                }

                // If Pending or Rejected, update leave hours
                const updateQuery = `
                    UPDATE leave_records 
                    SET Day1_Hrs = ?, Day2_Hrs = ?, Day3_Hrs = ?, Day4_Hrs = ?, 
                        Day5_Hrs = ?, Day6_Hrs = ?, Day7_Hrs = ?
                    WHERE Employee_Id = ? AND Leave_Start_Date = ?;
                `;

                connection.query(updateQuery, [day1, day2, day3, day4, day5, day6, day7, employeeId, startDate], (err, result) => {
                    if (err) {
                        return res.status(500).json({ error: "Failed to update leave records" });
                    }
                    res.status(200).json({ message: "Leave hours updated successfully", result });
                });
            } else {
                res.status(404).json({ message: "Leave record not found" });
            }
        }
    );
});


  router.get("/getEmployeeRole/:employeeId", (req, res) => {
    const { employeeId } = req.params;

    const roleQuery = "SELECT employee_Role FROM signup WHERE Employee_Id = ?";

    connection.query(roleQuery, [employeeId], (error, results) => {
        if (error) {
            console.error("Database Error:", error.sqlMessage || error);
            return res.status(500).json({ error: "Database query failed" });
        }

        if (results.length > 0) {
            res.json({ employeeRole: results[0].employee_Role });
        } else {
            res.status(404).json({ error: "Employee not found" });
        }
    });
});


/**
 * Fetch Total Timesheet Status Counts for All Employees (Admin)
 */
router.get('/getTimesheetStatusCounts', (req, res) => {
    const query = `
        SELECT 
            SUM(CASE WHEN Timesheet_Status = 'Approved' THEN 1 ELSE 0 END) AS total_approved,
            SUM(CASE WHEN Timesheet_Status = 'Pending' THEN 1 ELSE 0 END) AS total_pending,
            SUM(CASE WHEN Timesheet_Status = 'Rejected' THEN 1 ELSE 0 END) AS total_rejected
        FROM timesheet;
    `;

    connection.query(query, (error, results) => {
        if (error) {
            return res.status(500).json({ error: "Database query failed" });
        }
        res.json(results[0]); // Return the counts
    });
});



//Timesheet Status Update and leave staus update with supervison date
// router.put('/updateStatus/:employeeId', (req, res) => { 
//     const { employeeId } = req.params;
//     const { startDate, endDate, status } = req.body;

//     if (!startDate || !endDate || !status || (status !== "Approved" && status !== "Rejected")) {
//         return res.status(400).json({ error: "Invalid request. Provide startDate, endDate, and valid status ('Approved' or 'Rejected')." });
//     }

//     const supervisionDate = new Date().toISOString().slice(0, 19).replace("T", " ");

//     const timesheetQuery = `
//         UPDATE timesheet 
//         SET Timesheet_Status = ?, Supervision_Date = ?
//         WHERE Employee_Id = ? 
//         AND Timesheet_Start_Date = ? 
//         AND Timesheet_End_Date = ?
//     `;

//     const leaveQuery = `
//         UPDATE leave_records 
//         SET Leave_Status = ?, Supervision_Date = ?
//         WHERE Employee_Id = ? 
//         AND Leave_Start_Date = ? 
//         AND Leave_End_Date = ?
//     `;

//     connection.beginTransaction(err => {
//         if (err) {
//             console.error("Error starting transaction:", err);
//             return res.status(500).json({ error: "Transaction error" });
//         }

//         // Update Timesheet Status
//         connection.query(timesheetQuery, [status, supervisionDate, employeeId, startDate, endDate], (err, timesheetResult) => {
//             if (err) {
//                 console.error("Error updating timesheet status:", err.sqlMessage);
//                 return connection.rollback(() => {
//                     res.status(500).json({ error: err.sqlMessage });
//                 });
//             }

//             // Update Leave Status
//             connection.query(leaveQuery, [status, supervisionDate, employeeId, startDate, endDate], (err, leaveResult) => {
//                 if (err) {
//                     console.error("Error updating leave status:", err.sqlMessage);
//                     return connection.rollback(() => {
//                         res.status(500).json({ error: err.sqlMessage });
//                     });
//                 }

//                 connection.commit(err => {
//                     if (err) {
//                         console.error("Error committing transaction:", err);
//                         return connection.rollback(() => {
//                             res.status(500).json({ error: "Commit error" });
//                         });
//                     }

//                     res.status(200).json({
//                         message: `Timesheet and leave status updated to '${status}' successfully.`,
//                         supervisionDate,
//                         timesheetAffectedRows: timesheetResult.affectedRows,
//                         leaveAffectedRows: leaveResult.affectedRows
//                     });
//                 });
//             });
//         });
//     });
// });



router.put('/updateStatus/:employeeId', (req, res) => { 
    const { employeeId } = req.params;
    const { startDate, endDate, status, approverEmployeeId } = req.body;

    if (!startDate || !endDate || !status || !approverEmployeeId || 
        (status !== "Approved" && status !== "Rejected")) {
        return res.status(400).json({ 
            error: "Invalid request. Provide startDate, endDate, approverEmployeeId, and valid status ('Approved' or 'Rejected')." 
        });
    }

    // Get current timestamp (Supervision_Date)
    const supervisionDate = new Date().toISOString().slice(0, 19).replace('T', ' '); // Format: "YYYY-MM-DD HH:MM:SS"

    // Query to get Approver's Name
    const getApproverQuery = `SELECT Employee_Name FROM signup WHERE Employee_Id = ?`;

    // Updated queries to include Supervision_Date
    const timesheetQuery = `
        UPDATE timesheet 
        SET Timesheet_Status = ?, Supervision = ?, Supervision_Date = ? 
        WHERE Employee_Id = ? 
        AND Timesheet_Start_Date = ? 
        AND Timesheet_End_Date = ?
    `;

    const leaveQuery = `
        UPDATE leave_records 
        SET Leave_Status = ?, Supervision = ?, Supervision_Date = ? 
        WHERE Employee_Id = ? 
        AND Leave_Start_Date = ? 
        AND Leave_End_Date = ?
    `;

    // Start transaction
    connection.beginTransaction(err => {
        if (err) {
            console.error("Error starting transaction:", err);
            return res.status(500).json({ error: "Transaction error" });
        }

        // Get Approver's Name
        connection.query(getApproverQuery, [approverEmployeeId], (err, approverResults) => {
            if (err) {
                console.error("Error fetching approver:", err.sqlMessage);
                return connection.rollback(() => {
                    res.status(500).json({ error: err.sqlMessage });
                });
            }

            if (approverResults.length === 0) {
                return connection.rollback(() => {
                    res.status(404).json({ error: "Approver not found" });
                });
            }

            const approverName = approverResults[0].Employee_Name;

            // Update Timesheet
            connection.query(timesheetQuery, 
                [status, approverName, supervisionDate, employeeId, startDate, endDate], 
                (err, timesheetResult) => {
                    if (err) {
                        console.error("Error updating timesheet:", err.sqlMessage);
                        return connection.rollback(() => {
                            res.status(500).json({ error: err.sqlMessage });
                        });
                    }

                    // Update Leave Records
                    connection.query(leaveQuery, 
                        [status, approverName, supervisionDate, employeeId, startDate, endDate], 
                        (err, leaveResult) => {
                            if (err) {
                                console.error("Error updating leave:", err.sqlMessage);
                                return connection.rollback(() => {
                                    res.status(500).json({ error: err.sqlMessage });
                                });
                            }

                            // Commit transaction
                            connection.commit(err => {
                                if (err) {
                                    console.error("Error committing transaction:", err);
                                    return connection.rollback(() => {
                                        res.status(500).json({ error: "Commit error" });
                                    });
                                }

                                res.status(200).json({
                                    message: `Status updated to '${status}' successfully.`,
                                    approver: approverName,
                                    supervisionDate: supervisionDate, // Return the timestamp
                                    timesheetUpdated: timesheetResult.affectedRows,
                                    leaveUpdated: leaveResult.affectedRows
                                });
                            });
                        });
                });
        });
    });
});


module.exports = router;
