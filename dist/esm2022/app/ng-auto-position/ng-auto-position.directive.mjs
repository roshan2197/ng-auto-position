import { DestroyRef, Directive, ElementRef, EventEmitter, HostBinding, Output, inject, input, } from '@angular/core';
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmctYXV0by1wb3NpdGlvbi5kaXJlY3RpdmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBwL25nLWF1dG8tcG9zaXRpb24vbmctYXV0by1wb3NpdGlvbi5kaXJlY3RpdmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUVMLFVBQVUsRUFDVixTQUFTLEVBQ1QsVUFBVSxFQUNWLFlBQVksRUFDWixXQUFXLEVBQ1gsTUFBTSxFQUNOLE1BQU0sRUFDTixLQUFLLEdBQ04sTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsTUFBTSxNQUFNLENBQUM7QUFDeEMsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBQzlDLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLDRCQUE0QixDQUFDOztBQUVoRTs7Ozs7Ozs7Ozs7R0FXRztBQUtILE1BQU0sT0FBTyw4QkFBOEI7SUFDekMsK0NBQStDO0lBQzlCLEVBQUUsR0FBRyxNQUFNLENBQUMsQ0FBQSxVQUF1QixDQUFBLENBQUMsQ0FBQztJQUV0RCx1REFBdUQ7SUFDdEMsVUFBVSxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUVqRDs7O09BR0c7SUFDSCxnQkFBZ0IsR0FBRyxLQUFLLENBQStDLElBQUksQ0FBQyxDQUFDO0lBRTdFOzs7T0FHRztJQUNILGtCQUFrQixHQUFHLEtBQUssQ0FBZ0IsSUFBSSxDQUFDLENBQUM7SUFFaEQsb0RBQW9EO0lBQ3BELFVBQVUsR0FBRyxLQUFLLENBQVMsQ0FBQyxDQUFDLENBQUM7SUFFOUIsNkNBQTZDO0lBQzdDLE1BQU0sR0FBRyxLQUFLLENBQVMsQ0FBQyxDQUFDLENBQUM7SUFFMUIsNkNBQTZDO0lBQzdDLFVBQVUsR0FBRyxLQUFLLENBQVUsS0FBSyxDQUFDLENBQUM7SUFFbkM7Ozs7T0FJRztJQUNILFNBQVMsR0FBRyxLQUFLLENBQStDLE1B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QUMsUUFBUSxJQUFJLEtBQUssQ0FBQyxTQUFTLElBQUksS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQzNFLElBQUksdUJBQXVCLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7Z0JBQzNDLGFBQWEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDOUIsQ0FBQztZQUNELE9BQU8sR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDO1FBQ2xDLENBQUM7UUFFRCxPQUFPLGFBQWEsQ0FBQztJQUN2QixDQUFDO3dHQTFRVSw4QkFBOEI7NEZBQTlCLDhCQUE4Qjs7NEZBQTlCLDhCQUE4QjtrQkFKMUMsU0FBUzttQkFBQztvQkFDVCxRQUFRLEVBQUUsa0JBQWtCO29CQUM1QixVQUFVLEVBQUUsSUFBSTtpQkFDakI7OEJBMkVXLGVBQWU7c0JBQXhCLE1BQU07Z0JBUVAsVUFBVTtzQkFEVCxXQUFXO3VCQUFDLGtCQUFrQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIEFmdGVyVmlld0luaXQsXG4gIERlc3Ryb3lSZWYsXG4gIERpcmVjdGl2ZSxcbiAgRWxlbWVudFJlZixcbiAgRXZlbnRFbWl0dGVyLFxuICBIb3N0QmluZGluZyxcbiAgT3V0cHV0LFxuICBpbmplY3QsXG4gIGlucHV0LFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IGZyb21FdmVudCwgbWVyZ2UgfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IGRlYm91bmNlVGltZSB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7IHRha2VVbnRpbERlc3Ryb3llZCB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUvcnhqcy1pbnRlcm9wJztcblxuLyoqXG4gKiBBdXRvUG9zaXRpb25FbGVtZW50RGlyZWN0aXZlXG4gKlxuICogQXV0b21hdGljYWxseSBwb3NpdGlvbnMgYW4gb3ZlcmxheSBlbGVtZW50IChkcm9wZG93biAvIHBvcG92ZXIpXG4gKiByZWxhdGl2ZSB0byBhIHJlZmVyZW5jZSBlbGVtZW50IGFuZCBrZWVwcyBpdCBpbnNpZGUgdGhlIHZpZXdwb3J0LlxuICpcbiAqIERFU0lHTiBERUNJU0lPTlM6XG4gKiAtIFVzZXMgYHBvc2l0aW9uOiBmaXhlZGAgc28gdmlld3BvcnQgbWF0aCBpcyByZWxpYWJsZS5cbiAqIC0gVXNlcyBnZXRCb3VuZGluZ0NsaWVudFJlY3QoKSBmb3IgYWxsIG1lYXN1cmVtZW50cy5cbiAqIC0gQXZvaWRzIERPTSBkZXB0aCBhc3N1bXB0aW9ucyAobnBtLXNhZmUpLlxuICogLSBVc2VzIFJlc2l6ZU9ic2VydmVyIHRvIHJlYWN0IHRvIHNpemUgY2hhbmdlcy5cbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW25nQXV0b1Bvc2l0aW9uXScsXG4gIHN0YW5kYWxvbmU6IHRydWUsXG59KVxuZXhwb3J0IGNsYXNzIE5nQXV0b1Bvc2l0aW9uRWxlbWVudERpcmVjdGl2ZSBpbXBsZW1lbnRzIEFmdGVyVmlld0luaXQge1xuICAvKiogTmF0aXZlIGVsZW1lbnQgcmVmZXJlbmNlIGZvciB0aGUgb3ZlcmxheSAqL1xuICBwcml2YXRlIHJlYWRvbmx5IGVsID0gaW5qZWN0KEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+KTtcblxuICAvKiogVXNlZCBieSBBbmd1bGFyIHRvIGF1dG8tY2xlYW4gUnhKUyBzdWJzY3JpcHRpb25zICovXG4gIHByaXZhdGUgcmVhZG9ubHkgZGVzdHJveVJlZiA9IGluamVjdChEZXN0cm95UmVmKTtcblxuICAvKipcbiAgICogRGlyZWN0IHJlZmVyZW5jZSB0byB0aGUgYW5jaG9yIGVsZW1lbnQuXG4gICAqIElmIHByb3ZpZGVkLCB0aGlzIHRha2VzIHByaW9yaXR5IG92ZXIgcmVmZXJlbmNlRWxlbWVudElkLlxuICAgKi9cbiAgcmVmZXJlbmNlRWxlbWVudCA9IGlucHV0PEhUTUxFbGVtZW50IHwgRWxlbWVudFJlZjxIVE1MRWxlbWVudD4gfCBudWxsPihudWxsKTtcblxuICAvKipcbiAgICogSUQgb2YgdGhlIHJlZmVyZW5jZSBlbGVtZW50LlxuICAgKiBJZiBub3QgcHJvdmlkZWQsIHBhcmVudEVsZW1lbnQgaXMgdXNlZC5cbiAgICovXG4gIHJlZmVyZW5jZUVsZW1lbnRJZCA9IGlucHV0PHN0cmluZyB8IG51bGw+KG51bGwpO1xuXG4gIC8qKiBEZWJvdW5jZSB0aW1lIGZvciBzY3JvbGwgLyByZXNpemUgZXZlbnRzIChtcykgKi9cbiAgZGVib3VuY2VNcyA9IGlucHV0PG51bWJlcj4oMCk7XG5cbiAgLyoqIEdhcCBiZXR3ZWVuIHJlZmVyZW5jZSBhbmQgb3ZlcmxheSAocHgpICovXG4gIG9mZnNldCA9IGlucHV0PG51bWJlcj4oNSk7XG5cbiAgLyoqIE1hdGNoIG92ZXJsYXkgd2lkdGggdG8gcmVmZXJlbmNlIHdpZHRoICovXG4gIG1hdGNoV2lkdGggPSBpbnB1dDxib29sZWFuPihmYWxzZSk7XG5cbiAgLyoqXG4gICAqIFByZWZlcnJlZCBwbGFjZW1lbnQuXG4gICAqIC0gJ2F1dG8nIGNob29zZXMgdG9wL2JvdHRvbSBiYXNlZCBvbiBhdmFpbGFibGUgc3BhY2UuXG4gICAqIC0gJ2xlZnQnLydyaWdodCcgYXJlIGV4cGxpY2l0LlxuICAgKi9cbiAgcGxhY2VtZW50ID0gaW5wdXQ8J2F1dG8nIHwgJ3RvcCcgfCAnYm90dG9tJyB8ICdsZWZ0JyB8ICdyaWdodCc+KCdhdXRvJyk7XG5cbiAgLyoqIE1pbmltdW0gcGFkZGluZyBmcm9tIHRoZSB2aWV3cG9ydCBlZGdlcyB3aGVuIGNsYW1waW5nLiAqL1xuICB2aWV3cG9ydFBhZGRpbmcgPSBpbnB1dDxudW1iZXI+KDQpO1xuXG4gIC8qKlxuICAgKiBMaXN0ZW4gdG8gc2Nyb2xsIGV2ZW50cyBvbiBzY3JvbGxhYmxlIHBhcmVudHMgb2YgdGhlIHJlZmVyZW5jZSBlbGVtZW50LlxuICAgKiBVc2VmdWwgZm9yIG92ZXJsYXlzIGluc2lkZSBzY3JvbGxhYmxlIGNvbnRhaW5lcnMgKGRyYXdlcnMsIHBhbmVscykuXG4gICAqXG4gICAqIERlZmF1bHQ6IHRydWVcbiAgICovXG4gIHRyYWNrU2Nyb2xsUGFyZW50cyA9IGlucHV0PGJvb2xlYW4+KHRydWUpO1xuXG4gIC8qKlxuICAgKiBPcHRpb25hbCBzZWxlY3RvciBmb3IgaW5uZXIgc2Nyb2xsYWJsZSBjb250ZW50XG4gICAqIHdob3NlIG1heC1oZWlnaHQgd2lsbCBiZSBhdXRvLWNhbGN1bGF0ZWQuXG4gICAqL1xuICBzY3JvbGxhYmxlU2VsZWN0b3IgPSBpbnB1dDxzdHJpbmcgfCBudWxsPihudWxsKTtcblxuICAvKipcbiAgICogRW5hYmxlcyBvciBkaXNhYmxlcyBhdXRvbWF0aWMgcmVwb3NpdGlvbmluZ1xuICAgKiBvbiB3aW5kb3cgc2Nyb2xsIGFuZCByZXNpemUuXG4gICAqXG4gICAqIERlZmF1bHQ6IHRydWVcbiAgICovXG4gIGVuYWJsZUF1dG9SZXBvc2l0aW9uID0gaW5wdXQ8Ym9vbGVhbj4odHJ1ZSk7XG5cbiAgLyoqXG4gICAqIExpc3Qgb2YgZWxlbWVudCBJRHMgb3IgY2xhc3MgbmFtZXNcbiAgICogd2hvc2Ugc2Nyb2xsYmFycyBzaG91bGQgYmUgaGlkZGVuXG4gICAqIHdoaWxlIHRoZSBwb3B1cCBpcyB2aXNpYmxlLlxuICAgKlxuICAgKiBFeGFtcGxlczpcbiAgICogWydib2R5J11cbiAgICogWydhcHAtbGF5b3V0JywgJy5jb250ZW50LXdyYXBwZXInXVxuICAgKi9cbiAgaGlkZVNjcm9sbFRhcmdldHMgPSBpbnB1dDxzdHJpbmdbXSB8IG51bGw+KG51bGwpO1xuXG4gIC8qKlxuICAgKiBFbWl0cyB0aGUgZmluYWwgcGxhY2VtZW50IGFmdGVyIGVhY2ggdXBkYXRlLlxuICAgKi9cbiAgQE91dHB1dCgpIHBsYWNlbWVudENoYW5nZSA9IG5ldyBFdmVudEVtaXR0ZXI8XG4gICAgJ3RvcCcgfCAnYm90dG9tJyB8ICdsZWZ0JyB8ICdyaWdodCdcbiAgPigpO1xuXG4gIC8qKlxuICAgKiBIaWRlIG92ZXJsYXkgdW50aWwgcG9zaXRpb25lZCB0byBhdm9pZCBmbGlja2VyLlxuICAgKi9cbiAgQEhvc3RCaW5kaW5nKCdzdHlsZS52aXNpYmlsaXR5JylcbiAgdmlzaWJpbGl0eTogJ2hpZGRlbicgfCAndmlzaWJsZScgPSAnaGlkZGVuJztcblxuICBwcml2YXRlIGxhc3RQbGFjZW1lbnQ6ICd0b3AnIHwgJ2JvdHRvbScgfCAnbGVmdCcgfCAncmlnaHQnIHwgbnVsbCA9IG51bGw7XG5cbiAgbmdBZnRlclZpZXdJbml0KCk6IHZvaWQge1xuICAgIGNvbnN0IG92ZXJsYXkgPSB0aGlzLmVsLm5hdGl2ZUVsZW1lbnQ7XG4gICAgb3ZlcmxheS5zdHlsZS5wb3NpdGlvbiA9ICdmaXhlZCc7XG5cbiAgICAvLyBSZXNpemVPYnNlcnZlciBhbHdheXMgdXNlZnVsIChjb250ZW50IGNoYW5nZXMpXG4gICAgY29uc3Qgcm8gPSBuZXcgUmVzaXplT2JzZXJ2ZXIoKCkgPT4gdGhpcy51cGRhdGVQb3NpdGlvbigpKTtcbiAgICByby5vYnNlcnZlKG92ZXJsYXkpO1xuXG4gICAgY29uc3QgcmVmZXJlbmNlID0gdGhpcy5nZXRSZWZlcmVuY2VFbGVtZW50KG92ZXJsYXkpO1xuICAgIGlmIChyZWZlcmVuY2UpIHJvLm9ic2VydmUocmVmZXJlbmNlKTtcblxuICAgIC8vIENvbmRpdGlvbmFsbHkgbGlzdGVuIHRvIHNjcm9sbCArIHJlc2l6ZSAoaW5jbHVkaW5nIHNjcm9sbGFibGUgcGFyZW50cylcbiAgICBpZiAodGhpcy5lbmFibGVBdXRvUmVwb3NpdGlvbigpKSB7XG4gICAgICBjb25zdCBzY3JvbGxQYXJlbnRzID1cbiAgICAgICAgcmVmZXJlbmNlICYmIHRoaXMudHJhY2tTY3JvbGxQYXJlbnRzKClcbiAgICAgICAgICA/IHRoaXMuZ2V0U2Nyb2xsYWJsZVBhcmVudHMocmVmZXJlbmNlKVxuICAgICAgICAgIDogW107XG4gICAgICBjb25zdCBzY3JvbGxTdHJlYW1zID0gc2Nyb2xsUGFyZW50cy5tYXAoKHRhcmdldCkgPT5cbiAgICAgICAgZnJvbUV2ZW50KHRhcmdldCwgJ3Njcm9sbCcpLFxuICAgICAgKTtcblxuICAgICAgbWVyZ2UoZnJvbUV2ZW50KHdpbmRvdywgJ3Njcm9sbCcpLCBmcm9tRXZlbnQod2luZG93LCAncmVzaXplJyksIC4uLnNjcm9sbFN0cmVhbXMpXG4gICAgICAgIC5waXBlKFxuICAgICAgICAgIGRlYm91bmNlVGltZSh0aGlzLmRlYm91bmNlTXMoKSksXG4gICAgICAgICAgdGFrZVVudGlsRGVzdHJveWVkKHRoaXMuZGVzdHJveVJlZiksXG4gICAgICAgIClcbiAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB0aGlzLnVwZGF0ZVBvc2l0aW9uKCkpO1xuICAgIH1cblxuICAgIHRoaXMudXBkYXRlUG9zaXRpb24oKTtcblxuICAgICh0aGlzLmRlc3Ryb3lSZWYgYXMgYW55KS5vbkRlc3Ryb3k/LigoKSA9PiByby5kaXNjb25uZWN0KCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgcmVmZXJlbmNlIGVsZW1lbnQgaXMgY29tcGxldGVseSBvdXRzaWRlIHZpZXdwb3J0LlxuICAgKiBFdmVuIDFweCB2aXNpYmxlID0gY29uc2lkZXJlZCB2aXNpYmxlLlxuICAgKi9cbiAgcHJpdmF0ZSBpc1JlZmVyZW5jZUZ1bGx5T3V0KHJlZlJlY3Q6IERPTVJlY3QpOiBib29sZWFuIHtcbiAgICBjb25zdCB2dyA9IHdpbmRvdy5pbm5lcldpZHRoO1xuICAgIGNvbnN0IHZoID0gd2luZG93LmlubmVySGVpZ2h0O1xuXG4gICAgcmV0dXJuIChcbiAgICAgIHJlZlJlY3QuYm90dG9tIDw9IDAgfHwgLy8gYWJvdmUgdmlld3BvcnRcbiAgICAgIHJlZlJlY3QudG9wID49IHZoIHx8IC8vIGJlbG93IHZpZXdwb3J0XG4gICAgICByZWZSZWN0LnJpZ2h0IDw9IDAgfHwgLy8gbGVmdCBvZiB2aWV3cG9ydFxuICAgICAgcmVmUmVjdC5sZWZ0ID49IHZ3IC8vIHJpZ2h0IG9mIHZpZXdwb3J0XG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxjdWxhdGVzIGFuZCBhcHBsaWVzIG92ZXJsYXkgcG9zaXRpb24uXG4gICAqL1xuICBwcml2YXRlIHVwZGF0ZVBvc2l0aW9uKCk6IHZvaWQge1xuICAgIGNvbnN0IG92ZXJsYXkgPSB0aGlzLmVsLm5hdGl2ZUVsZW1lbnQ7XG4gICAgY29uc3QgcmVmZXJlbmNlID0gdGhpcy5nZXRSZWZlcmVuY2VFbGVtZW50KG92ZXJsYXkpO1xuICAgIGlmICghcmVmZXJlbmNlKSByZXR1cm47XG5cbiAgICBjb25zdCB2aWV3cG9ydFcgPSB3aW5kb3cuaW5uZXJXaWR0aDtcbiAgICBjb25zdCB2aWV3cG9ydEggPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG5cbiAgICBjb25zdCByZWZSZWN0ID0gcmVmZXJlbmNlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG4gICAgLy8gT3B0aW9uYWxseSBtYXRjaCB3aWR0aFxuICAgIGlmICh0aGlzLm1hdGNoV2lkdGgoKSkge1xuICAgICAgb3ZlcmxheS5zdHlsZS53aWR0aCA9IGAke3JlZlJlY3Qud2lkdGh9cHhgO1xuICAgIH1cblxuICAgIGNvbnN0IG92ZXJsYXlSZWN0ID0gb3ZlcmxheS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICAgIGNvbnN0IHNwYWNlQWJvdmUgPSByZWZSZWN0LnRvcDtcbiAgICBjb25zdCBzcGFjZUJlbG93ID0gdmlld3BvcnRIIC0gcmVmUmVjdC5ib3R0b207XG5cbiAgICBsZXQgb3Blbk9uVG9wID1cbiAgICAgIG92ZXJsYXlSZWN0LmhlaWdodCA+IHNwYWNlQmVsb3cgJiYgc3BhY2VBYm92ZSA+PSBvdmVybGF5UmVjdC5oZWlnaHQ7XG5cbiAgICAvLyBQbGFjZW1lbnQgb3ZlcnJpZGUgKHVzZXItc3BlY2lmaWVkIHByZWZlcmVuY2UpXG4gICAgY29uc3QgcHJlZmVycmVkUGxhY2VtZW50ID0gdGhpcy5wbGFjZW1lbnQoKTtcbiAgICBpZiAocHJlZmVycmVkUGxhY2VtZW50ID09PSAndG9wJykgb3Blbk9uVG9wID0gdHJ1ZTtcbiAgICBpZiAocHJlZmVycmVkUGxhY2VtZW50ID09PSAnYm90dG9tJykgb3Blbk9uVG9wID0gZmFsc2U7XG5cbiAgICBsZXQgdG9wID0gcmVmUmVjdC50b3A7XG4gICAgbGV0IGxlZnQgPSByZWZSZWN0LmxlZnQ7XG4gICAgbGV0IGZpbmFsUGxhY2VtZW50OiAndG9wJyB8ICdib3R0b20nIHwgJ2xlZnQnIHwgJ3JpZ2h0JztcblxuICAgIGlmIChwcmVmZXJyZWRQbGFjZW1lbnQgPT09ICdsZWZ0JyB8fCBwcmVmZXJyZWRQbGFjZW1lbnQgPT09ICdyaWdodCcpIHtcbiAgICAgIGZpbmFsUGxhY2VtZW50ID0gcHJlZmVycmVkUGxhY2VtZW50O1xuICAgICAgbGVmdCA9XG4gICAgICAgIHByZWZlcnJlZFBsYWNlbWVudCA9PT0gJ2xlZnQnXG4gICAgICAgICAgPyByZWZSZWN0LmxlZnQgLSBvdmVybGF5UmVjdC53aWR0aCAtIHRoaXMub2Zmc2V0KClcbiAgICAgICAgICA6IHJlZlJlY3QucmlnaHQgKyB0aGlzLm9mZnNldCgpO1xuICAgICAgdG9wID0gcmVmUmVjdC50b3A7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZpbmFsUGxhY2VtZW50ID0gb3Blbk9uVG9wID8gJ3RvcCcgOiAnYm90dG9tJztcbiAgICAgIHRvcCA9IG9wZW5PblRvcFxuICAgICAgICA/IHJlZlJlY3QudG9wIC0gb3ZlcmxheVJlY3QuaGVpZ2h0IC0gdGhpcy5vZmZzZXQoKVxuICAgICAgICA6IHJlZlJlY3QuYm90dG9tICsgdGhpcy5vZmZzZXQoKTtcbiAgICAgIGxlZnQgPSByZWZSZWN0LmxlZnQ7XG4gICAgfVxuXG4gICAgY29uc3QgZnVsbHlPdXQgPSB0aGlzLmlzUmVmZXJlbmNlRnVsbHlPdXQocmVmUmVjdCk7XG5cbiAgICBpZiAoIWZ1bGx5T3V0KSB7XG4gICAgICAvLyDinIUgTk9STUFMIE1PREUgKHJlZmVyZW5jZSBhdCBsZWFzdCBwYXJ0aWFsbHkgdmlzaWJsZSlcbiAgICAgIC8vIENsYW1wIHRvIHZpZXdwb3J0XG5cbiAgICAgIGNvbnN0IHBhZGRpbmcgPSBNYXRoLm1heCgwLCB0aGlzLnZpZXdwb3J0UGFkZGluZygpKTtcbiAgICAgIHRvcCA9IE1hdGgubWluKHRvcCwgdmlld3BvcnRIIC0gb3ZlcmxheVJlY3QuaGVpZ2h0IC0gcGFkZGluZyk7XG4gICAgICB0b3AgPSBNYXRoLm1heCh0b3AsIHBhZGRpbmcpO1xuICAgICAgbGVmdCA9IE1hdGgubWluKGxlZnQsIHZpZXdwb3J0VyAtIG92ZXJsYXlSZWN0LndpZHRoIC0gcGFkZGluZyk7XG4gICAgICBsZWZ0ID0gTWF0aC5tYXgobGVmdCwgcGFkZGluZyk7XG4gICAgfVxuICAgIC8vIGVsc2U6IOKchSBGT0xMT1cgTU9ERSAocmVmZXJlbmNlIGZ1bGx5IG91dCBvZiB2aWV3cG9ydClcbiAgICAvLyBkbyBOT1QgY2xhbXAg4oaSIGxldCBwb3B1cCBnbyBvZmZzY3JlZW4gbmF0dXJhbGx5XG4gICAgLy8gdG9wICYgbGVmdCBzdGF5IHJlbGF0aXZlIHRvIHJlZlJlY3RcblxuICAgIG92ZXJsYXkuc3R5bGUudG9wID0gYCR7dG9wfXB4YDtcbiAgICBvdmVybGF5LnN0eWxlLmxlZnQgPSBgJHtsZWZ0fXB4YDtcblxuICAgIGlmICh0aGlzLmxhc3RQbGFjZW1lbnQgIT09IGZpbmFsUGxhY2VtZW50KSB7XG4gICAgICB0aGlzLmxhc3RQbGFjZW1lbnQgPSBmaW5hbFBsYWNlbWVudDtcbiAgICAgIHRoaXMucGxhY2VtZW50Q2hhbmdlLmVtaXQoZmluYWxQbGFjZW1lbnQpO1xuICAgIH1cblxuICAgIC8vIE9wdGlvbmFsIGlubmVyIHNjcm9sbCBjb250YWluZXIgaGFuZGxpbmdcbiAgICBpZiAodGhpcy5zY3JvbGxhYmxlU2VsZWN0b3IoKSkge1xuICAgICAgY29uc3QgaW5uZXIgPSBvdmVybGF5LnF1ZXJ5U2VsZWN0b3IoXG4gICAgICAgIHRoaXMuc2Nyb2xsYWJsZVNlbGVjdG9yKCkhLFxuICAgICAgKSBhcyBIVE1MRWxlbWVudDtcbiAgICAgIGlmIChpbm5lcikge1xuICAgICAgICBjb25zdCBwYWRkaW5nID0gTWF0aC5tYXgoMCwgdGhpcy52aWV3cG9ydFBhZGRpbmcoKSk7XG4gICAgICAgIGNvbnN0IG1heFNwYWNlID1cbiAgICAgICAgICBmaW5hbFBsYWNlbWVudCA9PT0gJ2xlZnQnIHx8IGZpbmFsUGxhY2VtZW50ID09PSAncmlnaHQnXG4gICAgICAgICAgICA/IHZpZXdwb3J0SCAtIHBhZGRpbmcgKiAyXG4gICAgICAgICAgICA6IG9wZW5PblRvcFxuICAgICAgICAgICAgICA/IHNwYWNlQWJvdmVcbiAgICAgICAgICAgICAgOiBzcGFjZUJlbG93O1xuICAgICAgICBpbm5lci5zdHlsZS5tYXhIZWlnaHQgPSBgJHtNYXRoLm1pbihtYXhTcGFjZSAtIDEwLCB2aWV3cG9ydEggKiAwLjkpfXB4YDtcbiAgICAgICAgaW5uZXIuc3R5bGUub3ZlcmZsb3dZID0gJ2F1dG8nO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIHZpc2liaWxpdHkgc2FmZSB1cGRhdGVcbiAgICBxdWV1ZU1pY3JvdGFzaygoKSA9PiB7XG4gICAgICB0aGlzLnZpc2liaWxpdHkgPSAndmlzaWJsZSc7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmVzb2x2ZXMgdGhlIHJlZmVyZW5jZSBlbGVtZW50LlxuICAgKi9cbiAgcHJpdmF0ZSBnZXRSZWZlcmVuY2VFbGVtZW50KG92ZXJsYXk6IEhUTUxFbGVtZW50KTogSFRNTEVsZW1lbnQgfCBudWxsIHtcbiAgICBjb25zdCBkaXJlY3RSZWYgPSB0aGlzLnJlZmVyZW5jZUVsZW1lbnQoKTtcbiAgICBpZiAoZGlyZWN0UmVmKSB7XG4gICAgICByZXR1cm4gZGlyZWN0UmVmIGluc3RhbmNlb2YgRWxlbWVudFJlZlxuICAgICAgICA/IGRpcmVjdFJlZi5uYXRpdmVFbGVtZW50XG4gICAgICAgIDogZGlyZWN0UmVmO1xuICAgIH1cblxuICAgIGNvbnN0IGlkID0gdGhpcy5yZWZlcmVuY2VFbGVtZW50SWQoKTtcbiAgICByZXR1cm4gaWQgPyBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCkgOiBvdmVybGF5LnBhcmVudEVsZW1lbnQ7XG4gIH1cblxuICAvKipcbiAgICogRmluZHMgc2Nyb2xsYWJsZSBhbmNlc3RvcnMgYnkgY2hlY2tpbmcgb3ZlcmZsb3cgc3R5bGVzLlxuICAgKi9cbiAgcHJpdmF0ZSBnZXRTY3JvbGxhYmxlUGFyZW50cyhlbGVtZW50OiBIVE1MRWxlbWVudCk6IEhUTUxFbGVtZW50W10ge1xuICAgIGNvbnN0IHNjcm9sbFBhcmVudHM6IEhUTUxFbGVtZW50W10gPSBbXTtcbiAgICBsZXQgY3VycmVudCA9IGVsZW1lbnQucGFyZW50RWxlbWVudDtcblxuICAgIHdoaWxlIChjdXJyZW50ICYmIGN1cnJlbnQgIT09IGRvY3VtZW50LmJvZHkgJiYgY3VycmVudCAhPT0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50KSB7XG4gICAgICBjb25zdCBzdHlsZSA9IGdldENvbXB1dGVkU3R5bGUoY3VycmVudCk7XG4gICAgICBjb25zdCBvdmVyZmxvdyA9IGAke3N0eWxlLm92ZXJmbG93fSAke3N0eWxlLm92ZXJmbG93WX0gJHtzdHlsZS5vdmVyZmxvd1h9YDtcbiAgICAgIGlmICgvKGF1dG98c2Nyb2xsfG92ZXJsYXkpLy50ZXN0KG92ZXJmbG93KSkge1xuICAgICAgICBzY3JvbGxQYXJlbnRzLnB1c2goY3VycmVudCk7XG4gICAgICB9XG4gICAgICBjdXJyZW50ID0gY3VycmVudC5wYXJlbnRFbGVtZW50O1xuICAgIH1cblxuICAgIHJldHVybiBzY3JvbGxQYXJlbnRzO1xuICB9XG59XG4iXX0=