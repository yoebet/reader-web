import {Injectable} from '@angular/core';
import {ActiveModal} from 'ng2-semantic-ui/dist/modules/modal/classes/active-modal';
import {SuiModalService} from 'ng2-semantic-ui';

import {SessionService} from './session.service';
import {LoginModal} from '../account/login-popup.component';


let loginModal: ActiveModal<string, string, string> = null;

@Injectable()
export class AppService {

  constructor(private sessionService: SessionService,
              private modalService: SuiModalService) {

    sessionService.sessionEventEmitter
      .subscribe(event => {
        if (event === 'RequestLogin') {
          if (loginModal == null) {
            loginModal = this.modalService.open<string, string, string>(new LoginModal(/*'请重新登录'*/))
              .onDeny(d => loginModal = null)
              .onApprove(r => loginModal = null);
          }
        }
      });
  }

}
