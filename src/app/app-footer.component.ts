import {Component, OnInit} from '@angular/core';
import {AppRelease} from './models/app-release';
import {AppService} from './services/app.service';

import {StaticResource} from './config';

@Component({
  selector: 'app-footer',
  templateUrl: './app-footer.component.html'
})
export class AppFooterComponent implements OnInit {

  appRelease: AppRelease;
  appDownloadUrl: string;
  appManualUrl: string = StaticResource.AppManualIndexPage;


  constructor(private appService: AppService) {

  }

  ngOnInit() {
    this.appService.getAppRelease()
      .subscribe((release: AppRelease) => {
        this.appRelease = release;

        let apkBase = StaticResource.AppPackagesBase;
        let pi = release.packageInfo;
        if (!pi) {
          return;
        }
        this.appDownloadUrl = `${apkBase}/${pi.file}`;
      });
  }
}
