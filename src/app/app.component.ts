import { Component } from '@angular/core';
import { NgAutoPositionTestComponent } from './ng-auto-position/testing/ng-autoposition-test.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NgAutoPositionTestComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'ng-auto-position';
}
