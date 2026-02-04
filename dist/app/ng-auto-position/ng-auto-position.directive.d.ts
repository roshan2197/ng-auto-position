import { AfterViewInit, ElementRef, EventEmitter } from '@angular/core';
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
     * Direct reference to the anchor element.
     * If provided, this takes priority over referenceElementId.
     */
    referenceElement: import("@angular/core").InputSignal<HTMLElement | ElementRef<HTMLElement>>;
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
     * Preferred placement.
     * - 'auto' chooses top/bottom based on available space.
     * - 'left'/'right' are explicit.
     */
    placement: import("@angular/core").InputSignal<"auto" | "top" | "bottom" | "left" | "right">;
    /** Minimum padding from the viewport edges when clamping. */
    viewportPadding: import("@angular/core").InputSignal<number>;
    /**
     * Listen to scroll events on scrollable parents of the reference element.
     * Useful for overlays inside scrollable containers (drawers, panels).
     *
     * Default: true
     */
    trackScrollParents: import("@angular/core").InputSignal<boolean>;
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
     * Emits the final placement after each update.
     */
    placementChange: EventEmitter<"top" | "bottom" | "left" | "right">;
    /**
     * Hide overlay until positioned to avoid flicker.
     */
    visibility: 'hidden' | 'visible';
    private lastPlacement;
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
    /**
     * Finds scrollable ancestors by checking overflow styles.
     */
    private getScrollableParents;
    static ɵfac: i0.ɵɵFactoryDeclaration<NgAutoPositionElementDirective, never>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<NgAutoPositionElementDirective, "[ngAutoPosition]", never, { "referenceElement": { "alias": "referenceElement"; "required": false; "isSignal": true; }; "referenceElementId": { "alias": "referenceElementId"; "required": false; "isSignal": true; }; "debounceMs": { "alias": "debounceMs"; "required": false; "isSignal": true; }; "offset": { "alias": "offset"; "required": false; "isSignal": true; }; "matchWidth": { "alias": "matchWidth"; "required": false; "isSignal": true; }; "placement": { "alias": "placement"; "required": false; "isSignal": true; }; "viewportPadding": { "alias": "viewportPadding"; "required": false; "isSignal": true; }; "trackScrollParents": { "alias": "trackScrollParents"; "required": false; "isSignal": true; }; "scrollableSelector": { "alias": "scrollableSelector"; "required": false; "isSignal": true; }; "enableAutoReposition": { "alias": "enableAutoReposition"; "required": false; "isSignal": true; }; "hideScrollTargets": { "alias": "hideScrollTargets"; "required": false; "isSignal": true; }; }, { "placementChange": "placementChange"; }, never, never, true, never>;
}
