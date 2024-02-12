import sha1 from 'js-sha1';
import Navigo from 'navigo';

import gsap from "gsap";
import Universe from './universe/Universe';

import '@splidejs/splide/css/skyblue';
import Splide from '@splidejs/splide';

type options = {
  dom: HTMLElement,
  cms_url: string,
  languages: string[],
}

export default class Website {
  public options: options;
  public router: Navigo;
  public universe: Universe;
  private menu: HTMLElement;
  private menuContainer: HTMLElement;
  private pagesContainer: HTMLElement;
  private pageIndex: number;
  private scrollTop: boolean;
  private ready: boolean;
  private loading: HTMLElement;
  private menuToggler: HTMLInputElement;
  private startLoadingTimeout: any;
  private language: string;
  private cmsURL: string;

  constructor(options) {
    this.options = options;
    this.cmsURL = options.cms_url;
    this.menu = null;
    this.pageIndex = 0;
    this.scrollTop = true;
    this.ready = true;
    this.startLoadingTimeout = null;
    this.loading = document.getElementById("loading");
    this.menuContainer = document.getElementById("menu");
    this.pagesContainer = document.getElementById("pages");
    this.menuToggler = document.getElementById("menu-toggle-checkbox") as HTMLInputElement;

    this.setLanguage();
  }

  async init(): Promise<void> {
    const loadPage        = this.loadPage.bind(this);
    const closeOtherPages = this.closeOtherPages.bind(this);
    const showMenu        = this.showMenu.bind(this);
    const projectsClick   = this.projectsClick.bind(this);

    new Promise<void>(async (resolve) => {
      this.router = new Navigo("/");
      this.router
        .on("/", () => {
          this.router.navigate("/" + this.language);
        })
        .on("/fr", () => {
          closeOtherPages(null);
          showMenu();
        })
        .on("/en", () => {
          closeOtherPages(null);
          showMenu();
        })
        .on("/fr/projets", () => {
          closeOtherPages(null);
          showMenu();
          projectsClick();
        })
        .on("/en/projects", () => {
          closeOtherPages(null);
          showMenu();
          projectsClick();
        })
        .on("*", async (matches) => {
          await loadPage("/" + matches.url);
        });

      // create universe
      const data = await this.loadProjects();
      this.universe = new Universe({
	dom: this.options.dom,
	isMobile: this.isMobile(),
        markerClick: this.projectClick.bind(this),
        data: data,
      })
      await this.universe.init();
      await this.loadMenu();
      this.router.resolve();
      this.addEvents();
      resolve();
      this.stopLoading();
      this.universe.load_hq_textures();
    });
  }

  private isDesktop() {
    return !this.isMobile();
  }

  private isMobile() {
    return window.innerWidth < 1200;
  }

  private startLoading() {
    this.startLoadingTimeout = setTimeout(() => {
      requestAnimationFrame(() => {
	this.loading.classList.add("on-page")
	this.loading.classList.remove("out")
      });
    }, 250);
  }

  private stopLoading() {
    clearTimeout(this.startLoadingTimeout);
    setTimeout(() => {
      requestAnimationFrame(() => {
	this.loading.classList.add("out")
      });
    }, 250);
  }

  private addEvents() {
    // only on desktop
    if (this.isDesktop()) {
      document.addEventListener('mousemove', this.fadeInMenu.bind(this));
      document.addEventListener('mousemove', this.fadeInPagination.bind(this));
      document.addEventListener('mousemove', this.fadeInPageClose.bind(this));
    }
  }

  private async fetchRemote(url) {
    return fetch(url)
      .then(response => {
        if (response.ok)
          return response.text();
        else if (response.status === 404)
          return "<body class='not-found'><div id='content'><h1>Oops! Page non trouvée! Page not found!</h1></div></body>";
        else
          return Promise.reject('some other error: ' + response.status)
      })
      //.then(data => console.log('data is', data))
      //.catch(error => { throw new Error(`Failed to fetch url: ${url} ${error}`) })
  }

  private gotoStart() {
    event.preventDefault();
    this.menuToggler.checked = false;
    this.router.navigate("/" + this.language);

    this.universe.hideZoomMarkers();
    this.universe.startRotation();
  }

  private closeOtherPages(active_page) {
    setTimeout(() => {
      requestAnimationFrame(() => {
        document
          .querySelectorAll(".page")
          .forEach((page) => {
            if ((!active_page || active_page.id != page.id) && page.classList.contains("open")) {
              page.classList.remove("open");
              this.pageIndex -= 1;
            }
          })
      });
    }, 250);
  }

  async linkPreload(event: MouseEvent) {
    event.preventDefault();
    const url = (event.target as HTMLElement).closest("a").getAttribute("href");
    await this.loadPageInBackground(url, false);
  }

  async linkClick(event: MouseEvent, replace) {
    event.preventDefault();
    const url = (event.target as HTMLElement).closest("a").getAttribute("href");
    if (url == "/" + this.router.getCurrentLocation().url) return;

    if (url.startsWith("http:") || url.startsWith("https:")) {
      window.location.href = url;
      return;
    }

    if (replace)
      this.router.navigate(url, { historyAPIMethod: 'replaceState' });
    else
      this.router.navigate(url);
  }

  async linkOpen(event: MouseEvent) {
    event.preventDefault();
    const url = (event.target as HTMLElement).closest("a").getAttribute("href");
    window.open(url, '_blank');
  }

  async projectClick(url) {
    this.router.navigate(url);
  }

  async waitForReady(context) {
    return new Promise(waitFor);

    function waitFor(resolve) {
      if (context.ready)
	resolve(true);
      else
	setTimeout(waitFor.bind(context, resolve), 30);
    }
  }

  async loadPageInBackground(url, indicator) {
    if (indicator) this.startLoading();
    await this.waitForReady(this);

    const hash = sha1(url);
    const page = document.getElementById(`page-${hash}`);
    if (page) return page;

    this.ready = null;
    const html = await this.fetchRemote(this.cmsURL + url);
    const extracted  = this.extractPortionOfHtml(html, "#content");
    const pagination = this.extractPortionOfHtml(html, "nav.pagination");
    const new_page = this.createPage(hash, extracted[0], extracted[1], pagination[1]);
    this.ready = true;
    return new_page;
  }

  async loadPage(url) {
    this.menuToggler.checked = false;
    const page = await this.loadPageInBackground(url, true)
    this.showPage(page);
    setTimeout(() => {
      this.closeOtherPages(page);
    }, 100);
    this.menuContainer.className = "on-page";
    gsap.killTweensOf(this.menu);
    if (this.menu) this.menu.style.opacity = "1";
  }

  private showPage(page) {
    if (page.classList.contains("open")) return;

    if (this.scrollTop)
      page.scrollTop = 0;
    this.scrollTop = true;
    this.pageIndex += 1;
    page.style.zIndex = 1000 + this.pageIndex;
    // see https://stackoverflow.com/questions/24148403/trigger-css-transition-on-appended-element
    setTimeout(() => {
      requestAnimationFrame(() => {
	page.classList.add("open");
	// only on desktop
        if (this.isDesktop()) {
          this.fadeInPageClose();
          this.fadeInPagination();
        }
      });
    }, 20);
    this.stopLoading();
  }

  private closePage() {
    event.preventDefault();
    this.pageIndex -= 1;
    this.scrollTop = false;
    const parts = this.router.getCurrentLocation().url.split("/");
    parts.pop();
    this.router.navigate(parts.join("/"));
    return false;
  }

  private fadeInPageClose() {
    const element = document.querySelector('.page.open .page-close');
    if (!element) return;

    gsap.killTweensOf(element);
    gsap.to(element, { opacity: 1, delay: 0 });
    gsap.to(element, { opacity: 0, delay: 2 });
  }

  private fadeInPagination() {
    const element = document.querySelector('.page.open .pagination');
    if (!element) return;

    gsap.killTweensOf(element);
    gsap.to(element, { opacity: 1, delay: 0 });
    gsap.to(element, { opacity: 0, delay: 2 });
  }

  private fadeInMenu() {
    gsap.killTweensOf(this.menu);
    if (this.menuContainer.classList.contains("on-page")) return;

    gsap.to(this.menu, { opacity: 1, delay: 0 });
    gsap.to(this.menu, { opacity: 0, delay: 2 });
  }

  // shows the menu on universe
  private showMenu() {
    this.menuContainer.className = "";
  }

  private pageTemplate() {
    return `<a href="#" class="page-close"></a><div class="page-inner"></div><div class="pagination"></div>`;
  }

  private createPage(id, classes, html, pagination_html) {
    const page = document.createElement("div");
    page.id = `page-${id}`;
    page.classList.add("page");
    if (classes.length > 0) page.classList.add(...classes);
    page.innerHTML = this.pageTemplate();
    this.pagesContainer.append(page);
    const target = page.querySelector('.page-inner');
    target.innerHTML = html;
    // move #viewlet-above-content-title (e.g. leadImage) below title
    const leadImage = target.querySelector('#viewlet-above-content-title');
    if (leadImage) {
      const h1 = target.querySelector('h1.documentFirstHeading');
      h1.after(leadImage);
    }

    const linkOpen = this.linkOpen.bind(this);
    const linkClick = this.linkClick.bind(this);
    const linkPreload = this.linkPreload.bind(this);
    target
      .querySelectorAll('a')
      .forEach((link) => {
        if (link.href.match(/@@download/)) return;

        if (link.href.startsWith(this.cmsURL)) {
          link.href = link.href.replace(this.cmsURL, "");
          link.addEventListener('click', (ev) => linkClick(ev, false));
          link.addEventListener('mouseover', (ev) => linkPreload(ev));
          return;
        }

        link.addEventListener('click', (ev) => linkOpen(ev));
      })

    // slider ....
    if (page.querySelector('.splide')) {
      const splide = new Splide(`#${page.id} .splide`, {
	lazyLoad: 'sequential',
      });
      splide.mount();
    }

    if (pagination_html) {
      const pagination = page.querySelector('.pagination');
      pagination.innerHTML = pagination_html;

      pagination
        .querySelectorAll('a')
        .forEach((link) => {
          link.href = link.href.replace(this.cmsURL, "");
          link.addEventListener('click', (ev) => linkClick(ev, true));
          link.addEventListener('mouseover', (ev) => linkPreload(ev, true));
        })
    }

    page
      .querySelector(".page-close")
      .addEventListener('click', this.closePage.bind(this))

    return page;
  }

  private projectsClick() {
    this.menuToggler.checked = false;
    this.universe.showZoomMarkers();
    this.universe.stopRotation();
  }

  async loadMenu() {
    const extracted = this.extractPortionOfHtml(
      await this.fetchRemote(this.cmsURL + "/" + this.language + "/sitemap"),
      "#content-core"
    );

    const target = document.getElementById("menu-inner");
    this.menu = target;

    target.innerHTML = extracted[1];
    target
      .querySelectorAll('a')
      .forEach((link) => {
	link.href = link.href.replace(this.cmsURL, "");
      })

    document
      .getElementById("menu-title")
      .addEventListener('click', this.gotoStart.bind(this))

    const linkClick = this.linkClick.bind(this);
    const linkPreload = this.linkPreload.bind(this);
    target
      .querySelectorAll('#menu-inner > ul > li > a')
      .forEach((link) => {
	link.addEventListener('click', linkClick);
	link.addEventListener('mouseover', linkPreload)
      })
  }

  async loadProjects() {
    const projects_path = {
      "fr": "/fr/projets",
      "en": "/en/projects",
    }
    const url = this.cmsURL + projects_path[this.language];
    const projects = await this.fetchJson(url);
    const items = await Promise.all(projects.items.map(async (project) => {
      return await this.fetchJson(project["@id"]);
    }));
    const data = items.map((item) => {
      return {
	id: item.id,
	url: item["@id"].replace(this.cmsURL, ""),
	img: item.marker_image.scales.preview.download,
	name: item.title + "<br/>" + item.subtitle,
	latitude: parseFloat(item.latitude),
	longitude: parseFloat(item.longitude),
      };
    });
    return data;
  }

  async fetchJson(url) {
    return await fetch(url, { headers: { "Accept": "application/json" } })
      .then((response) => { return response.json() })
      .catch(function(error) { throw new Error(`Failed to fetchJSON url: ${url} ${error}`) });
  }

  private extractPortionOfHtml(html, selector) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const classes = doc.body.className;
    const selectedElement = doc.querySelector(selector);

    if (selectedElement) {
      return [classes.split(" "), selectedElement.innerHTML];
    } else {
      //console.error(`Element with selector "${selector}" not found`);
      return [[], ""];
    }
  }

  private setLanguage() {
    // set language from url
    this.language = window.location.pathname.substring(1,3);
    if (this.options.languages.includes(this.language)) return;

    // get first language from browser preference
    for (const language of navigator.languages) {
      if (!this.options.languages.includes(language)) continue;

      this.language = language;
      break;
    }
    // set first language as default
    if (!this.language) this.language = this.options.languages[0];
  }
}
