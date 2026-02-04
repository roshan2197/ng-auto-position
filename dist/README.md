# **ng-auto-position**

A lightweight **Angular standalone directive** that automatically positions dropdowns, popovers, and floating panels relative to a reference element, while correctly handling scrolling, resizing, viewport boundaries, and scroll locking.

This directive is designed for cases where **Angular CDK Overlay is too heavy**, but you still need **reliable, production-grade positioning**.

---

## **✨ Features**

* ✅ **Smart Positioning**: Auto positions popup **above or below** a reference element.  
* ✅ **Dynamic Tracking**: Popup **follows the reference** while scrolling (no freezing).  
* ✅ **Boundary Detection**: Viewport clamping when the reference is visible.  
* ✅ **Natural Exit**: Popup moves out of viewport when the reference fully leaves.  
* ✅ **Responsive**: Optional repositioning on scroll & resize.  
* ✅ **Layout Sync**: Optional width matching with reference element.  
* ✅ **UX Control**: Optional background scroll locking and internal scroll handling.  
* ✅ **Modern**: Standalone directive (Angular 16+), no Angular CDK dependency.

---

## **📦 Installation**

```bash
npm install ng-auto-position
```

```bash
pnpm add ng-auto-position
```

```bash
yarn add ng-auto-position
```

---

## **🧪 Demo**

Run locally to see the live positioning demos and scroll playground.

```bash
npm install
npm start
```

Open the dev server URL shown in your terminal.

---

## **📌 Quick Start**

### **1\. Component Template**

Apply the directive and provide the ID of the element it should anchor to.

HTML  

```html
<button id="menuBtn">Menu</button>

<div
  ngAutoPosition
  referenceElementId="menuBtn"
  [offset]="8"
  [matchWidth]="true"
>
  Menu content
</div>
```

TypeScript

```typescript
import { NgAutoPositionElementDirective } from 'ng-auto-position';
import { Component } from '@angular/core';

@Component({
  selector: 'demo',
  standalone: true,
  imports: [NgAutoPositionElementDirective],
  templateUrl: './demo.component.html',
})
export class DemoComponent {}
```

---

## **⚙️ API Inputs**

| Input | Type | Default | Description |
| :---- | :---- | :---- | :---- |
| referenceElementId | string | null | ID of the reference element. |
| enableAutoReposition | boolean | true | Reposition on window scroll & resize. |
| debounceMs | number | 0 | Debounce delay for scroll/resize events. |
| offset | number | 0 | Pixel gap between reference and popup. |
| matchWidth | boolean | false | Match popup width to reference element width. |
| scrollableSelector | string | null | Inner element selector to limit height/enable scroll. |
| hideScrollTargets | string[] | null | IDs or classes (e.g. ['body']) to hide scrollbars. |

---

## **✅ Common Recipes**

### **1\. Menu With Internal Scroll**

```html
<button id="menuBtn">Open menu</button>

<div
  ngAutoPosition
  referenceElementId="menuBtn"
  [matchWidth]="true"
  [scrollableSelector]="'.menu-items'"
  [offset]="8"
>
  <div class="menu-items">
    <div class="menu-item">Account settings and profile preferences</div>
    <div class="menu-item">Billing, invoices, and subscription plan</div>
    <div class="menu-item">Team access and member permissions</div>
    <div class="menu-item">Keyboard shortcuts and productivity tips</div>
    <div class="menu-item">Security, sessions, and sign out</div>
  </div>
</div>
```

```css
.menu-items {
  overflow-y: auto;
  max-height: 240px;
}

.menu-item {
  line-height: 1.35;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}
```

### **2\. Scroll-Lock The Background**

```html
<button id="sheetBtn">Open sheet</button>

<div
  ngAutoPosition
  referenceElementId="sheetBtn"
  [hideScrollTargets]="['body', '.app-shell']"
>
  Content
</div>
```

### **3\. Auto-Width Popover**

```html
<button id="helpBtn">Help</button>
<div ngAutoPosition referenceElementId="helpBtn" [matchWidth]="true">
  Helpful content
</div>
```

### **4\. Scroll Tracking (Window Scroll)**

```html
<button id="scrollAnchor">Anchor</button>
<div ngAutoPosition referenceElementId="scrollAnchor" [offset]="12">
  This stays attached while the page scrolls.
</div>
```

---

## **🧩 Advanced Examples**

### **1\. Dropdown with internal scrolling**

Automatically constrains height and enables internal scrolling if the viewport is too small.

HTML  

```html
<button id="actionsBtn">Actions</button>

<div
  ngAutoPosition
  referenceElementId="actionsBtn"
  scrollableSelector=".menu-items"
  class="dropdown"
>
  <div class="menu-items"></div>
</div>
```

CSS  

```css
.menu-items {
  overflow-y: auto;
}
```

### **2\. Lock background scrolling**

Prevents the user from scrolling the background while the popup is active.

HTML  

```html
<div
  ngAutoPosition
  referenceElementId="menuBtn"
  [hideScrollTargets]="['body', '.layout-container']"
  class="dropdown"
>
  Menu content
</div>
```

---

## **🧠 Positioning Behavior Explained**

* **Reference is fully visible**: Popup is clamped to the viewport to prevent overflow on all sides.  
* **Reference is partially visible**: Popup remains visible and clamped to the viewport.  
* **Reference is outside viewport**: Popup moves with the reference and can go fully off-screen. It never "freezes" or sticks in mid-air.

---

## **🧪 Angular Compatibility**

| Angular Version | Supported |
| :---- | :---- |
| 16+ | ✅ |

---

## **📄 License**

MIT © Roshan

## **🔗 Links**

* **npm**: [https://www.npmjs.com/package/ng-auto-position](https://www.npmjs.com/package/ng-auto-position)  
* **GitHub**: [https://github.com/roshan2197/ng-auto-position](https://github.com/roshan2197/ng-auto-position)
