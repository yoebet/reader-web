import {Component} from '@angular/core';

import {ModalSize} from 'ng2-semantic-ui/dist/modules/modal/classes/modal-config';
import {ComponentModalConfig, SuiModal} from 'ng2-semantic-ui';

import {SessionService} from '../services/session.service';
import {OpResult} from '../models/op-result';

@Component({
  selector: 'login-popup',
  templateUrl: './login-popup.component.html'
})
export class LoginPopupComponent {

  loginMessage: string;

  constructor(private sessionService: SessionService,
              private modal: SuiModal<string, string, string>) {
    this.loginMessage = modal.context;
  }

  cancel() {
    this.loginMessage = null;
    this.modal.deny('');
  }

  login(name, pass) {
    this.sessionService.login(name, pass)
      .subscribe((opr: OpResult) => {
        if (opr && opr.ok === 1) {
          this.loginMessage = null;
          this.modal.approve('');
        } else {
          this.loginMessage = '用户名/密码错误';
        }
      }, (err) => {
        this.loginMessage = '发生错误了';
      });
  }

  onPassKeyup(name, pass, $event) {
    $event.stopPropagation();
    if ($event.keyCode === 13 && name && pass) {
      this.login(name, pass);
    }
  }

}

export class LoginModal extends ComponentModalConfig<string> {
  constructor(message: string = null) {
    super(LoginPopupComponent, message, false);
    this.size = ModalSize.Mini;
    this.mustScroll = false;
  }
}
