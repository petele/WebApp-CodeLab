/*
Copyright 2012 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.


  Based on HTML5Slides from http://code.google.com/p/html5slides/
  Special thanks to: Eric Bidelman, Luke MahŽ, Marcin Wichary,
                     Dominic Mazzoni, Charles Chen

  Authors: Chris Wilson (cwilso@chromium.org)
           Pete LePage (petele@google.com)
*/

window.slidesConfig = window.slidesConfig || {
  // Slide settings
  settings : {
    useBuilds: true,
    showHiddenSlides: false
  },
  info: {
    // Presentation Name
    subtitle: 'HTML5',
    title: 'Web App Code Lab',


    // Personal info
    name: 'Pete LePage',
    pic: './images/html5-guy.png',
    gplus: 'https://plus.google.com/117555368223516714643',
    twitter: 'petele',
    blog: 'http://petelepage.com/blog/',

    // Google Analytics Token
    ga_account: 'UA-9988000-4',

    // Links
    slides: 'http://petelepage.com/webapp-codelab/slides/',
    feedback: 'http://TBD',
    location: 'San Francsico, CA',

    // Presentation Timer
    date: new Date('Apr 5 2012 17:20'),
    logo: './images/html5_logo_256.png',
    minutes: 220,
    warnAt: 30
  }
};
