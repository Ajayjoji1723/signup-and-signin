const express = require("express");
const {open} = require("sqlite");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bcrypt = require("bcrypt");
const cors = require("cors");
const port = process.env.PORT || 3001


const dbPath = path.join(__dirname, "userdata.db");

const app = express();
app.use(cors({origin: true}));
app.use(express.json());
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(port, ()=>{
      console.log(`Server Running at ${port}`);
    });
  } catch ( e ) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const validatePassword= (password)=>{
  return password.length > 5;
};

app.get("/", async (req, res) => {
  const allUsersQuery = `SELECT * FROM userData;`;
  const allUsers = await db.all(allUsersQuery)
  res.json(allUsers)
});

app.post("/register/", async (req, res) => {
  const {optionid, username, mailid, companyname, mobilenum, password} = req.body;
  const userQuery = `SELECT * FROM userData WHERE mail_id = '${mailid}';`;
  const dbUser = await db.get(userQuery);
  const hashedPassword = await bcrypt.hash(password, 10);
  if ( dbUser === undefined ) {
    if (validatePassword(password)) {
      const createEmployee = `INSERT INTO userData(type,username,mail_id,company_name,mobile_num,password)
      VALUES
        ("${optionid}", "${username}", "${mailid}", "${companyname}", ${mobilenum}, "${hashedPassword}");`;
      const user = await db.run(createEmployee);
      console.log(user);
      res.status(200).json(`Registered as ${optionid}`);
    } else {
      res.json("Password is to short");
    }
  } else {
    res.json("User already registered");
  }
});

app.post("/login/", async (req, res) => {
  const {mailid, password} = req.body;
  const userQuery= `SELECT * FROM userData WHERE mail_id = '${mailid}'`;
  const dbUser = await db.get(userQuery);
  if (dbUser === undefined) {
    res.send("Invalid User");
  } else {
    console.log(dbUser);
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true ) {
      res.json(`${dbUser.type}`);
    } else {
      res.json("Invalid Password");
    }
  }
});

module.exports = app;

