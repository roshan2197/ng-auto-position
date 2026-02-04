import {
  AfterViewInit,
  DestroyRef,
  Directive,
  ElementRef,
  EventEmitter,
  HostBinding,
  Output,
  inject,
  input,
} from '@angular/core';
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
@Directive({
  selector: '[ngAutoPosition]',
  standalone: true,
})
export class NgAutoPositionElementDirective implements AfterViewInit {
  /** Native element reference for the overlay */
  private readonly el = inject(ElementRef<HTMLElement>);

  /** Used by Angular to auto-clean RxJS subscriptions */
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Direct reference to the anchor element.
   * If provided, this takes priority over referenceElementId.
   */
  referenceElement = input<HTMLElement | ElementRef<HTMLElement> | null>(null);

  /**
   * ID of the reference element.
   * If not provided, parentElement is used.
   */
  referenceElementId = input<string | null>(null);

  /** Debounce time for scroll / resize events (ms) */
  debounceMs = input<number>(0);

  /** Gap between reference and overlay (px) */
  offset = input<number>(5);

  /** Match overlay width to reference width */
  matchWidth = input<boolean>(false);

  /**
   * Preferred placement.
   * - 'auto' chooses top/bottom based on available space.
   */
  placement = input<'auto' | 'top' | 'bottom'>('auto');

  /** Minimum padding from the viewport edges when clamping. */
  viewportPadding = input<number>(4);

  /**
   * Optional selector for inner scrollable content
   * whose max-height will be auto-calculated.
   */
  scrollableSelector = input<string | null>(null);

  /**
   * Enables or disables automatic repositioning
   * on window scroll and resize.
   *
   * Default: true
   */
  enableAutoReposition = input<boolean>(true);

  /**
   * List of element IDs or class names
   * whose scrollbars should be hidden
   * while the popup is visible.
   *
   * Examples:
   * ['body']
   * ['app-layout', '.content-wrapper']
   */
  hideScrollTargets = input<string[] | null>(null);

  /**
   * Emits the final placement after each update.
   */
  @Output() placementChange = new EventEmitter<'top' | 'bottom'>();

  /**
   * Hide overlay until positioned to avoid flicker.
   */
  @HostBinding('style.visibility')
  visibility: 'hidden' | 'visible' = 'hidden';

  private lastPlacement: 'top' | 'bottom' | null = null;

  ngAfterViewInit(): void {
    const overlay = this.el.nativeElement;
    overlay.style.position = 'fixed';

    // ResizeObserver always useful (content changes)
    const ro = new ResizeObserver(() => this.updatePosition());
    ro.observe(overlay);

    const reference = this.getReferenceElement(overlay);
    if (reference) ro.observe(reference);

    // Conditionally listen to scroll + resize
    if (this.enableAutoReposition()) {
      merge(fromEvent(window, 'scroll'), fromEvent(window, 'resize'))
        .pipe(
          debounceTime(this.debounceMs()),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe(() => this.updatePosition());
    }

    this.updatePosition();

    (this.destroyRef as any).onDestroy?.(() => ro.disconnect());
  }

  /**
   * Returns true if the reference element is completely outside viewport.
   * Even 1px visible = considered visible.
   */
  private isReferenceFullyOut(refRect: DOMRect): boolean {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    return (
      refRect.bottom <= 0 || // above viewport
      refRect.top >= vh || // below viewport
      refRect.right <= 0 || // left of viewport
      refRect.left >= vw // right of viewport
    );
  }

  /**
   * Calculates and applies overlay position.
   */
  private updatePosition(): void {
    const overlay = this.el.nativeElement;
    const reference = this.getReferenceElement(overlay);
    if (!reference) return;

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

    let openOnTop =
      overlayRect.height > spaceBelow && spaceAbove >= overlayRect.height;

    // Placement override (user-specified preference)
    const preferredPlacement = this.placement();
    if (preferredPlacement === 'top') openOnTop = true;
    if (preferredPlacement === 'bottom') openOnTop = false;

    // --- base positioning relative to reference ---
    let top = openOnTop
      ? refRect.top - overlayRect.height - this.offset()
      : refRect.bottom + this.offset();

    let left = refRect.left;

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

    const finalPlacement = openOnTop ? 'top' : 'bottom';
    if (this.lastPlacement !== finalPlacement) {
      this.lastPlacement = finalPlacement;
      this.placementChange.emit(finalPlacement);
    }

    // Optional inner scroll container handling
    if (this.scrollableSelector()) {
      const inner = overlay.querySelector(
        this.scrollableSelector()!,
      ) as HTMLElement;
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
  private getReferenceElement(overlay: HTMLElement): HTMLElement | null {
    const directRef = this.referenceElement();
    if (directRef) {
      return directRef instanceof ElementRef
        ? directRef.nativeElement
        : directRef;
    }

    const id = this.referenceElementId();
    return id ? document.getElementById(id) : overlay.parentElement;
  }
}
