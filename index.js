const ipfsClient = require('ipfs-http-client');
const express = require('express');
const bodyParser = require('body.parser');
const fileUpload = require('express-fileupload');
const fs = require('fs')
var app = express();

app.use(express.static('public'));
// Port website will run on
app.listen(8080);

const ipfs = new ipfsClient([host = 'localhost', port = '5001', protocol = 'http']);

app.set('view engine', 'html')
app.use(bodyParser.urlencoded({extended = true}));
app.use(fileUpload());

app.post('/public/Upload', (req, res) => {
    const file = req.files.file;
    const fileName = req.body.fileName;
    const filePath = 'files/' + fileName;

    file.mv(filePath, async (err) => {
        if(err){
            console.log('Error: failed to download the file');
            return res.status(500).send(err);
        }

        const fileHash = await addFile(fileName, filePath);
        fs.unlink(filePath, (err) => {
            if(err){
               console.log(err);
            }
        })

        res.render('upload', {fileName, fileHash});
    })
});

const addFile = async (fileName, filePath) => {
    const file = fs.readFileSync(filePath);
    const fileAdded = await ipfs.add({path: fileName, content: file});
    const fileHash = fileAdded[0].hash;

    return fileHash
}

// Connect to CockroachDB through Sequelize.


// Create the "accounts" table.
function insertion() {
    const Sequelize = require("sequelize-cockroachdb");
  // For secure connection:
    const fs = require(['fs']);
    var sequelize = new Sequelize({
      dialect: "postgres",
      username: "andrewzhang76",
      password: "LTqvU1pow8hYE1mp",
      host: "free-tier.gcp-us-central1.cockroachlabs.cloud",
      port: 26257,
      database: "EDU-IO.defaultdb",
      dialectOptions: {
        ssl: {
          rejectUnauthorized: false,
          // For secure connection:
          ca: fs.readFileSync('certs/ca.crt')
                   .toString()
        },
      },
      logging: false,
    });
    
    // Define the Account model for the "accounts" table.
    const Account = sequelize.define("accounts", {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
      },
      balance: {
        type: Sequelize.INTEGER,
      },
      password:{
        type: Sequelize.STRING,
      }
      
    });
    Account.sync({
      force: true,
    })
      .then(function () {
        // Insert two rows into the "accounts" table.
        return Account.bulkCreate([
          {
            id: "andrewzhang76@berkeley.edu",
            balance: 1000,
            password:"zjm010706",
          },
          {
            id: "jerryhu@berkeley.edu",
            balance: 250,
            password:"huyujie1207",
          },
        ]);
      })
      .then(function (accounts) {
        // Print out the balances.
        accounts.forEach(function (account) {
          console.log(account.id + " " + account.balance);
        });
        process.exit(0);
      })
      .catch(function (err) {
        console.error("error: " + err.message);
        process.exit(1);
      });
  }
  


