import { AfterViewInit } from '@angular/core';
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
export declare class NgAutoPositionElementDirective implements AfterViewInit {
    /** Native element reference for the overlay */
    private readonly el;
    /** Used by Angular to auto-clean RxJS subscriptions */
    private readonly destroyRef;
    /**
     * ID of the reference element.
     * If not provided, parentElement is used.
     */
    referenceElementId: import("@angular/core").InputSignal<string>;
    /** Debounce time for scroll / resize events (ms) */
    debounceMs: import("@angular/core").InputSignal<number>;
    /** Gap between reference and overlay (px) */
    offset: import("@angular/core").InputSignal<number>;
    /** Match overlay width to reference width */
    matchWidth: import("@angular/core").InputSignal<boolean>;
    /**
     * Optional selector for inner scrollable content
     * whose max-height will be auto-calculated.
     */
    scrollableSelector: import("@angular/core").InputSignal<string>;
    /**
     * Enables or disables automatic repositioning
     * on window scroll and resize.
     *
     * Default: true
     */
    enableAutoReposition: import("@angular/core").InputSignal<boolean>;
    /**
     * List of element IDs or class names
     * whose scrollbars should be hidden
     * while the popup is visible.
     *
     * Examples:
     * ['body']
     * ['app-layout', '.content-wrapper']
     */
    hideScrollTargets: import("@angular/core").InputSignal<string[]>;
    /**
     * Hide overlay until positioned to avoid flicker.
     */
    visibility: 'hidden' | 'visible';
    ngAfterViewInit(): void;
    /**
     * Returns true if the reference element is completely outside viewport.
     * Even 1px visible = considered visible.
     */
    private isReferenceFullyOut;
    /**
     * Calculates and applies overlay position.
     */
    private updatePosition;
    /**
     * Resolves the reference element.
     */
    private getReferenceElement;
    static ɵfac: i0.ɵɵFactoryDeclaration<NgAutoPositionElementDirective, never>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<NgAutoPositionElementDirective, "[ngAutoPosition]", never, { "referenceElementId": { "alias": "referenceElementId"; "required": false; "isSignal": true; }; "debounceMs": { "alias": "debounceMs"; "required": false; "isSignal": true; }; "offset": { "alias": "offset"; "required": false; "isSignal": true; }; "matchWidth": { "alias": "matchWidth"; "required": false; "isSignal": true; }; "scrollableSelector": { "alias": "scrollableSelector"; "required": false; "isSignal": true; }; "enableAutoReposition": { "alias": "enableAutoReposition"; "required": false; "isSignal": true; }; "hideScrollTargets": { "alias": "hideScrollTargets"; "required": false; "isSignal": true; }; }, {}, never, never, true, never>;
}
