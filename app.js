const express = require("express");
const bodyParser = require("body-parser");
//const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
var _ = require("lodash");

const dotenv = "dotenv";
dotenv.config();
const MongoPassword = process.env.PASSWORD;

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

//DB connection
mongoose.connect(
  `mongodb+srv://admin-kris:${MongoPassword}@cluster0.ct9nbjc.mongodb.net/todolistDB`,
  {
    useNewUrlParser: true,
  }
);

//Schema
const itemSchema = {
  name: String,
};

//Model
const Item = mongoose.model("Item", itemSchema);

//Create sample documents
const item1 = new Item({
  name: "welcome to todo list",
});
const item2 = new Item({
  name: "<-- Hit the + button to add a new item",
});
const item3 = new Item({
  name: "<-- Hit this to delete an item",
});
//put items in array
const defaultItems = [item1, item2, item3];

//list schema
const listSchema = {
  name: String,
  items: [itemSchema], //item schema base item ( item document)
};
// model
const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  //Read items
  Item.find()
    .then(function (foundItems) {
      if (foundItems.length === 0) {
        // check if collection is empty
        //insert multiple item (array of docs)
        Item.insertMany(defaultItems)
          .then(function () {
            console.log("successful save items to database");
            //mongoose.connection.close();
          })
          .catch(function (err) {
            console.log(err);
            //mongoose.connection.close();
          });
        res.redirect("/");
      } else {
        //just render the list
        res.render("list", { listTitle: "Today", newListItems: foundItems });
      }
    })
    .catch(function (err) {
      console.log(err);
    });
  //const day = date.getDate();
  //res.render("list", { listTitle: "day", newListItems: items });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  //create new document
  const item = new Item({
    name: itemName,
  });

  //handle diff listName
  if (listName === "Today") {
    //will save this into the collecion
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName })
      .then(function (foundList) {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      })
      .catch(function (err) {
        console.log(err);
      });
  }

  // if (req.body.list === "Work") {
  //   workItems.push(item);
  //   res.redirect("/work");
  // } else {
  //   items.push(item);
  //   res.redirect("/");
  // }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const checkedList = req.body.listName;

  if (checkedList === "Today") {
    Item.findByIdAndRemove(checkedItemId)
      .then(() => {
        console.log("deletion success.");
        res.redirect("/");
      })
      .catch(function (err) {
        console.log(err);
      });
  } else {
    List.findOneAndUpdate(
      { name: checkedList },
      { $pull: { items: { _id: checkedItemId } } }
    )
      .then(function (foundList) {
        res.redirect("/" + checkedList);
      })
      .catch(function (err) {
        console.log(err);
      });
  }
});

// app.get("/work", function (req, res) {
//   res.render("list", { listTitle: "Work List", newListItems: workItems });
// });

//create dynamic route
app.get("/:customListName", (req, res) => {
  //Access req.params.paramName
  const customListName = _.capitalize(req.params.customListName);

  //check if list exist
  List.findOne({ name: customListName })
    .then(function (foundList) {
      if (!foundList) {
        console.log("list doesn't exist, creating new list!");
        //create new list
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        //save to collection
        list.save();
        res.redirect("/" + customListName);
      } else {
        console.log("list already exists, showing existing list");
        //console.log(foundList);
        //show existing list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    })
    .catch(function (err) {
      console.log(err);
    });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
