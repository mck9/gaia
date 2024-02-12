import { EventEmitter } from 'pietile-eventemitter';

type options = { dom: HTMLElement }

interface IEvents {
  resize: () => void
}

export default class Sizes {
  public width: number;
  public height: number;
  public element: HTMLElement;
  public emitter: EventEmitter<IEvents>;

  constructor(options: options) {
    this.element = options.dom;

    this.emitter = new EventEmitter<IEvents>();
    this.width = 0;
    this.height = 0;

    // Resize event
    window.addEventListener('resize', this.resize.bind(this))

    this.resize()
  }

  on<T extends keyof IEvents>(event: T, fun: () => void) {
    this.emitter.on(event, fun)
  }

  resize() {
    this.width = this.element.offsetWidth
    this.height = this.element.offsetHeight

    this.emitter.emit('resize')
  }
}
