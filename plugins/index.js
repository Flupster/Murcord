const fs = require("fs");

exports.load = () => {
  console.log("Loading plugins...");

  fs.readdir(__dirname, (err, files) => {
    files.forEach(file => {
      if (file !== "index.js") {
        require("./" + file).start();
      }
    });
  });
};
