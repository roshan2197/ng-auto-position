import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NgAutoPositionElementDirective } from './ng-auto-position/ng-auto-position.directive';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, NgAutoPositionElementDirective],
  templateUrl: './app.component.html',
})
export class AppComponent {
  title = 'ng-auto-position';
  showMenu = false;
  showPopover = false;
  showInline = false;
  showSticky = false;

  menuItems = [
    'Account settings',
    'Billing & plan',
    'Team access',
    'Keyboard shortcuts',
    'Sign out',
  ];

  toggleMenu(): void {
    this.showMenu = !this.showMenu;
  }

  togglePopover(): void {
    this.showPopover = !this.showPopover;
  }

  toggleInline(): void {
    this.showInline = !this.showInline;
  }

  toggleSticky(): void {
    this.showSticky = !this.showSticky;
  }

  closeAll(): void {
    this.showMenu = false;
    this.showPopover = false;
    this.showInline = false;
    this.showSticky = false;
  }
}
