/* eslint-disable no-var */
import "@fontsource/roboto";

import "modern-normalize/modern-normalize.css";
import "../css/index.scss";

import Website from './Website';

const website = new Website({
  dom: document.querySelector('#earth-canvas'),
  cms_url: "https://www.guillaumebarth.com/cms",
  languages: ["fr", "en"],
});
website.init();
