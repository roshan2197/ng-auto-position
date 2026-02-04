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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmctYXV0by1wb3NpdGlvbi5kaXJlY3RpdmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBwL25nLWF1dG8tcG9zaXRpb24vbmctYXV0by1wb3NpdGlvbi5kaXJlY3RpdmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUVMLFVBQVUsRUFDVixTQUFTLEVBQ1QsVUFBVSxFQUNWLFdBQVcsRUFDWCxNQUFNLEVBQ04sS0FBSyxHQUNOLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLE1BQU0sTUFBTSxDQUFDO0FBQ3hDLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUM5QyxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSw0QkFBNEIsQ0FBQzs7QUFFaEU7Ozs7Ozs7Ozs7O0dBV0c7QUFLSCxNQUFNLE9BQU8sOEJBQThCO0lBQ3pDLCtDQUErQztJQUM5QixFQUFFLEdBQUcsTUFBTSxDQUFDLENBQUEsVUFBdUIsQ0FBQSxDQUFDLENBQUM7SUFFdEQsdURBQXVEO0lBQ3RDLFVBQVUsR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7SUFFakQ7OztPQUdHO0lBQ0gsa0JBQWtCLEdBQUcsS0FBSyxDQUFnQixJQUFJLENBQUMsQ0FBQztJQUVoRCxvREFBb0Q7SUFDcEQsVUFBVSxHQUFHLEtBQUssQ0FBUyxDQUFDLENBQUMsQ0FBQztJQUU5Qiw2Q0FBNkM7SUFDN0MsTUFBTSxHQUFHLEtBQUssQ0FBUyxDQUFDLENBQUMsQ0FBQztJQUUxQiw2Q0FBNkM7SUFDN0MsVUFBVSxHQUFHLEtBQUssQ0FBVSxLQUFLLENBQUMsQ0FBQztJQUVuQzs7O09BR0c7SUFDSCxrQkFBa0IsR0FBRyxLQUFLLENBQWdCLElBQUksQ0FBQyxDQUFDO0lBRWhEOzs7OztPQUtHO0lBQ0gsb0JBQW9CLEdBQUcsS0FBSyxDQUFVLElBQUksQ0FBQyxDQUFDO0lBRTVD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LFNBQVMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUM7Z0JBQ3JELEtBQUssQ0FBQyxLQUFLLENBQUMsU0FBUyxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEdBQUcsRUFBRSxFQUFFLFNBQVMsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDO2dCQUN4RSxLQUFLLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxNQUFNLENBQUM7WUFDakMsQ0FBQztRQUNILENBQUM7UUFFRCx5QkFBeUI7UUFDekIsY0FBYyxDQUFDLEdBQUcsRUFBRTtZQUNsQixJQUFJLENBQUMsVUFBVSxHQUFHLFNBQVMsQ0FBQztRQUM5QixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRDs7T0FFRztJQUNLLG1CQUFtQixDQUFDLE9BQW9CO1FBQzlDLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1FBQ3JDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDO0lBQ2xFLENBQUM7d0dBeEtVLDhCQUE4Qjs0RkFBOUIsOEJBQThCOzs0RkFBOUIsOEJBQThCO2tCQUoxQyxTQUFTO21CQUFDO29CQUNULFFBQVEsRUFBRSxrQkFBa0I7b0JBQzVCLFVBQVUsRUFBRSxJQUFJO2lCQUNqQjs4QkFvREMsVUFBVTtzQkFEVCxXQUFXO3VCQUFDLGtCQUFrQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIEFmdGVyVmlld0luaXQsXG4gIERlc3Ryb3lSZWYsXG4gIERpcmVjdGl2ZSxcbiAgRWxlbWVudFJlZixcbiAgSG9zdEJpbmRpbmcsXG4gIGluamVjdCxcbiAgaW5wdXQsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgZnJvbUV2ZW50LCBtZXJnZSB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgZGVib3VuY2VUaW1lIH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHsgdGFrZVVudGlsRGVzdHJveWVkIH0gZnJvbSAnQGFuZ3VsYXIvY29yZS9yeGpzLWludGVyb3AnO1xuXG4vKipcbiAqIEF1dG9Qb3NpdGlvbkVsZW1lbnREaXJlY3RpdmVcbiAqXG4gKiBBdXRvbWF0aWNhbGx5IHBvc2l0aW9ucyBhbiBvdmVybGF5IGVsZW1lbnQgKGRyb3Bkb3duIC8gcG9wb3ZlcilcbiAqIHJlbGF0aXZlIHRvIGEgcmVmZXJlbmNlIGVsZW1lbnQgYW5kIGtlZXBzIGl0IGluc2lkZSB0aGUgdmlld3BvcnQuXG4gKlxuICogREVTSUdOIERFQ0lTSU9OUzpcbiAqIC0gVXNlcyBgcG9zaXRpb246IGZpeGVkYCBzbyB2aWV3cG9ydCBtYXRoIGlzIHJlbGlhYmxlLlxuICogLSBVc2VzIGdldEJvdW5kaW5nQ2xpZW50UmVjdCgpIGZvciBhbGwgbWVhc3VyZW1lbnRzLlxuICogLSBBdm9pZHMgRE9NIGRlcHRoIGFzc3VtcHRpb25zIChucG0tc2FmZSkuXG4gKiAtIFVzZXMgUmVzaXplT2JzZXJ2ZXIgdG8gcmVhY3QgdG8gc2l6ZSBjaGFuZ2VzLlxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbbmdBdXRvUG9zaXRpb25dJyxcbiAgc3RhbmRhbG9uZTogdHJ1ZSxcbn0pXG5leHBvcnQgY2xhc3MgTmdBdXRvUG9zaXRpb25FbGVtZW50RGlyZWN0aXZlIGltcGxlbWVudHMgQWZ0ZXJWaWV3SW5pdCB7XG4gIC8qKiBOYXRpdmUgZWxlbWVudCByZWZlcmVuY2UgZm9yIHRoZSBvdmVybGF5ICovXG4gIHByaXZhdGUgcmVhZG9ubHkgZWwgPSBpbmplY3QoRWxlbWVudFJlZjxIVE1MRWxlbWVudD4pO1xuXG4gIC8qKiBVc2VkIGJ5IEFuZ3VsYXIgdG8gYXV0by1jbGVhbiBSeEpTIHN1YnNjcmlwdGlvbnMgKi9cbiAgcHJpdmF0ZSByZWFkb25seSBkZXN0cm95UmVmID0gaW5qZWN0KERlc3Ryb3lSZWYpO1xuXG4gIC8qKlxuICAgKiBJRCBvZiB0aGUgcmVmZXJlbmNlIGVsZW1lbnQuXG4gICAqIElmIG5vdCBwcm92aWRlZCwgcGFyZW50RWxlbWVudCBpcyB1c2VkLlxuICAgKi9cbiAgcmVmZXJlbmNlRWxlbWVudElkID0gaW5wdXQ8c3RyaW5nIHwgbnVsbD4obnVsbCk7XG5cbiAgLyoqIERlYm91bmNlIHRpbWUgZm9yIHNjcm9sbCAvIHJlc2l6ZSBldmVudHMgKG1zKSAqL1xuICBkZWJvdW5jZU1zID0gaW5wdXQ8bnVtYmVyPigwKTtcblxuICAvKiogR2FwIGJldHdlZW4gcmVmZXJlbmNlIGFuZCBvdmVybGF5IChweCkgKi9cbiAgb2Zmc2V0ID0gaW5wdXQ8bnVtYmVyPig1KTtcblxuICAvKiogTWF0Y2ggb3ZlcmxheSB3aWR0aCB0byByZWZlcmVuY2Ugd2lkdGggKi9cbiAgbWF0Y2hXaWR0aCA9IGlucHV0PGJvb2xlYW4+KGZhbHNlKTtcblxuICAvKipcbiAgICogT3B0aW9uYWwgc2VsZWN0b3IgZm9yIGlubmVyIHNjcm9sbGFibGUgY29udGVudFxuICAgKiB3aG9zZSBtYXgtaGVpZ2h0IHdpbGwgYmUgYXV0by1jYWxjdWxhdGVkLlxuICAgKi9cbiAgc2Nyb2xsYWJsZVNlbGVjdG9yID0gaW5wdXQ8c3RyaW5nIHwgbnVsbD4obnVsbCk7XG5cbiAgLyoqXG4gICAqIEVuYWJsZXMgb3IgZGlzYWJsZXMgYXV0b21hdGljIHJlcG9zaXRpb25pbmdcbiAgICogb24gd2luZG93IHNjcm9sbCBhbmQgcmVzaXplLlxuICAgKlxuICAgKiBEZWZhdWx0OiB0cnVlXG4gICAqL1xuICBlbmFibGVBdXRvUmVwb3NpdGlvbiA9IGlucHV0PGJvb2xlYW4+KHRydWUpO1xuXG4gIC8qKlxuICAgKiBMaXN0IG9mIGVsZW1lbnQgSURzIG9yIGNsYXNzIG5hbWVzXG4gICAqIHdob3NlIHNjcm9sbGJhcnMgc2hvdWxkIGJlIGhpZGRlblxuICAgKiB3aGlsZSB0aGUgcG9wdXAgaXMgdmlzaWJsZS5cbiAgICpcbiAgICogRXhhbXBsZXM6XG4gICAqIFsnYm9keSddXG4gICAqIFsnYXBwLWxheW91dCcsICcuY29udGVudC13cmFwcGVyJ11cbiAgICovXG4gIGhpZGVTY3JvbGxUYXJnZXRzID0gaW5wdXQ8c3RyaW5nW10gfCBudWxsPihudWxsKTtcblxuICAvKipcbiAgICogSGlkZSBvdmVybGF5IHVudGlsIHBvc2l0aW9uZWQgdG8gYXZvaWQgZmxpY2tlci5cbiAgICovXG4gIEBIb3N0QmluZGluZygnc3R5bGUudmlzaWJpbGl0eScpXG4gIHZpc2liaWxpdHk6ICdoaWRkZW4nIHwgJ3Zpc2libGUnID0gJ2hpZGRlbic7XG5cbiAgbmdBZnRlclZpZXdJbml0KCk6IHZvaWQge1xuICAgIGNvbnN0IG92ZXJsYXkgPSB0aGlzLmVsLm5hdGl2ZUVsZW1lbnQ7XG4gICAgb3ZlcmxheS5zdHlsZS5wb3NpdGlvbiA9ICdmaXhlZCc7XG5cbiAgICAvLyBSZXNpemVPYnNlcnZlciBhbHdheXMgdXNlZnVsIChjb250ZW50IGNoYW5nZXMpXG4gICAgY29uc3Qgcm8gPSBuZXcgUmVzaXplT2JzZXJ2ZXIoKCkgPT4gdGhpcy51cGRhdGVQb3NpdGlvbigpKTtcbiAgICByby5vYnNlcnZlKG92ZXJsYXkpO1xuXG4gICAgY29uc3QgcmVmZXJlbmNlID0gdGhpcy5nZXRSZWZlcmVuY2VFbGVtZW50KG92ZXJsYXkpO1xuICAgIGlmIChyZWZlcmVuY2UpIHJvLm9ic2VydmUocmVmZXJlbmNlKTtcblxuICAgIC8vIENvbmRpdGlvbmFsbHkgbGlzdGVuIHRvIHNjcm9sbCArIHJlc2l6ZVxuICAgIGlmICh0aGlzLmVuYWJsZUF1dG9SZXBvc2l0aW9uKCkpIHtcbiAgICAgIG1lcmdlKGZyb21FdmVudCh3aW5kb3csICdzY3JvbGwnKSwgZnJvbUV2ZW50KHdpbmRvdywgJ3Jlc2l6ZScpKVxuICAgICAgICAucGlwZShcbiAgICAgICAgICBkZWJvdW5jZVRpbWUodGhpcy5kZWJvdW5jZU1zKCkpLFxuICAgICAgICAgIHRha2VVbnRpbERlc3Ryb3llZCh0aGlzLmRlc3Ryb3lSZWYpLFxuICAgICAgICApXG4gICAgICAgIC5zdWJzY3JpYmUoKCkgPT4gdGhpcy51cGRhdGVQb3NpdGlvbigpKTtcbiAgICB9XG5cbiAgICB0aGlzLnVwZGF0ZVBvc2l0aW9uKCk7XG5cbiAgICAodGhpcy5kZXN0cm95UmVmIGFzIGFueSkub25EZXN0cm95Py4oKCkgPT4gcm8uZGlzY29ubmVjdCgpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRydWUgaWYgdGhlIHJlZmVyZW5jZSBlbGVtZW50IGlzIGNvbXBsZXRlbHkgb3V0c2lkZSB2aWV3cG9ydC5cbiAgICogRXZlbiAxcHggdmlzaWJsZSA9IGNvbnNpZGVyZWQgdmlzaWJsZS5cbiAgICovXG4gIHByaXZhdGUgaXNSZWZlcmVuY2VGdWxseU91dChyZWZSZWN0OiBET01SZWN0KTogYm9vbGVhbiB7XG4gICAgY29uc3QgdncgPSB3aW5kb3cuaW5uZXJXaWR0aDtcbiAgICBjb25zdCB2aCA9IHdpbmRvdy5pbm5lckhlaWdodDtcblxuICAgIHJldHVybiAoXG4gICAgICByZWZSZWN0LmJvdHRvbSA8PSAwIHx8IC8vIGFib3ZlIHZpZXdwb3J0XG4gICAgICByZWZSZWN0LnRvcCA+PSB2aCB8fCAvLyBiZWxvdyB2aWV3cG9ydFxuICAgICAgcmVmUmVjdC5yaWdodCA8PSAwIHx8IC8vIGxlZnQgb2Ygdmlld3BvcnRcbiAgICAgIHJlZlJlY3QubGVmdCA+PSB2dyAvLyByaWdodCBvZiB2aWV3cG9ydFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogQ2FsY3VsYXRlcyBhbmQgYXBwbGllcyBvdmVybGF5IHBvc2l0aW9uLlxuICAgKi9cbiAgcHJpdmF0ZSB1cGRhdGVQb3NpdGlvbigpOiB2b2lkIHtcbiAgICBjb25zdCBvdmVybGF5ID0gdGhpcy5lbC5uYXRpdmVFbGVtZW50O1xuICAgIGNvbnN0IHJlZmVyZW5jZSA9IHRoaXMuZ2V0UmVmZXJlbmNlRWxlbWVudChvdmVybGF5KTtcbiAgICBpZiAoIXJlZmVyZW5jZSkgcmV0dXJuO1xuXG4gICAgY29uc3Qgdmlld3BvcnRXID0gd2luZG93LmlubmVyV2lkdGg7XG4gICAgY29uc3Qgdmlld3BvcnRIID0gd2luZG93LmlubmVySGVpZ2h0O1xuXG4gICAgY29uc3QgcmVmUmVjdCA9IHJlZmVyZW5jZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICAgIC8vIE9wdGlvbmFsbHkgbWF0Y2ggd2lkdGhcbiAgICBpZiAodGhpcy5tYXRjaFdpZHRoKCkpIHtcbiAgICAgIG92ZXJsYXkuc3R5bGUud2lkdGggPSBgJHtyZWZSZWN0LndpZHRofXB4YDtcbiAgICB9XG5cbiAgICBjb25zdCBvdmVybGF5UmVjdCA9IG92ZXJsYXkuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgICBjb25zdCBzcGFjZUFib3ZlID0gcmVmUmVjdC50b3A7XG4gICAgY29uc3Qgc3BhY2VCZWxvdyA9IHZpZXdwb3J0SCAtIHJlZlJlY3QuYm90dG9tO1xuXG4gICAgY29uc3Qgb3Blbk9uVG9wID1cbiAgICAgIG92ZXJsYXlSZWN0LmhlaWdodCA+IHNwYWNlQmVsb3cgJiYgc3BhY2VBYm92ZSA+PSBvdmVybGF5UmVjdC5oZWlnaHQ7XG5cbiAgICAvLyAtLS0gYmFzZSBwb3NpdGlvbmluZyByZWxhdGl2ZSB0byByZWZlcmVuY2UgLS0tXG4gICAgbGV0IHRvcCA9IG9wZW5PblRvcFxuICAgICAgPyByZWZSZWN0LnRvcCAtIG92ZXJsYXlSZWN0LmhlaWdodCAtIHRoaXMub2Zmc2V0KClcbiAgICAgIDogcmVmUmVjdC5ib3R0b20gKyB0aGlzLm9mZnNldCgpO1xuXG4gICAgbGV0IGxlZnQgPSByZWZSZWN0LmxlZnQ7XG5cbiAgICBjb25zdCBmdWxseU91dCA9IHRoaXMuaXNSZWZlcmVuY2VGdWxseU91dChyZWZSZWN0KTtcblxuICAgIGlmICghZnVsbHlPdXQpIHtcbiAgICAgIC8vIOKchSBOT1JNQUwgTU9ERSAocmVmZXJlbmNlIGF0IGxlYXN0IHBhcnRpYWxseSB2aXNpYmxlKVxuICAgICAgLy8gQ2xhbXAgdG8gdmlld3BvcnRcblxuICAgICAgdG9wID0gTWF0aC5taW4odG9wLCB2aWV3cG9ydEggLSBvdmVybGF5UmVjdC5oZWlnaHQgLSA0KTtcbiAgICAgIGxlZnQgPSBNYXRoLm1pbihsZWZ0LCB2aWV3cG9ydFcgLSBvdmVybGF5UmVjdC53aWR0aCAtIDQpO1xuICAgIH1cbiAgICAvLyBlbHNlOiDinIUgRk9MTE9XIE1PREUgKHJlZmVyZW5jZSBmdWxseSBvdXQgb2Ygdmlld3BvcnQpXG4gICAgLy8gZG8gTk9UIGNsYW1wIOKGkiBsZXQgcG9wdXAgZ28gb2Zmc2NyZWVuIG5hdHVyYWxseVxuICAgIC8vIHRvcCAmIGxlZnQgc3RheSByZWxhdGl2ZSB0byByZWZSZWN0XG5cbiAgICBvdmVybGF5LnN0eWxlLnRvcCA9IGAke3RvcH1weGA7XG4gICAgb3ZlcmxheS5zdHlsZS5sZWZ0ID0gYCR7bGVmdH1weGA7XG5cbiAgICAvLyBPcHRpb25hbCBpbm5lciBzY3JvbGwgY29udGFpbmVyIGhhbmRsaW5nXG4gICAgaWYgKHRoaXMuc2Nyb2xsYWJsZVNlbGVjdG9yKCkpIHtcbiAgICAgIGNvbnN0IGlubmVyID0gb3ZlcmxheS5xdWVyeVNlbGVjdG9yKFxuICAgICAgICB0aGlzLnNjcm9sbGFibGVTZWxlY3RvcigpISxcbiAgICAgICkgYXMgSFRNTEVsZW1lbnQ7XG4gICAgICBpZiAoaW5uZXIpIHtcbiAgICAgICAgY29uc3QgbWF4U3BhY2UgPSBvcGVuT25Ub3AgPyBzcGFjZUFib3ZlIDogc3BhY2VCZWxvdztcbiAgICAgICAgaW5uZXIuc3R5bGUubWF4SGVpZ2h0ID0gYCR7TWF0aC5taW4obWF4U3BhY2UgLSAxMCwgdmlld3BvcnRIICogMC45KX1weGA7XG4gICAgICAgIGlubmVyLnN0eWxlLm92ZXJmbG93WSA9ICdhdXRvJztcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyB2aXNpYmlsaXR5IHNhZmUgdXBkYXRlXG4gICAgcXVldWVNaWNyb3Rhc2soKCkgPT4ge1xuICAgICAgdGhpcy52aXNpYmlsaXR5ID0gJ3Zpc2libGUnO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc29sdmVzIHRoZSByZWZlcmVuY2UgZWxlbWVudC5cbiAgICovXG4gIHByaXZhdGUgZ2V0UmVmZXJlbmNlRWxlbWVudChvdmVybGF5OiBIVE1MRWxlbWVudCk6IEhUTUxFbGVtZW50IHwgbnVsbCB7XG4gICAgY29uc3QgaWQgPSB0aGlzLnJlZmVyZW5jZUVsZW1lbnRJZCgpO1xuICAgIHJldHVybiBpZCA/IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKSA6IG92ZXJsYXkucGFyZW50RWxlbWVudDtcbiAgfVxufVxuIl19