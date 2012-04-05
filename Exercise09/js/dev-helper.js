/*
 Helper test methods to add a couple of items to our list
*/
//var items = [];

  var names = ["Adam", "Bert", "Charlie", "Dave", "Ernie", "Frances",
    "Gary", "Isabelle", "John", "Kyle", "Lyla", "Matt", "Nancy", "Ophelia",
    "Peter", "Quentin", "Rachel", "Stan", "Tom", "Uma", "Veronica", "Wilson",
    "Xander", "Yehuda", "Zora"];
  var feeds = ["Engadget", "Gizmodo", "Memegen", "New York Times"];

  var lorem = "<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed ";
  lorem += "do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ";
  lorem += "ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut ";
  lorem += "aliquip ex ea commodo consequat. Duis aute irure dolor in ";
  lorem += "reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla ";
  lorem += "pariatur. Excepteur sint occaecat cupidatat non proident, sunt in ";
  lorem += "culpa qui officia deserunt mollit anim id est laborum.</p>";
  lorem += lorem;
  lorem += lorem;
  lorem += lorem;

function addNewItems(num) {
  for (var i = 0; i < num; i++) {
    var item = {};
    var item_id = Math.floor(Math.random() * 1000000000);
    item.item_id = item_id;
    item.key = item_id;
    item.pub_name = feeds[Math.floor(Math.random()*feeds.length)];
    item.pub_author = names[Math.floor(Math.random()*names.length)] + " " + names[Math.floor(Math.random()*names.length)];
    item.title = "Item Title " + item_id.toString();
    item.item_link = "http://url/" + item_id.toString();
    item.feed_link = "http://url/" + item_id.toString();
    item.content = "<p>" + item.title + "<p>" + lorem;
    item.short_desc = item.content.substr(0, 128) + "...";
    item.pub_date = new Date(1300000000000 + i * 86400000 + (86400000 * Math.random()));
    if (Math.random() > 0.5) {
      item.read = true;
    }
    if (Math.random() > 0.5) {
      item.starred = true;
    }
    var emItem = WReader.Item.create(item);
    WReader.dataController.addItem(emItem);
    store.save(item);
    WReader.itemsController.showDefault();
  }
}

function addSingleNew() {
  var item = {};
  var i = Math.floor(Math.random() * 1000000000);
  item.item_id = i;
  item.key = i;
  item.pub_name = feeds[Math.floor(Math.random()*feeds.length)];
  item.pub_author = names[Math.floor(Math.random()*names.length)] + " " + names[Math.floor(Math.random()*names.length)];
  item.title = "Item Title " + i.toString();
  item.item_link = "http://url/" + i.toString();
  item.feed_link = "http://url/" + i.toString();
  item.content = "<p>" + item.title + "<p>" + lorem;
  item.short_desc = item.content.substr(0, 128) + "...";
  item.pub_date = new Date().toJSON();
  item.read = false;
  if (Math.random() > 0.5) {
    item.starred = true;
  }
  var emItem = WReader.Item.create(item);
  WReader.dataController.addItem(emItem);
  store.save(item);
  WReader.itemsController.showDefault();
}


