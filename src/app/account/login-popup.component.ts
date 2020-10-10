import {Component} from '@angular/core';

import {ModalSize} from 'ng2-semantic-ui/dist/modules/modal/classes/modal-config';
import {ComponentModalConfig, SuiModal} from 'ng2-semantic-ui';

import {SessionService} from '../services/session.service';
import {OpResult} from '../models/op-result';


const wxAppId = `wx4a226a806e99f56c`;

@Component({
  selector: 'login-popup',
  templateUrl: './login-popup.component.html',
  styleUrls: ['./login-popup.component.css']
})
export class LoginPopupComponent {

  loginMethod: 'wx' | 'pass' = 'wx';

  loginMessage: string;

  wxRedirectUri?: string;


  constructor(private sessionService: SessionService,
              private modal: SuiModal<LoginContext, string, string>) {
    let lc = modal.context;
    this.loginMessage = lc.message;
    this.wxRedirectUri = lc.wxRedirectUri;
  }

  static buildWxAuthUrl(redirectUri,
                        scope: 'snsapi_userinfo' | 'snsapi_base' = 'snsapi_userinfo',
                        state = '10') {
    return `https://open.weixin.qq.com/connect/oauth2/authorize`
      + `?appid=${wxAppId}&redirect_uri=${redirectUri}`
      + `&response_type=code&scope=${scope}&state=${state}#wechat_redirect`;
  }

  cancel() {
    this.loginMessage = null;
    this.modal.deny('');
  }

  wxLogin() {
    if (!this.wxRedirectUri) {
      return;
    }
    window.location.href = LoginPopupComponent.buildWxAuthUrl(this.wxRedirectUri);
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


export class LoginContext {

  message?: string;
  wxRedirectUri?: string;
}


export class LoginModal extends ComponentModalConfig<LoginContext> {
  constructor(loginContext: LoginContext = null) {
    super(LoginPopupComponent, loginContext, false);
    this.size = ModalSize.Mini;
    this.mustScroll = false;
  }
}
