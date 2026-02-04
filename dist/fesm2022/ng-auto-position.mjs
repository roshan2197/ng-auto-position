import * as i0 from '@angular/core';
import { inject, ElementRef, DestroyRef, input, EventEmitter, HostBinding, Output, Directive } from '@angular/core';
import { fromEvent, merge } from 'rxjs';
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
     * Direct reference to the anchor element.
     * If provided, this takes priority over referenceElementId.
     */
    referenceElement = input(null);
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
     * Preferred placement.
     * - 'auto' chooses top/bottom based on available space.
     * - 'left'/'right' are explicit.
     */
    placement = input('auto');
    /** Minimum padding from the viewport edges when clamping. */
    viewportPadding = input(4);
    /**
     * Listen to scroll events on scrollable parents of the reference element.
     * Useful for overlays inside scrollable containers (drawers, panels).
     *
     * Default: true
     */
    trackScrollParents = input(true);
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
     * Emits the final placement after each update.
     */
    placementChange = new EventEmitter();
    /**
     * Hide overlay until positioned to avoid flicker.
     */
    visibility = 'hidden';
    lastPlacement = null;
    ngAfterViewInit() {
        const overlay = this.el.nativeElement;
        overlay.style.position = 'fixed';
        // ResizeObserver always useful (content changes)
        const ro = new ResizeObserver(() => this.updatePosition());
        ro.observe(overlay);
        const reference = this.getReferenceElement(overlay);
        if (reference)
            ro.observe(reference);
        // Conditionally listen to scroll + resize (including scrollable parents)
        if (this.enableAutoReposition()) {
            const scrollParents = reference && this.trackScrollParents()
                ? this.getScrollableParents(reference)
                : [];
            const scrollStreams = scrollParents.map((target) => fromEvent(target, 'scroll'));
            merge(fromEvent(window, 'scroll'), fromEvent(window, 'resize'), ...scrollStreams)
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
        let openOnTop = overlayRect.height > spaceBelow && spaceAbove >= overlayRect.height;
        // Placement override (user-specified preference)
        const preferredPlacement = this.placement();
        if (preferredPlacement === 'top')
            openOnTop = true;
        if (preferredPlacement === 'bottom')
            openOnTop = false;
        let top = refRect.top;
        let left = refRect.left;
        let finalPlacement;
        if (preferredPlacement === 'left' || preferredPlacement === 'right') {
            finalPlacement = preferredPlacement;
            left =
                preferredPlacement === 'left'
                    ? refRect.left - overlayRect.width - this.offset()
                    : refRect.right + this.offset();
            top = refRect.top;
        }
        else {
            finalPlacement = openOnTop ? 'top' : 'bottom';
            top = openOnTop
                ? refRect.top - overlayRect.height - this.offset()
                : refRect.bottom + this.offset();
            left = refRect.left;
        }
        const fullyOut = this.isReferenceFullyOut(refRect);
        if (!fullyOut) {
            // ✅ NORMAL MODE (reference at least partially visible)
            // Clamp to viewport
            const padding = Math.max(0, this.viewportPadding());
            top = Math.min(top, viewportH - overlayRect.height - padding);
            top = Math.max(top, padding);
            left = Math.min(left, viewportW - overlayRect.width - padding);
            left = Math.max(left, padding);
        }
        // else: ✅ FOLLOW MODE (reference fully out of viewport)
        // do NOT clamp → let popup go offscreen naturally
        // top & left stay relative to refRect
        overlay.style.top = `${top}px`;
        overlay.style.left = `${left}px`;
        if (this.lastPlacement !== finalPlacement) {
            this.lastPlacement = finalPlacement;
            this.placementChange.emit(finalPlacement);
        }
        // Optional inner scroll container handling
        if (this.scrollableSelector()) {
            const inner = overlay.querySelector(this.scrollableSelector());
            if (inner) {
                const padding = Math.max(0, this.viewportPadding());
                const maxSpace = finalPlacement === 'left' || finalPlacement === 'right'
                    ? viewportH - padding * 2
                    : openOnTop
                        ? spaceAbove
                        : spaceBelow;
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
        const directRef = this.referenceElement();
        if (directRef) {
            return directRef instanceof ElementRef
                ? directRef.nativeElement
                : directRef;
        }
        const id = this.referenceElementId();
        return id ? document.getElementById(id) : overlay.parentElement;
    }
    /**
     * Finds scrollable ancestors by checking overflow styles.
     */
    getScrollableParents(element) {
        const scrollParents = [];
        let current = element.parentElement;
        while (current && current !== document.body && current !== document.documentElement) {
            const style = getComputedStyle(current);
            const overflow = `${style.overflow} ${style.overflowY} ${style.overflowX}`;
            if (/(auto|scroll|overlay)/.test(overflow)) {
                scrollParents.push(current);
            }
            current = current.parentElement;
        }
        return scrollParents;
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.3.12", ngImport: i0, type: NgAutoPositionElementDirective, deps: [], target: i0.ɵɵFactoryTarget.Directive });
    static ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "17.1.0", version: "17.3.12", type: NgAutoPositionElementDirective, isStandalone: true, selector: "[ngAutoPosition]", inputs: { referenceElement: { classPropertyName: "referenceElement", publicName: "referenceElement", isSignal: true, isRequired: false, transformFunction: null }, referenceElementId: { classPropertyName: "referenceElementId", publicName: "referenceElementId", isSignal: true, isRequired: false, transformFunction: null }, debounceMs: { classPropertyName: "debounceMs", publicName: "debounceMs", isSignal: true, isRequired: false, transformFunction: null }, offset: { classPropertyName: "offset", publicName: "offset", isSignal: true, isRequired: false, transformFunction: null }, matchWidth: { classPropertyName: "matchWidth", publicName: "matchWidth", isSignal: true, isRequired: false, transformFunction: null }, placement: { classPropertyName: "placement", publicName: "placement", isSignal: true, isRequired: false, transformFunction: null }, viewportPadding: { classPropertyName: "viewportPadding", publicName: "viewportPadding", isSignal: true, isRequired: false, transformFunction: null }, trackScrollParents: { classPropertyName: "trackScrollParents", publicName: "trackScrollParents", isSignal: true, isRequired: false, transformFunction: null }, scrollableSelector: { classPropertyName: "scrollableSelector", publicName: "scrollableSelector", isSignal: true, isRequired: false, transformFunction: null }, enableAutoReposition: { classPropertyName: "enableAutoReposition", publicName: "enableAutoReposition", isSignal: true, isRequired: false, transformFunction: null }, hideScrollTargets: { classPropertyName: "hideScrollTargets", publicName: "hideScrollTargets", isSignal: true, isRequired: false, transformFunction: null } }, outputs: { placementChange: "placementChange" }, host: { properties: { "style.visibility": "this.visibility" } }, ngImport: i0 });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.3.12", ngImport: i0, type: NgAutoPositionElementDirective, decorators: [{
            type: Directive,
            args: [{
                    selector: '[ngAutoPosition]',
                    standalone: true,
                }]
        }], propDecorators: { placementChange: [{
                type: Output
            }], visibility: [{
                type: HostBinding,
                args: ['style.visibility']
            }] } });

/**
 * Generated bundle index. Do not edit.
 */

export { NgAutoPositionElementDirective };
//# sourceMappingURL=ng-auto-position.mjs.map
