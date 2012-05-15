describe('services', function() {
  beforeEach(module('wReader.services'));

  describe('items', function() {
    var URL = 'http://blog.chromium.org/feeds/posts/default?alt=json&callback=JSON_CALLBACK';
    var items;

    beforeEach(module(function($provide) {
      // mock out the store
      $provide.value('store', {
        all: function(callback) {callback([]);},
        save: angular.noop,
        toggleRead: angular.noop,
        toggleStar: angular.noop
      });
    }));

    beforeEach(inject(function($httpBackend, $injector) {
      $httpBackend.whenJSONP(URL).respond(RESPONSE);
      items = $injector.get('items');

      $httpBackend.flush();
    }));


    describe('addItem', function() {
      it('should only add item if it is not present yet', function() {
        expect(items.all.length).toBe(25);

        // returns true if added
        expect(items.addItem({item_id: 'fake-id'})).toBe(true);
        expect(items.all.length).toBe(26);

        // returns false if not added
        expect(items.addItem({item_id: 'fake-id'})).toBe(false);
        expect(items.all.length).toBe(26);
      });
    });


    describe('toggleRead', function() {
      it('should toggle selected item read', function() {
        items.selectItem(0);
        expect(items.filtered[0].read).toBe(true);

        items.toggleRead();
        expect(items.filtered[0].read).toBe(false);

        items.toggleRead();
        expect(items.filtered[0].read).toBe(true);
      });


      it('should set read of selected item to given value', function() {
        items.selectItem(0);
        expect(items.filtered[0].read).toBe(true);

        items.toggleRead(true);
        expect(items.filtered[0].read).toBe(true);

        items.toggleRead(true);
        expect(items.filtered[0].read).toBe(true);
      });
    });


    describe('toggleStar', function() {
      it('should toggle selected item star', function() {
        items.selectItem(0);
        expect(items.filtered[0].starred).toBe(false);

        items.toggleStar();
        expect(items.filtered[0].starred).toBe(true);

        items.toggleStar();
        expect(items.filtered[0].starred).toBe(false);
      });


      it('should set starred of selected item to given value', function() {
        items.selectItem(0);
        expect(items.filtered[0].starred).toBe(false);

        items.toggleStar(true);
        expect(items.filtered[0].starred).toBe(true);

        items.toggleStar(true);
        expect(items.filtered[0].starred).toBe(true);
      });
    });


    describe('selectItem', function() {
      it('should select given item', function() {
        items.selectItem(1);

        expect(items.selected).toBe(items.filtered[1]);
        expect(items.selectedIdx).toBe(1);
        expect(items.filtered[1].selected).toBe(true);
      });


      it('should deselect the previous item', function() {
        items.selectItem(1);
        items.selectItem(2);

        expect(items.filtered[1].selected).toBe(false);
      });


      it('should the item to be read', function() {
        items.selectItem(3);

        expect(items.filtered[3].read).toBe(true);
      });
    });


    describe('markAllRead', function() {
      it('should set all filtered items read', function() {
        items.markAllRead();

        angular.forEach(items.filtered, function(item) {
          expect(item.read).toBe(true);
        });
      });
    });


    describe('filterBy', function() {
      it('should filter starred/unstarred', function() {
        items.filterBy('starred', true);
        expect(items.filtered.length).toBe(0);

        items.filterBy('starred', false);
        expect(items.filtered.length).toBe(25);

        items.selectItem(0);
        items.toggleStar(true);
        items.selectItem(1);
        items.toggleStar(true);

        items.filterBy('starred', true);
        expect(items.filtered.length).toBe(2);

        items.filterBy('starred', false);
        expect(items.filtered.length).toBe(23);
      });


      it('should update index of selected item', function() {
        items.selectItem(1);
        items.toggleStar(true);
        expect(items.selectedIdx).toBe(1);

        items.filterBy('starred', true);
        expect(items.selectedIdx).toBe(0);
      });


      it('should remove selected item if not present in new filter', function() {
        var selectedItem = items.filtered[2];

        items.selectItem(2);
        items.toggleRead(true);
        expect(items.selectedIdx).toBe(2);

        items.filterBy('read', false);
        expect(items.selectedIdx).toBe(null);
        expect(items.selected).toBe(null);

        // should de-select the previous
        expect(selectedItem.selected).toBe(false);
      });
    });


    describe('clearFilter', function() {
      it('should clear the filters', function() {
        items.filterBy('read', true);
        expect(items.filtered.length).toBe(0);

        items.clearFilter();
        expect(items.filtered.length).toBe(25);
      });
    });


    describe('prev', function() {
      it('should select the first item if nothing selected yet', function() {
        items.prev();
        expect(items.selectedIdx).toBe(0);
      });


      it('should select previous item', function() {
        items.selectItem(2);
        items.prev();
        expect(items.selectedIdx).toBe(1);
      });


      it('should do nothing if first item selected', function() {
        items.selectItem(0);
        items.prev();
        expect(items.selectedIdx).toBe(0);
      });
    });


    describe('next', function() {
      it('should select the first item if nothing selected yet', function() {
        items.next();
        expect(items.selectedIdx).toBe(0);
      });


      it('should select next item', function() {
        items.selectItem(2);
        items.next();
        expect(items.selectedIdx).toBe(3);
      });


      it('should do nothing if last item selected', function() {
        items.selectItem(24);
        items.next();
        expect(items.selectedIdx).toBe(24);
      });
    });


    describe('hasPrev', function() {
      it('should return true if non first item selected', function() {
        items.selectItem(0);
        expect(items.hasPrev()).toBe(false);

        items.selectItem(1);
        expect(items.hasPrev()).toBe(true);

        items.selectItem(20);
        expect(items.hasPrev()).toBe(true);
      });


      it('should return true if nothing selected yet', function() {
        expect(items.hasPrev()).toBe(true);
      });
    });


    describe('hasNext', function() {
      it('should return true if non last item selected', function() {
        items.selectItem(0);
        expect(items.hasNext()).toBe(true);

        items.selectItem(23);
        expect(items.hasNext()).toBe(true);

        items.selectItem(24);
        expect(items.hasNext()).toBe(false);
      });


      it('should return true if nothing selected yet', function() {
        expect(items.hasNext()).toBe(true);
      });
    });
  });


  describe('Item', function() {
    var ENTRY = RESPONSE.feed.entry[0];

    it('should parse entry object', function() {
      var item = new Item(ENTRY, 'pub_name', 'link');

      expect(item.read).toBe(false);
      expect(item.starred).toBe(false);
      expect(item.selected).toBe(false);

      expect(item.title).toBe('Connect with Web Intents');
      expect(item.item_id).toBe('tag:blogger.com,1999:blog-2471378914199150966.post-9024980817440542046');
      expect(item.key).toBe('tag:blogger.com,1999:blog-2471378914199150966.post-9024980817440542046');
      expect(item.pub_name).toBe('pub_name');
      expect(item.pub_author).toBe('Google Chrome Blog');
      expect(item.pub_date instanceof Date).toBe(true);
      expect(item.pub_date.getTime()).toBe(1337114100001);
      expect(item.item_link).toEqual('http://blog.chromium.org/2012/05/connect-with-web-intents.html');
      expect(item.feed_link).toBe('link');
    });


    it('should init empty object if no entry given', function() {
      var item = new Item();

      expect(item.read).toBe(false);
      expect(item.starred).toBe(false);
      expect(item.selected).toBe(false);
    });
  });
});
