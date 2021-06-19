
export type Definition = string | (() => string) | Promise<string>

export interface Item {
  match: string
  definition: Definition
  link?: string
}

export const GLOSSARY_CLASS_ITEM = "glssry-item";
export const GLOSSARY_CLASS_ACTIVE = "active";
export const GLOSSARY_CLASS_TOOLTIP = "glssry-tooltip";

interface Result {
  node: Node
  match: string
}

type MaybeResult = Result | undefined

interface Glossary {
  items: Item[]
}

interface HTMLGlossaryElement extends HTMLElement {
  dataset: {
    glssryItem: string
  }
}

interface HTMLGlossaryTooltipElement extends HTMLDivElement {
  dataset: {
    glssryActiveItem?: string
  }
}

const resolveDefinition = async (item: Item) =>
  typeof item.definition === "function" ? item.definition() : item.definition

interface Options {
  domRoot?: HTMLElement
  usedDocument?: Document
}

export class Application {
  private tooltip: HTMLGlossaryTooltipElement;
  private domRoot: HTMLElement;
  private usedDocument: Document;

  public constructor(private glossary: Glossary, { domRoot = document.body, usedDocument = document }: Options) {
    this.domRoot = domRoot;
    this.usedDocument = usedDocument;
    this.tooltip = this.usedDocument.createElement("div");
    this.tooltip.className = GLOSSARY_CLASS_TOOLTIP;
  }

  public apply () {
    this.glossary.items.forEach(this.applySingle);
  }

  public start () {
    this.domRoot.addEventListener("click", this.spawnTooltip);
    this.domRoot.addEventListener("focusin", this.spawnTooltip);
    this.domRoot.addEventListener("focusout", this.handleClick);
    this.setCleanerListeners();
  }

  public destroy () {
    this.domRoot.removeEventListener("click", this.spawnTooltip);
  }

  private applySingle = (item: Item, index: number) => {

    const result = this.traverseTreeUntilFound(this.domRoot, item.match);

    if (!result) {
      throw new Error(`The following item did not match any text content: "${item.match}"`);
    }
    result.node.parentElement!.innerHTML = result.node.parentElement!.innerHTML.replace(
      result.match, `<span tabindex="0" class="${GLOSSARY_CLASS_ITEM}" data-glssry-item="${index}">${result.match}</span>`
    );
  }

  private traverseTreeUntilFound = (element: Node, match: string): MaybeResult => {
    const regex = new RegExp(match)
    const containsText = regex.exec(element.textContent || "");

    if (!containsText) {
      return undefined
    }

    const results = Array.from(element.childNodes).filter(child => child.nodeName === "#text").find(textNode => regex.exec(textNode.textContent || ""))
    if (results) {
      return {
        node: results,
        match: regex.exec(results.textContent || "")![0]
      };
    }
    return Array.from(element.childNodes).filter(child => child.nodeName !== "#text").map((child) => this.traverseTreeUntilFound(child, match)).find((child) => child !== undefined)
  }

  private spawnTooltip = async (e: MouseEvent) => {
    const target = e.target as HTMLGlossaryElement;
    if (this.tooltip.dataset.glssryActiveItem) {
      this.domRoot.querySelector(`.${GLOSSARY_CLASS_ITEM}:nth-of-type(${parseInt(this.tooltip.dataset.glssryActiveItem) + 1})`)?.classList.remove(GLOSSARY_CLASS_ACTIVE);
    }
    if (!target.classList.contains(GLOSSARY_CLASS_ITEM)) {
      return
    }

    target.classList.add(GLOSSARY_CLASS_ACTIVE);
    window.removeEventListener("click", this.handleClick);
    this.clearTooltip();
    this.tooltip.style.display = "none";
    this.tooltip.innerHTML = await resolveDefinition(this.glossary.items[parseInt(target.dataset.glssryItem)]);
    this.usedDocument.body.appendChild(this.tooltip);

    const bounding = this.domRoot.getBoundingClientRect();

    const targetBounding = target.getBoundingClientRect();
    const bottom = window.innerHeight;
    const right = window.innerWidth;
    if (targetBounding.top + targetBounding.height + 100 > bottom) {
      this.tooltip.style.bottom = (bottom - targetBounding.top - window.scrollY) + "px";
    } else {
      this.tooltip.style.top = (targetBounding.bottom + window.scrollY) + "px";
    }

    if (targetBounding.left + targetBounding.width + 100 > right) {
      this.tooltip.style.right = (bounding.width - (target.offsetLeft + target.offsetWidth)) + "px";
    } else {
      this.tooltip.style.left = target.offsetLeft + "px";
    }
    this.tooltip.style.display = "block";
    this.tooltip.dataset.glssryActiveItem = target.dataset.glssryItem;
    setTimeout(() => window.addEventListener("click", this.handleClick), 200);
  }

  private handleClick = () => {
    this.domRoot.querySelector(`.${GLOSSARY_CLASS_ITEM}:nth-of-type(${parseInt(this.tooltip.dataset.glssryActiveItem!) + 1})`)?.classList.remove(GLOSSARY_CLASS_ACTIVE);
    this.tooltip.parentElement?.removeChild(this.tooltip);
    window.removeEventListener("click", this.handleClick);
  }

  private setCleanerListeners = () => {
    window.addEventListener("resize", this.handleClick);
    window.addEventListener("scroll", this.handleClick);
  }

  private clearTooltip = () => {
    (this.tooltip.style as any) = {};
  }
}

export const glossarize = (items: Item[], options: Options = {}) => {
  const glossary = { items };
  const application = new Application(glossary, options);
  application.apply();
  application.start();
  return application;
}

