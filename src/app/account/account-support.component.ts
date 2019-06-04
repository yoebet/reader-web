import {SuiModalService} from 'ng2-semantic-ui';
import {ActivatedRoute, ParamMap} from '@angular/router';

import {combineLatest} from 'rxjs';

import {StaticResource} from '../config';
import {SessionService} from '../services/session.service';
import {User} from '../models/user';
import {OpResult} from '../models/op-result';
import {LoginModal} from './login-popup.component';
import {WxAuthService} from '../services/wx-auth.service';


export abstract class AccountSupportComponent {

  avatarsBase = StaticResource.UserAvatarsBase;

  contentLoaded = false;
  requireLogin = true;
  pathParams: ParamMap;
  queryParams: ParamMap;

  get currentUser(): User {
    return this.sessionService.currentUser;
  }

  protected constructor(protected sessionService: SessionService,
                        protected wxAuthService: WxAuthService,
                        protected modalService: SuiModalService,
                        protected route: ActivatedRoute) {

  }


  protected abstract loadContent();

  protected abstract buildCurrentUrl(): string;


  protected onLoginCancel() {
  }

  protected onLoginSuccess() {
    if (!this.contentLoaded) {
      this.loadContent();
    }
  }

  checkLoginAndLoad() {
    combineLatest(this.route.paramMap, this.route.queryParamMap)
      .subscribe(([pathParams, queryParams]) => {
        this.pathParams = pathParams;
        this.queryParams = queryParams;
        this.doCheckLoginAndLoad();
      });
  }

  protected doCheckLoginAndLoad() {

    if (this.queryParams) {
      console.log(this.queryParams);

      // let state = params.get('state');
      let code = this.queryParams.get('code');
      if (code) {
        let url = this.buildCurrentUrl();
        window.history.pushState({}, '', url);
        // this.wxAuthService.requestAccessToken(code)
        this.wxAuthService.requestAccessTokenAndLogin(code)
          .subscribe(result => {
            console.log(result);
            let scope = result.wxAuthScope;
            if (result.ok === 0) {
              if (scope === 'snsapi_userinfo') {
                alert(result.message || '微信登录失败');
              }
              return;
            }
          });
        return;
      }

      let tempToken = this.queryParams.get('tt');
      if (tempToken) {
        this.sessionService.loginByTempToken(tempToken)
          .subscribe((opr: OpResult) => {
            if (opr && opr.ok === 1) {
              let url = this.buildCurrentUrl();
              window.history.pushState({}, '', url);
              this.loadContent();
            } else {
              let msg = opr.message || '登录失败';
              alert(msg);
            }
          });
        return;
      }
    }

    let cu = this.sessionService.currentUser;
    if (cu) {
      this.loadContent();
      return;
    }

    this.sessionService.checkLogin()
      .subscribe(cu => {
        if (cu) {
          this.loadContent();
          return;
        }
        if (!this.requireLogin) {
          return;
        }
        this.openLoginDialog();
      });
  }

  openLoginDialog() {
    this.modalService.open<string, string, string>(new LoginModal(/*'请登录'*/))
      .onDeny(d => {
        this.onLoginCancel();
      })
      .onApprove(r => {
        this.onLoginSuccess();
      });
  }

}
