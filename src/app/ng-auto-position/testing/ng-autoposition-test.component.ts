import { NgAutoPositionElementDirective } from '../ng-auto-position.directive';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'ng-auto-position-test',
  standalone: true,
  imports: [CommonModule, NgAutoPositionElementDirective],
  templateUrl: './ng-autoposition-test.component.html',
})
export class NgAutoPositionTestComponent {
  show: boolean = false;

  toggle() {
    this.show = !this.show;
  }
}
