import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';

import {SuiModalService} from 'ng2-semantic-ui';

import {User} from './models/user';
import {OpResult} from './models/op-result';
import {AppService} from './services/app.service';
import {SessionService} from './services/session.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  get currentUser(): User {
    return this.sessionService.currentUser;
  }

  constructor(private appService: AppService,
              private sessionService: SessionService,
              private router: Router,
              public modalService: SuiModalService) {
  }

  ngOnInit() {
    this.sessionService.checkLogin()
      .subscribe(a => {
      });
  }


  logout() {
    this.sessionService.logout()
      .subscribe((opr: OpResult) => {
        if (opr && opr.ok === 1) {
          this.router.navigate(['/']);
        }
      });
  }
}
