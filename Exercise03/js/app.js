


// Create the all up Ember application
var WReader = Em.Application.create({
  ready: function() {
    // Call the superclass's `ready` method.
    this._super();
  }
});

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

WReader.dataController = Em.ArrayController.create({
  // content array for Ember's data
  content: [],

  // Adds an item to the controller if it's not already in the controller
  addItem: function(item) {
    // Check to see if there are any items in the controller with the same
    //  item_id already
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

  // Binary search implementation that finds the index where a entry
  // should be inserted when sorting by date.
  binarySearch: function(value, low, high) {
    var mid, midValue;
    if (low === high) {
      return low;
    }
    mid = low + Math.floor((high - low) / 2);
    midValue = Date.parse(this.objectAt(mid).get('pub_date'));

    if (value < midValue) {
      return this.binarySearch(value, mid + 1, high);
    } else if (value > midValue) {
      return this.binarySearch(value, low, mid);
    }
    return mid;
  }

  /* Exercise 3.1 */

});

// View for the ItemsList
WReader.SummaryListView = Em.View.extend({
  tagName: 'article',
  classNames: ['well', 'summary']

  /* Exercise 3.4 */

  /* Exercise 3.5 */

});
