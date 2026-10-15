import { AfterViewInit, Directive, ElementRef, OnDestroy, effect, inject } from '@angular/core';
import { LanguageService } from './language.service';

@Directive({ selector: '[appTranslate]', standalone: true })
export class TranslateContentDirective implements AfterViewInit, OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly language = inject(LanguageService);
  private readonly textStates = new WeakMap<Text, { source: string; rendered: string }>();
  private readonly attributeStates = new WeakMap<Element, Map<string, { source: string; rendered: string }>>();
  private observer?: MutationObserver;

  constructor() {
    effect(() => {
      const language = this.language.language();
      if (typeof document !== 'undefined') document.documentElement.lang = language;
      queueMicrotask(() => this.translateTree());
    });
  }

  ngAfterViewInit(): void {
    const target = typeof document !== 'undefined' ? document.body : this.host;
    this.hostRef = target;
    this.translateTree();
    if (typeof MutationObserver === 'undefined') return;
    this.observer = new MutationObserver(records => {
      for (const record of records) {
        if (record.type === 'characterData' && record.target instanceof Text) this.translateText(record.target);
        for (const node of Array.from(record.addedNodes)) this.translateNode(node);
        if (record.type === 'attributes' && record.target instanceof Element && record.attributeName) {
          this.translateAttribute(record.target, record.attributeName);
        }
      }
    });
    this.observer.observe(target, { subtree: true, childList: true, characterData: true, attributes: true,
      attributeFilter: ['aria-label', 'title', 'placeholder', 'alt'] });
  }

  ngOnDestroy(): void { this.observer?.disconnect(); }

  private hostRef: HTMLElement = this.host;

  private translateTree(): void {
    this.translateNode(this.hostRef);
  }

  private translateNode(node: Node): void {
    if (node instanceof Text) { this.translateText(node); return; }
    if (!(node instanceof Element) || node instanceof HTMLElement && ['MAT-ICON', 'SCRIPT', 'STYLE'].includes(node.tagName)) return;
    for (const child of Array.from(node.childNodes)) this.translateNode(child);
    for (const attribute of ['aria-label', 'title', 'placeholder', 'alt']) this.translateAttribute(node, attribute);
  }

  private translateText(node: Text): void {
    const current = node.nodeValue ?? '';
    const state = this.textStates.get(node);
    const source = state && current === state.rendered ? state.source : current;
    const rendered = this.language.translate(source);
    this.textStates.set(node, { source, rendered });
    if (current !== rendered) node.nodeValue = rendered;
  }

  private translateAttribute(element: Element, name: string): void {
    if (!element.hasAttribute(name)) return;
    let states = this.attributeStates.get(element);
    if (!states) { states = new Map(); this.attributeStates.set(element, states); }
    const current = element.getAttribute(name) ?? '';
    const state = states.get(name);
    const source = state && current === state.rendered ? state.source : current;
    const rendered = this.language.translate(source);
    states.set(name, { source, rendered });
    if (current !== rendered) element.setAttribute(name, rendered);
  }
}
