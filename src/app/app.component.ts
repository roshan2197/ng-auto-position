import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NgAutoPositionElementDirective } from './ng-auto-position/ng-auto-position.directive';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, NgAutoPositionElementDirective],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'ng-auto-position';
  showMenu = false;
  showPopover = false;
  showInline = false;
  showSticky = false;
  showContainer = false;
  showTopExample = false;
  showBottomExample = false;
  showLeftExample = false;
  showRightExample = false;
  menuPlacement: 'top' | 'bottom' | 'left' | 'right' | null = null;

  menuItems = [
    'Account settings',
    'Billing & plans',
    'Team permissions',
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

  toggleContainer(): void {
    this.showContainer = !this.showContainer;
  }

  toggleTopExample(): void {
    this.showTopExample = !this.showTopExample;
  }

  toggleBottomExample(): void {
    this.showBottomExample = !this.showBottomExample;
  }

  toggleLeftExample(): void {
    this.showLeftExample = !this.showLeftExample;
  }

  toggleRightExample(): void {
    this.showRightExample = !this.showRightExample;
  }

  closeAll(): void {
    this.showMenu = false;
    this.showPopover = false;
    this.showInline = false;
    this.showSticky = false;
    this.showContainer = false;
    this.showTopExample = false;
    this.showBottomExample = false;
    this.showLeftExample = false;
    this.showRightExample = false;
  }
}
