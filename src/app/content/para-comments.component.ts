import {Component} from '@angular/core';
import {ComponentModalConfig, SuiModal, ModalSize} from 'ng2-semantic-ui';

import {Para} from '../models/para';
import {ParaComment} from '../models/para-comment';

@Component({
  selector: 'para-comments',
  templateUrl: './para-comments.component.html'
})
export class ParaCommentsComponent {
  para: Para;
  comments: ParaComment[];

  constructor(private modal: SuiModal<Para, string, string>) {
    this.para = modal.context;
    this.comments = this.para.comments;
  }

  close() {
    this.modal.deny('');
  }
}

export class ParaCommentsModal extends ComponentModalConfig<Para> {
  constructor(context: Para) {
    super(ParaCommentsComponent, context, false);
    this.size = ModalSize.Tiny;
    this.isClosable = true;
    this.mustScroll = true;
  }
}
