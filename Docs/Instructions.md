WReader Code Lab
================


<div class="alert alert-info">
  <strong>Attention!</strong> Be sure to check the <a href="errata.html">errata documention</a> for important updates and a list of currently broken features.
</div>

Introduction
------------
This codelab covers the techniques and design fundamentals required to create modern, 'lick-able' web applications.  The exercises look at the fundamentals of building web applications:

* Using an MVC framework
* Making cross-domain requests and handling JSON data
* Creating user interfaces & experiences that are action oriented and app-like
* Enabling offline experiences

### Prerequisites
Before you begin, make sure you've downloaded the required [codelab files](https://github.com/petele/WebApp-CodeLab/zipball/master) from [https://github.com/petele/WebApp-CodeLab](https://github.com/petele/WebApp-CodeLab), that you have a working development environment, and a working web server.  You must be able to successfully open and run `http://server/codelab/finalproject/index.html`

### How To Proceed
Each exercise has it's own folder (for example `/exercise1/`).  It includes a folder `_solution` with working code you can use if you run out of time or get stuck.  Progressive exercises folders include the solution from the previous exercises.

For each exercise, it's *recommended* that you start with the working version provided in the exercise folder to ensure that you're always starting from a known position, and that a mistake in a previous exercise doesn't pop up in a later exercise.

***

Exercise 1 - Boiler plate
-------------------------
For our application, we've chosen to use [HTML5Boilerplate](http://html5boilerplate.com/) as our starting point.  Take a few minutes to have a look around the included files, and customize title and description in index.html.  For now, leave the Google Analytics UA as is; we'll update that later.

***

Exercise 2 - Setup Model, Controller, and View
----------------------------------------------
We've chosen to use [Ember.js](http://emberjs.com/) as our MVC framework, and have added that to the `/js/libs/` folder.  We've also added a `dev-helper.js` file for some simple testing and development use and will remove this before we complete the project.

In this exercise, we'll create our data model and controller, and then add a simple view to the page so that we can see the items in our controller.

### Step 1: Creating the Ember object
The first thing we need to do is create an Ember object to store our data feeds in.  We will extend the `Em.Object` and create a new `Item` object with the following properties: `read`, `starred`, `item_id`,  `title`, `pub_name`, `pub_author`, `pub_date`, `short_desc`, `content`, `feed_link`, and `item_link`.

#### Exercise 2.1 (js/app.js)
    // Ember Object model for entry items
    WReader.Item = Em.Object.extend({
      read: false,
      starred: false,
      item_id: null,
      title: null,
      pub_name: null,
      pub_author: null,
      pub_date: new Date(0),
      short_desc: null,
      content: null,
      feed_link: null,
      item_link: null
    });

### Step 2: Create a data controller to store our items
Next, we need to create a data controller object (`dataController`) by extending the Ember array controller class.  Ember leaves it up to us how we store the data, and add items to the controller, so we'll need to add an array to store the data (`content: []`), and a method (`addItem: function(item)`) to add items to the array.  To save some time, we've already added a binary search method (`binarySearch: function(value, low, high)`) to make it easier to add them items to the array in a `pub_date` sorted order.

#### Exercise 2.2 (js/app.js)
    // content array for Ember's data
    content: [],

    // Adds an item to the controller if it's not already in the controller
    addItem: function(item) {
      // Check to see if there are any items in the controller with the same
      // item_id already
      var exists = this.filterProperty('item_id', item.item_id).length;
      if (exists === 0) {
        // If no results are returned, we insert the new item into the data
        // controller in order of publication date
        var length = this.get('length'), idx;
        idx = this.binarySearch(Date.parse(item.get('pub_date')), 0, length);
        this.insertAt(idx, item);
        return true;
      } else {
        // It's already in the data controller, so we won't re-add it.
        return false;
      }
    },

### Step 3: Add a summary list view
Now that we've got data into our controller, we need a way to display it on screen with a view.  For now, we'll just create a simple view that creates an article tag, with two classes `well` and `summary`.

#### Exercise 2.3 (js/app.js)
    tagName: 'article',
    classNames: ['well', 'summary']

### Step 4: Add the view to our HTML
We've got the view defined in our framework, we need to render it in the HTML somewhere.  We'll put this in the `mainContent` `section` element and put all of these items into a child section with the class `summaries`.


#### Exercise 2.4 (index.html)
    <script type="text/x-handlebars">
      {{#each WReader.dataController}}
        {{#view WReader.SummaryListView contentBinding="this"}}
          {{content.title}} from {{content.pub_name}} on {{content.pub_date}}
        {{/view}}
      {{/each}}
    </script>

The script block tells Ember's template compiler that the code between the tags should be rendered with the appropriate content from the defined controllers and views.  We use `{{#each WReader.dataController}}` to specify that we want every item in the `dataController` to be rendered with the `WReader.SummaryListView`.

### Step 5: Let's try it out!
Let's try it out.  When we open the app in Chrome, we won't see anything, because nothing has been added to the data controller yet.  We'll use a function in dev-helper.js to do that, and Ember will automatically update our view.

1. Open exercise 2 in Chrome (eg `http://localhost/wreader/exercise2/index.html`)
2. Open the dev tools and switch to the console window
3. In the console window and type `addNewItems(10)` then hit enter

_If everything worked, you should now see 10 new articles, listing the title, publisher, and date._

***

Exercise 3 - Enhance View & Controllers
---------------------------------------
In this exercise, we'll add some additional properties to our controller so we can quickly query for the number of items, how many have been read, starred.  We'll also create a function to format the date into something a little more human friendly.

### Step 1: Add additional properties to the dataController
We want to show the number of items that are in our data controller, including the total count, how many have been read, how many are unread, and how many are starred.  Ember allows us to make a function act like a property by adding `.property()` to the end of the function.  The value we pass to the property function tells Ember when the specified item is updated, it needs to update the value of the property.

Let's look at an example for readCount:
    readCount: function() {
      return 1;
    }.property('@each')

Right now, it simply returns 1, but we want it to return the number of read items in our data controller.  To do that, we need to get the list of read items, and then get the length of that filtered list.  Ember provides an easy way to filter objects with the `filterProperty(name, value)` function.  Let's replace the `return 1;` with `return this.filterProperty('read', true).get('length');`

Now that you've got how to get the number of read items, let's add properties for `itemCount`, `readCount`, `unreadCount` and `starredCount`.

#### Exercise 3.1 (js/app.js)
    // A 'property' that returns the count of items
      itemCount: function() {
      return this.get('length');
    }.property('@each'),

    // A 'property' that returns the count of read items
    readCount: function() {
      return this.filterProperty('read', true).get('length');
    }.property('@each.read'),

    // A 'property' that returns the count of unread items
    unreadCount: function() {
      return this.filterProperty('read', false).get('length');
    }.property('@each.read'),

    // A 'property' that returns the count of starred items
    starredCount: function() {
      return this.filterProperty('starred', true).get('length');
    }.property('@each.starred')

### Step 2: Show new count properties in HTML
Let's add the counts to our `index.html` page so we can see the counts for items that are in our data controller.  Ember's templating feature allow us to pull data straight from controllers in addition to views, by providing the full namespace.  For example, `{{WReader.dataController.itemCount}}` will display the value for the `itemCount` property on the object `dataController`.

#### Exercise 3.2 (index.html)
    <div>
      {{WReader.dataController.itemCount}} items <br />
      {{WReader.dataController.unreadCount}} are unread<br />
      {{WReader.dataController.readCount}} are read<br />
      {{WReader.dataController.starredCount}} are starred<br />
    </div>

### Step 3: Let's try it out!
Let's try it out!

1. Open exercise 3 in Chrome (eg `http://localhost/wreader/exercise3/index.html`)
2. Open the dev tools and switch to the console window
3. In the console window, type `addNewItems(10)` and hit enter

_If everything worked, you should now see 10 new articles, listing the title, publisher, and date, as well as the counts read, unread starred and total items._

### Step 4: Add additional class bindings to SummaryListView

We want Ember to add the `read` and/or `starred` class to items in the `SummaryListView` if they've already been read or starred.  To do that, we need to add a `classNameBindings` property to the view, and add matching properties to the view object.

First, let's add the `classNameBinding` property, and bind the `read` and `starred` properties, if the property returns `true`, it'll add the bound class.

#### Exercise 3.4a (js/app.js)
    classNameBindings: ['read', 'starred']

Next, we need to add the properties for `read` and `starred` items.  Since we already have a property on the item for `read` and `starred`, we can simply query that property and return its result. Like the counts, these are also properties, but instead of being updated every time `@each` object changes, we want them to update as the items change in the controller.

#### Exercise 3.4b (js/app.js)
    // Enables/Disables the read CSS class
    read: function() {
      var read = this.get('content').get('read');
      return read;
    }.property('WReader.itemsController.@each.read'),

    // Enables/Disables the read CSS class
    starred: function() {
      var starred = this.get('content').get('starred');
      return starred;
    }.property('WReader.itemsController.@each.starred')

### Step 5: Custom date formatting
Finally, let's format the date in to something a little more human readable.  We've added [Moment.js](http://momentjs.com/), a date & time library that makes date formatting a lot easier.  Like we did for the `read` and `starred` properties on the view, we'll create a property on the view to return the formatted date.

#### Exercise 3.5 (js/app.js)
    // Returns the date in a human readable format
    formattedDate: function() {
      var d = this.get('content').get('pub_date');
      return moment(d).format('MMMM Do, YYYY');
    }.property('WReader.itemsController.@each.pub_date')

### Step 6: Let's try it out!
Let's try it out!

1. Open exercise 3 in Chrome (eg `http://localhost/wreader/exercise3/index.html`)
2. Open the dev tools and switch to the console window
3. In the console window, type `addNewItems(10)` and hit enter

_If everything worked, you should now see 10 new articles, listing the title, publisher, and a nicely formatted date.  If you've got extra time, play around with moment.js to see what other formats you can put the date into._

***

Exercise 4 - Add New Controller & NavBar
----------------------------------------
In exercise 4, we'll add a new controller for filtering what's visible on screen and hook up a set of click events to the counters.

### Step 1: Create a new itemsController
The `dataController` contains all of the items in our data store, but we don't always want to show that, sometimes we may only want to show the read items, or the starred items, or maybe just the unread items.  To do that, we'll create a new controller (`itemsController`), that will contain only the visible items.

We also want to add two new functions to this controller, `clearFilter()` and `filterBy(key, value)`.  Using `filterBy()` set's the content of `itemsController` to the filtered results of the `dataController`.

#### Exercise 4.1 (js/app.js)
    WReader.itemsController = Em.ArrayController.create({
    // content array for Ember's data
    content: [],

    // Sets content[] to the filtered results of the data controller
    filterBy: function(key, value) {
      this.set('content', WReader.dataController.filterProperty(key, value));
    },

    // Sets content[] to all items in the data controller
    clearFilter: function() {
      this.set('content', WReader.dataController.get('content'));
    },

    // Shortcut for filterBy
    showDefault: function() {
      this.filterBy('read', false);
    },

### Step 2: Add a navigation bar view
The next step is to create a new view for the fixed navigation bar that will run across the top of the UI.  Its primary purpose will be to show the number of items in the `dataController`, and update the `itemsController`.

In `NavBarView`, let's add properties for `itemCount`, `unreadCount`, `starredCount`, and `readCount` that returns the number of items in the `dataController`.  For example, `itemCount` would return `WReader.dataController.get('itemCount');`

#### Exercise 4.2 (js/app.js)
    // A 'property' that returns the count of items
    itemCount: function() {
      return WReader.dataController.get('itemCount');
    }.property('WReader.dataController.itemCount'),

    // A 'property' that returns the count of unread items
    unreadCount: function() {
      return WReader.dataController.get('unreadCount');
    }.property('WReader.dataController.unreadCount'),

    // A 'property' that returns the count of starred items
    starredCount: function() {
      return WReader.dataController.get('starredCount');
    }.property('WReader.dataController.starredCount'),

    // A 'property' that returns the count of read items
    readCount: function() {
      return WReader.dataController.get('readCount');
    }.property('WReader.dataController.readCount')

### Step 3: Add the navigation bar to the index.html
Now that we've created the view, we need a place for it to display in our HTML.  Since this will be a fixed navigation bar across the top of the page, we'll put it in a `<header>` element just below the `body` element.

Note: that we're wrapping the counts in anchor elements, we'll deal with that in the next step.

#### Exercise 4.3 (index.html)
    <header>
      <script type="text/x-handlebars">
        {{#view WReader.NavBarView}}
          <ul>
            <li><a>{{itemCount}} Items</a></li>
            <li><a>{{unreadCount}} Unread</a></li>
            <li><a>{{starredCount}} Starred</a></li>
            <li><a>{{readCount}} Read</a></li>
          </ul>
        {{/view}}
      </script>
    </header>

### Step 4: Add the click handlers for the anchors
To change what's displayed in the `SummaryListView`, we need to add click handlers to the anchor elements.  Adding a click handler is done by adding `{{action "function" on="click"}}` to each anchor element.

#### Exercise 4.4a (index.html)
    <li><a {{action "showAll" on="click"}}>{{itemCount}} Items</a></li>
    <li><a {{action "showUnread" on="click"}}>{{unreadCount}} Unread</a></li>
    <li><a {{action "showStarred" on="click"}}>{{starredCount}} Starred</a></li>
    <li><a {{action "showRead" on="click"}}>{{readCount}} Read</a></li>

Next, we need to handle the clicks in the `NavBarView` by creating a new function for each of the methods we've indicated, `showAll`, `showUnread`, `showStarred`, and `showRead`.

#### Exercise 4.4b (js/app.js)
    // Click handler for menu bar
    showAll: function() {
      WReader.itemsController.clearFilter();
    },

    // Click handler for menu bar
    showUnread: function() {
      WReader.itemsController.filterBy('read', false);
    },

    // Click handler for menu bar
    showStarred: function() {
      WReader.itemsController.filterBy('starred', true);
    },

    // Click handler for menu bar
    showRead: function() {
      WReader.itemsController.filterBy('read', true);
    }

### Step 5: Let's try it out!
Let's try it out!

1. Open exercise 4 in Chrome (eg `http://localhost/wreader/exercise4/index.html`)
2. Open the dev tools and switch to the console window
3. In the console window, type `addNewItems(10)` and hit enter
4. Click on each of the different counts to see the items list change

_If everything worked, you should now see 10 new articles, listing the title, publisher, and a nicely formatted date.  Clicking on the different counts should update the displayed list._

***

Exercise 5 - Pull Data From Server
----------------------------------
In this exercise, we're going to make a cross domain request to get the RSS feed data from another server, and then insert it into our data controller.  We'll use a Yahoo pipe to get the feed, since it supports CORS requests, and pull RSS feed from the Chromium blog.

### Step 1: Create the GetItemsFromServer function
jQuery and the browser are smart enough to handle CORS requests for us and there is little extra that we need to do!  We simply need to supply it with the URL we want to make the request to.

First, let's create the GetItemsFromServer function off the WReader namespace, then we'll craft our request URL.

#### Exercise 5.1 (js/app.js)
    WReader.GetItemsFromServer = function() {
      // URL to data feed that I plan to consume
      var feed = "http://blog.chromium.org/feeds/posts/default?alt=rss";
      feed = encodeURIComponent(feed);

      // Feed parser that supports CORS and returns data as a JSON string
      var feedPipeURL = "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20xml%20where%20url%3D'";
      feedPipeURL += feed + "'&format=json";
      //console.log("Starting AJAX Request:", feedPipeURL);

      /* Exercise 5.2 */

    };

### Step 2: Use jQuery to make the AJAX request
Next, we can make the actual request using jQuery

#### Exercise 5.2 (js/app.js)
    $.ajax({
      url: feedPipeURL,
      dataType: 'json',
      success: function(data) {
        /* Exercise 5.3 */
      });

### Step 3: Parse the returned data, create new items & insert into controller
Once the data has been returned from the server, we can parse the data into individual items and insert them into the `dataController`.  Ember provides a `map` function that makes it easy to iterate through an array and do something with that array.  In our case, we'll use the `map` function to iterate over the RSS feed items, create new a Ember object then insert it into the `dataController`.

#### Exercise 5.3 (js/app.js)
    // Get the items object from the result
    var items = data.query.results.rss.channel.item;

    // Get the original feed URL from the result
    var feedLink = data.query.results.rss.channel.link;

    // Use map to iterate through the items and create a new JSON object for
    // each item
    items.map(function(entry) {
      var item = {};
      // Set the item ID to the item GUID
      item.item_id = entry.guid.content;
      // Set the publication name to the RSS Feed Title
      item.pub_name = data.query.results.rss.channel.title;
      item.pub_author = entry.author;
      item.title = entry.title;
      // Set the link to the entry to it's original source if it exists
      //  or set it to the entry link
      if (entry.origLink) {
        item.item_link = entry.origLink;
      } else if (entry.link) {
        item.item_link = entry.link;
      }
      item.feed_link = feedLink;
      // Set the content of the entry
      item.content = entry.description;
      // Ensure the summary is less than 128 characters
      if (entry.description) {
        item.short_desc = entry.description.substr(0, 128) + "...";
      }
      // Create a new date object with the entry publication date
      item.pub_date = new Date(entry.pubDate);
      item.read = false;
      // Set the item key to the item_id/GUID
      item.key = item.item_id;
      // Create the Ember object based on the JavaScript object
      var emItem = WReader.Item.create(item);
      // Try to add the item to the data controller, if it's successfully
      // added, we get TRUE and add the item to the local data store,
      // otherwise it's likely already in the local data store.
      WReader.dataController.addItem(emItem);
    });

    // Refresh the visible items
    WReader.itemsController.showDefault();

### Step 4: Fire GetItemsFromServer() at application start
Since we want the application to start and get the latest data from the server, we'll add `WReader.GetItemsFromServer();` to the `var WReader = Em.Application.create({ ... });` function.

#### Exercise 5.4 (js/app.js)
    WReader.GetItemsFromServer();

### Step 5: Add a refresh button to the NavBarView
Our last step for this exercise will be to add a refresh button to the `NavBarView`, which means we need to add a  click handler to `NavBarView` and an anchor tag in `index.html` that will fire the handler.

#### Exercise 5.5a (js/app.js)
    // Click handler for menu bar
    refresh: function() {
      WReader.GetItemsFromServer();
    }

#### Exercise 5.5b (index.html)
    <li><a {{action "refresh" on="click"}}>Reload</a></li>

### Step 6: Let's try it out!
Let's try it out!

1. Open exercise 5 in Chrome (eg `http://localhost/wreader/exercise5/index.html`)
4. Click on each of the different counts to see the items list change

_If everything worked, you should now see 20 new articles loaded from the web service, listing the title, publisher, and a nicely formatted date.  Clicking on the different counts should update the displayed list._

***

Exercise 6 - Setup Application UI and UX
----------------------------------------
In exercise 6, we'll Twitter's Bootstrap UI framework, and a number of visual styling elements to get WReader to look like a real web application instead of the jumble of text that it is now.

### Step 1: Add Bootstrap's UI style sheet
We've already downloaded [Twitter's Bootstrap](http://twitter.github.com/bootstrap/), so we need to include the style sheet in our HTML.  For now, we'll only include the CSS style sheet, but it also comes with a small JavaScript that adds additional functionality.

#### Exercise 6.1 (index.html)
    <link rel="stylesheet" href="css/bootstrap.css">

### Step 2: Add styling & semantics to header
Next, let's update the nav bar in `index.html` to be styled to use [Twitter's NavBar](http://twitter.github.com/bootstrap/components.html#navbar) look and feel.

The navbar requires only a few divs to structure it well for static or fixed display.

    <div class="navbar navbar-fixed-top">
      <div class="navbar-inner">
        <div class="container">
          <a class="brand">...</a>
          <ul class="nav">
            <li>...</li>
          </ul>
        </div>
      </div>
    </div>

#### Exercise 6.2 (index.html)
    <header>
      <script type="text/x-handlebars">
        {{#view WReader.NavBarView}}
          <div class="navbar navbar-fixed-top">
            <div class="navbar-inner">
              <div class="container">
                <a class="brand">wReader</a>
                <ul class="nav">
                  <li class="itemCount"><a {{action "showAll" on="click"}}>{{itemCount}} Items</a></li>
                  <li class="itemCount"><a {{action "showUnread" on="click"}}>{{unreadCount}} Unread</a></li>
                  <li class="itemCount"><a {{action "showStarred" on="click"}}>{{starredCount}} Starred</a></li>
                  <li class="itemCount"><a {{action "showRead" on="click"}}>{{readCount}} Read</a></li>
                </ul>
                <form class="navbar-search pull-left" id="navSearch">
                  <input type="text" class="search-query" placeholder="Search">
                </form>
                <ul class="nav pull-right">
                  <li><a {{action "refresh" on="click"}}><i class="icon-refresh icon-white"></i></a></li>
                </ul>
              </div>
            </div>
          </div>
        {{/view}}
      </script>
    </header>

### Step 3: Apply appropriate classes to mainContent
In order to prepare for our three column layout that we're about to add, we need to add two new divs to the `mainContent` `section`, one that will display the navigation controls on the left, and one to display the selected item on the right.

#### Exercise 6.3a (index.html)
    <section class="controls">controls</section>

#### Exercise 6.3b (index.html)
    <section class="entries">entries</section>


### Step 4: Set up 3 column layout for main panel
Now it's time to set up the three column layout using the flex-box model.  We've already setup a couple of classes in our `css.html` file to reduce some of the annoying styling that you'd need to do.

First, let's set the style on `mainContent` that contains all of our content
#### Exercise 6.4a (style.css)
    section.mainContent {
      display: -webkit-box;
      -webkit-box-orient: horizontal;
      overflow: hidden;
      height: 100%;
      width: 100%;
      box-sizing: border-box;
      padding-bottom: 0px;
    }

We also need to make sure that all `div`'s that are child elements of `section.mainContent` to be the full height of the window.

#### Exercise 6.4b (style.css)
    section.mainContent div {
      height: 100%;
    }

Finally, let's add the CSS to specify how we want the look and feel for each of the three columns

#### Exercise 6.4c (style.css)
    .controls {
      box-sizing: border-box;
      padding: 5px;
      width: 50px;
      margin: 0;
      height: 100%;
    }

    .summaries {
      box-sizing: border-box;
      padding: 10px;
      overflow-y: scroll;
      width: 300px;
    }

    .entries {
      padding: 10px;
      box-sizing: border-box;
      -webkit-box-flex: 1;
      overflow-y: scroll;
      padding-left: 10px;
    }

### Step 5: Let's try it out!
Let's try it out!

1. Open exercise 6 in Chrome (eg `http://localhost/wreader/exercise6/index.html`)
2. Click on each of the different counts to see the items list change

***

Exercise 7 - Add selected item controller & view for controller
------------------------------------------------
In this exercise, we'll add the selected item controller to show which item are currently 'selected', and provide functionality to move to the previous, or next one, mark the current one as read/unread and add or remove the starred attribute.

### Step 1: Create the SelectedItemController
Like we have with our previous controllers, we need to create a new controller by extending Ember's base object `WReader.selectedItemController = Em.Object.create({ ... });`  In it we will need to add several properties, for example `selectedItem` to hold the selected item, `hasPrev` and `hasNext` to indicate if there are items in `itemsController` before or after the selected item.

#### Exercise 7.1a (js/app.js)
    // Pointer to the seclected item
    selectedItem: null,
    hasPrev: false,
    hasNext: false,

    // Called to select an item
    select: function(item) {
      this.set('selectedItem', item);
      if (item) {
        this.toggleRead(true);

        // Determine if we have a previous/next item in the array
        var currentIndex = WReader.itemsController.content.indexOf(this.get('selectedItem'));
        if (currentIndex + 1 >= WReader.itemsController.get('itemCount')) {
          this.set('hasNext', false);
        } else {
          this.set('hasNext', true);
        }
        if (currentIndex === 0) {
          this.set('hasPrev', false);
        } else {
          this.set('hasPrev', true);
        }

      } else {
        this.set('hasPrev', false);
        this.set('hasNext', false);
      }
    },

The `selectedItemController` sets `hasPrev` and `hasNext` when an item is selected by checking where in the array index our selected item falls.

Next, we want to be able to both toggle and explictly set the read and starred state for this item.  We'll do that by creating two functions `toggleRead(bool)` and `toggleStar(bool)`.  The parameter is optional, and if it's not set, we should toggle the flag.

#### Exercise 7.1b (js/app.js)
    // Toggles or sets the read state with an optional boolean
    toggleRead: function(read) {
      if (read === undefined) {
        read = !this.selectedItem.get('read');
      }
      this.selectedItem.set('read', read);
      var key = this.selectedItem.get('item_id');
    },

    // Toggles or sets the starred status with an optional boolean
    toggleStar: function(star) {
      if (star === undefined) {
        star = !this.selectedItem.get('starred');
      }
      this.selectedItem.set('starred', star);
      var key = this.selectedItem.get('item_id');
    },

Finally, we want to have a way to move to the previous or next item in `itemsController`

#### Exercise 7.1c (js/app.js)
    // Selects the next item in the item controller
    next: function() {
      // Get's the current index in case we've changed the list of items, if the
      // item is no longer visible, it will return -1.
      var currentIndex = WReader.itemsController.content.indexOf(this.get('selectedItem'));
      // Figure out the next item by adding 1, which will put it at the start
      // of the newly selected items if they've changed.
      var nextItem = WReader.itemsController.content[currentIndex + 1];
      if (nextItem) {
        this.select(nextItem);
      }
    },

    // Selects the previous item in the item controller
    prev: function() {
      // Get's the current index in case we've changed the list of items, if the
      // item is no longer visible, it will return -1.
      var currentIndex = WReader.itemsController.content.indexOf(this.get('selectedItem'));
      // Figure out the previous item by subtracting 1, which will result in an
      // item not found if we're already at 0
      var prevItem = WReader.itemsController.content[currentIndex - 1];
      if (prevItem) {
        this.select(prevItem);
      }
    }

### Step 2: Adding our EntryItemView
By this time, hopefully you've got the hang of Ember's views, so let's create `WReader.EntryItemView` by extending `Em.View` as we've done in the past.  Since the content that will be represented is effectively an article from a blog, we'll specifically set the `tagName`, and add a few default classes like `well` and `entry`.

#### Exercise 7.2a (js/app.js)
    tagName: 'article',
    contentBinding: 'WReader.selectedItemController.selectedItem',
    classNames: ['well', 'entry'],

But, let's take this a step further, and instead of using the `classNameBindings` like we have in the past, let's actually specify the classes we want used for each item.  That way, we can have one class use if an item is read, and a different one if it isn't.  Twitter's Bootstrap library includes icons that will work perfectly for read/unread and starred/unstarred states.  We've also used [Moment.js](http://moment.js) again to provide some nice date formatting.

#### Exercise 7.2b (js/app.js)
    // Enables/Disables the active CSS class
    active: function() {
      return true;
    }.property('WReader.selectedItemController.selectedItem'),

    starClass: function() {
      var selectedItem = WReader.selectedItemController.get('selectedItem');
      if (selectedItem) {
        if (selectedItem.get('starred')) {
          return 'icon-star';
        }
      }
      return 'icon-star-empty';
    }.property('WReader.selectedItemController.selectedItem.starred'),

    readClass: function() {
      var selectedItem = WReader.selectedItemController.get('selectedItem');
      if (selectedItem) {
        if (selectedItem.get('read')) {
          return 'icon-ok-sign';
        }
      }
      return 'icon-ok-circle';
    }.property('WReader.selectedItemController.selectedItem.read'),

    // Returns a human readable date
    formattedDate: function() {
      var d = this.get('content').get('pub_date');
      return moment(d).format("MMMM Do YYYY, h:mm a");
    }.property('WReader.selectedItemController.selectedItem')

### Step 3: Add a click handler to the SummaryListView items
Next we need some kind of way to select items from the `SummaryListView`.  To do that, we'll add a click handler to the view that will set the `selectedItemController`'s item to the item that was clicked on.  Ember is very helpful because it knows about certain event types (like `click`), which means we can add it to the `view`, but don't have to make any changes to our markup.

#### Exercise 7.3 (js/app.js)
    // Handle clicks on an item summary
    click: function(evt) {
      // Figure out what the user just clicked on, then set selectedItemController
      var content = this.get('content');
      WReader.selectedItemController.select(content);
    },

If we try running this now, clicking on an item, it will select it by calling `WReader.selectedItemController.select(content);`, but because we don't have anything in our markup to display it yet, we won't see anything.

### Step 4: Adding the markup to display what's in selectedItemController
Let's get the rendering for the EntryItemView on to our page.  Like other views, it's content lives between `<script type="text/x-handlebars">`, but this time, we're going to do something a little different.  Ember's template language allows us to use `if` statements to see if a controller has content or not  If it does, it uses one view, and if it doesn't it might use a different view, in our case, we're just going to use some simple markup if there's nothing there.  For example, `{{#if WReader.selectedItemController.selectedItem}}` checks if there is an item selected in the `selectedItemController`.

For now, let's just concentrate on getting the content on the page, we'll make it look pretty in a minute.

#### Exercise 7.4 (index.html)
    <script type="text/x-handlebars">
      {{#if WReader.selectedItemController.selectedItem}}
        {{#view WReader.EntryItemView}}
            <p>{{formattedDate}}</p>
            <p>
              <i {{bindAttr class="readClass"}}></i> <i {{bindAttr class="starClass"}}></i>
              <a target="_blank" {{bindAttr href="content.item_link"}}><i class="icon-share"></i></a>
            </p>
            <h2>{{content.title}}</h2>
            <p>by {{content.pub_author}} of {{content.pub_name}}</p>
            <p>{{{content.content}}}</p>
          {{/view}}
        {{else}}
          <div class="nothingSelected">
            <img src="img/sadpanda.png" alt="Sad Panda">
            <p>Nothing selected.</p>
          </div>
        {{/if}}
    </script>

You'll notice that we've got the `{{#if}}` statement, the `{{else}}` and finally the `{{/if}}, so if there isn't an item selected, we can show the sad panda.  If we try to run the app now, when you click on an item in the summary list on the left, it should appear on the right with all of the information.

### Step 5: Add an active property to SummaryListView
It would be nice if we could indicate in the `summaryListView` on the left, which item is currently selected, so that users have a better idea of what they're looking at.  To do that, we'll add an additional class to the `classNameBindings` list, and an additional property to `summaryListView` to indicate if an item is selected in the `selectedItemController` or not.

#### Exercise 7.5a (js/app.js)
    classNameBindings: ['read', 'starred', 'active'],

#### Exercise 7.5b (js/app.js)
    // Enables/Disables the active CSS class
    active: function() {
      var selectedItem = WReader.selectedItemController.get('selectedItem');
      var content = this.get('content');
      if (content === selectedItem) {
        return true;
      }
    }.property('WReader.selectedItemController.selectedItem')

Finally, we can add some additional styling for items that are read, unread, starred, or selected.  We've provided styles for the read and active, and will leave it open to your creativity to add the starred style.

#### Exercise 7.5c (style.css)
    .summary.read {
      opacity: 0.6;
    }

    .summary.active {
      background-color: #e4e4e4;
      border: 1px solid rgba(0, 0, 0, 0.05);
      opacity: 1.0;
    }

### Step 6: Add the left hand controls
We're going to create another view that will provide some functionality down the left hand side to make it easy to move between articles, mark them read/unread, add stars, etc.  Like before, we need to start by creating a new view (`WReader.NavControlsView`) that extends `Em.View`.  We've already added handlers for most of the buttons (`navUp`, `navDown`, etc)

Let's first add the view to our HTML.  We're going to use the flex box model in the next step, so for now, we're just getting things set up.  We're going to need five buttons, `markAllRead`, `navUp`, `navDown`, `toggleStar`, `toggleRead` and `refresh`.

#### Exercise 7.6a (index.html)
    <script type="text/x-handlebars">
      {{#view WReader.NavControlsView}}
        <div class="tControls">
          <div class="top">
            <button {{action "markAllRead"}} class='btn'><i class="icon-ok"></i></button>
          </div>
          <div class="middle">
            <button {{action "navUp"}} class='btn'><i class="icon-arrow-up"></i></button>
            <button {{action "toggleStar"}} {{bindAttr disabled="buttonDisabled"}} class='btn'>
              <i {{bindAttr class="starClass"}}></i>
            </button>
            <button {{action "toggleRead"}} {{bindAttr disabled="buttonDisabled"}} class='btn'>
              <i {{bindAttr class="readClass"}}></i>
            </button>
            <button {{action "navDown"}} class='btn'><i class="icon-arrow-down"></i></button>
          </div>
          <div class="bottom">
            <button {{action "refresh"}} class='btn'><i class="icon-refresh"></i></button>
          </div>
        </div>
      {{/view}}
    </script>

Notice in `toggleStar` button, we've got `{{bindAttr disabled="buttonDisabled"}}`, this binds the `buttons`'s disabled property to the `buttonDisabled` property in `NavControlsView`.  This has the effect of enabling or disabling the button depending on if something is selected or not.

#### Exercise 7.6b (js/app.js)
    starClass: function() {
      var selectedItem = WReader.selectedItemController.get('selectedItem');
      if (selectedItem) {
        if (selectedItem.get('starred')) {
          return 'icon-star';
        }
      }
      return 'icon-star-empty';
    }.property('WReader.selectedItemController.selectedItem.starred'),

    readClass: function() {
      var selectedItem = WReader.selectedItemController.get('selectedItem');
      if (selectedItem) {
        if (selectedItem.get('read')) {
          return 'icon-ok-sign';
        }
      }
      return 'icon-ok-circle';
    }.property('WReader.selectedItemController.selectedItem.read'),

    nextDisabled: function() {
      return !WReader.selectedItemController.get('hasNext');
    }.property('WReader.selectedItemController.selectedItem.next'),

    prevDisabled: function() {
      return !WReader.selectedItemController.get('hasPrev');
    }.property('WReader.selectedItemController.selectedItem.prev'),

    buttonDisabled: function() {
      var selectedItem = WReader.selectedItemController.get('selectedItem');
      if (selectedItem) {
        return false;
      }
      return true;
    }.property('WReader.selectedItemController.selectedItem')

### Step 7: Style the controls on the left side
We'll use the flexbox layout again, but this time, instead of laying things out horizontally, we'll do it vertically.  Like before, we set the display of our parent element (`.tControls`) to `display: -webkit-box;`, but this time, we set the orientation to `-webkit-box-orient: vertical;`  Next, we need to set the heights on the elements and tell them how to grow.

We also want the buttons to have a particular size, so let's set that as well to ensure that they fit properly and look nice.

#### Exercise 7.7a
    .tControls {
      display: -webkit-box;
      -webkit-box-orient: vertical;
    }

    .controls div.top {
      min-height: 50px;
      display: -webkit-box;
      -webkit-box-align: start;
      -webkit-box-flex: 1;
    }

    .controls div.middle {
      min-height: 185px;
      display: -webkit-box;
      -webkit-box-align: center;
      -webkit-box-flex: 2;
    }

    .controls div.bottom {
      min-height: 50px;
      -webkit-box-flex: 1;
      display: -webkit-box;
      -webkit-box-align: end;
    }

    .controls .btn {
      width: 40px;
      height: 40px;
      margin-top: 5px;
    }

### Step 8: Let's try it out!
Let's try it out!

1. Open exercise 7 in Chrome (eg `http://localhost/wreader/exercise7/index.html`)
2. Click on each of the different counts to see the items list change

***


Exercise 8 - Add UI Enhancements
--------------------------------
Right now our content is just being rendered on screen in a very boring way, in this exercise you'll update the content to look a little more styled and eye catching.

### Step 1: Making the SummaryListView look more exciting
We'll use Bootstrap's grid layout to get our content looking exactly like we want.  For the summary list, we want two rows, one that will contain `pub_name` and one for `pub_date`, on the second row, we'll list the item `title`.

#### Exercise 8.1a (index.html)
    {{#each WReader.itemsController}}
      {{#view WReader.SummaryListView contentBinding="this"}}
        <div class="row-fluid">
          <div class="span6 pub-name">
            {{content.pub_name}}
          </div>
          <div class="span6 pub-date">
            {{formattedDate}}
          </div>
        </div>
        <h3 class="pub-title">{{content.title}}</h3>
      {{/view}}
    {{/each}}

A little extra font styling would be nice, but certainly isn't required.

#### Exercise 8.1b (style.css)
    .summary .pub-name {
      font-size: 0.9em;
    }
    .summary .pub-date {
      font-size: 0.9em;
      text-align: right;
    }

### Step 2: Making the EntryItemView look better
The EntryItemView could look so much better, and we want to add a set of controls to allow us easily change the state of the item.  We've already implemented the handlers for these events, so you don't need to worry about that for now.

#### Exercise 8.2a (index.html)
    {{#view WReader.EntryItemView}}
      <div class="row-fluid">
        <div class="span8">{{formattedDate}}</div>
          <div class="span4 actions">
            <button type="button" {{bindAttr class="readButtonClass"}} {{action "toggleRead"}}>
              <i {{bindAttr class="readClass"}} class="icon-white"></i>
            </button>
            <button type="button" {{bindAttr class="starButtonClass"}} {{action "toggleStar"}}>
              <i {{bindAttr class="starClass"}}></i>
            </button>
            <a target="_blank" {{bindAttr href="content.item_link"}} class="btn"><i class="icon-share"></i></a>
          </div>
        </div>
        <h2>{{content.title}}</h2>
        <span class="author">{{content.pub_author}}</span> - <span class="pub-name">{{content.pub_name}}</span>
        <hr />
        <p class="post-content">{{{content.content}}}</p>
      {{/view}}

#### Exercise 8.2b (style.css)
    .entry {
      box-shadow: 5px 5px 5px rgba(210, 210, 210, 0.6);
    }

    .entry.active {
      border: 0px solid #222;
    }

    .entry .pub-date {
      font-size: 0.9em;
    }
    .entry .actions {
      text-align: right;
    }

    .entry .post-content img {
      margin: 5px;
    }

    .nothingSelected {
      text-align: center;
    }

### Step 3: Add a toggleRead and toggleStar to the EntryItemView
Let's go ahead and add two handlers to toggle the read and star states of the selected item.

#### Exercise 8.3 (js/app.js)
    toggleRead: function() {
      WReader.selectedItemController.toggleRead();
    },

    toggleStar: function() {
      WReader.selectedItemController.toggleStar();
    }

### Step 4: Add more UI and UX embelishments
Take a bit of time to play with any additional UI embelishments that you may want to add.  Be sure to check out [Bootstrap's](http://twitter.github.com/bootstrap) documentation to see what all is available to you!

### Step 5: Let's try it out!
Let's try it out!

1. Open exercise 8 in Chrome (eg `http://localhost/wreader/exercise8/index.html`)
2. Click on each of the different counts to see the items list change

***

Exercise 9 - Adding LawnChair for persistent data storage
---------------------------------------------------------
In exercise 9, we're going to use [LawnChair](http://westcoastlogic.com/lawnchair/) as a simple data storage library.  LawnChair is good, but has some pretty significant issues that would prevent it from being used in production code, but they're fixable with a little effort.

### Step 1: Create a LawnChair instance to store our data
The first thing we need to do is create our LawnChair instance so that we've got quick and easy access to it.

#### Exercise 9.1 (js/app.js)
    // Create or open the data store where objects are stored for offline use
    var store = new Lawnchair({name: 'entries', record: 'entry'}, function() {});

### Step 2: Create a new method to pull any existing data from the local data store
We need to create a method (`WReader.GetItemsFromDataStore`) to pull out any existing data from the data store before we go up to the server and ask it if it has anything new.  That method makes a request to LawnChair to get all of the items, the does a `forEach` over the resulting array and adds those items to the dataController.

We're using `store.all` instead of `store.each` because LawnChair returns ther results asyncronously, which might lead to items being added from the server and the local store at the same time, something we don't want.  Once we've finished adding all of the items from the local data store, we'll ask the server if it has any new data by calling `WReader.GetItemsFromServer();`

#### Exercise 9.2 (js/app.js)
    // Get all items from the local data store.
    var items = store.all(function(arr) {
      arr.forEach( function(entry) {
        var item = WReader.Item.create(entry);
        WReader.dataController.addItem(item);
      });
      console.log("Entries loaded from local data store:", arr.length);

      // Set the default view to any unread items
      WReader.itemsController.showDefault();

      // Load items from the server after we've loaded everything from
      //  the local data store
      WReader.GetItemsFromServer();
    });

### Step 3: Update the start up flow to load local data first, then the server
We want to remove the call to `WReader.GetItemsFromServer();` and replace it with `WReader.GetItemsFromDataStore();`, which will call `WReader.GetItemsFromServer();` when it's done.

#### Exercise 9.3 (js/app.js)
    WReader.GetItemsFromDataStore();

### Step 4: Update dataController.addItem to prevent duplicates and store new items locally
We don't want the local data store to contain duplicate items, so we need to be careful about adding them.  Our `dataController.addItem(item)` function returns true if the item is unique (and not currently saved locally) or false if it's already in the `dataController`.  That means we can use the result of `addItem` to determine if we should save the new item in the `store`.

#### Exercise 9.4 (js/app.js)
    if (WReader.dataController.addItem(emItem)) {
      store.save(item);
    }

### Step 5: Let's try it out!
Let's try it out!

1. Open exercise 9 in Chrome (eg `http://localhost/wreader/exercise9/index.html`)
2. Comment out the `WReader.GetItemsFromServer();` and see if data is loaded from the local store

***

Exercise 10 - Adding AppCache to enable offline experiences
-----------------------------------------------------------

### Step 1: Create the cache manifest

#### Exercise 10.1 (wreader.appcache)
    CACHE MANIFEST
    # version 0.0.10

    CACHE:
    index.html
    js/libs/jquery-1.7.1.min.js
    js/dev-helper.js
    js/libs/bootstrap.js
    js/libs/lawnchair-0.6.1.js
    js/libs/lawnchair-adapter-indexed-db-0.6.1.js
    js/libs/moment-1.5.0.js
    js/libs/ember-0.9.5.js
    js/plugins.js
    js/app.js
    css/bootstrap.css
    css/style.css

    NETWORK:
    *

### Step 2: Add the manifest to index.html

#### Exercise 10.2 (index.html)
    <html class="no-js" lang="en" manifest="wreader.appcache">


### Step 3: Add event handlers (optional)

#### Exercise 10.3a (js/app.js)
    window.applicationCache.addEventListener('updateready', function(e) {
      if (window.applicationCache.status == window.applicationCache.UPDATEREADY) {
        $("#modalUpdate").modal({"show":true});
      }
    }, false);

    WReader.swapCache = function(value) {
      if (value === true) {
        window.applicationCache.swapCache();
        window.location.reload();
      } else {
        $("#modalUpdate").modal('hide');
      }
    };

#### Exercise 10.3b (index.html)
    <div class="modal fade" id="modalUpdate">
      <div class="modal-header">
        <a class="close" data-dismiss="modal">×</a>
        <h3>Update Application</h3>
      </div>
      <div class="modal-body">
        <p>A new version of WReader is available, would you like to upgrade now?</p>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-primary" onclick="WReader.swapCache(true);">Yes</button>
        <button type="button" class="btn" onclick="WReader.swapCache(false);">Later</button>
      </div>
    </div>

### Step 5: Let's try it out!
Let's try it out!

1. Open exercise 10 in Chrome (eg `http://localhost/wreader/exercise10/index.html`)
2. Open the dev tools and switch to the console window
3. Verify everything is cached as expected
4. Disable your network and try to reload the page

### Step 6: Disable AppCache for further development

1. Re-enable the network if you haven't already
1. Rename `wreader.appcache` to `_disabled_wreader.appcache`
2. Refresh WReader in the browser
3. Verify that caching fails and items are loaded as expected.

***

Exercise 11 - Adding keyboard and touch events
----------------------------------------------

### Step 1: Add keyboard event handler

#### Exercise 11.1a (js/app.js)
    function handleBodyKeyDown(evt) {
      if (evt.srcElement.tagName === "BODY") {
        switch (evt.keyCode) {
          case 34: // PgDn
          case 39: // right arrow
          case 40: // down arrow
          case 74: // j
            WReader.selectedItemController.next();
            break;

          case 32: // Space
            WReader.HandleSpaceKey();
            evt.preventDefault();
            break;

          case 33: // PgUp
          case 37: // left arrow
          case 38: // up arrow
          case 75: // k
            WReader.selectedItemController.prev();
            break;

          case 85: // U
            WReader.selectedItemController.toggleRead();
            break;

          case 72: // H
            WReader.selectedItemController.toggleStar();
            break;
          }
        }
    }

#### Exercise 11.1b (js/app.js)
    WReader.HandleSpaceKey = function() {
      var itemHeight = $('.entry.active').height() + 60;
      var winHeight = $(window).height();
      var curScroll = $('.entries').scrollTop();
      var scroll = curScroll + winHeight;
      if (scroll < itemHeight) {
        $('.entries').scrollTop(scroll);
      } else {
        WReader.selectedItemController.next();
      }
    };

#### Exercise 11.1c (js/app.js)
    document.addEventListener('keydown', handleBodyKeyDown, false);

### Step 2: Let's try it out!
Let's try it out!

1. Open exercise 11 in Chrome (eg `http://localhost/wreader/exercise11/index.html`)
2. Try pressing j, k, u or h

### Step 3: Add touch events to the SummaryListView
Since we want the same experience if a user touches an item in the summary view as if they clicked on it, we'll just have the `touchEnd` event pass directly to the `click` event handler.

#### Exercise 11.3 (js/app.js)
    touchEnd: function(evt) {
      this.click(evt);
    }


Exercise 12 - Performance Tips & Techniques
-------------------------------------------
Be sure to check out [Best Practices for Speeding Up Your Web Site](http://developer.yahoo.com/performance/rules.html) from the good folks at [Yahoo](http://developer.yahoo.com/), who have done a lot of great work around this.

### Step 1: Use the audit tool in Chrome
1. Open exercise 12 in Chrome (eg `http://localhost/wreader/exercise12/index.html`)
2. Open the Chrome Developer Tools, and switch to the `Audit` tab
3. Press the Audit button
4. Review the Network Utilization tab and make any applicable updates
5. Review the Web Page Performance tab and make any applicable updates


### Step 2: Scripts at the bottom, CSS at the top
We've already done this in our boiler plate, so there's nothing to change here! Yay!

### Step 3: Reduce the number of HTTP requests

1. Combine your CSS files in the a single CSS file and replace with the new combined file
2. Combine any JavaScript files that you can

#### Exercise 12.3a - Concatenate files
    cat css/bootstrap.css css/style.css > css/wreader.css
    cat js/libs/bootstrap.js js/libs/lawnchair-0.6.1.js js/libs/moment-1.5.0.js js/plugins.js > js/libs/libraries.js

#### Exercise 12.3b (index.html)
    <link rel="stylesheet" href="css/wreader.css">

#### Exercise 12.3c (index.html)
    <script src="js/libraries.js"></script>
    <script src="js/libs/ember-0.9.5.js"></script>
    <script src="js/app.js"></script>

### Step 4: Minify the code to reduce file sizes

#### Exercise 12.4a
    java -jar ../tools/yuicompressor-2.4.7.jar css/wreader.css -o css/wreader.min.css
    java -jar ../tools/yuicompressor-2.4.7.jar js/libraries.js -o js/libraries.min.js
    java -jar ../tools/yuicompressor-2.4.7.jar js/app.js -o js/app.min.js

_Note_: For these couple of files, our request size decreased from *170k* to *62k*

#### Exercise 12.4b
1. Update `wreader.css` to `wreader.min.css`.  (Dropped by *14k*)
2. Update `libraries.js` to `libraries.min.js`  (Dropped by *48k*)
3. Update `ember-0.9.5.js` to `ember-0.9.5.min.js` (Dropped by *332k*)
4. Update `app.js` to `app.min.js` (Dropped by *10k*)
5. Update and enable `wreader.appcache` for the new minified files

