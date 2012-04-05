


// Create the all up Ember application
var WReader = Em.Application.create({
  ready: function() {
    // Call the superclass's `ready` method.
    this._super();
  }
});

// Ember Object model for entry items
WReader.Item = Em.Object.extend({
  /* Exercise 2.1 */
});

WReader.dataController = Em.ArrayController.create({
  /* Exercise 2.2 */

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
});

// View for the ItemsList
WReader.SummaryListView = Em.View.extend({
  /* Exercise 2.3 */
});
