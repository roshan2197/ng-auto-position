import { DestroyRef, Directive, ElementRef, HostBinding, inject, input, } from '@angular/core';
import { fromEvent, merge } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import * as i0 from "@angular/core";
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
export class NgAutoPositionElementDirective {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmctYXV0by1wb3NpdGlvbi5kaXJlY3RpdmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBwL25nLWF1dG8tcG9zaXRpb24vbmctYXV0by1wb3NpdGlvbi5kaXJlY3RpdmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUVMLFVBQVUsRUFDVixTQUFTLEVBQ1QsVUFBVSxFQUNWLFdBQVcsRUFDWCxNQUFNLEVBQ04sS0FBSyxHQUNOLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLE1BQU0sTUFBTSxDQUFDO0FBQ3hDLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUM5QyxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSw0QkFBNEIsQ0FBQzs7QUFFaEU7Ozs7Ozs7Ozs7O0dBV0c7QUFLSCxNQUFNLE9BQU8sOEJBQThCO0lBQ3pDLCtDQUErQztJQUM5QixFQUFFLEdBQUcsTUFBTSxDQUFDLENBQUEsVUFBdUIsQ0FBQSxDQUFDLENBQUM7SUFFdEQsdURBQXVEO0lBQ3RDLFVBQVUsR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7SUFFakQ7OztPQUdHO0lBQ0gsa0JBQWtCLEdBQUcsS0FBSyxDQUFnQixJQUFJLENBQUMsQ0FBQztJQUVoRCxvREFBb0Q7SUFDcEQsVUFBVSxHQUFHLEtBQUssQ0FBUyxDQUFDLENBQUMsQ0FBQztJQUU5Qiw2Q0FBNkM7SUFDN0MsTUFBTSxHQUFHLEtBQUssQ0FBUyxDQUFDLENBQUMsQ0FBQztJQUUxQiw2Q0FBNkM7SUFDN0MsVUFBVSxHQUFHLEtBQUssQ0FBVSxLQUFLLENBQUMsQ0FBQztJQUVuQzs7O09BR0c7SUFDSCxrQkFBa0IsR0FBRyxLQUFLLENBQWdCLElBQUksQ0FBQyxDQUFDO0lBRWhEOzs7OztPQUtHO0lBQ0gsb0JBQW9CLEdBQUcsS0FBSyxDQUFVLElBQUksQ0FBQyxDQUFDO0lBRTVDOzs7Ozs7OztPQVFHO0lBQ0gsaUJBQWlCLEdBQUcsS0FBSyxDQUFrQixJQUFJLENBQUMsQ0FBQztJQUVqRDs7T0FFRztJQUVILFVBQVUsR0FBeUIsUUFBUSxDQUFDO0lBRTVDLGVBQWU7UUFDYixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGFBQWEsQ0FBQztRQUN0QyxPQUFPLENBQUMsS0FBSyxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUM7UUFFakMsaURBQWlEO1FBQ2pELE1BQU0sRUFBRSxHQUFHLElBQUksY0FBYyxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDO1FBQzNELEVBQUUsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFcEIsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3BELElBQUksU0FBUztZQUFFLEVBQUUsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7UUFFckMsMENBQTBDO1FBQzFDLElBQUksSUFBSSxDQUFDLG9CQUFvQixFQUFFLEVBQUUsQ0FBQztZQUNoQyxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsRUFBRSxTQUFTLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO2lCQUM1RCxJQUFJLENBQ0gsWUFBWSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQyxFQUMvQixrQkFBa0IsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQ3BDO2lCQUNBLFNBQVMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUMsQ0FBQztRQUM1QyxDQUFDO1FBRUQsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBRXJCLElBQUksQ0FBQyxVQUFrQixDQUFDLFNBQVMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDO0lBQzlELENBQUM7SUFFRDs7O09BR0c7SUFDSyxtQkFBbUIsQ0FBQyxPQUFnQjtRQUMxQyxNQUFNLEVBQUUsR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDO1FBQzdCLE1BQU0sRUFBRSxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUM7UUFFOUIsT0FBTyxDQUNMLE9BQU8sQ0FBQyxNQUFNLElBQUksQ0FBQyxJQUFJLGlCQUFpQjtZQUN4QyxPQUFPLENBQUMsR0FBRyxJQUFJLEVBQUUsSUFBSSxpQkFBaUI7WUFDdEMsT0FBTyxDQUFDLEtBQUssSUFBSSxDQUFDLElBQUksbUJBQW1CO1lBQ3pDLE9BQU8sQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDLG9CQUFvQjtTQUN4QyxDQUFDO0lBQ0osQ0FBQztJQUVEOztPQUVHO0lBQ0ssY0FBYztRQUNwQixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGFBQWEsQ0FBQztRQUN0QyxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDcEQsSUFBSSxDQUFDLFNBQVM7WUFBRSxPQUFPO1FBRXZCLE1BQU0sU0FBUyxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUM7UUFDcEMsTUFBTSxTQUFTLEdBQUcsTUFBTSxDQUFDLFdBQVcsQ0FBQztRQUVyQyxNQUFNLE9BQU8sR0FBRyxTQUFTLENBQUMscUJBQXFCLEVBQUUsQ0FBQztRQUVsRCx5QkFBeUI7UUFDekIsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQztZQUN0QixPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxHQUFHLE9BQU8sQ0FBQyxLQUFLLElBQUksQ0FBQztRQUM3QyxDQUFDO1FBRUQsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLHFCQUFxQixFQUFFLENBQUM7UUFFcEQsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQztRQUMvQixNQUFNLFVBQVUsR0FBRyxTQUFTLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQztRQUU5QyxNQUFNLFNBQVMsR0FDYixXQUFXLENBQUMsTUFBTSxHQUFHLFVBQVUsSUFBSSxVQUFVLElBQUksV0FBVyxDQUFDLE1BQU0sQ0FBQztRQUV0RSxpREFBaUQ7UUFDakQsSUFBSSxHQUFHLEdBQUcsU0FBUztZQUNqQixDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsR0FBRyxXQUFXLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDbEQsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBRW5DLElBQUksSUFBSSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUM7UUFFeEIsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRW5ELElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNkLHVEQUF1RDtZQUN2RCxvQkFBb0I7WUFFcEIsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLFNBQVMsR0FBRyxXQUFXLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ3hELElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxTQUFTLEdBQUcsV0FBVyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQztRQUMzRCxDQUFDO1FBQ0Qsd0RBQXdEO1FBQ3hELGtEQUFrRDtRQUNsRCxzQ0FBc0M7UUFFdEMsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQztRQUMvQixPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksR0FBRyxHQUFHLElBQUksSUFBSSxDQUFDO1FBRWpDLDJDQUEyQztRQUMzQyxJQUFJLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxFQUFFLENBQUM7WUFDOUIsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLGFBQWEsQ0FDakMsSUFBSSxDQUFDLGtCQUFrQixFQUFHLENBQ1osQ0FBQztZQUNqQixJQUFJLEtBQUssRUFBRSxDQUFDO2dCQUNWLE1BQU0sUUFBUSxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUM7Z0JBQ3JELEtBQUssQ0FBQyxLQUFLLENBQUMsU0FBUyxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEdBQUcsRUFBRSxFQUFFLFNBQVMsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDO2dCQUN4RSxLQUFLLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxNQUFNLENBQUM7WUFDakMsQ0FBQztRQUNILENBQUM7UUFFRCx5QkFBeUI7UUFDekIsY0FBYyxDQUFDLEdBQUcsRUFBRTtZQUNsQixJQUFJLENBQUMsVUFBVSxHQUFHLFNBQVMsQ0FBQztRQUM5QixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRDs7T0FFRztJQUNLLG1CQUFtQixDQUFDLE9BQW9CO1FBQzlDLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1FBQ3JDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDO0lBQ2xFLENBQUM7d0dBeEtVLDhCQUE4Qjs0RkFBOUIsOEJBQThCOzs0RkFBOUIsOEJBQThCO2tCQUoxQyxTQUFTO21CQUFDO29CQUNULFFBQVEsRUFBRSxrQkFBa0I7b0JBQzVCLFVBQVUsRUFBRSxJQUFJO2lCQUNqQjs4QkFvREMsVUFBVTtzQkFEVCxXQUFXO3VCQUFDLGtCQUFrQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XHJcbiAgQWZ0ZXJWaWV3SW5pdCxcclxuICBEZXN0cm95UmVmLFxyXG4gIERpcmVjdGl2ZSxcclxuICBFbGVtZW50UmVmLFxyXG4gIEhvc3RCaW5kaW5nLFxyXG4gIGluamVjdCxcclxuICBpbnB1dCxcclxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcclxuaW1wb3J0IHsgZnJvbUV2ZW50LCBtZXJnZSB9IGZyb20gJ3J4anMnO1xyXG5pbXBvcnQgeyBkZWJvdW5jZVRpbWUgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XHJcbmltcG9ydCB7IHRha2VVbnRpbERlc3Ryb3llZCB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUvcnhqcy1pbnRlcm9wJztcclxuXHJcbi8qKlxyXG4gKiBBdXRvUG9zaXRpb25FbGVtZW50RGlyZWN0aXZlXHJcbiAqXHJcbiAqIEF1dG9tYXRpY2FsbHkgcG9zaXRpb25zIGFuIG92ZXJsYXkgZWxlbWVudCAoZHJvcGRvd24gLyBwb3BvdmVyKVxyXG4gKiByZWxhdGl2ZSB0byBhIHJlZmVyZW5jZSBlbGVtZW50IGFuZCBrZWVwcyBpdCBpbnNpZGUgdGhlIHZpZXdwb3J0LlxyXG4gKlxyXG4gKiBERVNJR04gREVDSVNJT05TOlxyXG4gKiAtIFVzZXMgYHBvc2l0aW9uOiBmaXhlZGAgc28gdmlld3BvcnQgbWF0aCBpcyByZWxpYWJsZS5cclxuICogLSBVc2VzIGdldEJvdW5kaW5nQ2xpZW50UmVjdCgpIGZvciBhbGwgbWVhc3VyZW1lbnRzLlxyXG4gKiAtIEF2b2lkcyBET00gZGVwdGggYXNzdW1wdGlvbnMgKG5wbS1zYWZlKS5cclxuICogLSBVc2VzIFJlc2l6ZU9ic2VydmVyIHRvIHJlYWN0IHRvIHNpemUgY2hhbmdlcy5cclxuICovXHJcbkBEaXJlY3RpdmUoe1xyXG4gIHNlbGVjdG9yOiAnW25nQXV0b1Bvc2l0aW9uXScsXHJcbiAgc3RhbmRhbG9uZTogdHJ1ZSxcclxufSlcclxuZXhwb3J0IGNsYXNzIE5nQXV0b1Bvc2l0aW9uRWxlbWVudERpcmVjdGl2ZSBpbXBsZW1lbnRzIEFmdGVyVmlld0luaXQge1xyXG4gIC8qKiBOYXRpdmUgZWxlbWVudCByZWZlcmVuY2UgZm9yIHRoZSBvdmVybGF5ICovXHJcbiAgcHJpdmF0ZSByZWFkb25seSBlbCA9IGluamVjdChFbGVtZW50UmVmPEhUTUxFbGVtZW50Pik7XHJcblxyXG4gIC8qKiBVc2VkIGJ5IEFuZ3VsYXIgdG8gYXV0by1jbGVhbiBSeEpTIHN1YnNjcmlwdGlvbnMgKi9cclxuICBwcml2YXRlIHJlYWRvbmx5IGRlc3Ryb3lSZWYgPSBpbmplY3QoRGVzdHJveVJlZik7XHJcblxyXG4gIC8qKlxyXG4gICAqIElEIG9mIHRoZSByZWZlcmVuY2UgZWxlbWVudC5cclxuICAgKiBJZiBub3QgcHJvdmlkZWQsIHBhcmVudEVsZW1lbnQgaXMgdXNlZC5cclxuICAgKi9cclxuICByZWZlcmVuY2VFbGVtZW50SWQgPSBpbnB1dDxzdHJpbmcgfCBudWxsPihudWxsKTtcclxuXHJcbiAgLyoqIERlYm91bmNlIHRpbWUgZm9yIHNjcm9sbCAvIHJlc2l6ZSBldmVudHMgKG1zKSAqL1xyXG4gIGRlYm91bmNlTXMgPSBpbnB1dDxudW1iZXI+KDApO1xyXG5cclxuICAvKiogR2FwIGJldHdlZW4gcmVmZXJlbmNlIGFuZCBvdmVybGF5IChweCkgKi9cclxuICBvZmZzZXQgPSBpbnB1dDxudW1iZXI+KDUpO1xyXG5cclxuICAvKiogTWF0Y2ggb3ZlcmxheSB3aWR0aCB0byByZWZlcmVuY2Ugd2lkdGggKi9cclxuICBtYXRjaFdpZHRoID0gaW5wdXQ8Ym9vbGVhbj4oZmFsc2UpO1xyXG5cclxuICAvKipcclxuICAgKiBPcHRpb25hbCBzZWxlY3RvciBmb3IgaW5uZXIgc2Nyb2xsYWJsZSBjb250ZW50XHJcbiAgICogd2hvc2UgbWF4LWhlaWdodCB3aWxsIGJlIGF1dG8tY2FsY3VsYXRlZC5cclxuICAgKi9cclxuICBzY3JvbGxhYmxlU2VsZWN0b3IgPSBpbnB1dDxzdHJpbmcgfCBudWxsPihudWxsKTtcclxuXHJcbiAgLyoqXHJcbiAgICogRW5hYmxlcyBvciBkaXNhYmxlcyBhdXRvbWF0aWMgcmVwb3NpdGlvbmluZ1xyXG4gICAqIG9uIHdpbmRvdyBzY3JvbGwgYW5kIHJlc2l6ZS5cclxuICAgKlxyXG4gICAqIERlZmF1bHQ6IHRydWVcclxuICAgKi9cclxuICBlbmFibGVBdXRvUmVwb3NpdGlvbiA9IGlucHV0PGJvb2xlYW4+KHRydWUpO1xyXG5cclxuICAvKipcclxuICAgKiBMaXN0IG9mIGVsZW1lbnQgSURzIG9yIGNsYXNzIG5hbWVzXHJcbiAgICogd2hvc2Ugc2Nyb2xsYmFycyBzaG91bGQgYmUgaGlkZGVuXHJcbiAgICogd2hpbGUgdGhlIHBvcHVwIGlzIHZpc2libGUuXHJcbiAgICpcclxuICAgKiBFeGFtcGxlczpcclxuICAgKiBbJ2JvZHknXVxyXG4gICAqIFsnYXBwLWxheW91dCcsICcuY29udGVudC13cmFwcGVyJ11cclxuICAgKi9cclxuICBoaWRlU2Nyb2xsVGFyZ2V0cyA9IGlucHV0PHN0cmluZ1tdIHwgbnVsbD4obnVsbCk7XHJcblxyXG4gIC8qKlxyXG4gICAqIEhpZGUgb3ZlcmxheSB1bnRpbCBwb3NpdGlvbmVkIHRvIGF2b2lkIGZsaWNrZXIuXHJcbiAgICovXHJcbiAgQEhvc3RCaW5kaW5nKCdzdHlsZS52aXNpYmlsaXR5JylcclxuICB2aXNpYmlsaXR5OiAnaGlkZGVuJyB8ICd2aXNpYmxlJyA9ICdoaWRkZW4nO1xyXG5cclxuICBuZ0FmdGVyVmlld0luaXQoKTogdm9pZCB7XHJcbiAgICBjb25zdCBvdmVybGF5ID0gdGhpcy5lbC5uYXRpdmVFbGVtZW50O1xyXG4gICAgb3ZlcmxheS5zdHlsZS5wb3NpdGlvbiA9ICdmaXhlZCc7XHJcblxyXG4gICAgLy8gUmVzaXplT2JzZXJ2ZXIgYWx3YXlzIHVzZWZ1bCAoY29udGVudCBjaGFuZ2VzKVxyXG4gICAgY29uc3Qgcm8gPSBuZXcgUmVzaXplT2JzZXJ2ZXIoKCkgPT4gdGhpcy51cGRhdGVQb3NpdGlvbigpKTtcclxuICAgIHJvLm9ic2VydmUob3ZlcmxheSk7XHJcblxyXG4gICAgY29uc3QgcmVmZXJlbmNlID0gdGhpcy5nZXRSZWZlcmVuY2VFbGVtZW50KG92ZXJsYXkpO1xyXG4gICAgaWYgKHJlZmVyZW5jZSkgcm8ub2JzZXJ2ZShyZWZlcmVuY2UpO1xyXG5cclxuICAgIC8vIENvbmRpdGlvbmFsbHkgbGlzdGVuIHRvIHNjcm9sbCArIHJlc2l6ZVxyXG4gICAgaWYgKHRoaXMuZW5hYmxlQXV0b1JlcG9zaXRpb24oKSkge1xyXG4gICAgICBtZXJnZShmcm9tRXZlbnQod2luZG93LCAnc2Nyb2xsJyksIGZyb21FdmVudCh3aW5kb3csICdyZXNpemUnKSlcclxuICAgICAgICAucGlwZShcclxuICAgICAgICAgIGRlYm91bmNlVGltZSh0aGlzLmRlYm91bmNlTXMoKSksXHJcbiAgICAgICAgICB0YWtlVW50aWxEZXN0cm95ZWQodGhpcy5kZXN0cm95UmVmKSxcclxuICAgICAgICApXHJcbiAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB0aGlzLnVwZGF0ZVBvc2l0aW9uKCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMudXBkYXRlUG9zaXRpb24oKTtcclxuXHJcbiAgICAodGhpcy5kZXN0cm95UmVmIGFzIGFueSkub25EZXN0cm95Py4oKCkgPT4gcm8uZGlzY29ubmVjdCgpKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgcmVmZXJlbmNlIGVsZW1lbnQgaXMgY29tcGxldGVseSBvdXRzaWRlIHZpZXdwb3J0LlxyXG4gICAqIEV2ZW4gMXB4IHZpc2libGUgPSBjb25zaWRlcmVkIHZpc2libGUuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBpc1JlZmVyZW5jZUZ1bGx5T3V0KHJlZlJlY3Q6IERPTVJlY3QpOiBib29sZWFuIHtcclxuICAgIGNvbnN0IHZ3ID0gd2luZG93LmlubmVyV2lkdGg7XHJcbiAgICBjb25zdCB2aCA9IHdpbmRvdy5pbm5lckhlaWdodDtcclxuXHJcbiAgICByZXR1cm4gKFxyXG4gICAgICByZWZSZWN0LmJvdHRvbSA8PSAwIHx8IC8vIGFib3ZlIHZpZXdwb3J0XHJcbiAgICAgIHJlZlJlY3QudG9wID49IHZoIHx8IC8vIGJlbG93IHZpZXdwb3J0XHJcbiAgICAgIHJlZlJlY3QucmlnaHQgPD0gMCB8fCAvLyBsZWZ0IG9mIHZpZXdwb3J0XHJcbiAgICAgIHJlZlJlY3QubGVmdCA+PSB2dyAvLyByaWdodCBvZiB2aWV3cG9ydFxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGN1bGF0ZXMgYW5kIGFwcGxpZXMgb3ZlcmxheSBwb3NpdGlvbi5cclxuICAgKi9cclxuICBwcml2YXRlIHVwZGF0ZVBvc2l0aW9uKCk6IHZvaWQge1xyXG4gICAgY29uc3Qgb3ZlcmxheSA9IHRoaXMuZWwubmF0aXZlRWxlbWVudDtcclxuICAgIGNvbnN0IHJlZmVyZW5jZSA9IHRoaXMuZ2V0UmVmZXJlbmNlRWxlbWVudChvdmVybGF5KTtcclxuICAgIGlmICghcmVmZXJlbmNlKSByZXR1cm47XHJcblxyXG4gICAgY29uc3Qgdmlld3BvcnRXID0gd2luZG93LmlubmVyV2lkdGg7XHJcbiAgICBjb25zdCB2aWV3cG9ydEggPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XHJcblxyXG4gICAgY29uc3QgcmVmUmVjdCA9IHJlZmVyZW5jZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuXHJcbiAgICAvLyBPcHRpb25hbGx5IG1hdGNoIHdpZHRoXHJcbiAgICBpZiAodGhpcy5tYXRjaFdpZHRoKCkpIHtcclxuICAgICAgb3ZlcmxheS5zdHlsZS53aWR0aCA9IGAke3JlZlJlY3Qud2lkdGh9cHhgO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IG92ZXJsYXlSZWN0ID0gb3ZlcmxheS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuXHJcbiAgICBjb25zdCBzcGFjZUFib3ZlID0gcmVmUmVjdC50b3A7XHJcbiAgICBjb25zdCBzcGFjZUJlbG93ID0gdmlld3BvcnRIIC0gcmVmUmVjdC5ib3R0b207XHJcblxyXG4gICAgY29uc3Qgb3Blbk9uVG9wID1cclxuICAgICAgb3ZlcmxheVJlY3QuaGVpZ2h0ID4gc3BhY2VCZWxvdyAmJiBzcGFjZUFib3ZlID49IG92ZXJsYXlSZWN0LmhlaWdodDtcclxuXHJcbiAgICAvLyAtLS0gYmFzZSBwb3NpdGlvbmluZyByZWxhdGl2ZSB0byByZWZlcmVuY2UgLS0tXHJcbiAgICBsZXQgdG9wID0gb3Blbk9uVG9wXHJcbiAgICAgID8gcmVmUmVjdC50b3AgLSBvdmVybGF5UmVjdC5oZWlnaHQgLSB0aGlzLm9mZnNldCgpXHJcbiAgICAgIDogcmVmUmVjdC5ib3R0b20gKyB0aGlzLm9mZnNldCgpO1xyXG5cclxuICAgIGxldCBsZWZ0ID0gcmVmUmVjdC5sZWZ0O1xyXG5cclxuICAgIGNvbnN0IGZ1bGx5T3V0ID0gdGhpcy5pc1JlZmVyZW5jZUZ1bGx5T3V0KHJlZlJlY3QpO1xyXG5cclxuICAgIGlmICghZnVsbHlPdXQpIHtcclxuICAgICAgLy8g4pyFIE5PUk1BTCBNT0RFIChyZWZlcmVuY2UgYXQgbGVhc3QgcGFydGlhbGx5IHZpc2libGUpXHJcbiAgICAgIC8vIENsYW1wIHRvIHZpZXdwb3J0XHJcblxyXG4gICAgICB0b3AgPSBNYXRoLm1pbih0b3AsIHZpZXdwb3J0SCAtIG92ZXJsYXlSZWN0LmhlaWdodCAtIDQpO1xyXG4gICAgICBsZWZ0ID0gTWF0aC5taW4obGVmdCwgdmlld3BvcnRXIC0gb3ZlcmxheVJlY3Qud2lkdGggLSA0KTtcclxuICAgIH1cclxuICAgIC8vIGVsc2U6IOKchSBGT0xMT1cgTU9ERSAocmVmZXJlbmNlIGZ1bGx5IG91dCBvZiB2aWV3cG9ydClcclxuICAgIC8vIGRvIE5PVCBjbGFtcCDihpIgbGV0IHBvcHVwIGdvIG9mZnNjcmVlbiBuYXR1cmFsbHlcclxuICAgIC8vIHRvcCAmIGxlZnQgc3RheSByZWxhdGl2ZSB0byByZWZSZWN0XHJcblxyXG4gICAgb3ZlcmxheS5zdHlsZS50b3AgPSBgJHt0b3B9cHhgO1xyXG4gICAgb3ZlcmxheS5zdHlsZS5sZWZ0ID0gYCR7bGVmdH1weGA7XHJcblxyXG4gICAgLy8gT3B0aW9uYWwgaW5uZXIgc2Nyb2xsIGNvbnRhaW5lciBoYW5kbGluZ1xyXG4gICAgaWYgKHRoaXMuc2Nyb2xsYWJsZVNlbGVjdG9yKCkpIHtcclxuICAgICAgY29uc3QgaW5uZXIgPSBvdmVybGF5LnF1ZXJ5U2VsZWN0b3IoXHJcbiAgICAgICAgdGhpcy5zY3JvbGxhYmxlU2VsZWN0b3IoKSEsXHJcbiAgICAgICkgYXMgSFRNTEVsZW1lbnQ7XHJcbiAgICAgIGlmIChpbm5lcikge1xyXG4gICAgICAgIGNvbnN0IG1heFNwYWNlID0gb3Blbk9uVG9wID8gc3BhY2VBYm92ZSA6IHNwYWNlQmVsb3c7XHJcbiAgICAgICAgaW5uZXIuc3R5bGUubWF4SGVpZ2h0ID0gYCR7TWF0aC5taW4obWF4U3BhY2UgLSAxMCwgdmlld3BvcnRIICogMC45KX1weGA7XHJcbiAgICAgICAgaW5uZXIuc3R5bGUub3ZlcmZsb3dZID0gJ2F1dG8nO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gdmlzaWJpbGl0eSBzYWZlIHVwZGF0ZVxyXG4gICAgcXVldWVNaWNyb3Rhc2soKCkgPT4ge1xyXG4gICAgICB0aGlzLnZpc2liaWxpdHkgPSAndmlzaWJsZSc7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlc29sdmVzIHRoZSByZWZlcmVuY2UgZWxlbWVudC5cclxuICAgKi9cclxuICBwcml2YXRlIGdldFJlZmVyZW5jZUVsZW1lbnQob3ZlcmxheTogSFRNTEVsZW1lbnQpOiBIVE1MRWxlbWVudCB8IG51bGwge1xyXG4gICAgY29uc3QgaWQgPSB0aGlzLnJlZmVyZW5jZUVsZW1lbnRJZCgpO1xyXG4gICAgcmV0dXJuIGlkID8gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpIDogb3ZlcmxheS5wYXJlbnRFbGVtZW50O1xyXG4gIH1cclxufVxyXG4iXX0=