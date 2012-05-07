DocsController.$inject = ['$scope', '$location', '$window', '$cookies', '$filter'];
function DocsController(scope, $location, $window, $cookies, $filter) {
  window.$root = scope.$root;

  var OFFLINE_COOKIE_NAME = 'ng-offline',
      DOCS_PATH = /^\/(api)|(guide)|(cookbook)|(misc)|(tutorial)/,
      INDEX_PATH = /^(\/|\/index[^\.]*.html)$/,
      filter = $filter('filter');

  scope.$location = $location;
  scope.versionNumber = angular.version.full;
  scope.version = angular.version.full + "  " + angular.version.codeName;
  scope.subpage = false;
  scope.offlineEnabled = ($cookies[OFFLINE_COOKIE_NAME] == angular.version.full);
  scope.futurePartialTitle = null;
  scope.loading = 0;

  if (!$location.path() || INDEX_PATH.test($location.path())) {
    $location.path('/api').replace();
  }

  scope.$watch('$location.path()', function(path) {
    // ignore non-doc links which are used in examples
    if (DOCS_PATH.test(path)) {
      var parts = path.split('/');
      scope.sectionId = parts[1];
      scope.partialId = parts[2] || 'index';
      scope.pages = filter(NG_PAGES, {section: scope.sectionId});

      var i = scope.pages.length;
      while (i--) {
        if (scope.pages[i].id == scope.partialId) break;
      }
      if (i<0) {
        scope.partialTitle = 'Error: Page Not Found!';
        delete scope.partialId;
      } else {
        // TODO(i): this is not ideal but better than updating the title before a partial arrives,
        //   which results in the old partial being displayed with the new title
        scope.futurePartialTitle = scope.pages[i].name;
        scope.loading++;
      }
    }
  });

  scope.getUrl = function(page) {
    return page.section + (page.id == 'index' ? '' : '/' + page.id);
  };

  scope.getCurrentPartial = function() {
    return this.partialId
        ? ('./partials/' + this.sectionId + '/' + this.partialId.replace('angular.Module', 'angular.IModule') + '.html')
        : '';
  };

  scope.getClass = function(page) {
    var depth = page.depth,
        cssClass = 'level-' + depth + (page.name == this.partialId ? ' selected' : '');

    if (page.section == 'api')
      cssClass += ' monospace';

    return cssClass;
  };

  scope.selectedSection = function(section) {
    return section == scope.sectionId ? 'current' : '';
  };

  scope.selectedPartial = function(partial) {
    return partial.id == scope.partialId ? 'current' : '';
  };

  scope.afterPartialLoaded = function() {
    var currentPageId = $location.path();
    scope.loading--;
    scope.partialTitle = scope.futurePartialTitle;
    SyntaxHighlighter.highlight();
    $window._gaq.push(['_trackPageview', currentPageId]);
    loadDisqus(currentPageId);
  };

  /** stores a cookie that is used by apache to decide which manifest ot send */
  scope.enableOffline = function() {
    //The cookie will be good for one year!
    var date = new Date();
    date.setTime(date.getTime()+(365*24*60*60*1000));
    var expires = "; expires="+date.toGMTString();
    var value = angular.version.full;
    document.cookie = OFFLINE_COOKIE_NAME + "="+value+expires+"; path=" + $location.path;

    //force the page to reload so server can serve new manifest file
    window.location.reload(true);
  };

  // bind escape to hash reset callback
  angular.element(window).bind('keydown', function(e) {
    if (e.keyCode === 27) {
      scope.$apply(function() {
        scope.subpage = false;
      });
    }
  });

  function loadDisqus(currentPageId) {
    // http://docs.disqus.com/help/2/
    window.disqus_shortname = 'angularjs-next';
    window.disqus_identifier = currentPageId;
    window.disqus_url = 'http://docs-next.angularjs.org' + currentPageId;

    if ($location.host() == 'localhost') {
      return; // don't display disqus on localhost, comment this out if needed
      //window.disqus_developer = 1;
    }

    // http://docs.disqus.com/developers/universal/
    (function() {
        var dsq = document.createElement('script'); dsq.type = 'text/javascript'; dsq.async = true;
      dsq.src = 'http://angularjs.disqus.com/embed.js';
      (document.getElementsByTagName('head')[0] ||
        document.getElementsByTagName('body')[0]).appendChild(dsq);
    })();

    angular.element(document.getElementById('disqus_thread')).html('');
  }
}

SyntaxHighlighter['defaults'].toolbar = false;
SyntaxHighlighter['defaults'].gutter = true;

/**
 * Controller for tutorial instructions
 * @param $cookieStore
 * @constructor
 */
function TutorialInstructionsCtrl($scope, $cookieStore) {
  $scope.selected = $cookieStore.get('selEnv') || 'git-mac';

  $scope.currentCls = function(id, cls) {
    return this.selected == id  ? cls || 'current' : '';
  };

  $scope.select = function(id) {
    this.selected = id;
    $cookieStore.put('selEnv', id);
  };
}

angular.module('ngdocs', ['ngdocs.directives', 'ngResource', 'ngCookies', 'ngSanitize'],
    function($locationProvider, $filterProvider, $compileProvider) {
  $locationProvider.html5Mode(true).hashPrefix('!');

  $filterProvider.register('title', function(){
    return function(text) {
      return text && text.replace(/^angular\.module\.([^\.]+)(\.(.*))?$/, function(_, module, _0, name){
        return 'Module ' + module + (name ? ' - ' + name : '');
      });
    };
  });

  $compileProvider.directive('code', function() {
    return { restrict: 'E', terminal: true };
  });
});

angular.module('ngdocs.directives', [], function($compileProvider) {

  var angularJsUrl;
  var scripts = document.getElementsByTagName("script");
  var angularJsRegex = /^(|.*\/)angular(-\d.*?)?(\.min)?.js(\?[^#]*)?(#(.*))?$/;
  for(var j = 0; j < scripts.length; j++) {
    var src = scripts[j].src;
    if (src && src.match(angularJsRegex)) {
      angularJsUrl = src.replace(/docs(-next)?\.angularjs\.org/, 'code.angularjs.org');
      continue;
    }
  }


  var HTML_TEMPLATE =
    '<!doctype html>\n' +
    '<html ng-app_MODULE_>\n' +
    ' <script src="' + angularJsUrl + '"></script>\n' +
    '_SCRIPT_SOURCE_' +
    ' <body>\n' +
    '_HTML_SOURCE_\n' +
    ' </body>\n' +
    '</html>';

  $compileProvider.directive('docExample', ['$injector', '$log', '$browser', '$location',
                                    function($injector,   $log,   $browser,   $location) {
    return {
      restrict: 'E',
      terminal: true,
      compile: function(element, attrs) {
        var module = attrs.module;

        //jQuery find() methods in this widget contain primitive selectors on purpose so that we can use
        //jqlite instead. jqlite's find() method currently supports onlt getElementsByTagName!
        var example = element.find('pre').eq(0),  //doc-source
            scriptSrc = '',
            htmlSrc = example.text().replace(/<script(\s+type="text\/javascript")?>([\s\S]+)<\/script>/im, function(_, type, script) {
                scriptSrc = script;
                return '';
              }),
            showSource = example.attr('source') !== 'false',
            jsfiddle = example.attr('jsfiddle') || true,
            scenario = element.find('pre').eq(1); //doc-scenario

        var tabs = angular.element('<ul class="doc-example">');

        // show source tab, if not disabled
        if (showSource) {
          tabs.append(
            '<li class="doc-example-heading"><h3>Source</h3></li>' +
            '<li class="doc-example-source" ng:non-bindable>' +
            jsFiddleButton(jsfiddle) + // may or may not have value
            '<pre class="brush: js; html-script: true; toolbar: false;"></pre></li>');
        }
        // show live preview tab
        var livePreviewTab;
        tabs.append('<li class="doc-example-heading"><h3>Live Preview</h3></li>');
        tabs.append(livePreviewTab = angular.element('<li class="doc-example-live">' + htmlSrc +'</li>'));
        // show scenario tab, if present
        if (scenario.text()) {
          tabs.append(
            '<li class="doc-example-heading"><h3>Scenario Test</h3></li>' +
            '<li class="doc-example-scenario"><pre class="brush: js">' + scenario.text() + '</pre></li>');
        }

        tabs.find('li').eq(1).find('pre').text(
          HTML_TEMPLATE.
            replace('_SCRIPT_SOURCE_', scriptSrc ? ' <script>\n' + indent(scriptSrc, '  ') + '\n </script>\n'  : '').
            replace('_HTML_SOURCE_', indent(htmlSrc, '  ')).
            replace('_MODULE_', module ? '="' + module + '"' : ''));

        element.html('');
        element.append(tabs);

        try {
          if (window.execScript) { // IE
            window.execScript(scriptSrc || '"stupid IE!"'); // IE complains when evaling empty string
          } else {
            window.eval(scriptSrc);
          }
        } catch (e) {
          alert(e);
        }

        return function(docsAppScope) {
          var modules = [
            function($provide) {
              $provide.value('$browser', $browser);
              $provide.provider('$location', function() {
                this.$get = function() {
                  return $location;
                };
                this.hashPrefix = this.html5Mode = angular.noop;
              });
              $provide.decorator('$defer', function($rootScope, $delegate) {
                return angular.extend(function(fn, delay) {
                  if (delay && delay > 500) {
                    return setTimeout(function() {
                      $rootScope.$apply(fn);
                    }, delay);
                  } else {
                    return $delegate.apply(this, arguments);
                  }
                }, $delegate);
              });
            }
          ];
          module && modules.push(module);

          angular.bootstrap(livePreviewTab, modules).
              invoke(['$rootScope', function(example$rootScope) {
                element.bind('$destroy', docsAppScope.$root.$watch(function() {
                  // this propagates the $watch from the docs app to the example app
                  example$rootScope.$digest();
                }));
              }]);
        };

        function jsFiddleButton(jsfiddle) {
          var fixJsFiddleIssue132 = true;
          if (jsfiddle !== 'false') {
            if(jsfiddle === true) {
              //dynamically generate a fiddle
              var fiddleUrl = 'http://jsfiddle.net/api/post/library/pure/';

              function jsFiddleEscape(text, prefix) {
                return indent(text.replace(/<\/textarea>/gi,'&lt;/textarea&gt;'), prefix);
              }

              return '<form class="jsfiddle" method="post" action="' + fiddleUrl + '" target="_blank">' +
                        (fixJsFiddleIssue132 ? '' : '<textarea name="resources">' + angularJsUrl + '</textarea>') +
                        '<textarea name="css">\n' +
                          (fixJsFiddleIssue132 ? '</style>\n<script src="' + angularJsUrl + '"></script>\n<style>\n' : '') +
                          '.ng-invalid { border: 1px solid red; } \n' +
                          'body { font-family: Arial,Helvetica,sans-serif; }\n' +
                          'body, td, th { font-size: 14px; margin: 0; }\n' +
                          'table { border-collapse: separate; border-spacing: 2px; display: table; margin-bottom: 0; margin-top: 0; -moz-box-sizing: border-box; text-indent: 0; }\n' +
                          'a:link, a:visited, a:hover { color: #5D6DB6; text-decoration: none; }\n' +
                          '.error { color: red; }\n' +
                        '</textarea>' +
                        '<input type="text" name="title" value="AngularJS Live Example">' +
                        '<textarea name="html">' +
                          '<div ng:app' + (module ? '="' + module + '"' : '') + '>\n' + jsFiddleEscape(htmlSrc, ' ') + '\n</div>' +
                        '</textarea>' +
                        '<textarea name="js">' + jsFiddleEscape(scriptSrc) + '</textarea>' +
                        '<button>edit at jsFiddle</button>' +
                      '</form>';
            } else {
              //use existing fiddle
              fiddleUrl = "http://jsfiddle.net" + jsfiddle;
              return '<form class="jsfiddle" method="get" action="' + fiddleUrl + '" target="_blank">' +
                       '<button>edit at jsFiddle</button>' +
                     '</form>';
            }
          } else {
            return '';
          }
        };
      }
    }
  }]);

  function indent(text, prefix) {
    prefix = prefix || '';
    if (!text) return text;
    var lines = text.split(/\r?\n/);
    var i;

    // remove any leading blank lines
    while (lines[0].match(/^\s*$/)) lines.shift();
    // remove any trailing blank lines
    while (lines[lines.length - 1].match(/^\s*$/)) lines.pop();
    var minIndent = 999;
    for (i = 0; i < lines.length; i++) {
      var line = lines[0];
      var indent = line.match(/^\s*/)[0];
      if (indent !== line && indent.length < minIndent) {
        minIndent = indent.length;
      }
    }

    for (i = 0; i < lines.length; i++) {
      lines[i] = prefix + lines[i].substring(minIndent);
    }
    return lines.join('\n');
  }

  $compileProvider.directive('docTutorialInstructions', function() {
    var HTML_NAV = '<li ng:class="currentCls(\'{id}\')"><a ng:click="select(\'{id}\')" href>{title}</a></li>';
    var HTML_CONTENT = '<div ng:show="selected==\'{id}\'">{content}</div>';

    var HTML_TPL =
        '<p><a ng:init="showInstructions = {show}" ng:show="!showInstructions" ng:click="showInstructions = true" href>Workspace Reset Instructions &nbsp;&#x27A4;</a></p>' +
        '<div ng:controller="TutorialInstructionsCtrl" ng:show="showInstructions">' +
          '<div class="tabs-nav">' +
            '<ul>' +
            '</ul>' +
          '</div>' +
          '<div class="tabs-content"><div class="tabs-content-inner">' +

          '</div></div>' +
        '</div>';

    var DEFAULT_NAV =
      '<li ng:class="currentCls(\'git-mac\')"><a ng:click="select(\'git-mac\')" href>Git on Mac/Linux</a></li>' +
      '<li ng:class="currentCls(\'git-win\')"><a ng:click="select(\'git-win\')" href>Git on Windows</a></li>' +
      '<li ng:class="currentCls(\'ss-mac\')"><a ng:click="select(\'ss-mac\')" href>Snapshots on Mac/Linux</a></li>' +
      '<li ng:class="currentCls(\'ss-win\')"><a ng:click="select(\'ss-win\')" href>Snapshots on Windows</a></li>';

    var DEFAULT_CONTENT =
      '<div ng:show="selected==\'git-mac\'">' +
        '<ol>' +
        '<li><p>Reset the workspace to step {step}.</p>' +
        '<pre><code> git checkout -f step-{step}</code></pre></li>' +
        '<li><p>Refresh your browser or check the app out on <a href="http://angular.github.com/angular-phonecat/step-{step}/app">angular\'s server</a>.</p></li>' +
        '</ol>' +
      '</div>' +

      '<div ng:show="selected==\'git-win\'">' +
        '<ol>' +
        '<li><p>Reset the workspace to step {step}.</p>' +
        '<pre><code> git checkout -f step-{step}</code></pre></li>' +
        '<li><p>Refresh your browser or check the app out on <a href="http://angular.github.com/angular-phonecat/step-{step}/app">angular\'s server</a>.</p></li>' +
        '</ol>' +
      '</div>' +

      '<div ng:show="selected==\'ss-mac\'">' +
        '<ol>' +
        '<li><p>Reset the workspace to step {step}.</p>' +
        '<pre><code> ./goto_step.sh {step}</code></pre></li>' +
        '<li><p>Refresh your browser or check the app out on <a href="http://angular.github.com/angular-phonecat/step-{step}/app">angular\'s server</a>.</p></li>' +
        '</ol>' +
      '</div>' +

      '<div ng:show="selected==\'ss-win\'">' +
        '<ol>' +
        '<li><p>Reset the workspace to step {step}.</p>' +
        '<pre><code> ./goto_step.bat {step}</code></pre></li>' +
        '<li><p>Refresh your browser or check the app out on <a href="http://angular.github.com/angular-phonecat/step-{step}/app">angular\'s server</a>.</p></li>' +
        '</ol>' +
      '</div>';

    return {
      restrict: 'EA',
      compile: function(element, attrs) {
        var tabs = angular.element(HTML_TPL.replace('{show}', attrs.show || 'false')),
            nav = tabs.find('ul'),
            // use simple selectors because jqLite find() supports getElementsByTagName only
            content = tabs.find('div').find('div'),
            children = element.children();

        if (children.length) {
          // load custom content
          angular.forEach(element.children(), function(elm) {
            elm = angular.element(elm);
            var id = elm.attr('id');

            nav.append(HTML_NAV.replace('{title}', elm.attr('title')).replace(/\{id\}/g, id));
            content.append(HTML_CONTENT.replace('{id}', id).replace('{content}', elm.html()));
          });
        } else {
          // default
          nav.append(DEFAULT_NAV);
          content.append(DEFAULT_CONTENT.replace(/\{step\}/g, element.attr('step')));
        }

        element.html('');
        element.append(tabs);
      }
    }
  });


  $compileProvider.directive('docTutorialNav', function() {
    return {
      restrict: 'EA',
      link:function(scope, element, attrs) {
        var prevStep, codeDiff, nextStep,
            content, step = attrs.docTutorialNav;

        step = parseInt(step, 10);

        if (step === 0) {
          prevStep = '';
          nextStep = 'step_01';
          codeDiff = 'step-0~7...step-0';
        } else if (step === 11){
          prevStep = 'step_10';
          nextStep = 'the_end';
          codeDiff = 'step-10...step-11';
        } else {
          prevStep = 'step_' + pad(step - 1);
          nextStep = 'step_'  + pad(step + 1);
          codeDiff = 'step-' + (step-1) + '...step-' + step;
        }

        content = angular.element(
          '<li><a href="tutorial/' + prevStep + '">Previous</a></li>' +
          '<li><a href="http://angular.github.com/angular-phonecat/step-' + step + '/app">Live Demo</a></li>' +
          '<li><a href="https://github.com/angular/angular-phonecat/compare/' + codeDiff + '">Code Diff</a></li>' +
          '<li><a href="tutorial/' + nextStep + '">Next</a></li>'
        );

        element.attr('id', 'tutorial-nav');
        element.append(content);
      }
    };

    function pad(step) {
      return (step < 10) ? ('0' + step) : step;
    }
  });
});
