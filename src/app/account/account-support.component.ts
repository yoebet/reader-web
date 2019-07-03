import {OnDestroy, OnInit} from '@angular/core';
import {SuiModalService} from 'ng2-semantic-ui';
import {ActivatedRoute, ParamMap} from '@angular/router';

import {combineLatest, Subscription} from 'rxjs';
import {ActiveModal} from 'ng2-semantic-ui/dist/modules/modal/classes/active-modal';

import {environment} from '../../environments/environment';
import {StaticResource, LocalStorageKey} from '../config';
import {SessionService} from '../services/session.service';
import {WxAuthService} from '../services/wx-auth.service';
import {User} from '../models/user';
import {OpResult} from '../models/op-result';
import {LoginContext, LoginModal} from './login-popup.component';


let loginModal: ActiveModal<LoginContext, string, string> = null;

export abstract class AccountSupportComponent implements OnInit, OnDestroy {

  avatarsBase = StaticResource.UserAvatarsBase;
  webAppBase: string;

  loadImmediately = true;
  contentLoaded = false;
  requireLogin = false;
  pathParams: ParamMap;
  queryParams: ParamMap;

  sessionSubscription: Subscription;


  get currentUser(): User {
    return this.sessionService.currentUser;
  }

  protected constructor(protected sessionService: SessionService,
                        protected wxAuthService: WxAuthService,
                        protected modalService: SuiModalService,
                        protected route: ActivatedRoute) {

    this.webAppBase = environment.webAppBase;
  }

  ngOnInit(): void {
    // console.log(`ngOnInit: ${this.constructor.name}`);
    if (!this.sessionSubscription) {
      this.sessionSubscription = this.sessionService.sessionEventEmitter
        .subscribe(event => {
          if (event === 'RequestLogin') {
            if (loginModal == null) {
              let lc = new LoginContext();
              lc.wxRedirectUri = `${environment.webAppBase}/`;
              loginModal = this.modalService
                .open<LoginContext, string, string>(new LoginModal(lc))
                .onDeny(d => loginModal = null)
                .onApprove(r => loginModal = null);
            }
          } else if (event === 'Login' || event === 'Logout') {
            this.onUserChanged(event);
          }
        });
    }
  }

  ngOnDestroy(): void {
    // console.log(`ngOnDestroy: ${this.constructor.name}`);
    if (this.sessionSubscription) {
      this.sessionSubscription.unsubscribe();
      this.sessionSubscription = null;
    }
  }


  protected onUserChanged(event) {
    // console.log(`${event}: ${this.constructor.name}`);
  }


  protected abstract loadContent();

  protected abstract buildCurrentUri(): string;


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
        if (this.loadImmediately) {
          this.loadContent();
        }
        this.doCheckLoginAndLoad();
      });
  }

  protected doCheckLoginAndLoad() {

    if (this.queryParams) {
      // console.log(this.queryParams);

      let storage = window.localStorage;

      let state = this.queryParams.get('state');
      let code = this.queryParams.get('code');
      let rc = this.queryParams.get('rc');

      if (!rc && state) {
        let ps = state.split('-');
        for (let p of ps) {
          if (p.startsWith('rc')) {
            rc = p.substr(2);
            break;
          }
        }
      }

      if (code && code.length >= 24) {
        let url = this.buildCurrentUri();
        window.history.pushState({}, '', url);

        if (!rc) {
          rc = storage.getItem(LocalStorageKey.frc);
        }
        this.wxAuthService.requestAccessTokenAndLogin(code, rc)
          .subscribe(result => {
            console.log(result);
            let scope = result.wxAuthScope;
            if (result.ok === 0) {
              if (rc) {
                storage.setItem(LocalStorageKey.frc, rc);
              }
              if (scope === 'snsapi_userinfo') {
                alert(result.message || '微信登录失败');
              }
              return;
            }
          });
        return;
      }

      if (rc) {
        storage.setItem(LocalStorageKey.frc, rc);
      }

      let tempToken = this.queryParams.get('tt');
      if (tempToken) {
        this.sessionService.loginByTempToken(tempToken)
          .subscribe((opr: OpResult) => {
            if (opr && opr.ok === 1) {
              let url = this.buildCurrentUri();
              window.history.pushState({}, '', url);
              if (!this.loadImmediately) {
                this.loadContent();
              }
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
      if (!this.contentLoaded) {
        this.loadContent();
      }
      return;
    }

    this.sessionService.checkLogin()
      .subscribe(cu => {
        if (cu) {
          if (!this.contentLoaded) {
            this.loadContent();
          }
          return;
        }
        if (!this.requireLogin) {
          return;
        }
        this.openLoginDialog();
      });
  }

  openLoginDialog() {
    if (loginModal) {
      return;
    }
    let lc = new LoginContext();
    let curi = this.buildCurrentUri();
    lc.wxRedirectUri = `${this.webAppBase}/${curi}`;
    loginModal = this.modalService
      .open<LoginContext, string, string>(new LoginModal(lc))
      .onDeny(d => {
        loginModal = null;
        this.onLoginCancel();
      })
      .onApprove(r => {
        loginModal = null;
        this.onLoginSuccess();
      });
  }

  logout() {
    this.sessionService.logoutLocally();
  }

}
