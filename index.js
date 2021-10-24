// const ipfsClient = require('ipfs-http-client');
const express = require('express');
// const bodyParser = require('body.parser');
// const fileUpload = require('express-fileupload');
// const fs = require('fs')
var app = express();

app.use(express.static('public'));
// Port website will run on
app.listen(8080);

// const ipfs = new ipfsClient([host = 'localhost', port = '5001', protocol = 'http']);

// app.set('view engine', 'html')
// app.use(bodyParser.urlencoded({extended = true}));
// app.use(fileUpload());

// app.post('/public/Upload', (req, res) => {
//     const file = req.files.file;
//     const fileName = req.body.fileName;
//     const filePath = 'files/' + fileName;

//     file.mv(filePath, async (err) => {
//         if(err){
//             console.log('Error: failed to download the file');
//             return res.status(500).send(err);
//         }

//         const fileHash = await addFile(fileName, filePath);
//         fs.unlink(filePath, (err) => {
//             if(err){
//                console.log(err);
//             }
//         })

//         res.render('upload', {fileName, fileHash});
//     })
// });

// const addFile = async (fileName, filePath) => {
//     const file = fs.readFileSync(filePath);
//     const fileAdded = await ipfs.add({path: fileName, content: file});
//     const fileHash = fileAdded[0].hash;

//     return fileHash
// }


