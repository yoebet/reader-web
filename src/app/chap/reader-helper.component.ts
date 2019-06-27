import {Component} from '@angular/core';

import {ComponentModalConfig} from 'ng2-semantic-ui';
import {ModalSize} from 'ng2-semantic-ui/dist/modules/modal/classes/modal-config';

@Component({
  selector: 'reader-helper',
  templateUrl: './reader-helper.component.html',
  styleUrls: ['./reader-helper.component.css']
})
export class ReaderHelperComponent {

}


export class ReaderHelperModal extends ComponentModalConfig<void> {
  constructor() {
    super(ReaderHelperComponent, null, true);
    this.size = ModalSize.Tiny;
    this.mustScroll = false;
  }
}
