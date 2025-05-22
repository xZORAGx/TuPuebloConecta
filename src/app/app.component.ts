import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`
})
export class AppComponent { 
  title = 'tu_pueblo_conecta'; 

  constructor(
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer
  ) {
    // Add SVG icons to the registry - currently disabled
    /* 
    this.matIconRegistry.addSvgIcon(
      'facebook-logo',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/images/social/facebook.svg')
    );
    this.matIconRegistry.addSvgIcon(
      'twitter-logo',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/images/social/twitter.svg')
    );
    this.matIconRegistry.addSvgIcon(
      'instagram-logo',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/images/social/instagram.svg')
    );
    this.matIconRegistry.addSvgIcon(
      'linkedin-logo',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/images/social/linkedin.svg')
    );
    */
  }
}

