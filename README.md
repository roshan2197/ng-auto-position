# **ng-auto-position**

![npm](https://img.shields.io/npm/v/ng-auto-position)
![downloads](https://img.shields.io/npm/dm/ng-auto-position)

A lightweight **Angular standalone directive** that automatically positions dropdowns, popovers, and floating panels relative to a reference element, while correctly handling scrolling, resizing, viewport boundaries, and scroll locking.

This directive is designed for cases where **Angular CDK Overlay is too heavy**, but you still need **reliable, production-grade positioning**.

## 🔴 Live Demo

Try it directly in your browser:

👉 [https://stackblitz.com/~/github.com/roshan2197/ng-auto-position](https://stackblitz.com/~/github.com/roshan2197/ng-auto-position)

---

## **✨ Features**

- ✅ **Smart Positioning**: Auto positions popup **above or below** a reference element.
- ✅ **Dynamic Tracking**: Popup **follows the reference** while scrolling (no freezing).
- ✅ **Boundary Detection**: Viewport clamping when the reference is visible.
- ✅ **Natural Exit**: Popup moves out of viewport when the reference fully leaves.
- ✅ **Responsive**: Optional repositioning on scroll & resize.
- ✅ **Layout Sync**: Optional width matching with reference element.
- ✅ **UX Control**: Optional background scroll locking and internal scroll handling.
- ✅ **Modern**: Standalone directive (Angular 16+), no Angular CDK dependency.

---

## **📦 Installation**

npm install ng-auto-position

---

## **📌 Basic Usage**

### **1\. Component Template**

Apply the directive and provide the ID of the element it should anchor to.

HTML

```html
<div
  class="flex flex-row"
  style="
    display: flex;
    flex-direction: column;
    position: relative;
    left: 100vw;
    top: 100vh;
    height: 100vh;
    width: 200vw;
    padding: 700px;
  "
>
  <div>Lorem ipsum, dolor sit amet consectetur adipisicing elit.</div>
  <div style="height: fit-content">
    <button style="padding: 4px; border: 2px solid" (click)="toggle()">Toggle</button>
    @if (show) {
    <div
      ngAutoPosition
      style="
          width: 200px;
          height: 200px;
          border: 1px solid;
          background-color: white;
        "
    ></div>
    }
  </div>
  <div>Lorem ipsum, dolor sit amet consectetur adipisicing elit.</div>
</div>
```

Typescript

```typescript
import { NgAutoPositionElementDirective } from "../ng-auto-position.directive";
import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";

@Component({
  selector: "ng-auto-position-test",
  standalone: true,
  imports: [CommonModule, NgAutoPositionElementDirective],
  templateUrl: "./ng-autoposition-test.component.html",
})
export class NgAutoPositionTestComponent {
  show: boolean = false;

  toggle() {
    this.show = !this.show;
  }
}
```

---

## **⚙️ API Inputs**

| Input                | Type     | Default | Description                                           |
| :------------------- | :------- | :------ | :---------------------------------------------------- |
| referenceElementId   | string   | null    | ID of the reference element.                          |
| enableAutoReposition | boolean  | true    | Reposition on window scroll & resize.                 |
| debounceMs           | number   | 0       | Debounce delay for scroll/resize events.              |
| offset               | number   | 0       | Pixel gap between reference and popup.                |
| matchWidth           | boolean  | false   | Match popup width to reference element width.         |
| scrollableSelector   | string   | null    | Inner element selector to limit height/enable scroll. |
| hideScrollTargets    | string[] | null    | IDs or classes (e.g. ['body']) to hide scrollbars.    |

---

## **🧩 Advanced Examples**

### **1\. Dropdown with internal scrolling**

Automatically constrains height and enables internal scrolling if the viewport is too small.

HTML

```html
<button id="actionsBtn">Actions</button>

<div 
  autoPositionElement 
  referenceElementId="actionsBtn" 
  scrollableSelector=".menu-items" 
  class="dropdown">
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
  autoPositionElement 
  referenceElementId="menuBtn" 
  [hideScrollTargets]="['body', '.layout-container']" 
  class="dropdown">
  Menu content
</div>
```

---

## **🧠 Positioning Behavior Explained**

- **Reference is fully visible**: Popup is clamped to the viewport to prevent overflow on all sides.
- **Reference is partially visible**: Popup remains visible and clamped to the viewport.
- **Reference is outside viewport**: Popup moves with the reference and can go fully off-screen. It never "freezes" or sticks in mid-air.

---

## **🧪 Angular Compatibility**

| Angular Version | Supported |
| :-------------- | :-------- |
| 16+             | ✅        |

### **Standalone Import Example**

TypeScript

```typescript
import { AutoPositionElementDirective } from "ng-auto-position";

@Component({
  standalone: true,
  imports: [AutoPositionElementDirective],
})
export class DemoComponent {}
```

---

## **📄 License**

MIT © Roshan

## **🔗 Links**

- **npm**: [https://www.npmjs.com/package/ng-auto-position](https://www.npmjs.com/package/@roshan-ng/ng-auto-position)
- **GitHub**: [https://github.com/roshan2197/ng-auto-position](https://github.com/roshan/ng-auto-position)
