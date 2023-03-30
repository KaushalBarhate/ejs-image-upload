const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// Set EJS as templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
// Set storage engine
const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: function(req, file, cb) {
    cb(null,  Date.now() + path.extname(file.originalname));
  }
});

// Init upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 },
  fileFilter: function(req, file, cb) {
    checkFileType(file, cb);
  }
}).single('myImage');

// Check file type
function checkFileType(file, cb) {
  // Allowed extensions
  const filetypes = /jpeg|jpg|png|gif/;
  // Check extension
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime type
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb('Error: Images only!');
  }
}

// Public folder
app.use(express.static('./public'));

app.get('/', (req, res) => res.render('index'));

app.post('/upload', (req, res) => {
  upload(req, res, err => {
    if (err) {
      res.render('index', {
        msg: err
      });
    } else {
      if (req.file == undefined) {
        res.render('index', {
          msg: 'Error: No File Selected!'
        });
      } else {
        // Store the image name in a JSON file
        let images = [];
        if (fs.existsSync('./public/images.json')) {
          images = JSON.parse(fs.readFileSync('./public/images.json'));
        }
        images.push(req.file.filename);
        fs.writeFileSync('./public/images.json', JSON.stringify(images));

        res.render('index', {
          msg: 'File Uploaded!',
          file: `uploads/${req.file.filename}`
        });
      }
    }
  });
});

// Endpoint to delete an image name from the JSON file
// app.get('/delete/:filename', (req, res) => {
//   let images = [];
//   if (fs.existsSync('./public/images.json')) {
//     images = JSON.parse(fs.readFileSync('./public/images.json'));
//   }

//   const index = images.indexOf(req.params.filename);
//   if (index !== -1) {
//     images.splice(index, 1);
//     fs.writeFileSync('./public/images.json', JSON.stringify(images));
//     res.status(200).send('Image name deleted successfully');
//   } else {
//     res.status(404).send('Image not found in JSON file');
//   }
// });
// Endpoint to delete an image and its name from the server
app.get('/delete/:filename', (req, res) => {
  const imagePath = './public/uploads/' + req.params.filename;
  fs.unlink(imagePath, (err) => {
    if (err) {
      res.status(500).send('Error deleting image');
    } else {
      let images = [];
      if (fs.existsSync('./public/images.json')) {
        images = JSON.parse(fs.readFileSync('./public/images.json'));
      }

      const index = images.indexOf(req.params.filename);
      if (index !== -1) {
        images.splice(index, 1);
        fs.writeFileSync('./public/images.json', JSON.stringify(images));
        res.status(200).send('Image and its name deleted successfully');
      } else {
        res.status(404).send('Image not found in JSON file');
      }
    }
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
// module.exports = app
