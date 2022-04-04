import { signJws } from '../../src/auth';
import { generateNewJws } from '../../src/jws';

const sk =
  'edskS5s6m6ACFPoNaNJY5xfrSBvKDdbCjFPTq5BiF23rmLL7zxc8tBhyzqorapc6gXofoNSKh1N17aBPYc5mhQXqUJ47TPZ6tg';
const pk = 'edpkuT4d9VwyPsLAsT4djGBnvjCjMzcbeogBRDGfWPPYSJVYrx89po';

console.log(
  signJws(generateNewJws(pk, 'to.who.it.may.concern', 'TZ', 18000000), sk),
);
