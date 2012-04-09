WReader Code Lab Errata & Updates
=================================

This code lab is a work in progress, and there are a number of errors or items that need to be updated.  For the most up to date documentation and source code, be sure to check [https://github.com/petele/WebApp-CodeLab](https://github.com/petele/WebApp-CodeLab).

Exercise 1
----------
Exercise 1 is a little weak right now and needs to be updated to include more of an EmberJS introduction.

LawnChair IndexedDB Adapter
---------------------------
The [LawnChair IndexedDB Adapter](finalproject/js/libs/lawnchair-adapter-indexed-db-0.6.1.js) is currently hard coded to use the WebKit prefixes, which will fail for any non-webkit browser.  There are two solutions I'm currently investigating, updating the IndexedDB adapter, or replacing LawnChair with the [IDBWrapper](https://github.com/jensarps/IDBWrapper).


Vendor Prefixed CSS Styles
--------------------------
Almost all of the CSS is `-webkit` prefixed, and does not include prefixes for other browsers, this is a *bad* practice and needs to be fixed.  Beyond updating the documentation, a quick fix is to run the code through [Prefixr](http://prefixr.com/).
