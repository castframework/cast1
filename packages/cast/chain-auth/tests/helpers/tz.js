"use strict";
exports.__esModule = true;
var auth_1 = require("../../dist/auth");
var jws_1 = require("../../dist/jws");
var sk = 'edskS5s6m6ACFPoNaNJY5xfrSBvKDdbCjFPTq5BiF23rmLL7zxc8tBhyzqorapc6gXofoNSKh1N17aBPYc5mhQXqUJ47TPZ6tg';
var pk = 'edpkuT4d9VwyPsLAsT4djGBnvjCjMzcbeogBRDGfWPPYSJVYrx89po';
console.log(auth_1.signJws(jws_1.generateNewJws(pk, 'to.who.it.may.concern', 'TZ'), sk));
