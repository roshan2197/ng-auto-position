import * as i0 from '@angular/core';
import { inject, ElementRef, DestroyRef, input, HostBinding, Directive } from '@angular/core';
import { merge, fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * AutoPositionElementDirective
 *
 * Automatically positions an overlay element (dropdown / popover)
 * relative to a reference element and keeps it inside the viewport.
 *
 * DESIGN DECISIONS:
 * - Uses `position: fixed` so viewport math is reliable.
 * - Uses getBoundingClientRect() for all measurements.
 * - Avoids DOM depth assumptions (npm-safe).
 * - Uses ResizeObserver to react to size changes.
 */
class NgAutoPositionElementDirective {
    /** Native element reference for the overlay */
    el = inject((ElementRef));
    /** Used by Angular to auto-clean RxJS subscriptions */
    destroyRef = inject(DestroyRef);
    /**
     * ID of the reference element.
     * If not provided, parentElement is used.
     */
    referenceElementId = input(null);
    /** Debounce time for scroll / resize events (ms) */
    debounceMs = input(0);
    /** Gap between reference and overlay (px) */
    offset = input(5);
    /** Match overlay width to reference width */
    matchWidth = input(false);
    /**
     * Optional selector for inner scrollable content
     * whose max-height will be auto-calculated.
     */
    scrollableSelector = input(null);
    /**
     * Enables or disables automatic repositioning
     * on window scroll and resize.
     *
     * Default: true
     */
    enableAutoReposition = input(true);
    /**
     * List of element IDs or class names
     * whose scrollbars should be hidden
     * while the popup is visible.
     *
     * Examples:
     * ['body']
     * ['app-layout', '.content-wrapper']
     */
    hideScrollTargets = input(null);
    /**
     * Hide overlay until positioned to avoid flicker.
     */
    visibility = 'hidden';
    ngAfterViewInit() {
        const overlay = this.el.nativeElement;
        overlay.style.position = 'fixed';
        // ResizeObserver always useful (content changes)
        const ro = new ResizeObserver(() => this.updatePosition());
        ro.observe(overlay);
        const reference = this.getReferenceElement(overlay);
        if (reference)
            ro.observe(reference);
        // Conditionally listen to scroll + resize
        if (this.enableAutoReposition()) {
            merge(fromEvent(window, 'scroll'), fromEvent(window, 'resize'))
                .pipe(debounceTime(this.debounceMs()), takeUntilDestroyed(this.destroyRef))
                .subscribe(() => this.updatePosition());
        }
        this.updatePosition();
        this.destroyRef.onDestroy?.(() => ro.disconnect());
    }
    /**
     * Returns true if the reference element is completely outside viewport.
     * Even 1px visible = considered visible.
     */
    isReferenceFullyOut(refRect) {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        return (refRect.bottom <= 0 || // above viewport
            refRect.top >= vh || // below viewport
            refRect.right <= 0 || // left of viewport
            refRect.left >= vw // right of viewport
        );
    }
    /**
     * Calculates and applies overlay position.
     */
    updatePosition() {
        const overlay = this.el.nativeElement;
        const reference = this.getReferenceElement(overlay);
        if (!reference)
            return;
        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;
        const refRect = reference.getBoundingClientRect();
        // Optionally match width
        if (this.matchWidth()) {
            overlay.style.width = `${refRect.width}px`;
        }
        const overlayRect = overlay.getBoundingClientRect();
        const spaceAbove = refRect.top;
        const spaceBelow = viewportH - refRect.bottom;
        const openOnTop = overlayRect.height > spaceBelow && spaceAbove >= overlayRect.height;
        // --- base positioning relative to reference ---
        let top = openOnTop
            ? refRect.top - overlayRect.height - this.offset()
            : refRect.bottom + this.offset();
        let left = refRect.left;
        const fullyOut = this.isReferenceFullyOut(refRect);
        if (!fullyOut) {
            // ✅ NORMAL MODE (reference at least partially visible)
            // Clamp to viewport
            top = Math.min(top, viewportH - overlayRect.height - 4);
            left = Math.min(left, viewportW - overlayRect.width - 4);
        }
        // else: ✅ FOLLOW MODE (reference fully out of viewport)
        // do NOT clamp → let popup go offscreen naturally
        // top & left stay relative to refRect
        overlay.style.top = `${top}px`;
        overlay.style.left = `${left}px`;
        // Optional inner scroll container handling
        if (this.scrollableSelector()) {
            const inner = overlay.querySelector(this.scrollableSelector());
            if (inner) {
                const maxSpace = openOnTop ? spaceAbove : spaceBelow;
                inner.style.maxHeight = `${Math.min(maxSpace - 10, viewportH * 0.9)}px`;
                inner.style.overflowY = 'auto';
            }
        }
        // visibility safe update
        queueMicrotask(() => {
            this.visibility = 'visible';
        });
    }
    /**
     * Resolves the reference element.
     */
    getReferenceElement(overlay) {
        const id = this.referenceElementId();
        return id ? document.getElementById(id) : overlay.parentElement;
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.3.12", ngImport: i0, type: NgAutoPositionElementDirective, deps: [], target: i0.ɵɵFactoryTarget.Directive });
    static ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "17.1.0", version: "17.3.12", type: NgAutoPositionElementDirective, isStandalone: true, selector: "[ngAutoPosition]", inputs: { referenceElementId: { classPropertyName: "referenceElementId", publicName: "referenceElementId", isSignal: true, isRequired: false, transformFunction: null }, debounceMs: { classPropertyName: "debounceMs", publicName: "debounceMs", isSignal: true, isRequired: false, transformFunction: null }, offset: { classPropertyName: "offset", publicName: "offset", isSignal: true, isRequired: false, transformFunction: null }, matchWidth: { classPropertyName: "matchWidth", publicName: "matchWidth", isSignal: true, isRequired: false, transformFunction: null }, scrollableSelector: { classPropertyName: "scrollableSelector", publicName: "scrollableSelector", isSignal: true, isRequired: false, transformFunction: null }, enableAutoReposition: { classPropertyName: "enableAutoReposition", publicName: "enableAutoReposition", isSignal: true, isRequired: false, transformFunction: null }, hideScrollTargets: { classPropertyName: "hideScrollTargets", publicName: "hideScrollTargets", isSignal: true, isRequired: false, transformFunction: null } }, host: { properties: { "style.visibility": "this.visibility" } }, ngImport: i0 });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.3.12", ngImport: i0, type: NgAutoPositionElementDirective, decorators: [{
            type: Directive,
            args: [{
                    selector: '[ngAutoPosition]',
                    standalone: true,
                }]
        }], propDecorators: { visibility: [{
                type: HostBinding,
                args: ['style.visibility']
            }] } });

/**
 * Generated bundle index. Do not edit.
 */

export { NgAutoPositionElementDirective };
//# sourceMappingURL=ng-auto-position.mjs.map
